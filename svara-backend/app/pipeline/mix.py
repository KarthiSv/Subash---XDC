"""
Audio assembly — pure numpy/soundfile, no AI model.

Places re-timed, re-pitched vocal line segments back onto a full-length
track at their original timestamps, then mixes that reconstructed vocal
with the untouched instrumental stem from separate.py.
"""

from __future__ import annotations

import numpy as np


def overlay_segments(total_length: int, segments: list[tuple[int, np.ndarray]]) -> np.ndarray:
    """
    Place each (start_sample, audio) segment into a zero buffer of
    `total_length` samples, summing where segments overlap and clipping
    anything that runs past the end of the buffer.
    """
    buffer = np.zeros(total_length, dtype=np.float64)
    for start, audio in segments:
        if start >= total_length:
            continue
        end = min(total_length, start + len(audio))
        usable = end - start
        if usable <= 0:
            continue
        buffer[start:end] += audio[:usable]
    return buffer


def mix_tracks(vocal: np.ndarray, instrumental: np.ndarray, vocal_gain: float = 1.0, instrumental_gain: float = 1.0) -> np.ndarray:
    """
    Sum the (re-sung) vocal and the original instrumental, padding the
    shorter one with silence, then peak-normalize only if the mix clips.
    """
    length = max(len(vocal), len(instrumental))
    v = np.pad(vocal, (0, length - len(vocal)))
    i = np.pad(instrumental, (0, length - len(instrumental)))
    mixed = v * vocal_gain + i * instrumental_gain

    peak = np.max(np.abs(mixed)) if mixed.size else 0.0
    if peak > 1.0:
        mixed = mixed / peak
    return mixed
