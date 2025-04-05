import json
import asyncio
from aio_pika import connect_robust, IncomingMessage
from aiohttp import ClientSession
from sqlalchemy.ext.asyncio import async_sessionmaker
from sqlmodel import select
from models import Practice, PracticesUsersLink
from services.rpc_client import AsyncRpcClient
from core.db import engine
from core.config import settings

async_session = async_sessionmaker(engine, expire_on_commit=False)

class PracticeCorrectionQueueWorker:
    def __init__(self, max_concurrent_tasks=5):
        self.max_concurrent_tasks = max_concurrent_tasks
        self.semaphore = asyncio.Semaphore(max_concurrent_tasks)
        self.tasks = set()  # Para mantener un seguimiento de tareas activas

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
            async with message.process():
                print(f" [x] Received {message.body.decode('utf-8')}")

                # Crear una instancia de RPC Client para cada mensaje
                rpc_client = AsyncRpcClient()
                await rpc_client.connect()
                
                async with async_session() as db_session:
                    try:
                        # Decodificar el mensaje JSON
                        body_json = json.loads(message.body.decode('utf-8'))
                    except json.JSONDecodeError:
                        print(" [E] Error al deserialitzar el missatge JSON")
                        return
                    
                    # Llamada al cliente RPC
                    result: bytes = await rpc_client.call(body_json)
                    if not result:
                        print(" [!] No se recibió respuesta del servidor RPC")
                        return
                    
                    print(" [i] Respuesta del servidor RPC:", result.decode('utf-8'))
                    
                    result_str = result.decode('utf-8')
                    result_dict = json.loads(result_str)
                    
                    print(" [i] La respuesta es de tipo", type(result_dict))
                    
                    # Extraer datos del resultado
                    niub = result_dict["niub"]
                    id_curs = result_dict["course_id"]
                    id_practice = result_dict["practice_id"]
                    correction = result_dict["info"]

                    try:
                        # Actualizar la práctica en PostgreSQL
                        practice = await db_session.execute(
                            select(Practice).where(Practice.id == id_practice)
                        )
                        practice = practice.scalar_one_or_none()

                        practice_user = await db_session.execute(select(PracticesUsersLink)
                            .where(
                                PracticesUsersLink.user_niub == niub,
                                PracticesUsersLink.practice_id == practice.id
                            )
                        )
                        practice_user = practice_user.scalar_one_or_none()

                        if practice and practice_user:
                            # Actualizar el campo `correction` con la información recibida
                            practice_user.correction = correction
                            practice_user.corrected = True
                            await db_session.add(practice_user)
                            await db_session.commit()
                            print(f" [x] Práctica {id_practice} actualizada con la corrección.")
                        else:
                            print(f" [!] No se encontró la práctica con ID {id_practice}.")
                            return

                        # Notificar que la práctica ha sido corregida
                        data = {
                            'id': id,
                            'practica_id': id_practice,
                            'status': 'corrected'
                        }
                        await self.notify_practice_corrected(data)

                    except Exception as e:
                        print(f" [E] Error al interactuar con PostgreSQL: {e}")
        
        print(f" [+] Correction for NIUB {niub} completed successfully for practice {result_dict['name']}", message.body)

    # async def callback(self, message: IncomingMessage):
    #     # Crear una nueva tarea para procesar el mensaje
    #     task = asyncio.create_task(self.process_message(message))
    #     self.tasks.add(task)

    #     def on_task_done(task):
    #         try:
    #             # Si la tarea se completó con éxito, confirmar el mensaje
    #             message.ack()
    #         except Exception as e:
    #             print(f" [E] Error procesando mensaje: {e}")
    #             message.reject(requeue=True)  # Devuelve el mensaje a la cola si falla
    #         finally:
    #             self.tasks.discard(task)

    #     # Configurar callback para eliminar la tarea una vez completada
    #     task.add_done_callback(on_task_done)

    async def callback(self, message: IncomingMessage):
        # Crear una nueva tarea para procesar el mensaje
        await message.ack()  # Confirmar el mensaje inmediatamente para evitar reintentos
        task = asyncio.create_task(self.process_message(message))
        self.tasks.add(task)
        # Configurar callback para eliminar la tarea una vez completada
        task.add_done_callback(self.tasks.discard)

    async def start(self):
        print(f' [x] Starting worker...')
        connection = await connect_robust(settings.CLOUDAMQP_URL)
        channel = await connection.channel()
        # Aumentar el prefetch_count para permitir múltiples mensajes
        await channel.set_qos(prefetch_count=self.max_concurrent_tasks)
        queue = await channel.declare_queue('practicas', durable=True)
        await queue.consume(self.callback)
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
    # Puedes ajustar el número de tareas concurrentes según necesites
    worker = PracticeCorrectionQueueWorker(max_concurrent_tasks=5)
    loop = asyncio.get_event_loop()
    connection = loop.run_until_complete(worker.start())
    try:
        loop.run_forever()
    except KeyboardInterrupt:
        print("Interrupció de l'usuari")
    finally:
        loop.run_until_complete(connection.close())
        loop.run_until_complete(worker.close())
        loop.close()