"""
Transcription with line-level timestamps via faster-whisper (a CTranslate2
port of OpenAI's Whisper — free, open-source: MIT license,
https://github.com/SYSTRAN/faster-whisper).

Needs `pip install -r requirements-models.txt` and internet access to
download model weights on first run (blocked in this sandbox — same
constraint as separate.py).
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass
class Line:
    start_sec: float
    end_sec: float
    text: str


def transcribe_vocals(vocals_path: str, model_size: str = "small") -> tuple[str, list[Line]]:
    """
    Transcribe the isolated vocal stem into timestamped lines.
    Returns (detected_language_code, lines).
    """
    try:
        from faster_whisper import WhisperModel
    except ImportError as exc:
        raise RuntimeError(
            "faster-whisper is not installed. Run: pip install -r requirements-models.txt "
            "(on a machine with normal internet access)."
        ) from exc

    model = WhisperModel(model_size, device="cpu", compute_type="int8")
    segments, info = model.transcribe(vocals_path, word_timestamps=False)

    lines = [Line(start_sec=seg.start, end_sec=seg.end, text=seg.text.strip()) for seg in segments]
    return info.language, lines
