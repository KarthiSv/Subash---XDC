"""
Vocal / instrumental separation via Demucs (Meta, MIT license, free,
open-source: https://github.com/facebookresearch/demucs).

Needs `pip install -r requirements-models.txt` and internet access to
Demucs' model host on first run (this sandbox's egress is locked to package
registries only, so it can install the `demucs` package but not fetch its
pretrained weights — run this on a machine with normal internet access).
"""

from __future__ import annotations

from pathlib import Path


def separate_vocals(input_path: str, output_dir: str) -> tuple[str, str]:
    """
    Split a song into a vocal stem and an instrumental stem.
    Returns (vocals_path, instrumental_path).
    """
    try:
        import torch
        from demucs.apply import apply_model
        from demucs.audio import AudioFile, save_audio
        from demucs.pretrained import get_model
    except ImportError as exc:
        raise RuntimeError(
            "demucs is not installed. Run: pip install -r requirements-models.txt "
            "(on a machine with normal internet access — this sandbox can't fetch "
            "the pretrained weights)."
        ) from exc

    model = get_model("htdemucs")  # Demucs' standard 4-stem model (vocals/drums/bass/other)
    model.eval()

    wav = AudioFile(input_path).read(streams=0, samplerate=model.samplerate, channels=model.audio_channels)
    sources = apply_model(model, wav[None], device="cpu")[0]
    stems = dict(zip(model.sources, sources))

    out_dir = Path(output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    vocals_path = out_dir / "vocals.wav"
    save_audio(stems["vocals"], str(vocals_path), model.samplerate)

    instrumental = sum(audio for name, audio in stems.items() if name != "vocals")
    instrumental_path = out_dir / "instrumental.wav"
    save_audio(instrumental, str(instrumental_path), model.samplerate)

    return str(vocals_path), str(instrumental_path)
