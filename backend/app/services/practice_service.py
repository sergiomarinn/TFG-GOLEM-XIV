import pika
import json
from app.core.config import settings

def send_practice_data(body):
    """Envía un mensaje a la cola de RabbitMQ"""
    connection = pika.BlockingConnection(
        pika.URLParameters(settings.CLOUDAMQP_URL)
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