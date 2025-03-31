import pika
import json
import os
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())

#RABBIT_HOST = os.getenv("rabbit_host")
#RABBIT_PORT = int(os.getenv("rabbit_port"))
HOST = os.getenv("DB_HOST")

def send_practice_data(body):
    """Envía un mensaje a la cola de RabbitMQ"""
    connection = pika.BlockingConnection(
        pika.ConnectionParameters(host=HOST)
    )
    channel = connection.channel()

    channel.queue_declare(queue="practicas", durable=True)

    message = json.dumps(body).encode('utf-8')
    channel.basic_publish(
        exchange="",
        routing_key="practicas",
        body=message,
        properties=pika.BasicProperties(
            delivery_mode=pika.DeliveryMode.Persistent,
        ),
    )
    print(f" [x] Sended to worker {message}")

    connection.close()