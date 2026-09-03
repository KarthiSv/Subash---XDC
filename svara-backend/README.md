# Svara — open-source backend

A free, self-hosted alternative to the ElevenLabs-backed provider in
`svara-app/`. Same job contract (`create job -> poll status -> fetch audio`),
built entirely on free, open-source models instead of a paid API — no
per-conversion fee, no vendor lock-in.

| Stage | Library | License | Free? |
|---|---|---|---|
| Vocal / instrumental separation | [Demucs](https://github.com/facebookresearch/demucs) (Meta) | MIT | Yes |
| Transcription + timestamps | [faster-whisper](https://github.com/SYSTRAN/faster-whisper) | MIT | Yes |
| Translation | [Argos Translate](https://github.com/argosopentech/argos-translate) | Apache 2.0 | Yes, fully offline |
| Voice cloning | [Coqui TTS — XTTS-v2](https://github.com/coqui-ai/TTS) | Code: MIT. Checkpoint: Coqui CPML (free for personal/research; check terms before commercial use) | Yes for personal use |
| Syllable-timing fit, pitch alignment, mixing | This repo (`app/pipeline/retime.py`, `pitch.py`, `mix.py`) | — | Pure Python, no model at all |

## What's genuinely AI, and what genuinely isn't

Translation and voice cloning are inherently AI/ML tasks — there's no
rule-based way to do either convincingly, so "no AI at all" isn't a real
option for this product. What **is** real, rule-based logic — written here,
unit-tested, no model involved — is what makes the AI stages' output sound
musical instead of robotic:

- **`app/pipeline/retime.py`** — counts syllables per language (script-aware
  heuristics: Hangul block count, Han character count, Japanese mora,
  Devanagari/Tamil syllable-nucleus count, Latin vowel-grouping) and turns
  the mismatch between a translated line's natural length and the original
  line's duration into a bounded time-stretch plan.
- **`app/pipeline/pitch.py`** — a from-scratch autocorrelation pitch
  tracker and phase-vocoder time-stretch/pitch-shift, used to bend the
  cloned voice onto the original melody's register and pacing.
- **`app/pipeline/mix.py`** — places re-timed vocal lines back onto the
  timeline and mixes with the untouched instrumental.

Run `pytest tests/` — 19 tests, all passing, covering exactly these modules
with real signal-processing assertions (recovering known frequencies,
verifying octave shifts land within <1% error, etc.), not mocks.

## Why this can't fully run inside a locked-down sandbox

This backend was built and unit-tested inside a network-restricted
container: `pip install` works (PyPI is reachable), but the actual model
*weights* for Demucs/Whisper/XTTS live on hosts that container's egress
proxy blocks (huggingface.co, GitHub releases, Meta's/Azure's model CDNs),
and there's no GPU. So:

- `app/pipeline/retime.py`, `pitch.py`, `mix.py` — fully implemented,
  fully tested, run anywhere.
- `app/pipeline/separate.py`, `transcribe.py`, `translate.py`,
  `clone_tts.py` — correct, complete integration code against each
  library's real API, verified to fail *gracefully* with a clear message
  when the library isn't installed — but not exercisable end-to-end until
  run somewhere with normal internet access (your own machine, or a free
  Google Colab GPU runtime).

## Running it for real

```bash
cd svara-backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements-models.txt   # needs real internet access + time (multi-GB model downloads)
uvicorn app.main:app --reload
```

First run of each AI stage downloads its model weights (one-time, cached
afterward). A GPU speeds this up a lot but isn't strictly required for
short clips — Demucs/Whisper/XTTS all run on CPU, just slower.

### API

- `POST /convert` — multipart form: `file` (audio), `target_lang` (BCP-47
  code), `source_lang` (optional, `"auto"` by default). Returns `{jobId}`.
- `GET /jobs/{jobId}` — `{status: "queued"|"processing"|"done"|"failed", error, lines}`.
  `lines` carries each lyric line's original/translated text and a
  `warning` when `retime.py` flagged it as needing a shorter/longer
  phrasing to fit naturally.
- `GET /jobs/{jobId}/audio` — the finished WAV once `status` is `"done"`.

### Testing just the free logic (no model downloads needed)

```bash
pip install -r requirements.txt   # lightweight: fastapi, numpy, soundfile, pytest
pytest tests/ -v
```

## Connecting svara-app to this backend

Set `CONVERSION_BACKEND=opensource` and `OPEN_SOURCE_BACKEND_URL=http://localhost:8000`
in `svara-app/.env.local` — see `svara-app/lib/providers/openSource.js`.
Leave `CONVERSION_BACKEND` unset (or `elevenlabs`) to keep using the paid
ElevenLabs provider instead.

## Known limitations (MVP-level, being upfront about it)

- **Pitch alignment is whole-line, not note-by-note.** `_align_pitch_to_original`
  shifts each cloned line's overall register to match the original's median
  pitch — it doesn't follow the melody note-for-note within a line. A
  production system would want per-note contour tracking (or a proper
  singing-voice-synthesis model) here.
- **Syllable counting is a heuristic**, not real linguistic syllabification
  — it's good enough to flag lines that clearly won't fit, not a precise
  phonetic count for every language.
- **No queue/DB** — jobs live in an in-memory dict and on local disk. Fine
  for one machine; swap in Redis/Postgres + a real task queue (Celery, RQ)
  before running this for more than one person at a time.
