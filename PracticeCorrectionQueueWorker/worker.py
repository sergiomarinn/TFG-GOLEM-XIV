import os
import json
import asyncio
from aio_pika import connect_robust, IncomingMessage
from aiohttp import ClientSession
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlmodel import select
from dotenv import load_dotenv
from .models import Practice, PracticesUsersLink
from .rpc_client import RpcClient

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
HOST = os.getenv("DB_HOST")

# Configuración de SQLAlchemy para uso asíncrono
engine = create_async_engine(DATABASE_URL, echo=True)
async_session = async_sessionmaker(engine, expire_on_commit=False)


class Worker:
    def __init__(self, max_concurrent_tasks=5):
        self.rpc_client = RpcClient()
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
                
                async with async_session() as db_session:
                    try:
                        # Decodificar el mensaje JSON
                        body_json = json.loads(message.body.decode('utf-8'))
                    except json.JSONDecodeError:
                        print("Error al deserialitzar el missatge JSON")
                        return
                    
                    # Llamada al cliente RPC
                    result = await self.rpc_client.call(body_json)
                    print(f"Worker rep de client: {result}")
                    
                    result_str = result.decode('utf-8')
                    result_dict = json.loads(result_str)
                    
                    print("La respuesta es de tipo", type(result_dict))
                    
                    # Extraer datos del resultado
                    niub = result_dict["niub"]
                    id_curs = result_dict["curs_id"]
                    id_practica = result_dict["practica_id"]
                    correction = result_dict["info"]

                    try:
                        # Actualizar la práctica en PostgreSQL
                        practice = await db_session.execute(
                            select(Practice).where(Practice.id == id_practica)
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
                            print(f"Práctica {id_practica} actualizada con la corrección.")
                        else:
                            print(f"No se encontró la práctica con ID {id_practica}.")
                            return

                        # Notificar que la práctica ha sido corregida
                        data = {
                            'id': id,
                            'practica_id': id_practica,
                            'status': 'corrected'
                        }
                        await self.notify_practice_corrected(data)

                    except Exception as e:
                        print(f"Error al interactuar con PostgreSQL: {e}")
        
        print(" [x] Done", message.body)

    async def callback(self, message: IncomingMessage):
        # Crear una nueva tarea para procesar el mensaje
        task = asyncio.create_task(self.process_message(message))
        self.tasks.add(task)
        # Configurar callback para eliminar la tarea una vez completada
        task.add_done_callback(self.tasks.discard)

    async def start(self):
        connection = await connect_robust("amqp://guest:guest@localhost/")
        channel = await connection.channel()
        # Aumentar el prefetch_count para permitir múltiples mensajes
        await channel.set_qos(prefetch_count=self.max_concurrent_tasks)
        queue = await channel.declare_queue('practicas', durable=True)
        await queue.consume(self.callback)
        print(f' [*] Worker iniciado con capacidad para {self.max_concurrent_tasks} tareas concurrentes')
        print(' [*] Waiting for messages. To exit press CTRL+C')
        return connection

    async def close(self):
        # Esperar a que todas las tareas activas terminen
        if self.tasks:
            print(f"Esperando a que {len(self.tasks)} tareas terminen...")
            await asyncio.gather(*self.tasks, return_exceptions=True)
        await engine.dispose()

if __name__ == "__main__":
    # Puedes ajustar el número de tareas concurrentes según necesites
    worker = Worker(max_concurrent_tasks=5)
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