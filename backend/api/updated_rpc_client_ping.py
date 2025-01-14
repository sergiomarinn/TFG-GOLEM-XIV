import aio_pika

import asyncio

import uuid


class RpcClientPing:
    def __init__(self):
        self.connection = None
        self.channel = None
        self.callback_queue = None
        self.loop = asyncio.get_event_loop()
        self.futures = {}

    async def connect(self):
        self.connection = await aio_pika.connect_robust("amqp://guest:guest@localhost/")
        self.channel = await self.connection.channel()

        self.callback_queue = await self.channel.declare_queue('', exclusive=True)

        await self.channel.set_qos(prefetch_count=1)

        await self.callback_queue.consume(self.on_response)

  
    def on_response(self, message: aio_pika.IncomingMessage):
        future = self.futures.pop(message.correlation_id, None)

        if future and not future.done():
            future.set_result(message.body)

    async def call(self, procedure, subject, year, task, student_id, student_dir, teacher_dir):
        if not self.connection or self.connection.is_closed:
            await self.connect()

        corr_id = str(uuid.uuid4())

        future = self.loop.create_future()

        self.futures[corr_id] = future

        await self.channel.default_exchange.publish(
            aio_pika.Message(
                body=f"{subject},{year},{task},{student_id},{student_dir},{teacher_dir}".encode(),
                reply_to=self.callback_queue.name,
                correlation_id=corr_id,
            ),
            routing_key=procedure
        )

        return await future

    async def call_ping(self, procedure):
        if not self.connection or self.connection.is_closed:
            await self.connect()

        corr_id = str(uuid.uuid4())
        future = self.loop.create_future()
        self.futures[corr_id] = future

        await self.channel.default_exchange.publish(
            aio_pika.Message(
                body="".encode(),
                reply_to=self.callback_queue.name,
                correlation_id=corr_id,
            ),
            routing_key=procedure
        )

        return await future
