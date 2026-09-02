FROM python:3.13-slim

WORKDIR /app

RUN pip install --no-cache-dir locust==2.46.3

COPY runner.py locustfile.py ./

ENV PORT=8080
EXPOSE 8080

CMD ["python", "runner.py"]
