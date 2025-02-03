FROM python:3.10

WORKDIR /app

COPY queueWorker/requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY queueWorker /app/

ENV PYTHONPATH="/app/backend"

CMD python worker.py

