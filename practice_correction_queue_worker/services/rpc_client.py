import uuid
import json
import asyncio
import logging
from aio_pika import connect_robust, IncomingMessage, Message
from core.config import settings

logger = logging.getLogger(__name__)

class AsyncRpcClient():
    def __init__(self):
        logger.info("Requesting")
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

        logger.info("Connected and ready")
        return self

    async def on_response(self, message: IncomingMessage):
        """ Callback que maneja la respuesta del servidor RPC """
        async with message.process():
            correlation_id = message.correlation_id
            logger.info(f"Respuesta recibida en RPC Client: {message.body.decode('utf-8')}")
            
            try:
                if correlation_id in self.futures:
                    future: asyncio.Future = self.futures.pop(correlation_id)
                    future.set_result(message.body)
                    
            except Exception as e:
                logger.error(f"Error procesando el mensaje con correlation_id {correlation_id}: {e}")
    
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

        logger.info(f"Mensaje RPC enviado, esperando respuesta (correlation_id: {correlation_id})")
        return await future

    async def close(self):
        """Cierra la conexión"""
        if self.connection and not self.connection.is_closed:
            logger.info("Closing RPC connection")
            await self.connection.close()