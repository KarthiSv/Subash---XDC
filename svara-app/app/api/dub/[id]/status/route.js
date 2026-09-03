import { NextResponse } from "next/server";
import { getDubbingStatus, MOCK_MODE } from "../../../../../lib/elevenlabs";

export const runtime = "nodejs";

export async function GET(request, { params }) {
  if (MOCK_MODE) {
    return NextResponse.json({ status: "dubbed" });
  }
  try {
    const { id } = await params;
    const result = await getDubbingStatus(id);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: String(err.message || err) }, { status: 502 });
  }
}
