import sys
import os
import json
import asyncio
from aio_pika import connect_robust, IncomingMessage, ExchangeType
from aiohttp import ClientSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from dotenv import load_dotenv
from backend.api.models import practicas_usuario  # PModels
from backend.api.mongodb import MongoDBClient  # Conexión a MongoDB
from backend.api.rpc_client import RpcClient  # Cliente RPC

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
HOST = os.getenv("DB_HOST")
#RABBIT_HOST = os.getenv("rabbit_host")
#RABBIT_PORT = int(os.getenv("rabbit_port"))

# Configuración de SQLAlchemy para uso asíncrono
engine = create_async_engine(DATABASE_URL, echo=True)
AsyncSessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False
)

class Worker:
    def __init__(self):
        self.rpc_client = RpcClient()
        self.mongo = MongoDBClient()

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

    async def callback(self, message: IncomingMessage):
        async with message.process():
            print(f" [x] Received {message.body.decode('utf-8')}")
            print(" [x] Done", message.body)
            
            async with AsyncSessionLocal() as db_session:
                try:
                    body_json = json.loads(message.body.decode('utf-8'))
                except json.JSONDecodeError:
                    print("Error al deserialitzar el missatge JSON")
                    return
                
                result = await self.rpc_client.call(body_json)
                print(f"Worker rep de cliet: {result}")
                
                result_str = result.decode('utf-8')
                result_dict = json.loads(result_str)
                
                print("La respuesta es de tipo", type(result_dict))
                
                id = result_dict["niub"]
                id_curs = result_dict["curs_id"]
                id_practica = result_dict["practica_id"]
                info = result_dict["info"]

                try:
                    dbMongo = self.mongo.getDatabase("mydb")
                    collection = self.mongo.getCollection("mycol")
                    self.mongo.correccion(id, id_curs, id_practica, info)

                    practica_usuario = await db_session.execute(
                        practicas_usuario.select().filter(
                            practicas_usuario.user_niub == id,
                            practicas_usuario.practicas_id == id_practica
                        )
                    )
                    practica_usuario = practica_usuario.scalar_one_or_none()

                    if practica_usuario:
                        practica_usuario.corregit = True
                        await db_session.commit()
                    else:
                        new_practica_usuario = practicas_usuario(
                            user_niub=id,
                            practicas_id=id_practica,
                            corregit=True
                        )
                        db_session.add(new_practica_usuario)
                        await db_session.commit()

                    data = {
                        'id': id,
                        'practica_id': id_practica,
                        'status': 'corrected'
                    }

                    await self.notify_practice_corrected(data)

                except Exception as e:
                    print(f"Error a l'interactuar amb MongoDB: {e}")

    async def start(self):
        connection = await connect_robust("amqp://guest:guest@localhost/")
        channel = await connection.channel()
        await channel.set_qos(prefetch_count=1)
        queue = await channel.declare_queue('practicas', durable=True)
        await queue.consume(self.callback)
        print(' [*] Waiting for messages. To exit press CTRL+C')
        return connection

    async def close(self):
        await engine.dispose()
        self.mongo.close()

if __name__ == "__main__":
    worker = Worker()
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