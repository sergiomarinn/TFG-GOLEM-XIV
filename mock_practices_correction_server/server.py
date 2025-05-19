from pika.adapters.blocking_connection import BlockingChannel, BlockingConnection
from pika import URLParameters
from pika.spec import Basic, BasicProperties

import json 
import os
from dotenv import load_dotenv
from handlers import handle_java, handle_python

load_dotenv()

RPC_URL = os.getenv("RPC_URL", "amqp://guest:guest@localhost:5672/%2f")

connection = BlockingConnection(
    URLParameters(RPC_URL)
)
channel = connection.channel()
channel.queue_declare(queue="rpc_queue")


def on_request(ch: BlockingChannel, method: Basic.Deliver, props: BasicProperties, body: bytes) -> None:
    decoded = body.decode("utf-8")
    print(f" [i] Mensaje recibido: {decoded}")

    data = json.loads(decoded)
    programming_language = data.get("language")
    name = data.get("name")

    if programming_language == "java":
        response = handle_java(name, data)
    elif programming_language == "python":
        response = handle_python(name, data)
    else:
        response = {"error": f"Lenguaje '{programming_language}' no soportado"}

    response_json = json.dumps(response)

    print(f" [*] Publicando en la cola {props.reply_to}: {response_json}")
    ch.basic_publish(
        exchange="",
        routing_key=props.reply_to,
        properties=BasicProperties(correlation_id=props.correlation_id),
        body=response_json.encode(),
    )
    ch.basic_ack(delivery_tag=method.delivery_tag)

channel.basic_qos(prefetch_count=1)
channel.basic_consume(queue="rpc_queue", on_message_callback=on_request)

print(" [x] Awaiting RPC requests")
channel.start_consuming()