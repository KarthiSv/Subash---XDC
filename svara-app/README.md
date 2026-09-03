# Svara

Translate a song's lyrics into another language while keeping the original
singer's exact voice, tone, breath and timing.

Two interchangeable backends power the actual conversion — pick one with
`CONVERSION_BACKEND` in `.env.local` (see `.env.example`):

- **`elevenlabs`** (default) — the paid [ElevenLabs Dubbing API](https://elevenlabs.io/docs/api-reference/dubbing).
  Vocal isolation, translation, rhythm re-fit and voice-preserving
  resynthesis in one hosted call.
- **`opensource`** — the free, self-hosted pipeline in
  [`../svara-backend`](../svara-backend/README.md): Demucs + faster-whisper +
  Argos Translate + Coqui XTTS-v2, with real syllable-timing and
  pitch-alignment logic written (and unit-tested) from scratch, no paid API
  involved. Run that server separately and point `OPEN_SOURCE_BACKEND_URL`
  at it.

Both expose the same job contract to this app (`lib/provider.js` picks
between `lib/elevenlabs.js` and `lib/providers/openSource.js`), so the UI
and API routes don't change based on which one is active.

This is a standalone Next.js app, self-contained under `svara-app/` so it
doesn't touch the existing XDC dance-studio site elsewhere in this repo.

## How it works

1. **Upload** — you pick a song and a target language in the browser.
2. **`POST /api/dub`** forwards the file to ElevenLabs' Dubbing API and
   returns a `dubbingId`.
3. The client polls **`GET /api/dub/[id]/status`** every few seconds.
4. Once the job reports `dubbed`, the browser streams the result from
   **`GET /api/dub/[id]/audio?lang=...`**, which the server proxies from
   ElevenLabs so the API key never reaches the client.

No database or file storage is used — the app is fully stateless; ElevenLabs
tracks job state by `dubbingId`.

## Running it

```bash
cd svara-app
npm install
cp .env.example .env.local   # then paste in your ElevenLabs key
npm run dev
```

Open http://localhost:3000.

### Mock mode

If `ELEVENLABS_API_KEY` is not set, the app still runs end-to-end: uploading
a song and hitting "Convert" plays your original file back after a short
simulated delay, clearly labeled **"Mock preview"**. This lets you review
the full UI/UX flow without an API key. Set the key to get a real,
voice-preserving conversion.

Get a key at https://elevenlabs.io — the Dubbing API requires a paid plan
with dubbing credits.

## Limitations to know about

- **Processing time**: a full song can take several minutes to dub upstream.
  The default `POST /api/dub` route has a 60s serverless function timeout
  (`maxDuration`) — that's fine, since it only *starts* the job; polling
  happens separately and isn't time-limited the same way. If you deploy to
  Vercel's Hobby tier, function timeouts are capped lower than Pro — raise
  `maxDuration` or upgrade if you see timeouts on very large files.
- **File size**: capped at 50MB in `app/api/dub/route.js`; raise it if your
  hosting allows larger request bodies.
- **Field names**: this integrates against the documented ElevenLabs
  Dubbing API shape (`file`, `target_lang`, `source_lang`,
  `drop_background_audio` → `dubbing_id` → poll `status` → fetch
  `/audio/{lang}`). Verify against
  https://elevenlabs.io/docs/api-reference/dubbing if ElevenLabs changes
  their contract.

## Deploying

This is a plain Next.js app — deploy it to Vercel like any other:

```bash
vercel deploy
```

Then set `ELEVENLABS_API_KEY` as an environment variable in the Vercel
project settings (Production + Preview) so real conversions work once live.

## Project structure

```
svara-app/
  app/
    page.js                     marketing + converter page
    layout.js                   fonts, metadata
    globals.css                 design tokens (light/dark)
    api/
      languages/route.js        supported language list
      dub/route.js               POST — start a dubbing job
      dub/[id]/status/route.js  GET — poll job status
      dub/[id]/audio/route.js   GET — stream finished audio
  components/
    Nav.jsx, Converter.jsx, HowItWorks.jsx, LanguageGrid.jsx,
    FidelityTable.jsx, Footer.jsx
  lib/
    elevenlabs.js                server-side API client
```
