import sys
import os
sys.path.append("/app/backend")

#sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
#sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

import pika
#from .rpc_client import RpcClient
#from .mongodb import MongoDBClient
from sqlalchemy.orm import Session
import json
#from .database import SessionLocal
#from .models import practicas_usuario
from sqlalchemy.exc import SQLAlchemyError
import requests
import time

from dotenv import load_dotenv

from backend.api.database import SessionLocal  # PostgreSQL con SQLAlchemy
from backend.api.models import practicas_usuario  # PModels
from backend.api.mongodb import MongoDBClient  # Conexión a MongoDB
from backend.api.rpc_client import RpcClient  # Cliente RPC


load_dotenv()

#RABBIT_HOST = os.getenv("rabbit_host")
#RABBIT_PORT = int(os.getenv("rabbit_port"))
HOST = os.getenv("DB_HOST")

class Worker:
    def __init__(self):
        self.rpc_client = RpcClient()

        self.connection = pika.BlockingConnection(
            #pika.ConnectionParameters(host=RABBIT_HOST, port=RABBIT_PORT)
            pika.ConnectionParameters(host=HOST)
        )
        self.channel = self.connection.channel()

        self.channel.queue_declare(queue='practicas', durable=True)
        print(' [*] Waiting for messages. To exit press CTRL+C')

    def notify_practice_corrected(self, data):
        try:
            response = requests.post('http://localhost:5000/notify', json=data)
            if response.status_code == 200:
                print("Notificació enviada correctamente.")
            else:
                print(f"Error a l'enviar notificación: {response.status_code}")
        except Exception as e:
            print(f"Error al enviar notificació: {e}")

    def callback(self, ch, method, properties, body):
        print(f" [x] Received {body.decode('utf-8')}")
        print(" [x] Done", body)
        
        self.db_session = SessionLocal()
        self.mongo = MongoDBClient()

        ch.basic_ack(delivery_tag=method.delivery_tag)

        try:
            body_json = json.loads(body.decode('utf-8'))  
        except json.JSONDecodeError:
            print("Error al deserialitzar el missatge JSON")
            return
        
        result = self.rpc_client.call(body_json)
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

            practica_usuario = self.db_session.query(practicas_usuario).filter(
            practicas_usuario.user_niub == id, practicas_usuario.practicas_id == id_practica).first()

            if(practica_usuario):
                practica_usuario.corregit = True
                self.db_session.commit()
            else:
                new_practica_usuario = practicas_usuario(user_niub = id, practicas_id = id_practica, corregit = True)
                self.db_session.add(new_practica_usuario)
                self.db_session.commit()

            data = {
            'id': id,
            'practica_id': id_practica,
            'status': 'corrected'
            }

            self.notify_practice_corrected(data)

        except Exception as e:
            print(f"Error a l'interactuar amb MongoDB: {e}")
        finally:
            worker.close()

    def start(self):
        self.channel.basic_qos(prefetch_count=1)
        self.channel.basic_consume(queue='practicas', on_message_callback=self.callback)
        self.channel.start_consuming()
    
    def close(self):
        self.db_session.close()
        self.mongo.close()

if __name__ == "__main__":
    from threading import Thread

    try:
        worker = Worker()
        worker.start()
    except KeyboardInterrupt:
        print("Interrupció de l'usuari")
        