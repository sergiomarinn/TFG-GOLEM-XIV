import uuid
import time
import pika
import json
import os
from dotenv import load_dotenv

load_dotenv("C:/Users/rocio/IdeaProjects/TFG/backend/.env")

#RABBIT_HOST = os.getenv("rabbit_host")
#RABBIT_PORT = int(os.getenv("rabbit_port"))
HOST = os.getenv("DB_HOST")

class RpcClient():
    def __init__(self):

        print(" [x] Requesting RpcClient")

        self.connection = pika.BlockingConnection(
            #pika.ConnectionParameters(host=RABBIT_HOST, port=RABBIT_PORT)
            pika.ConnectionParameters(host=HOST)
        )


        self.channel = self.connection.channel()

        result = self.channel.queue_declare(queue="", exclusive=True)
        self.callback_queue = result.method.queue

        self.channel.basic_consume(
            queue=self.callback_queue,
            on_message_callback=self.on_response,
            auto_ack=True,
        )

        self.response = None
        self.corr_id = None

    def on_response(self, ch, method, props, body):
        print(f"Respuesta recibida en RpcClient: {body.decode('utf-8')}")
        if self.corr_id == props.correlation_id:
            self.response = body

    def call(self, body):
        print("Estoy en el método call de RPC_Client")
        self.response = None
        self.corr_id = str(uuid.uuid4())
        body_json = json.dumps(body)

        self.channel.basic_publish(
            exchange="",
            routing_key="rpc_queue",
            properties=pika.BasicProperties(
                reply_to=self.callback_queue,
                correlation_id=self.corr_id,
            ),
            body=body_json,
        )
        self.connection.process_data_events(time_limit=None)
        print("RPC_Client devuelve", self.response)
        return self.response