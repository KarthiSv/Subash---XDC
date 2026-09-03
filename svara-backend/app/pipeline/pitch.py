"""
Pitch/rhythm alignment — pure digital signal processing, no AI model.

Two jobs live here:
  1. estimate_f0: track the original vocal's pitch contour with a classic
     autocorrelation pitch detector.
  2. time_stretch / pitch_shift (phase-vocoder based): reshape a synthesized
     translated vocal to follow that original contour and timing, so the
     cloned voice sings the melody instead of speaking flatly over it.

Everything here is numpy/scipy math — no trained model, no downloaded
weights, nothing that needs network access to run.
"""

from __future__ import annotations

import numpy as np


def estimate_f0(
    signal: np.ndarray,
    sr: int,
    frame_size: int = 1024,
    hop: int = 256,
    fmin: float = 60.0,
    fmax: float = 1000.0,
    voiced_threshold: float = 0.30,
) -> np.ndarray:
    """
    Autocorrelation-based F0 tracker. Returns one estimate per hop
    (0.0 for frames judged unvoiced/silent).
    """
    n_frames = max(0, (len(signal) - frame_size) // hop + 1)
    f0 = np.zeros(n_frames, dtype=np.float64)

    lag_min = int(sr / fmax)
    lag_max = min(frame_size - 1, int(sr / fmin))

    window = np.hanning(frame_size)

    for i in range(n_frames):
        start = i * hop
        frame = signal[start : start + frame_size] * window
        if np.max(np.abs(frame)) < 1e-4:
            continue  # silence

        # Autocorrelation via FFT (much faster than np.correlate for this size).
        n = 1 << (2 * frame_size - 1).bit_length()
        spectrum = np.fft.rfft(frame, n=n)
        autocorr = np.fft.irfft(spectrum * np.conj(spectrum), n=n)[:frame_size]

        if autocorr[0] <= 0:
            continue
        normalized = autocorr / autocorr[0]

        segment = normalized[lag_min:lag_max]
        if segment.size == 0:
            continue
        peak_lag = int(np.argmax(segment)) + lag_min
        peak_val = normalized[peak_lag]

        if peak_val >= voiced_threshold:
            # Integer sample lags quantize frequency coarsely at high pitches
            # (e.g. only ~36 vs ~37-sample lags separate 440Hz from 428Hz at
            # 16kHz) — parabolic interpolation around the peak recovers
            # sub-sample lag precision from the three surrounding bins.
            refined_lag = float(peak_lag)
            if 0 < peak_lag < len(normalized) - 1:
                a, b, c = normalized[peak_lag - 1], normalized[peak_lag], normalized[peak_lag + 1]
                denom = a - 2 * b + c
                if abs(denom) > 1e-12:
                    refined_lag += 0.5 * (a - c) / denom
            f0[i] = sr / refined_lag

    return f0


def _stft(signal: np.ndarray, frame_size: int, hop: int) -> np.ndarray:
    window = np.hanning(frame_size)
    n_frames = max(1, (len(signal) - frame_size) // hop + 1)
    padded = np.pad(signal, (0, max(0, frame_size + (n_frames - 1) * hop - len(signal))))
    frames = np.stack([padded[i * hop : i * hop + frame_size] * window for i in range(n_frames)])
    return np.fft.rfft(frames, axis=1)


def time_stretch(signal: np.ndarray, sr: int, rate: float, frame_size: int = 2048, hop: int = 512) -> np.ndarray:
    """
    Phase-vocoder time stretch: change duration by `rate` (>1 = slower/longer)
    while preserving pitch.

    Standard formulation: analyse the signal at a *fixed* hop, then re-emit
    each analysis frame at a *scaled* synthesis hop (`hop * rate`) — the
    re-spacing is what stretches time. Each analysis frame is reused exactly
    once, so frame indices line up 1:1 between analysis and synthesis; the
    only thing that changes is how far apart they're placed on write-out.
    (An earlier version of this function instead kept the synthesis hop
    fixed and shrank the *analysis* hop, but built the STFT at the original
    fixed hop regardless — a mismatch between the hop the phase math assumed
    and the hop frames were actually spaced at, which showed up as pitch
    randomly collapsing partway through a stretch for some frequencies.)
    """
    if rate <= 0:
        raise ValueError("rate must be positive")
    if abs(rate - 1.0) < 1e-6:
        return signal.copy()

    spec = _stft(signal, frame_size, hop)
    n_frames, n_bins = spec.shape

    # `synthesis_hop = round(hop * rate)` looks right but isn't quite: total
    # output length is `frame_size + (n_frames-1)*synthesis_hop`, and that
    # fixed `frame_size` term doesn't scale with rate. For short signals
    # (few frames) that overhang is a significant fraction of the total, so
    # naively scaling the hop alone systematically undershoots the target
    # length (and therefore the pitch ratio pitch_shift derives from it).
    # Solve for the synthesis hop that actually hits the target length.
    desired_len = rate * len(signal)
    if n_frames > 1:
        synthesis_hop = max(1, int(round((desired_len - frame_size) / (n_frames - 1))))
    else:
        synthesis_hop = max(1, int(round(hop * rate)))

    freqs = np.fft.rfftfreq(frame_size) * 2 * np.pi
    mag = np.abs(spec)
    phase = np.angle(spec)

    out_phase = np.zeros((n_frames, n_bins))
    out_phase[0] = phase[0]

    for i in range(1, n_frames):
        dphi = phase[i] - phase[i - 1] - freqs * hop
        dphi = dphi - 2 * np.pi * np.round(dphi / (2 * np.pi))
        true_freq = freqs + dphi / hop
        out_phase[i] = out_phase[i - 1] + true_freq * synthesis_hop

    out_spec = mag * np.exp(1j * out_phase)
    out_frames_time = np.fft.irfft(out_spec, n=frame_size, axis=1)

    window = np.hanning(frame_size)
    out_len = frame_size + (n_frames - 1) * synthesis_hop
    output = np.zeros(out_len)
    norm = np.zeros(out_len)
    for i in range(n_frames):
        start = i * synthesis_hop
        output[start : start + frame_size] += out_frames_time[i] * window
        norm[start : start + frame_size] += window**2

    norm[norm < 1e-8] = 1.0
    return output / norm


def pitch_shift(signal: np.ndarray, sr: int, semitones: float) -> np.ndarray:
    """
    Shift pitch by `semitones` while preserving duration: time-stretch by the
    inverse ratio (changes pitch as a side effect), then resample back to the
    original length. Classic, model-free pitch-shift technique.
    """
    if abs(semitones) < 1e-6:
        return signal.copy()

    # Stretch duration by `ratio` first (phase vocoder preserves pitch while
    # doing so), then resample back to the original length below — squeezing
    # a `ratio`-times-longer buffer back into the original duration plays it
    # `ratio` times faster, which is what raises the pitch by `ratio`.
    ratio = 2.0 ** (semitones / 12.0)
    stretched = time_stretch(signal, sr, rate=ratio)

    target_len = len(signal)
    if len(stretched) == target_len:
        return stretched
    x_old = np.linspace(0, 1, len(stretched))
    x_new = np.linspace(0, 1, target_len)
    return np.interp(x_new, x_old, stretched)
