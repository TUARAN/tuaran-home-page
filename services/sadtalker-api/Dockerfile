FROM pytorch/pytorch:2.0.1-cuda11.7-cudnn8-runtime

ARG SADTALKER_COMMIT=cd4c0465ae0b54a6f85af57f5c65fec9fe23e7f8

ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONUNBUFFERED=1 \
    SADTALKER_ROOT=/opt/SadTalker \
    SADTALKER_DATA_ROOT=/data

RUN apt-get update \
    && apt-get install -y --no-install-recommends ffmpeg git wget \
    && rm -rf /var/lib/apt/lists/*

RUN git clone https://github.com/OpenTalker/SadTalker.git /opt/SadTalker \
    && cd /opt/SadTalker \
    && git checkout "${SADTALKER_COMMIT}" \
    && sed -i '/^gradio/d' requirements.txt \
    && pip install --no-cache-dir torchvision==0.15.2 \
    && pip install --no-cache-dir -r requirements.txt \
    && bash scripts/download_models.sh

WORKDIR /srv/sadtalker-api
COPY requirements-api.txt .
RUN pip install --no-cache-dir -r requirements-api.txt
COPY app ./app

VOLUME ["/data"]
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
