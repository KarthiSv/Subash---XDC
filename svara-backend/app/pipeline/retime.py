"""
Syllable-timing re-fit — pure rule-based logic, no AI model involved.

A translated lyric line almost never has the same number of syllables as the
original. Sung to the same melody, a mismatch reads instantly as "dubbed."
This module estimates how many syllables a line of text carries in a given
language (via script-aware heuristics, not a trained model) and turns that
into a bounded time-stretch plan the DSP alignment stage (pitch.py) can use
to fit the sung translation back onto the original line's duration.
"""

from __future__ import annotations

import re
from dataclasses import dataclass

# Average spoken/sung syllable duration by language, in seconds — rough
# reference values used only to bound how much stretch is reasonable before
# we flag a line as needing a shorter/longer phrasing rather than distorting
# the voice past the point of sounding natural.
_AVG_SYLLABLE_SEC = {
    "en": 0.20, "es": 0.19, "pt": 0.19, "fr": 0.21, "de": 0.22, "it": 0.19,
    "tr": 0.20, "vi": 0.21, "pl": 0.21, "nl": 0.21, "sv": 0.20, "id": 0.20,
    "hi": 0.20, "ta": 0.21, "ja": 0.16, "ko": 0.18, "zh": 0.24, "ar": 0.21,
}
_DEFAULT_AVG_SYLLABLE_SEC = 0.20

# A stretch beyond this ratio starts to audibly warp a singing voice (pitch
# artifacts, unnatural pacing) — bound taken from common time-stretch/pitch-
# shift engineering practice, not a hard physical law.
MIN_STRETCH_RATIO = 0.80
MAX_STRETCH_RATIO = 1.25


def _count_latin_syllables(word: str, lang: str) -> int:
    word = word.lower()
    groups = re.findall(r"[aeiouyáéíóúàèìòùâêîôûäëïöüãõ]+", word)
    count = len(groups)
    # English drops a trailing silent "e" ("name" -> 1 syllable, not 2).
    # Most other Latin-script languages here pronounce a final "e"
    # ("nome", "the" is English-specific), so this rule is English-only.
    if lang == "en" and count > 1 and word.endswith("e") and not word.endswith("le"):
        count -= 1
    return max(1, count)


def _count_hangul_syllables(text: str) -> int:
    # Precomposed Hangul syllable blocks (U+AC00–U+D7A3) are one block per
    # spoken syllable — the cleanest script to count in this whole module.
    return sum(1 for ch in text if 0xAC00 <= ord(ch) <= 0xD7A3) or 1


def _count_han_syllables(text: str) -> int:
    # Mandarin: essentially one syllable per Han character.
    return sum(1 for ch in text if 0x4E00 <= ord(ch) <= 0x9FFF) or 1


def _count_kana_mora(text: str) -> int:
    # Japanese: each kana is ~one mora; a bare kanji is approximated as two
    # morae (a rough average — real mora count depends on the reading).
    morae = 0
    for ch in text:
        cp = ord(ch)
        if 0x3040 <= cp <= 0x30FF:  # hiragana + katakana
            morae += 1
        elif 0x4E00 <= cp <= 0x9FFF:  # kanji, approximate
            morae += 2
    return morae or 1


def _count_indic_syllables(text: str, base_range: tuple[int, int], vowel_sign_range: tuple[int, int]) -> int:
    # Abugida scripts (Devanagari, Tamil, ...): a syllable nucleus is a
    # consonant/independent-vowel letter; dependent vowel signs and virama
    # modify it rather than adding a new syllable, so they're excluded.
    count = 0
    for ch in text:
        cp = ord(ch)
        if base_range[0] <= cp <= base_range[1] and not (vowel_sign_range[0] <= cp <= vowel_sign_range[1]):
            count += 1
    return count or 1


def _count_arabic_syllables(text: str) -> int:
    # Abjad script without diacritics: syllable count is ambiguous, so we
    # fall back to an average-letters-per-syllable estimate.
    letters = sum(1 for ch in text if 0x0621 <= ord(ch) <= 0x064A)
    return max(1, round(letters / 1.5)) if letters else 1


def count_syllables(text: str, lang: str) -> int:
    """Estimate syllable count of `text` for language `lang` (BCP-47-ish code)."""
    text = text.strip()
    if not text:
        return 0

    if lang == "ko":
        return _count_hangul_syllables(text)
    if lang == "zh":
        return _count_han_syllables(text)
    if lang == "ja":
        return _count_kana_mora(text)
    if lang == "hi":
        return _count_indic_syllables(text, (0x0900, 0x097F), (0x093E, 0x094C))
    if lang == "ta":
        return _count_indic_syllables(text, (0x0B80, 0x0BFF), (0x0BBE, 0x0BCC))
    if lang == "ar":
        return _count_arabic_syllables(text)

    words = re.findall(r"[^\s]+", text)
    return sum(_count_latin_syllables(w, lang) for w in words) or 1


@dataclass
class StretchPlan:
    original_duration_sec: float
    translated_syllables: int
    natural_duration_sec: float
    stretch_ratio: float          # >1 = translation needs slowing down to fit
    within_bounds: bool
    warning: str | None


def plan_line_fit(
    original_start_sec: float,
    original_end_sec: float,
    translated_text: str,
    target_lang: str,
) -> StretchPlan:
    """
    Given the original line's on-screen/on-track duration and the translated
    text that must be sung in that slot, compute a bounded time-stretch
    ratio for the alignment stage, and flag lines that don't fit naturally
    so a shorter/longer phrasing can be requested instead of over-stretching.
    """
    original_duration = max(0.05, original_end_sec - original_start_sec)
    syllables = count_syllables(translated_text, target_lang)
    per_syllable = _AVG_SYLLABLE_SEC.get(target_lang, _DEFAULT_AVG_SYLLABLE_SEC)
    natural_duration = syllables * per_syllable

    ratio = original_duration / natural_duration if natural_duration > 0 else 1.0
    within_bounds = MIN_STRETCH_RATIO <= ratio <= MAX_STRETCH_RATIO

    warning = None
    if not within_bounds:
        direction = "shorter" if ratio < MIN_STRETCH_RATIO else "longer"
        warning = (
            f"Translated line needs {direction} phrasing to fit naturally "
            f"(would need {ratio:.2f}x stretch, outside "
            f"[{MIN_STRETCH_RATIO}, {MAX_STRETCH_RATIO}])."
        )

    return StretchPlan(
        original_duration_sec=original_duration,
        translated_syllables=syllables,
        natural_duration_sec=natural_duration,
        stretch_ratio=ratio,
        within_bounds=within_bounds,
        warning=warning,
    )
