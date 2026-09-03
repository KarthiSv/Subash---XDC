import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.pipeline.orchestrator import _align_pitch_to_original
from app.pipeline.pitch import estimate_f0


def _tone(freq, sr, seconds):
    t = np.arange(int(sr * seconds)) / sr
    return 0.6 * np.sin(2 * np.pi * freq * t)


def test_align_pitch_moves_synth_toward_original_register():
    sr = 16000
    original = _tone(220.0, sr, 1.0)   # original singer's register
    synth = _tone(110.0, sr, 1.0)      # cloned TTS voice, an octave lower

    aligned = _align_pitch_to_original(synth, sr, original)

    f0 = estimate_f0(aligned, sr)
    voiced = f0[f0 > 0]
    assert voiced.size > 0
    assert abs(np.median(voiced) - 220.0) < 15.0


def test_align_pitch_is_a_noop_on_silence():
    sr = 16000
    silence = np.zeros(sr)
    synth = _tone(220.0, sr, 1.0)
    aligned = _align_pitch_to_original(synth, sr, silence)
    assert np.allclose(aligned, synth)
