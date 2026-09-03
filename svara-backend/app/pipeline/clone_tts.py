"""
Zero-shot voice cloning via Coqui TTS's XTTS-v2 (free, open-source model
weights; the code is MIT-licensed but the XTTS-v2 checkpoint ships under
Coqui's own "CPML" license — free for personal/research use, so check its
terms before any commercial deployment: https://github.com/coqui-ai/TTS).

The reason this is the practical free choice here rather than RVC/so-vits-svc:
those need a voice model *trained* per singer (10+ minutes of clean vocal
audio, real training time). XTTS-v2 clones a voice from just a few seconds
of reference audio — which we already have, from the separated vocal stem —
with no training step. It synthesizes *speech*, though, not sung melody;
pitch.py's F0-contour alignment is what turns that spoken clone into
something that follows the original tune.

Needs `pip install -r requirements-models.txt` and internet access to fetch
the XTTS-v2 checkpoint on first run (blocked in this sandbox).
"""

from __future__ import annotations


def clone_line(text: str, language: str, reference_audio_path: str, output_path: str) -> str:
    """
    Synthesize `text` in `language`, cloning the speaker timbre from
    `reference_audio_path` (a short clip of the original singer's isolated
    vocal). Returns `output_path`.
    """
    try:
        from TTS.api import TTS
    except ImportError as exc:
        raise RuntimeError(
            "Coqui TTS is not installed. Run: pip install -r requirements-models.txt "
            "(on a machine with normal internet access, ideally with a GPU)."
        ) from exc

    tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2")
    tts.tts_to_file(
        text=text,
        speaker_wav=reference_audio_path,
        language=language,
        file_path=output_path,
    )
    return output_path
