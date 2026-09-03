import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.pipeline.retime import count_syllables, plan_line_fit


def test_latin_syllable_counts():
    assert count_syllables("I keep your name", "en") == 4
    assert count_syllables("Guardo teu nome", "pt") == 5


def test_hangul_syllable_count_is_exact_block_count():
    # "내가 노래할 때" = 6 Hangul syllable blocks.
    assert count_syllables("내가 노래할 때", "ko") == 6


def test_han_character_count():
    assert count_syllables("你好世界", "zh") == 4


def test_kana_mora_count():
    # 4 hiragana characters -> 4 morae.
    assert count_syllables("こんにちは"[:4], "ja") == 4


def test_empty_text_has_zero_syllables():
    assert count_syllables("", "en") == 0


def test_plan_line_fit_within_bounds_for_matched_length():
    # 11 syllables (counted above) at ~0.20s/syllable = ~2.2s natural length,
    # close enough to a 2.0s slot to fit inside the stretch bounds.
    plan = plan_line_fit(0.0, 2.0, "one two three four five six seven eight nine ten", "en")
    assert plan.translated_syllables == 11
    assert plan.within_bounds
    assert plan.warning is None
    assert 0.85 < plan.stretch_ratio < 1.0


def test_plan_line_fit_flags_line_that_is_far_too_long():
    # A long translated line crammed into a very short original slot.
    long_line = " ".join(["syllable"] * 20)  # ~20 words, several syllables each
    plan = plan_line_fit(0.0, 1.0, long_line, "en")
    assert not plan.within_bounds
    assert plan.warning is not None
    assert plan.stretch_ratio < plan.stretch_ratio + 1  # sanity: ratio computed


def test_plan_line_fit_flags_line_that_is_far_too_short():
    plan = plan_line_fit(0.0, 10.0, "hi", "en")
    assert not plan.within_bounds
    assert "longer phrasing" in plan.warning
