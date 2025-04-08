import json
import asyncio
import platform
import os
from aio_pika import connect_robust, ExchangeType, IncomingMessage, Message
from aiohttp import ClientSession
from sqlalchemy.ext.asyncio import async_sessionmaker
from sqlmodel import select
from models import Practice, PracticesUsersLink
from services.rpc_client import AsyncRpcClient
from core.db import engine
from core.config import settings

async_session = async_sessionmaker(engine, expire_on_commit=False)

# Set the correct event loop policy for Windows
if platform.system() == 'Windows':
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

print(f" [i] Usant el event loop: {asyncio.get_event_loop_policy()}")
print(f" [i] Número de processos: {os.cpu_count()}")

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
                print(f" [x] Received {message.body.decode('utf-8')}")

                # Crear una instancia de RPC Client para cada mensaje
                rpc_client = AsyncRpcClient()
                await rpc_client.connect()
                
                async with async_session() as db_session:
                    try:
                        try:
                            # Decodificar el mensaje JSON
                            body_json = json.loads(message.body.decode('utf-8'))
                        except json.JSONDecodeError:
                            raise ValueError(" [E] Error al deserialitzar el missatge JSON")
                        
                        if not body_json.get("niub") and not body_json.get("practice_id") and not body_json.get("language"):
                            raise ValueError(" [!] El missatge no conté els camps necessaris: niub, practice_id o language")
                        
                        # Llamada al cliente RPC
                        result: bytes = await rpc_client.call(body_json)
                        if not result:
                            raise ValueError(" [!] No se recibió respuesta del servidor RPC")
                        
                        print(" [i] Respuesta del servidor RPC:", result.decode('utf-8'))
                        
                        result_str = result.decode('utf-8')
                        result_dict = json.loads(result_str)
                                                
                        # Extraer datos del resultado
                        niub = result_dict["niub"]
                        id_curs = result_dict["course_id"]
                        id_practice = result_dict["practice_id"]
                        practice_name = result_dict["name"]
                        correction = result_dict["info"]

                        try:
                            # Actualizar la práctica en PostgreSQL
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

                            # Actualizar el campo `correction` con la información recibida
                            practice_user.correction = correction
                            practice_user.corrected = True
                            await db_session.add(practice_user)
                            await db_session.commit()
                            print(f" [x] Práctica {id_practice} actualizada con la corrección.")

                        except Exception as e:
                            raise Exception(f" [E] Error al interactuar con PostgreSQL: {e}")

                        # Notificar que la práctica ha sido corregida
                        data = {
                            'id': id,
                            'practica_id': id_practice,
                            'status': 'corrected'
                        }
                        await self.notify_practice_corrected(data)

                        await message.ack()
                        print(f" [+] Correction for NIUB {niub} completed successfully for practice {result_dict['name']}", message.body)

                    except Exception as e:
                        print(e)
                        
                        # Obtener contador de reintentos
                        headers = message.headers or {}
                        retry_count = headers.get("retry_count", 0)

                        print(f" [!] Failded practice correction for NIUB {niub} and practice {id_practice}.")
                        
                        if retry_count >= self.max_retries:
                            print(f" [!] Permanent failure after {retry_count} attempts. Sending to DLQ.")
                            
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
                            print(f" [!] Retrying ({retry_count + 1}/{self.max_retries})...")
                            

    async def callback(self, message: IncomingMessage):
        # Crear una nueva tarea para procesar el mensaje
        task = asyncio.create_task(self.process_message(message))
        self.tasks.add(task)
        task.add_done_callback(self.tasks.discard)

    async def start(self):
        print(f' [*] Starting worker...')
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
        print(f' [x] Worker iniciado con capacidad para {self.max_concurrent_tasks} tareas concurrentes')
        print(' [*] Waiting for messages. To exit press CTRL+C')
        return connection

    async def close(self):
        # Esperar a que todas las tareas activas terminen
        if self.tasks:
            print(f" [*] Esperando a que {len(self.tasks)} tareas terminen...")
            await asyncio.gather(*self.tasks, return_exceptions=True)
        await engine.dispose()

if __name__ == "__main__":
    worker = PracticeCorrectionQueueWorker(max_concurrent_tasks=5)

    async def main():
        connection = await worker.start()
        try:
            await asyncio.Future() # Wait indefinitely
        except KeyboardInterrupt:
            print("Interrupció de l'usuari")
        finally:
            await connection.close()
            await worker.close()
    
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("Interrupció de l'usuari")