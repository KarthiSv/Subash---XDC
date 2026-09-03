import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.pipeline.mix import mix_tracks, overlay_segments


def test_overlay_places_segment_at_start_sample():
    seg = np.ones(50)
    buf = overlay_segments(1000, [(100, seg)])
    assert buf.shape == (1000,)
    assert np.all(buf[:100] == 0)
    assert np.all(buf[100:150] == 1)
    assert np.all(buf[150:] == 0)


def test_overlay_sums_overlapping_segments():
    buf = overlay_segments(100, [(10, np.ones(20)), (20, np.ones(20))])
    assert buf[15] == 1  # only first segment covers this sample
    assert buf[25] == 2  # both segments overlap here


def test_overlay_clips_segment_running_past_buffer_end():
    buf = overlay_segments(10, [(5, np.ones(20))])
    assert buf.shape == (10,)
    assert np.all(buf[5:10] == 1)


def test_mix_tracks_pads_shorter_track_with_silence():
    vocal = np.ones(5) * 0.3
    instrumental = np.ones(10) * 0.3
    mixed = mix_tracks(vocal, instrumental)
    assert mixed.shape == (10,)
    assert np.isclose(mixed[0], 0.6)
    assert np.isclose(mixed[7], 0.3)  # only instrumental covers this sample


def test_mix_tracks_normalizes_when_clipping():
    vocal = np.ones(10) * 0.8
    instrumental = np.ones(10) * 0.8
    mixed = mix_tracks(vocal, instrumental)
    assert np.max(np.abs(mixed)) <= 1.0 + 1e-9
