import { NextResponse } from "next/server";
import { fetchDubbedAudio, MOCK_MODE } from "../../../../../lib/elevenlabs";

export const runtime = "nodejs";

export async function GET(request, { params }) {
  const { searchParams } = new URL(request.url);
  const lang = searchParams.get("lang");

  if (MOCK_MODE) {
    return NextResponse.json(
      { error: "Mock mode has no server-rendered audio; the client plays the source file locally." },
      { status: 404 }
    );
  }
  if (!lang) {
    return NextResponse.json({ error: "Missing lang query param." }, { status: 400 });
  }

  try {
    const { id } = await params;
    const upstream = await fetchDubbedAudio(id, lang);
    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": upstream.headers.get("content-type") || "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    return NextResponse.json({ error: String(err.message || err) }, { status: 502 });
  }
}
