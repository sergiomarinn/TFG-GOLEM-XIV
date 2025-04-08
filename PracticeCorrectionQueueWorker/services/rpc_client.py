import uuid
import json
import asyncio
from aio_pika import connect_robust, IncomingMessage, Message
from core.config import settings

class AsyncRpcClient():
    def __init__(self):
        print(" [x] Requesting RPC Client")
        self.connection = None
        self.channel = None
        self.callback_queue = None
        self.futures = {}

    async def connect(self):
        """Establece la conexión con RabbitMQ"""
        # Conectar con RabbitMQ
        self.connection = await connect_robust(settings.RPC_URL)
        self.channel = await self.connection.channel()

        # Crear una cola exclusiva para recibir respuestas
        self.callback_queue = await self.channel.declare_queue("", exclusive=True)

        # Configurar el consumidor para recibir respuestas
        await self.callback_queue.consume(self.on_response)

        print(" [i] RPC Client connected and ready")
        return self

    async def on_response(self, message: IncomingMessage):
        """ Callback que maneja la respuesta del servidor RPC """
        async with message.process():
            correlation_id = message.correlation_id
            print(f" [x] Respuesta recibida en RPC Client: {message.body.decode('utf-8')}")
            
            try:
                if correlation_id in self.futures:
                    future: asyncio.Future = self.futures.pop(correlation_id)
                    future.set_result(message.body)
                    
            except Exception as e:
                print(f" [E] Error procesando el mensaje con correlation_id {correlation_id}: {e}")
    
    async def call(self, body):
        """ Envía un mensaje al servidor RPC y espera la respuesta """
        if not self.connection or self.connection.is_closed:
            await self.connect()
            
        correlation_id = str(uuid.uuid4())
        future = asyncio.get_event_loop().create_future()
        self.futures[correlation_id] = future

        body_json = json.dumps(body)

        await self.channel.default_exchange.publish(
            Message(
                body=body_json.encode(),
                correlation_id=correlation_id,
                reply_to=self.callback_queue.name,
            ),
            routing_key="rpc_queue",
        )

        print(f" [*] Mensaje RPC enviado, esperando respuesta (correlation_id: {correlation_id})")
        return await future

    async def close(self):
        """Cierra la conexión"""
        if self.connection and not self.connection.is_closed:
            await self.connection.close()