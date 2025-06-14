import json
import asyncio
import platform
import os
import logging
from aio_pika import connect_robust, IncomingMessage, Message
from sqlalchemy.ext.asyncio import async_sessionmaker
from sqlmodel import select
from models import Practice, PracticesUsersLink, StatusEnum
from services.rpc_client import AsyncRpcClient
from core.db import engine
from core.config import settings
from core.logging_config import configure_logging
from io import StringIO
import csv
import re
from contextlib import asynccontextmanager

async_session = async_sessionmaker(engine, expire_on_commit=False)

# Set the correct event loop policy for Windows
if platform.system() == 'Windows':
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

configure_logging()
logger = logging.getLogger(__name__)

logger.info(f"Using event loop: {asyncio.get_event_loop_policy()}")

class PracticeCorrectionQueueWorker:
    def __init__(self, max_concurrent_tasks=5, max_retries=3):
        self.max_concurrent_tasks = max_concurrent_tasks
        self.max_retries = max_retries
        self.semaphore = asyncio.Semaphore(max_concurrent_tasks)
        self.tasks = set()  # Para mantener un seguimiento de tareas activas
        self.channel = None

    @asynccontextmanager
    async def get_db(self):
        """Context manager for database sessions with proper error handling"""
        session = None
        try:
            session = async_session()
            yield session
        except Exception as e:
            if session:
                try:
                    await session.rollback()
                except Exception as rollback_error:
                    logger.error(f"Error during rollback: {rollback_error}")
            raise e
        finally:
            if session:
                try:
                    await session.close()
                except Exception as close_error:
                    logger.error(f"Error closing session: {close_error}")


    async def update_practice_status(self, niub: str, practice_id: str, status: StatusEnum, correction=None):
        """Separate method to update practice status with independent DB session"""
        try:
            async with self.get_db() as db_session:
                practice_user = await db_session.execute(
                    select(PracticesUsersLink).where(
                        PracticesUsersLink.user_niub == niub,
                        PracticesUsersLink.practice_id == practice_id
                    )
                )
                practice_user = practice_user.scalar_one_or_none()
                
                if practice_user:
                    practice_user.status = status
                    if correction is not None:
                        practice_user.correction = correction
                    
                    db_session.add(practice_user)
                    await db_session.commit()
                    await db_session.refresh(practice_user)
                    logger.info(f"Updated practice {practice_id} status to {status.value} for NIUB {niub}")
                    return True
                else:
                    return False
        except Exception as e:
            logger.error(f"Error updating practice status: {e}")
            return False


    def process_correction_data(self, correction_raw):
        """Extract and process correction data from raw response"""
        student_report = correction_raw.get('Student Report', {})
        
        # Extract grade and comments from Qualification Table Entry CSV
        qualification_table_raw = student_report.get('Qualification Table Entry', '')
        grade = None
        feedback_comments = None

        if qualification_table_raw:
            try:
                # Clean the CSV content (remove markdown code blocks)
                csv_content = qualification_table_raw.strip('```\n')
                csv_reader = csv.DictReader(StringIO(csv_content))
                
                # Get the first (and usually only) row of data
                for row in csv_reader:
                    # Extract grade from 'Qualificació' column
                    if 'Qualificació' in row and row['Qualificació']:
                        try:
                            grade = float(row['Qualificació'].replace(',', '.'))
                        except (ValueError, TypeError):
                            grade = None
                    
                    # Extract feedback comments from 'Comentaris de retroalimentació' column
                    if 'Comentaris de retroalimentació' in row and row['Comentaris de retroalimentació']:
                        feedback_comments = row['Comentaris de retroalimentació']
                        
                        # Clean HTML tags if present
                        feedback_comments = re.sub(r'<br>', '\n', feedback_comments)
                        feedback_comments = re.sub(r'<[^>]+>', '', feedback_comments)
                    
                    break  # Usually only one row of data
                    
            except Exception as e:
                logger.warning(f"Failed to parse Qualification Table Entry CSV: {e}")
                # Fallback to Global Grade parsing if CSV parsing fails
                global_grade_raw = student_report.get('Global Grade', '')
                if global_grade_raw:
                    lines = global_grade_raw.strip('```\n').split('\n')
                    for line in lines:
                        if line.strip() and not line.startswith('Número ID') and ',' in line:
                            parts = line.split(',')
                            if len(parts) > 0:
                                try:
                                    grade = float(parts[-1])
                                    break
                                except (ValueError, IndexError):
                                    continue

        # Create filtered correction object with only relevant fields
        return {
            'grade': grade,
            'feedback_comments': feedback_comments,
            'student_id': student_report.get('Student ID'),
            'report_date': student_report.get('Report Date'),
            'qualification_table_entry': student_report.get('Qualification Table Entry'),
            'filtered_grade_contributions': student_report.get('Filtered Grade Contributions'),
            'filtered_feedback_contributions': student_report.get('Filtered and Sorted Feedback Contributions'),
            'non_filtered_grade_contributions': student_report.get('Non-Filtered Grade Contributions'),
            'non_filtered_feedback_contributions': student_report.get('Non-Filtered Feedback Contributions'),
            'submission_build_output': student_report.get('Submission Build Output'),
            'checks_output': student_report.get('Additional Information', {}).get('Checks Output')
        }


    async def process_message(self, message: IncomingMessage):
        # Usamos semáforo para limitar la cantidad de tareas concurrentes
        async with self.semaphore:
            async with message.process(ignore_processed=True):
                logger.info(f"Received {message.body.decode('utf-8')}")

                try:
                    hasInvalidFields = False
                    try:
                        # Decodificar el mensaje JSON
                        body_json = json.loads(message.body.decode('utf-8'))
                    except json.JSONDecodeError:
                        raise ValueError("Error deserializing JSON message")
                    
                    required_fields = ["subject", "year", "task", "task_id", "student_id", "language"]
                    for field in required_fields:
                        if field not in body_json:
                            hasInvalidFields = True
                            raise ValueError(f"Message missing required field: {field}")
                    
                    niub = body_json["student_id"]
                    id_practice = body_json["task_id"]
                    practice_name = body_json["task"]
                    language = body_json["language"]
                    subject = body_json["subject"]
                    year = body_json["year"]

                    body_json["student_dir"] = body_json.get("student_dir", f"student_{niub}")
                    body_json["teacher_dir"] = body_json.get("teacher_dir", f"teacher_{id_practice}")

                    # Valida que la práctica exista en la base de datos
                    async with self.get_db() as db_session:
                        practice = await db_session.execute(
                            select(Practice).where(Practice.id == id_practice)
                        )
                        practice = practice.scalar_one_or_none()

                        if not practice:
                            hasInvalidFields = True
                            raise ValueError(f"Practice with ID {id_practice} not found")
                        
                    # Actualiza el estado de la práctica a CORRECTING
                    status_updated = await self.update_practice_status(niub, id_practice, StatusEnum.CORRECTING)
                    if not status_updated:
                        raise ValueError(f"Practice for user with NIUB {niub} and practice ID {id_practice} not found")

                    # Crear una instancia de RPC Client para cada mensaje
                    rpc_client = AsyncRpcClient()
                    
                    # Procesa la llamada al cliente RPC
                    try:
                        await rpc_client.connect()
                        
                        # Timeout en 15 minutos
                        result: bytes = await asyncio.wait_for(
                            rpc_client.call(language, body_json), 
                            timeout=900
                        )
                    except TimeoutError:
                        raise Exception(f"RPC call timed out after 15 minutes for user with NIUB {niub} and practice ID {id_practice}")
                    finally:
                        try:
                            await rpc_client.close()
                        except Exception as close_error:
                            logger.error(f"Error closing RPC client: {close_error}")

                    if not result:
                        raise ValueError("No response received from RPC server")
                    
                    result_str = result.decode('utf-8')
                    
                    if result_str.startswith("Error:"):
                        raise ValueError(f"Error from RPC server: {result_str}")
                    
                    correction_raw = json.loads(result_str)

                    if not correction_raw:
                        raise ValueError(f"Empty correction result for practice {practice_name} of NIUB {niub}")

                    logger.info(f"Processed correction result: {correction_raw}")
                    
                    # Procesar los datos de corrección
                    correction = self.process_correction_data(correction_raw)

                    # Actualiza con los resultados de la corrección
                    await self.update_practice_status(niub, id_practice, StatusEnum.CORRECTED, correction)

                    logger.info(f"Practice {id_practice} updated with correction.")

                    await message.ack()
                    logger.info(f"Correction for NIUB {niub} completed successfully for practice {practice_name}")

                except Exception as e:
                    logger.error(f"Error processing message: {str(e)}")
                    
                    # Obtener contador de reintentos
                    headers = message.headers or {}
                    retry_count = headers.get("retry_count", 0)

                    if not hasInvalidFields:
                        logger.warning(f"Failded practice correction for NIUB {niub} and practice {practice_name}.")
                    
                    if retry_count >= self.max_retries or hasInvalidFields:
                        if not hasInvalidFields:
                            await self.update_practice_status(niub, id_practice, StatusEnum.REJECTED)

                        logger.warning(f"Permanent failure after {retry_count} attempts. Sending to DLQ.")
                        if hasInvalidFields:
                            logger.warning(f"Message has invalid fields")

                        # Enviar a la cola DLQ final
                        await self.channel.default_exchange.publish(
                            Message(
                                body=message.body,
                                headers=headers
                            ),
                            routing_key="practicas.dlq"
                        )
                        await message.ack()
                        
                    else:
                        # Incrementar contador y rechazar (irá a retry.practicas)
                        new_headers = {**headers, "retry_count": retry_count + 1}

                        # Reintenta el mensaje con el contador actualizado
                        await self.channel.default_exchange.publish(
                            Message(
                                body=message.body,
                                headers=new_headers,
                                delivery_mode=message.delivery_mode
                            ),
                            routing_key="retry.practicas"
                        )
                        
                        await message.ack()
                        logger.warning(f"Retrying ({retry_count + 1}/{self.max_retries})...")
                      

    async def callback(self, message: IncomingMessage):
        # Crear una nueva tarea para procesar el mensaje
        task = asyncio.create_task(self.process_message(message))
        self.tasks.add(task)
        
        def task_done_callback(task):
            self.tasks.discard(task)
            # Log any unhandled exceptions
            if task.exception() and not task.cancelled():
                logger.error(f"Unhandled exception in task: {task.exception()}")
        
        task.add_done_callback(task_done_callback)


    async def start(self):
        logger.warning(f'Starting worker...')
        connection = await connect_robust(settings.CLOUDAMQP_URL)
        self.channel = await connection.channel()
        await self.channel.set_qos(prefetch_count=self.max_concurrent_tasks)
        
        # Cola principal
        main_queue = await self.channel.declare_queue('practicas', durable=True)
        
        # Cola de reintentos con TTL
        retry_queue = await self.channel.declare_queue(
            'retry.practicas',
            durable=True,
            arguments={
                "x-message-ttl": 5000,  # 5 segundos de retraso
                "x-dead-letter-exchange": "",
                "x-dead-letter-routing-key": "practicas"
            }
        )
        
        # Cola DLQ final para mensajes que han fallado demasiadas veces
        await self.channel.declare_queue('practicas.dlq', durable=True)
        
        await main_queue.consume(self.callback)
        logger.info(f'Worker started with capacity for {self.max_concurrent_tasks} concurrent tasks')
        logger.warning('Waiting for messages. To exit press CTRL+C')
        return connection


    async def close(self):
        # Esperar a que todas las tareas activas terminen
        if self.tasks:
            logger.warning(f"Waiting for {len(self.tasks)} tasks to complete...")
            
            # Si alguna tarea no se completa en el tiempo esperado, cancelarla
            try:
                await asyncio.wait_for(
                    asyncio.gather(*self.tasks, return_exceptions=True),
                    timeout=300  # 5 minutos de timeout para un apagado seguro
                )
            except asyncio.TimeoutError:
                logger.warning("Some tasks did not complete within timeout, cancelling them...")
                for task in self.tasks:
                    if not task.done():
                        task.cancel()
        
        try:
            await engine.dispose()
        except Exception as e:
            logger.error(f"Error disposing engine: {e}")


if __name__ == "__main__":
    worker = PracticeCorrectionQueueWorker(max_concurrent_tasks=os.cpu_count() * 4)

    async def main():
        connection = await worker.start()
        try:
            await asyncio.Future() # Wait indefinitely
        except KeyboardInterrupt:
            logger.warning("User interruption")
        finally:
            try:
                await connection.close()
            except Exception as e:
                logger.error(f"Error closing connection: {e}")
            
            await worker.close()
    
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.warning("User interruption")