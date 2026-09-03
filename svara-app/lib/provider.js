// Picks which conversion backend the API routes talk to.
//
// CONVERSION_BACKEND=opensource -> the free, self-hosted pipeline in
//   svara-backend/ (Demucs + faster-whisper + Argos Translate + XTTS-v2).
//   Point OPEN_SOURCE_BACKEND_URL at wherever that server runs.
// CONVERSION_BACKEND unset or "elevenlabs" (default) -> the paid ElevenLabs
//   Dubbing API in ./elevenlabs.js.
//
// Both implementations share the same shape (createDubbing / getDubbingStatus
// / fetchDubbedAudio) so the rest of the app doesn't need to branch on which
// one is active.

import * as elevenlabs from "./elevenlabs";
import * as openSource from "./providers/openSource";

const BACKEND = process.env.CONVERSION_BACKEND || "elevenlabs";
const impl = BACKEND === "opensource" ? openSource : elevenlabs;

// Mock mode (no real conversion, plays back the original file) only applies
// to the ElevenLabs path when no API key is configured — the open-source
// backend has no equivalent "no key" state, it either runs or its job fails
// with a clear error (see svara-backend's pipeline modules).
export const MOCK_MODE = BACKEND !== "opensource" && elevenlabs.MOCK_MODE;

export const createDubbing = impl.createDubbing;
export const getDubbingStatus = impl.getDubbingStatus;
export const fetchDubbedAudio = impl.fetchDubbedAudio;
