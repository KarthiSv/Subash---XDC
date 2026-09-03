// Thin server-side client for the ElevenLabs Dubbing API.
// Docs: https://elevenlabs.io/docs/api-reference/dubbing
//
// The whole "translate this song but keep the original singer's voice" pipeline
// (vocal isolation, meaning-locked translation, rhythm re-fit, voice-preserving
// resynthesis) is handled server-side by ElevenLabs' Dubbing API in one call -
// we just submit the file and poll for a result.

const BASE_URL = "https://api.elevenlabs.io/v1/dubbing";

export const MOCK_MODE = !process.env.ELEVENLABS_API_KEY;

function apiKey() {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) {
    throw new Error("ELEVENLABS_API_KEY is not set (running in mock mode)");
  }
  return key;
}

/**
 * Kick off a dubbing job for an uploaded song.
 * @param {{ file: File, sourceLang?: string, targetLang: string }} params
 * @returns {Promise<{ dubbingId: string, expectedDurationSec: number|null }>}
 */
export async function createDubbing({ file, sourceLang, targetLang, dropBackgroundAudio = false }) {
  const form = new FormData();
  form.append("file", file, file.name || "song.mp3");
  form.append("target_lang", targetLang);
  if (sourceLang && sourceLang !== "auto") {
    form.append("source_lang", sourceLang);
  }
  form.append("drop_background_audio", String(dropBackgroundAudio));

  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: { "xi-api-key": apiKey() },
    body: form,
  });

  if (!res.ok) {
    const detail = await safeText(res);
    throw new Error(`ElevenLabs dubbing create failed (${res.status}): ${detail}`);
  }

  const data = await res.json();
  return {
    dubbingId: data.dubbing_id,
    expectedDurationSec: data.expected_duration_sec ?? null,
  };
}

/**
 * Check the status of a dubbing job.
 * @param {string} dubbingId
 * @returns {Promise<{ status: string, error: string|null }>}
 */
export async function getDubbingStatus(dubbingId) {
  const res = await fetch(`${BASE_URL}/${dubbingId}`, {
    headers: { "xi-api-key": apiKey() },
  });

  if (!res.ok) {
    const detail = await safeText(res);
    throw new Error(`ElevenLabs dubbing status failed (${res.status}): ${detail}`);
  }

  const data = await res.json();
  return {
    status: data.status, // "dubbing" | "dubbed" | "failed"
    error: data.error ?? null,
  };
}

/**
 * Stream back the finished, voice-preserved translated track.
 * @param {string} dubbingId
 * @param {string} languageCode
 * @returns {Promise<Response>} raw upstream response (caller pipes the body through)
 */
export async function fetchDubbedAudio(dubbingId, languageCode) {
  const res = await fetch(`${BASE_URL}/${dubbingId}/audio/${languageCode}`, {
    headers: { "xi-api-key": apiKey() },
  });

  if (!res.ok) {
    const detail = await safeText(res);
    throw new Error(`ElevenLabs dubbing audio fetch failed (${res.status}): ${detail}`);
  }

  return res;
}

async function safeText(res) {
  try {
    return await res.text();
  } catch {
    return "(no error body)";
  }
}
