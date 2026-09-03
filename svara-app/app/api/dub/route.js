import { NextResponse } from "next/server";
import { createDubbing, MOCK_MODE } from "../../../lib/elevenlabs";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request) {
  const form = await request.formData();
  const file = form.get("file");
  const targetLang = form.get("targetLang");
  const sourceLang = form.get("sourceLang") || "auto";
  const keepInstrumental = form.get("keepInstrumental") !== "false";

  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "Missing audio file." }, { status: 400 });
  }
  if (!targetLang) {
    return NextResponse.json({ error: "Missing targetLang." }, { status: 400 });
  }
  if (file.size > 50 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (50MB max)." }, { status: 413 });
  }

  if (MOCK_MODE) {
    // No ELEVENLABS_API_KEY configured: report mock mode explicitly rather than
    // pretending to convert anything. The client plays the original file back
    // and labels it as a stand-in result.
    return NextResponse.json({ mockMode: true });
  }

  try {
    const { dubbingId, expectedDurationSec } = await createDubbing({
      file,
      sourceLang,
      targetLang,
      dropBackgroundAudio: !keepInstrumental,
    });
    return NextResponse.json({ mockMode: false, dubbingId, expectedDurationSec, targetLang });
  } catch (err) {
    return NextResponse.json({ error: String(err.message || err) }, { status: 502 });
  }
}
