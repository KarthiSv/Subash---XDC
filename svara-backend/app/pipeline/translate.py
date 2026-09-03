"""
Offline translation via Argos Translate (free, open-source, Apache 2.0:
https://github.com/argosopentech/argos-translate).

Unlike Demucs/Whisper/XTTS, Argos Translate's language packages are meant to
be installed once and then run fully offline — no per-call network need
after setup. That first-time package install still needs real internet
access this sandbox doesn't have, but it's a lighter one-time cost than the
other stages.
"""

from __future__ import annotations


def ensure_language_pair(from_code: str, to_code: str) -> None:
    """Install the Argos Translate package for this language pair if missing."""
    try:
        import argostranslate.package
        import argostranslate.translate
    except ImportError as exc:
        raise RuntimeError(
            "argostranslate is not installed. Run: pip install -r requirements-models.txt"
        ) from exc

    installed = argostranslate.translate.get_installed_languages()
    from_lang = next((l for l in installed if l.code == from_code), None)
    to_lang = next((l for l in installed if l.code == to_code), None)
    if from_lang and to_lang and from_lang.get_translation(to_lang):
        return  # package already installed

    argostranslate.package.update_package_index()
    available = argostranslate.package.get_available_packages()
    match = next((p for p in available if p.from_code == from_code and p.to_code == to_code), None)
    if not match:
        raise RuntimeError(f"No Argos Translate package available for {from_code} -> {to_code}.")
    argostranslate.package.install_from_path(match.download())


def translate_line(text: str, from_code: str, to_code: str) -> str:
    """Translate one lyric line, preserving meaning rather than paraphrasing loosely."""
    try:
        import argostranslate.translate
    except ImportError as exc:
        raise RuntimeError(
            "argostranslate is not installed. Run: pip install -r requirements-models.txt"
        ) from exc

    ensure_language_pair(from_code, to_code)
    return argostranslate.translate.translate(text, from_code, to_code)
