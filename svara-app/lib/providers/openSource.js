// Client for the free, self-hosted backend in ../../svara-backend — same
// job contract as ../elevenlabs.js (create -> poll status -> fetch audio),
// normalized to the same status vocabulary ("dubbing" | "dubbed" | "failed")
// so the API routes and Converter.jsx don't need to know which provider is
// active.

const BASE_URL = process.env.OPEN_SOURCE_BACKEND_URL || "http://localhost:8000";

export async function createDubbing({ file, sourceLang, targetLang }) {
  const form = new FormData();
  form.append("file", file, file.name || "song.mp3");
  form.append("target_lang", targetLang);
  form.append("source_lang", sourceLang && sourceLang !== "auto" ? sourceLang : "auto");

  const res = await fetch(`${BASE_URL}/convert`, { method: "POST", body: form });
  if (!res.ok) {
    throw new Error(`Open-source backend create failed (${res.status}): ${await safeText(res)}`);
  }

  const data = await res.json();
  return { dubbingId: data.jobId, expectedDurationSec: null };
}

export async function getDubbingStatus(jobId) {
  const res = await fetch(`${BASE_URL}/jobs/${jobId}`);
  if (!res.ok) {
    throw new Error(`Open-source backend status failed (${res.status}): ${await safeText(res)}`);
  }

  const data = await res.json();
  const status = data.status === "done" ? "dubbed" : data.status === "failed" ? "failed" : "dubbing";
  return { status, error: data.error ?? null, lines: data.lines ?? [] };
}

export async function fetchDubbedAudio(jobId, _languageCode) {
  // languageCode is part of the shared provider interface (ElevenLabs' URL
  // needs it) but this backend's /jobs/{id}/audio only ever serves the one
  // output file for a job, so it's unused here.
  const res = await fetch(`${BASE_URL}/jobs/${jobId}/audio`);
  if (!res.ok) {
    throw new Error(`Open-source backend audio fetch failed (${res.status}): ${await safeText(res)}`);
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
