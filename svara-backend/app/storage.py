"""In-memory job registry + local filesystem storage. No database — this is
a single-process dev/prototype server; swap in a real queue/DB for anything
beyond one machine."""

from __future__ import annotations

import threading
import uuid
from pathlib import Path
from typing import Any

STORAGE_DIR = Path(__file__).resolve().parent.parent / "storage" / "jobs"

_lock = threading.Lock()
_jobs: dict[str, dict[str, Any]] = {}


def new_job() -> tuple[str, Path]:
    job_id = uuid.uuid4().hex
    job_dir = STORAGE_DIR / job_id
    job_dir.mkdir(parents=True, exist_ok=True)
    with _lock:
        _jobs[job_id] = {"status": "queued", "error": None, "output_path": None, "lines": []}
    return job_id, job_dir


def update_job(job_id: str, **fields: Any) -> None:
    with _lock:
        if job_id in _jobs:
            _jobs[job_id].update(fields)


def get_job(job_id: str) -> dict[str, Any] | None:
    with _lock:
        job = _jobs.get(job_id)
        return dict(job) if job is not None else None
