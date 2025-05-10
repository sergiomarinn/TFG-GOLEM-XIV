import json
import asyncio
import platform
import os
import logging
from aio_pika import connect_robust, IncomingMessage, Message
from aiohttp import ClientSession
from sqlalchemy.ext.asyncio import async_sessionmaker
from sqlmodel import select
from models import Practice, PracticesUsersLink, StatusEnum
from services.rpc_client import AsyncRpcClient
from core.db import engine
from core.config import settings
from core.logging_config import configure_logging

async_session = async_sessionmaker(engine, expire_on_commit=False)

# Set the correct event loop policy for Windows
if platform.system() == 'Windows':
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

configure_logging()
logger = logging.getLogger(__name__)

logger.info(f"Usant el event loop: {asyncio.get_event_loop_policy()}")
logger.info(f"Número de processos: {os.cpu_count()}")

class PracticeCorrectionQueueWorker:
    def __init__(self, max_concurrent_tasks=5, max_retries=3):
        self.max_concurrent_tasks = max_concurrent_tasks
        self.max_retries = max_retries
        self.semaphore = asyncio.Semaphore(max_concurrent_tasks)
        self.tasks = set()  # Para mantener un seguimiento de tareas activas
        self.channel = None

    async def notify_practice_corrected(self, data):
        async with ClientSession() as session:
            try:
                async with session.post('http://localhost:5000/notify', json=data) as response:
                    if response.status == 200:
                        print("Notificació enviada correctamente.")
                    else:
                        print(f"Error a l'enviar notificación: {response.status}")
            except Exception as e:
                print(f"Error al enviar notificació: {e}")

    async def process_message(self, message: IncomingMessage):
        # Usamos semáforo para limitar la cantidad de tareas concurrentes
        async with self.semaphore:
            async with message.process(ignore_processed=True):
                logger.info(f"Received {message.body.decode('utf-8')}")

                # Crear una instancia de RPC Client para cada mensaje
                rpc_client = AsyncRpcClient()
                await rpc_client.connect()
                
                async with async_session() as db_session:
                    try:
                        hasInvalidFields = False
                        try:
                            # Decodificar el mensaje JSON
                            body_json = json.loads(message.body.decode('utf-8'))
                        except json.JSONDecodeError:
                            raise ValueError("Error al deserialitzar el missatge JSON")
                        
                        if not body_json.get("niub") and not body_json.get("practice_id") and not body_json.get("language"):
                            hasInvalidFields = True
                            raise ValueError("El missatge no conté els camps necessaris: niub, practice_id o language")
                        
                        niub = body_json["niub"]
                        id_curs = body_json["course_id"]
                        id_practice = body_json["practice_id"]
                        practice_name = body_json["name"]

                        practice = await db_session.execute(
                            select(Practice).where(Practice.id == id_practice)
                        )
                        practice = practice.scalar_one_or_none()

                        if not practice:
                            raise Exception(f"No se encontró la práctica con ID {id_practice}")

                        practice_user = await db_session.execute(select(PracticesUsersLink)
                            .where(
                                PracticesUsersLink.user_niub == niub,
                                PracticesUsersLink.practice_id == practice.id
                            )
                        )
                        practice_user = practice_user.scalar_one_or_none()

                        if not practice_user:
                            raise Exception(f"No se encontró la práctica del usuario con NIUB {niub} y ID de práctica {id_practice}")
                        
                        practice_user.status = StatusEnum.CORRECTING
                        db_session.add(practice_user)
                        await db_session.commit()
                        await db_session.refresh(practice_user)

                        # Llamada al cliente RPC
                        result: bytes = await asyncio.wait_for(rpc_client.call(body_json), timeout=600)
                        await rpc_client.close()

                        if not result:
                            raise ValueError("No se recibió respuesta del servidor RPC")
                        
                        result_str = result.decode('utf-8')
                        logger.info(f"Respuesta del servidor RPC: {result_str}")
                        
                        result_dict = json.loads(result_str)
                        if result_dict.get("error"):
                            raise ValueError(f"Error en el servidor RPC: {result_dict['error']}")

                        if not result_dict.get("niub") or not result_dict.get("course_id") or not result_dict.get("practice_id") or not result_dict.get("name") or not result_dict.get("info"):
                            raise ValueError("El missatge no conté els camps necessaris: niub, course_id, practice_id, name o info")

                        if result_dict["niub"] != niub or result_dict["course_id"] != id_curs or result_dict["practice_id"] != id_practice or result_dict["name"] != practice_name:
                            raise ValueError(f"El missatge conté camps amb valors diferents als esperats\n Original: {body_json} \n Resposta RPC: {result_dict}")

                        if not result_dict.get("info"):
                            raise ValueError(f"El missatge no conté la correcció de la pràctica {practice_name} del NIUB {niub}")
                        
                        correction = result_dict["info"]

                        # Actualizar el campo `correction` con la información recibida
                        practice_user.status = StatusEnum.CORRECTED
                        practice_user.correction = correction
                        db_session.add(practice_user)
                        await db_session.commit()
                        await db_session.refresh(practice_user)
                        logger.info(f"Práctica {id_practice} actualizada con la corrección.")

                        # Notificar que la práctica ha sido corregida
                        data = {
                            'id': id,
                            'practica_id': id_practice,
                            'status': 'corrected'
                        }
                        await self.notify_practice_corrected(data)

                        await message.ack()
                        logger.info(f"Correction for NIUB {niub} completed successfully for practice {practice_name}")

                    except Exception as e:
                        logger.error(e)
                        
                        # Obtener contador de reintentos
                        headers = message.headers or {}
                        retry_count = headers.get("retry_count", 0)

                        if not hasInvalidFields:
                            logger.warning(f"Failded practice correction for NIUB {niub} and practice {practice_name}.")
                        
                        if retry_count >= self.max_retries or hasInvalidFields:
                            if not hasInvalidFields:
                                practice_user.status = StatusEnum.REJECTED
                                db_session.add(practice_user)
                                await db_session.commit()
                                await db_session.refresh(practice_user)

                            logger.warning(f"Permanent failure after {retry_count} attempts. Sending to DLQ.")
                            if hasInvalidFields:
                                logger.warning(f"Message has invalid fields")

                            # Enviar a la cola DLQ final
                            await self.channel.default_exchange.publish(
                                Message(
                                    body=message.body,
                                    headers=headers
                                ),
                                routing_key="practicas.dlq"
                            )
                            await message.ack()
                            
                        else:
                            # Incrementar contador y rechazar (irá a retry.practicas)
                            new_headers = {**headers, "retry_count": retry_count + 1}

                            # Reintenta el mensaje con el contador actualizado
                            await self.channel.default_exchange.publish(
                                Message(
                                    body=message.body,
                                    headers=new_headers,
                                    delivery_mode=message.delivery_mode
                                ),
                                routing_key="retry.practicas"
                            )
                            
                            await message.ack()
                            logger.warning(f"Retrying ({retry_count + 1}/{self.max_retries})...")
                            

    async def callback(self, message: IncomingMessage):
        # Crear una nueva tarea para procesar el mensaje
        task = asyncio.create_task(self.process_message(message))
        self.tasks.add(task)
        task.add_done_callback(self.tasks.discard)

    async def start(self):
        logger.warning(f'Starting worker...')
        connection = await connect_robust(settings.CLOUDAMQP_URL)
        self.channel = await connection.channel()
        await self.channel.set_qos(prefetch_count=self.max_concurrent_tasks)
        
        # Cola principal
        main_queue = await self.channel.declare_queue('practicas', durable=True)
        
        # Cola de reintentos con TTL
        retry_queue = await self.channel.declare_queue(
            'retry.practicas',
            durable=True,
            arguments={
                "x-message-ttl": 5000,  # 5 segundos de retraso
                "x-dead-letter-exchange": "",
                "x-dead-letter-routing-key": "practicas"
            }
        )
        
        # Cola DLQ final para mensajes que han fallado demasiadas veces
        await self.channel.declare_queue('practicas.dlq', durable=True)
        
        await main_queue.consume(self.callback)
        logger.info(f'Worker iniciado con capacidad para {self.max_concurrent_tasks} tareas concurrentes')
        logger.warning('Waiting for messages. To exit press CTRL+C')
        return connection

    async def close(self):
        # Esperar a que todas las tareas activas terminen
        if self.tasks:
            logger.warning(f"Esperando a que {len(self.tasks)} tareas terminen...")
            await asyncio.gather(*self.tasks, return_exceptions=True)
        await engine.dispose()

if __name__ == "__main__":
    worker = PracticeCorrectionQueueWorker(max_concurrent_tasks=5)

    async def main():
        connection = await worker.start()
        try:
            await asyncio.Future() # Wait indefinitely
        except KeyboardInterrupt:
            logger.warning("Interrupció de l'usuari")
        finally:
            await connection.close()
            await worker.close()
    
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.warning("Interrupció de l'usuari")