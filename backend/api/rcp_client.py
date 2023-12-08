import pika
import uuid

class RpcClient:
    def __init__(self):
        self.connection = pika.BlockingConnection(pika.ConnectionParameters('localhost'))
        self.channel = self.connection.channel()

        result = self.channel.queue_declare(queue='', exclusive=True)
        self.callback_queue = result.method.queue

        self.channel.basic_consume(
            queue=self.callback_queue,
            on_message_callback=self.on_response,
            auto_ack=True
        )

    def on_response(self, ch, method, properties, body):
        if self.corr_id == properties.correlation_id:
            self.response = body

    def call(self, procedure, subject, year, task, student_id, student_dir, teacher_dir):
        self.response = None
        self.corr_id = str(uuid.uuid4())
        self.channel.basic_publish(
            exchange='',
            routing_key=procedure,
            properties=pika.BasicProperties(
                reply_to=self.callback_queue,
                correlation_id=self.corr_id
            ),
            body=f"{subject},{year},{task},{student_id},{student_dir},{teacher_dir}"
        )

        while self.response is None:
            self.connection.process_data_events()

        return self.response.decode()

def main():
    rpc_client = RpcClient()

    procedure = "java_checks"
    result = rpc_client.call(procedure, "prog2", "2223", "pr32", "niub20217245", "/home/dortiz/tmp/rpc_server/student_dir", "/home/dortiz/tmp/rpc_server/teacher_dir")
    print(" [.] Got result for " + procedure + ":", result)


