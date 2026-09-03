"""
Free, self-hosted alternative to the ElevenLabs-backed provider in
svara-app/lib/elevenlabs.js — same job-based contract (create -> poll status
-> fetch audio), built on open-source models instead of a paid API.

Run: uvicorn app.main:app --reload
Full pipeline requires requirements-models.txt to be installed on a machine
with real internet access (see each module's docstring in app/pipeline/).
"""

from __future__ import annotations

import shutil
import threading
from pathlib import Path

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse

from . import storage
from .pipeline.orchestrator import run_pipeline

app = FastAPI(title="Svara open-source backend")


@app.get("/health")
def health():
    return {"ok": True}


@app.post("/convert")
async def convert(file: UploadFile = File(...), target_lang: str = Form(...), source_lang: str = Form("auto")):
    if not file.filename:
        raise HTTPException(400, "Missing file.")

    job_id, job_dir = storage.new_job()
    input_path = job_dir / f"input{Path(file.filename).suffix or '.wav'}"
    with open(input_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    def _run():
        storage.update_job(job_id, status="processing")
        try:
            result = run_pipeline(str(input_path), target_lang, source_lang, str(job_dir))
            storage.update_job(
                job_id,
                status="done",
                output_path=result.output_path,
                lines=[
                    {
                        "start_sec": l.start_sec,
                        "end_sec": l.end_sec,
                        "original_text": l.original_text,
                        "translated_text": l.translated_text,
                        "warning": l.warning,
                    }
                    for l in result.lines
                ],
            )
        except Exception as exc:  # noqa: BLE001 — surface any pipeline failure to the client
            storage.update_job(job_id, status="failed", error=str(exc))

    threading.Thread(target=_run, daemon=True).start()
    return {"jobId": job_id, "status": "queued"}


@app.get("/jobs/{job_id}")
def job_status(job_id: str):
    job = storage.get_job(job_id)
    if job is None:
        raise HTTPException(404, "Unknown job id.")
    return {
        "status": job["status"],
        "error": job["error"],
        "lines": job["lines"],
    }


@app.get("/jobs/{job_id}/audio")
def job_audio(job_id: str):
    job = storage.get_job(job_id)
    if job is None:
        raise HTTPException(404, "Unknown job id.")
    if job["status"] != "done" or not job["output_path"]:
        raise HTTPException(409, f"Job is not finished (status: {job['status']}).")
    return FileResponse(job["output_path"], media_type="audio/wav")
