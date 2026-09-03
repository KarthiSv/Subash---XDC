import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.pipeline.pitch import estimate_f0, pitch_shift, time_stretch


def _tone(freq: float, sr: int, seconds: float) -> np.ndarray:
    t = np.arange(int(sr * seconds)) / sr
    return 0.6 * np.sin(2 * np.pi * freq * t)


def test_estimate_f0_recovers_known_frequency():
    sr = 16000
    signal = _tone(220.0, sr, 1.0)
    f0 = estimate_f0(signal, sr)
    voiced = f0[f0 > 0]
    assert voiced.size > 0
    assert abs(np.median(voiced) - 220.0) < 5.0


def test_estimate_f0_is_silent_for_silence():
    sr = 16000
    signal = np.zeros(sr)
    f0 = estimate_f0(signal, sr)
    assert np.all(f0 == 0.0)


def test_time_stretch_changes_duration_not_pitch():
    sr = 16000
    signal = _tone(220.0, sr, 1.0)
    stretched = time_stretch(signal, sr, rate=2.0)

    # ~2x longer.
    assert 1.7 < len(stretched) / len(signal) < 2.3

    f0_before = estimate_f0(signal, sr)
    f0_after = estimate_f0(stretched, sr)
    before_med = np.median(f0_before[f0_before > 0])
    after_med = np.median(f0_after[f0_after > 0])
    assert abs(before_med - after_med) < 10.0


def test_pitch_shift_up_one_octave_doubles_frequency():
    sr = 16000
    signal = _tone(220.0, sr, 1.0)
    shifted = pitch_shift(signal, sr, semitones=12.0)

    # Duration preserved by design.
    assert abs(len(shifted) - len(signal)) < sr * 0.05

    f0 = estimate_f0(shifted, sr)
    voiced = f0[f0 > 0]
    assert voiced.size > 0
    assert abs(np.median(voiced) - 440.0) < 15.0
