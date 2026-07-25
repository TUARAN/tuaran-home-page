import json
import os
import shutil
import subprocess
import sys
import threading
import uuid
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from typing import Optional
from urllib.parse import urlsplit

import httpx
from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field


APP_NAME = "tuaran-sadtalker-api"
SADTALKER_ROOT = Path(os.getenv("SADTALKER_ROOT", "/opt/SadTalker")).resolve()
DATA_ROOT = Path(os.getenv("SADTALKER_DATA_ROOT", "/data")).resolve()
PUBLIC_BASE_URL = os.getenv("SADTALKER_PUBLIC_BASE_URL", "").rstrip("/")
API_TOKEN = os.getenv("SADTALKER_API_TOKEN", "")
DEVICE = os.getenv("SADTALKER_DEVICE", "cuda").strip().lower()
ALLOWED_INPUT_HOSTS = {
    host.strip().lower()
    for host in os.getenv("SADTALKER_ALLOWED_INPUT_HOSTS", "2aran.com").split(",")
    if host.strip()
}
ALLOWED_WEBHOOK_HOSTS = {
    host.strip().lower()
    for host in os.getenv(
        "SADTALKER_ALLOWED_WEBHOOK_HOSTS",
        os.getenv("SADTALKER_ALLOWED_INPUT_HOSTS", "2aran.com"),
    ).split(",")
    if host.strip()
}
ALLOW_INSECURE_INPUTS = os.getenv("SADTALKER_ALLOW_INSECURE_INPUTS", "false").lower() == "true"
MAX_IMAGE_BYTES = int(os.getenv("SADTALKER_MAX_IMAGE_BYTES", str(6 * 1024 * 1024)))
MAX_AUDIO_BYTES = int(os.getenv("SADTALKER_MAX_AUDIO_BYTES", str(30 * 1024 * 1024)))

DATA_ROOT.mkdir(parents=True, exist_ok=True)
executor = ThreadPoolExecutor(max_workers=1, thread_name_prefix="sadtalker")
jobs = {}
processes = {}
lock = threading.RLock()


class JobOptions(BaseModel):
    enhancer: Optional[str] = Field(default="gfpgan")
    preprocess: str = Field(default="full")
    still: bool = Field(default=True)


class CreateJobRequest(BaseModel):
    source_image_url: str
    driven_audio_url: str
    webhook_url: str
    options: JobOptions = Field(default_factory=JobOptions)


def require_token(authorization: Optional[str] = Header(default=None)):
    if not API_TOKEN:
        raise HTTPException(status_code=503, detail="SADTALKER_API_TOKEN is not configured")
    if authorization != f"Bearer {API_TOKEN}":
        raise HTTPException(status_code=401, detail="Invalid API token")


def job_dir(job_id: str) -> Path:
    return DATA_ROOT / job_id


def metadata_path(job_id: str) -> Path:
    return job_dir(job_id) / "job.json"


def public_job(job):
    result = {
        "id": job["id"],
        "status": job["status"],
        "error": job.get("error", ""),
    }
    if job["status"] == "succeeded":
        result["output_url"] = f"{PUBLIC_BASE_URL}/v1/jobs/{job['id']}/output"
    return result


def save_job(job):
    folder = job_dir(job["id"])
    folder.mkdir(parents=True, exist_ok=True)
    metadata_path(job["id"]).write_text(
        json.dumps(job, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def update_job(job_id: str, **changes):
    with lock:
        job = jobs[job_id]
        job.update(changes)
        save_job(job)
        return dict(job)


def load_jobs():
    for path in DATA_ROOT.glob("*/job.json"):
        try:
            job = json.loads(path.read_text(encoding="utf-8"))
            if job.get("status") in {"queued", "processing", "starting"}:
                job["status"] = "failed"
                job["error"] = "SadTalker service restarted before the task completed."
                save_job(job)
            jobs[job["id"]] = job
        except (OSError, ValueError, KeyError):
            continue


def validate_remote_url(raw: str, *, webhook: bool = False):
    try:
        parsed = urlsplit(raw)
    except ValueError as exc:
        raise ValueError("Invalid URL") from exc
    if parsed.scheme not in ({"http", "https"} if ALLOW_INSECURE_INPUTS else {"https"}):
        raise ValueError("Only HTTPS URLs are allowed")
    hostname = (parsed.hostname or "").lower()
    allowed_hosts = ALLOWED_WEBHOOK_HOSTS if webhook else ALLOWED_INPUT_HOSTS
    if hostname not in allowed_hosts:
        raise ValueError(f"Remote host is not allowed: {hostname}")
    if not hostname or parsed.username or parsed.password:
        raise ValueError("Invalid URL")


def download_file(url: str, destination: Path, max_bytes: int):
    validate_remote_url(url)
    with httpx.stream("GET", url, follow_redirects=False, timeout=60.0) as response:
        response.raise_for_status()
        declared_size = int(response.headers.get("content-length", "0") or 0)
        if declared_size > max_bytes:
            raise ValueError("Remote input is too large")
        written = 0
        with destination.open("wb") as output:
            for chunk in response.iter_bytes():
                written += len(chunk)
                if written > max_bytes:
                    raise ValueError("Remote input is too large")
                output.write(chunk)


def notify_webhook(job):
    webhook_url = job.get("webhook_url", "")
    if not webhook_url:
        return
    try:
        validate_remote_url(webhook_url, webhook=True)
        httpx.post(webhook_url, json=public_job(job), timeout=30.0)
    except Exception:
        # 网站还会主动轮询；回调失败不应覆盖已经生成的结果。
        return


def run_job(job_id: str):
    with lock:
        if jobs[job_id]["status"] == "canceled":
            return
    job = update_job(job_id, status="processing", error="")
    folder = job_dir(job_id)
    source_path = folder / "source_image"
    audio_path = folder / "driven_audio.mp3"
    result_dir = folder / "results"
    result_dir.mkdir(parents=True, exist_ok=True)

    try:
        download_file(job["source_image_url"], source_path, MAX_IMAGE_BYTES)
        download_file(job["driven_audio_url"], audio_path, MAX_AUDIO_BYTES)
        with lock:
            if jobs[job_id]["status"] == "canceled":
                return

        command = [
            sys.executable,
            str(SADTALKER_ROOT / "inference.py"),
            "--source_image",
            str(source_path),
            "--driven_audio",
            str(audio_path),
            "--result_dir",
            str(result_dir),
            "--checkpoint_dir",
            str(SADTALKER_ROOT / "checkpoints"),
            "--preprocess",
            job["options"]["preprocess"],
        ]
        if job["options"].get("still"):
            command.append("--still")
        if job["options"].get("enhancer"):
            command.extend(["--enhancer", job["options"]["enhancer"]])
        if DEVICE == "cpu":
            command.append("--cpu")

        log_path = folder / "inference.log"
        with log_path.open("wb") as log_file:
            process = subprocess.Popen(
                command,
                cwd=SADTALKER_ROOT,
                stdout=log_file,
                stderr=subprocess.STDOUT,
            )
            with lock:
                processes[job_id] = process
            exit_code = process.wait()
        with lock:
            processes.pop(job_id, None)

        if jobs[job_id]["status"] == "canceled":
            return
        if exit_code != 0:
            raise RuntimeError(f"SadTalker exited with code {exit_code}")

        outputs = sorted(result_dir.rglob("*.mp4"), key=lambda path: path.stat().st_mtime)
        if not outputs:
            raise RuntimeError("SadTalker did not produce an MP4 file")
        shutil.move(str(outputs[-1]), str(folder / "result.mp4"))
        completed = update_job(job_id, status="succeeded", error="")
        notify_webhook(completed)
    except Exception as exc:
        with lock:
            processes.pop(job_id, None)
        if jobs[job_id]["status"] != "canceled":
            failed = update_job(job_id, status="failed", error=str(exc)[:500])
            notify_webhook(failed)


load_jobs()
app = FastAPI(title=APP_NAME, version="1.0.0")


@app.get("/health")
def health():
    ready = (
        bool(API_TOKEN)
        and bool(PUBLIC_BASE_URL)
        and (SADTALKER_ROOT / "inference.py").is_file()
        and (SADTALKER_ROOT / "checkpoints").is_dir()
    )
    return {
        "status": "ok" if ready else "not_ready",
        "ready": ready,
        "device": DEVICE,
        "queued_jobs": sum(job["status"] == "queued" for job in jobs.values()),
    }


@app.post("/v1/jobs", status_code=202, dependencies=[Depends(require_token)])
def create_job(payload: CreateJobRequest):
    if not PUBLIC_BASE_URL:
        raise HTTPException(status_code=503, detail="SADTALKER_PUBLIC_BASE_URL is not configured")
    if not (SADTALKER_ROOT / "inference.py").is_file():
        raise HTTPException(status_code=503, detail="SadTalker is not installed")
    try:
        validate_remote_url(payload.source_image_url)
        validate_remote_url(payload.driven_audio_url)
        validate_remote_url(payload.webhook_url, webhook=True)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    if payload.options.preprocess not in {"crop", "extcrop", "resize", "full", "extfull"}:
        raise HTTPException(status_code=400, detail="Invalid preprocess option")
    if payload.options.enhancer not in {None, "", "gfpgan", "RestoreFormer"}:
        raise HTTPException(status_code=400, detail="Invalid enhancer option")

    job_id = uuid.uuid4().hex
    job = {
        "id": job_id,
        "status": "queued",
        "error": "",
        "source_image_url": payload.source_image_url,
        "driven_audio_url": payload.driven_audio_url,
        "webhook_url": payload.webhook_url,
        "options": payload.options.model_dump(),
    }
    with lock:
        jobs[job_id] = job
        save_job(job)
    executor.submit(run_job, job_id)
    return public_job(job)


@app.get("/v1/jobs/{job_id}", dependencies=[Depends(require_token)])
def get_job(job_id: str):
    with lock:
        job = jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return public_job(job)


@app.post("/v1/jobs/{job_id}/cancel", dependencies=[Depends(require_token)])
def cancel_job(job_id: str):
    with lock:
        job = jobs.get(job_id)
        process = processes.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job["status"] not in {"succeeded", "failed", "canceled"}:
        if process and process.poll() is None:
            process.terminate()
        job = update_job(job_id, status="canceled", error="")
    return public_job(job)


@app.get("/v1/jobs/{job_id}/output", dependencies=[Depends(require_token)])
def get_output(job_id: str):
    with lock:
        job = jobs.get(job_id)
    output = job_dir(job_id) / "result.mp4"
    if not job or job["status"] != "succeeded" or not output.is_file():
        raise HTTPException(status_code=404, detail="Output not found")
    return FileResponse(output, media_type="video/mp4", filename=f"{job_id}.mp4")
