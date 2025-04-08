import pika
import json
from app.core.config import settings

def send_practice_data(body):
    """Envía un mensaje a la cola del queue worker de corrección de prácticas."""
    connection = pika.BlockingConnection(
        pika.URLParameters(settings.CLOUDAMQP_URL)
    )
    channel = connection.channel()

    # Declarar la cola principal - debe coincidir con la configuración del worker
    channel.queue_declare(queue="practicas", durable=True)
    
    # Declarar la cola de reintentos con TTL
    channel.queue_declare(
        queue="retry.practicas", 
        durable=True,
        arguments={
            "x-message-ttl": 5000,  # 5 segundos de retraso
            "x-dead-letter-exchange": "",
            "x-dead-letter-routing-key": "practicas"
        }
    )
    
    # Declarar la cola DLQ para mensajes fallidos permanentemente
    channel.queue_declare(queue="practicas.dlq", durable=True)

    # Inicializar headers con contador de reintentos a 0
    headers = {"retry_count": 0}
    
    message = json.dumps(body).encode('utf-8')
    channel.basic_publish(
        exchange="",
        routing_key="practicas",
        body=message,
        properties=pika.BasicProperties(
            delivery_mode=pika.DeliveryMode.Persistent,
            headers=headers  # Incluimos los headers con el contador
        ),
    )
    print(f" [x] Sended to worker {message}")

    connection.close()