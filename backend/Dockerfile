FROM python:3.10-slim

WORKDIR /app

COPY ./ /app/
COPY ./requirements.txt /app/requirements.txt
COPY ./start.sh /app/start.sh  

RUN chmod +x /app/start.sh

RUN pip install --no-cache-dir -r /app/requirements.txt

EXPOSE 8000

CMD ["/app/start.sh"]




