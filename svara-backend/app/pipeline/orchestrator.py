"""
Ties every stage together: separate -> transcribe -> translate -> re-time ->
clone -> pitch-align -> mix. The AI stages (separate/transcribe/translate/
clone) need their model weights downloaded first (see requirements-models.txt
and each module's docstring); the re-timing and pitch-alignment stages are
the pure-logic modules in retime.py and pitch.py, unit-tested in tests/.
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import numpy as np
import soundfile as sf

from .mix import mix_tracks, overlay_segments
from .pitch import estimate_f0, pitch_shift, time_stretch
from .retime import MAX_STRETCH_RATIO, MIN_STRETCH_RATIO, plan_line_fit
from .separate import separate_vocals
from .transcribe import transcribe_vocals
from .translate import translate_line


@dataclass
class LineResult:
    start_sec: float
    end_sec: float
    original_text: str
    translated_text: str
    warning: str | None


@dataclass
class PipelineResult:
    output_path: str
    detected_source_lang: str
    lines: list[LineResult]


def _reference_clip_path(vocals_path: str, job_dir: Path, seconds: float = 6.0) -> str:
    """A short clip of the isolated vocal, used once as the XTTS-v2 timbre reference."""
    audio, sr = sf.read(vocals_path)
    if audio.ndim > 1:
        audio = audio.mean(axis=1)
    clip = audio[: int(sr * seconds)]
    ref_path = job_dir / "voice_reference.wav"
    sf.write(ref_path, clip, sr)
    return str(ref_path)


def _align_pitch_to_original(synth_audio: np.ndarray, sr: int, original_segment: np.ndarray) -> np.ndarray:
    """
    Shift the cloned line's overall pitch level to match the original line's
    median pitch. This is a coarse, whole-segment alignment (matches the
    average pitch register), not a frame-by-frame melody follow — a real
    production system would want per-note contour tracking here.
    """
    orig_f0 = estimate_f0(original_segment, sr)
    synth_f0 = estimate_f0(synth_audio, sr)
    orig_voiced = orig_f0[orig_f0 > 0]
    synth_voiced = synth_f0[synth_f0 > 0]
    if orig_voiced.size == 0 or synth_voiced.size == 0:
        return synth_audio

    semitone_offset = 12.0 * np.log2(np.median(orig_voiced) / np.median(synth_voiced))
    semitone_offset = float(np.clip(semitone_offset, -12.0, 12.0))
    return pitch_shift(synth_audio, sr, semitone_offset)


def run_pipeline(input_path: str, target_lang: str, source_lang: str, job_dir: str) -> PipelineResult:
    from .clone_tts import clone_line  # imported lazily so a missing dep only
                                        # breaks the stage that needs it

    job_path = Path(job_dir)
    job_path.mkdir(parents=True, exist_ok=True)

    vocals_path, instrumental_path = separate_vocals(input_path, job_dir)
    vocals_audio, sr = sf.read(vocals_path)
    if vocals_audio.ndim > 1:
        vocals_audio = vocals_audio.mean(axis=1)
    instrumental_audio, _ = sf.read(instrumental_path)
    if instrumental_audio.ndim > 1:
        instrumental_audio = instrumental_audio.mean(axis=1)

    detected_lang, lines = transcribe_vocals(vocals_path)
    effective_source = source_lang if source_lang and source_lang != "auto" else detected_lang

    reference_clip = _reference_clip_path(vocals_path, job_path)

    line_results: list[LineResult] = []
    segments: list[tuple[int, np.ndarray]] = []

    for idx, line in enumerate(lines):
        translated = translate_line(line.text, effective_source, target_lang)
        plan = plan_line_fit(line.start_sec, line.end_sec, translated, target_lang)

        raw_line_path = job_path / f"line_{idx:03d}_raw.wav"
        clone_line(translated, target_lang, reference_clip, str(raw_line_path))
        synth_audio, synth_sr = sf.read(raw_line_path)
        if synth_audio.ndim > 1:
            synth_audio = synth_audio.mean(axis=1)
        if synth_sr != sr:
            # Resample to the vocal track's sample rate for consistent mixing.
            x_old = np.linspace(0, 1, len(synth_audio))
            x_new = np.linspace(0, 1, int(len(synth_audio) * sr / synth_sr))
            synth_audio = np.interp(x_new, x_old, synth_audio)

        # plan.stretch_ratio is already original_slot_duration / natural_tts_duration,
        # i.e. exactly the rate time_stretch needs to turn the synthesized line
        # into something that fills the original slot.
        bounded_ratio = float(np.clip(plan.stretch_ratio, MIN_STRETCH_RATIO, MAX_STRETCH_RATIO))
        fitted = time_stretch(synth_audio, sr, rate=bounded_ratio) if bounded_ratio != 1.0 else synth_audio

        start_sample = int(line.start_sec * sr)
        end_sample = int(line.end_sec * sr)
        original_segment = vocals_audio[start_sample:end_sample]
        fitted = _align_pitch_to_original(fitted, sr, original_segment)

        segments.append((start_sample, fitted))
        line_results.append(
            LineResult(
                start_sec=line.start_sec,
                end_sec=line.end_sec,
                original_text=line.text,
                translated_text=translated,
                warning=plan.warning,
            )
        )

    reconstructed_vocal = overlay_segments(len(vocals_audio), segments)
    mixed = mix_tracks(reconstructed_vocal, instrumental_audio)

    output_path = job_path / "converted.wav"
    sf.write(output_path, mixed, sr)

    return PipelineResult(output_path=str(output_path), detected_source_lang=detected_lang, lines=line_results)
