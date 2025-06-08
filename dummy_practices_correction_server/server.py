import asyncio
import json
import logging
import os
import random
from datetime import datetime
from aio_pika import connect_robust, IncomingMessage, Message
from core.config import settings
from core.logging_config import configure_logging

# Configure logging
configure_logging()
logger = logging.getLogger(__name__)

class DummyPracticeCorrectionServer:
    def __init__(self, max_concurrent_corrections=10):
        self.max_concurrent_corrections = max_concurrent_corrections
        self.semaphore = asyncio.Semaphore(max_concurrent_corrections)
        self.connection = None
        self.channel = None
        self.active_corrections = 0
        
        # Simulated correction templates for different subjects/practices
        self.correction_templates = {
            "java": {
                "grades": [8.5, 9.0, 9.25, 9.5, 9.75, 10.0, 7.5, 8.0, 6.5, 7.0, 8.75, 9.8],
                "feedback_comments": [
                    "- Excel·lent implementació del patró MVC\n- Codi ben estructurat i documentat\n- Interfície d'usuari intuïtiva i funcional",
                    "- Bon ús de les estructures de dades\n- Es podria millorar la gestió d'excepcions\n- La documentació és clara i completa",
                    "- M'agrada com ha quedat la interfície\n- A la memòria, és important tenir en compte que quan parlem sobre tipus d'esdeveniments ens estem referint als objectes\n- Em sembla un detall excel·lent que hàgiu afegit funcionalitat no sol·licitada a l'enunciat",
                    "- Implementació correcta dels algorismes\n- Codi net i ben organitzat\n- Es podrien afegir més casos de prova",
                    "- Molt bona gestió dels esdeveniments\n- Les classes estan ben dissenyades\n- El control d'errors és adequat",
                    "- Excel·lent ús de la programació orientada a objectes\n- La separació de responsabilitats és clara\n- Interfície gràfica ben implementada",
                    "- Bon disseny de l'arquitectura del programa\n- Els mètodes estan ben definits\n- Es podria optimitzar l'eficiència d'alguns algorismes",
                    "- La implementació de les col·leccions és correcta\n- Bon ús dels patrons de disseny\n- La funcionalitat compleix amb els requisits",
                    "- Codi molt llegible i ben comentat\n- Gestió adequada de la memòria\n- Les proves unitàries són suficients",
                    "- Excel·lent organització del projecte\n- La interfície segueix les convencions de Java Swing\n- Es podria millorar la validació d'entrada de dades",
                    "- Bon ús de l'herència i polimorfisme\n- Els fitxers estan ben organitzats\n- La documentació interna és clara",
                    "- Implementació robusta i estable\n- Bon tractament dels casos límit\n- La presentació de resultats és adequada"
                ],
                "build_warnings": [
                    "warning: [unchecked] unchecked call to addElement(E) as a member of the raw type DefaultListModel",
                    "warning: [unchecked] unchecked method invocation: method setModel in class JList",
                    "warning: [deprecation] method deprecated since version 1.8",
                    "Note: Some input files use or override a deprecated API.",
                    "warning: [rawtypes] found raw type: ArrayList",
                    "warning: [serial] serializable class does not declare a serialVersionUID field",
                    "warning: unused import java.util.Vector"
                ]
            },
            "python": {
                "grades": [8.0, 8.5, 9.0, 9.5, 10.0, 7.5, 9.25, 6.5, 7.0, 8.75, 9.8],
                "feedback_comments": [
                    "- Excel·lent ús de les llibreries de Python\n- Codi pythònic i ben estructurat\n- Documentació clara amb docstrings",
                    "- Bon maneig d'excepcions\n- Es podria optimitzar alguns algorismes\n- Tests unitaris ben implementats",
                    "- Implementació elegant i eficient\n- Codi fàcil de llegir i mantenir\n- Excel·lent ús de list comprehensions",
                    "- Molt bon ús de les funcions lambda\n- Els decoradors estan ben aplicats\n- La gestió de fitxers és correcta",
                    "- Excel·lent ús de les estructures de dades natives\n- Bon aprofitament de les característiques del llenguatge\n- El codi segueix les convencions PEP 8",
                    "- Implementació molt neta i professional\n- Bon ús dels mòduls i paquets\n- La gestió d'errors és adequada",
                    "- Excel·lent documentació amb docstrings\n- Els tipus d'anotació són correctes\n- Bon ús de les funcions built-in",
                    "- Codi molt llegible i ben organitzat\n- Bon ús dels context managers\n- Les proves cobreixen els casos principals",
                    "- Implementació eficient dels algorismes\n- Bon ús de generadors i iteradors\n- La modularitat del codi és excel·lent",
                    "- Excel·lent ús de la programació funcional\n- Les funcions són pures i ben definides\n- Bon tractament de les col·leccions",
                    "- Molt bon ús de les expressions regulars\n- La gestió de dates i temps és correcta\n- El parsing de dades és robust",
                    "- Implementació professional i neta\n- Bon ús dels patrons de disseny en Python\n- La gestió de dependències és adequada"
                ],
                "build_warnings": [
                    "PEP 8: line too long (85 > 79 characters)",
                    "unused import 'sys'",
                    "variable 'temp' is assigned but never used",
                    "PEP 8: expected 2 blank lines after class definition",
                    "undefined name 'variable_name' (check for typos)",
                    "PEP 8: missing whitespace around operator",
                    "imported but unused module 'os'"
                ]
            }
        }

    async def connect(self):
        """Establish connection to RabbitMQ"""
        self.connection = await connect_robust(settings.RPC_URL)
        self.channel = await self.connection.channel()
        logger.info("Dummy correction server connected to RabbitMQ")

    async def simulate_correction_process(self, procedure, subject, year, task, student_id, student_dir, teacher_dir):
        """Simulate the correction process with realistic delays and responses"""
        
        # Simulate processing time (between 5-30 seconds for demo purposes)
        processing_time = random.uniform(30, 120)
        logger.info(f"Starting correction for {student_id}/{task} - estimated time: {processing_time:.1f}s")
        
        # Simulate different stages of correction
        await asyncio.sleep(processing_time * 0.3)  # Compilation phase
        logger.info(f"Compilation completed for {student_id}/{task}")
        
        await asyncio.sleep(processing_time * 0.4)  # Testing phase
        logger.info(f"Testing completed for {student_id}/{task}")
        
        await asyncio.sleep(processing_time * 0.3)  # Grading phase
        logger.info(f"Grading completed for {student_id}/{task}")
        
        template = self.correction_templates.get(procedure, self.correction_templates["java"])
        
        # Generate correction result
        grade = random.choice(template["grades"])
        feedback = random.choice(template["feedback_comments"])
        
        # Generate build output with some warnings
        build_warnings = random.sample(template["build_warnings"], 
                                     random.randint(0, min(3, len(template["build_warnings"]))))
        
        build_output = ""
        if build_warnings:
            build_output = "\n".join([f"/path/to/{student_dir}/src/file.{procedure}: {warning}" 
                                    for warning in build_warnings])
            build_output += f"\n{len(build_warnings)} warnings\n"
        else:
            build_output = "Compilation successful with no warnings."
        
        # Create qualification table entry (CSV format)
        qualification_csv = f"""```
Identificador,Nom complet,Número ID,Estat,Qualificació,Qualificació màxima,Es pot canviar la qualificació,Darrera modificació (tramesa),Darrera modificació (qualificació),Comentaris de retroalimentació
Participant{random.randint(1000000, 9999999)},STUDENT NAME,{student_id},S'ha tramès per qualificar,{grade},"10,00",Sí,"{datetime.now().strftime('%A, %d de %B %Y, %H:%M')}",-,"{feedback.replace(chr(10), '<br>')}"
```"""
        
        # Generate grade contributions
        manual_adjustment = round(random.uniform(-0.5, 0.5), 2)
        grade_contributions = f"```\nmanual {task.upper()[:3]} {manual_adjustment}\n\n```" if manual_adjustment != 0 else "```\n\n```"
        
        # Generate feedback contributions  
        feedback_lines = feedback.split('\n')
        feedback_contributions = "```\n"
        for line in feedback_lines:
            if line.strip():
                feedback_contributions += f"manual {task.upper()[:3]} ; {line}\n"
        feedback_contributions += "\n```"
        
        # Create the complete correction response
        correction_result = {
            "Student Report": {
                "Student ID": student_id,
                "Report Date": datetime.now().strftime("%a %b %d %I:%M:%S %p CEST %Y"),
                "Qualification Table Entry": qualification_csv,
                "Filtered Grade Contributions": grade_contributions,
                "Filtered and Sorted Feedback Contributions": feedback_contributions,
                "Non-Filtered Grade Contributions": grade_contributions,
                "Non-Filtered Feedback Contributions": feedback_contributions,
                "Submission Build Output": f"```\n{build_output}\n```",
                "Additional Information": {
                    "Checks Output": [
                        f"[/home/teacher/tasks/{subject}/{year}/{task}/{student_id}/report/checks.out.html](file:///home/teacher/tasks/{subject}/{year}/{task}/{student_id}/report/checks.out.html)"
                    ]
                }
            }
        }
        
        return correction_result

    async def handle_correction_request(self, message: IncomingMessage):
        """Handle incoming correction requests"""
        async with self.semaphore:
            self.active_corrections += 1
            logger.info(f"Active corrections: {self.active_corrections}")
            
            try:
                async with message.process():
                    # Parse the request
                    body = message.body.decode('utf-8')
                    logger.info(f"Received correction request: {body}")
                    
                    # Parse comma-separated values
                    parts = body.split(',')
                    if len(parts) != 6:
                        error_msg = f"Error: Invalid request format. Expected 6 comma-separated values, got {len(parts)}"
                        logger.error(error_msg)
                        
                        await self.channel.default_exchange.publish(
                            Message(
                                body=error_msg.encode(),
                                correlation_id=message.correlation_id
                            ),
                            routing_key=message.reply_to
                        )
                        return
                    
                    subject, year, task, student_id, student_dir, teacher_dir = parts
                    
                    # Simulate occasional errors (5% chance)
                    if random.random() < 0.05:
                        error_msg = f"Error: Compilation failed for {student_id}/{task}"
                        logger.error(error_msg)
                        
                        await self.channel.default_exchange.publish(
                            Message(
                                body=error_msg.encode(),
                                correlation_id=message.correlation_id
                            ),
                            routing_key=message.reply_to
                        )
                        return
                    
                    # Perform the correction
                    correction_result = await self.simulate_correction_process(
                        message.routing_key, subject, year, task, student_id, student_dir, teacher_dir
                    )
                    
                    # Send the response
                    response_body = json.dumps(correction_result, ensure_ascii=False, indent=2)
                    
                    await self.channel.default_exchange.publish(
                        Message(
                            body=response_body.encode('utf-8'),
                            correlation_id=message.correlation_id
                        ),
                        routing_key=message.reply_to
                    )
                    
                    logger.info(f"Correction completed and sent for {student_id}/{task}")
                    
            except Exception as e:
                logger.error(f"Error processing correction request: {e}")
                error_msg = f"Error: Internal server error during correction"
                
                try:
                    await self.channel.default_exchange.publish(
                        Message(
                            body=error_msg.encode(),
                            correlation_id=message.correlation_id
                        ),
                        routing_key=message.reply_to
                    )
                except Exception as send_error:
                    logger.error(f"Failed to send error response: {send_error}")
                    
            finally:
                self.active_corrections -= 1

    async def start_server(self, languages=None):
        """Start the correction server for specified languages"""
        if languages is None:
            languages = ['java', 'python']
            
        await self.connect()
        
        # Set QoS to limit concurrent processing
        await self.channel.set_qos(prefetch_count=self.max_concurrent_corrections)
        
        # Create queues for each language and start consuming
        for language in languages:
            queue = await self.channel.declare_queue(language, durable=True)
            await queue.consume(self.handle_correction_request)
            logger.info(f"Started correction procedure for language: {language}")
            
        logger.info(f"Dummy correction procedure started for languages: {languages}")
        logger.info(f"Max concurrent corrections: {self.max_concurrent_corrections}")
        logger.warning("Server ready to process correction requests. Press CTRL+C to stop.")
        
        # Keep the server running
        try:
            await asyncio.Future()  # Run forever
        except KeyboardInterrupt:
            logger.info("Shutting down correction server...")
        finally:
            if self.connection and not self.connection.is_closed:
                await self.connection.close()
                logger.info("Connection closed")

async def main():
    """Main function to run the dummy correction server"""
    server = DummyPracticeCorrectionServer(max_concurrent_corrections=os.cpu_count() * 4)
    
    # Start server for common programming languages
    await server.start_server(['java', 'python'])

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Server stopped by user")