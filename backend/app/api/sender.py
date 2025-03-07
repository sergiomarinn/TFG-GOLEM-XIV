
import sys
import time
import pika
import json
import os
from dotenv import load_dotenv

load_dotenv("C:/Users/rocio/IdeaProjects/TFG/backend/.env")

#RABBIT_HOST = os.getenv("rabbit_host")
#RABBIT_PORT = int(os.getenv("rabbit_port"))
HOST = os.getenv("DB_HOST")

class Sender:
    def __init__(self, body):

        connection = pika.BlockingConnection(
            #pika.ConnectionParameters(host=RABBIT_HOST, port=RABBIT_PORT)
            pika.ConnectionParameters(host=HOST)
        )
        channel = connection.channel()

        channel.queue_declare(queue="practicas", durable=True)

        self.push_queue(channel, connection, body)
    
    def push_queue(self, channel, connection, body):
        message = json.dumps(body).encode('utf-8')
        channel.basic_publish(
            exchange="",
            routing_key="practicas",
            body=message,
            properties=pika.BasicProperties(
                delivery_mode=pika.DeliveryMode.Persistent,
            ),
        )
        print(f" [x] Enviada a worker {message}")

        connection.close()