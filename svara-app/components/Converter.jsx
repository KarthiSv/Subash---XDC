"use client";

import { useEffect, useRef, useState } from "react";

const POLL_MS = 3000;

export default function Converter() {
  const [languages, setLanguages] = useState([]);
  const [file, setFile] = useState(null);
  const [fileUrl, setFileUrl] = useState(null);
  const [sourceLang, setSourceLang] = useState("auto");
  const [targetLang, setTargetLang] = useState("ta");
  const [keepInstrumental, setKeepInstrumental] = useState(true);
  const [phase, setPhase] = useState("idle"); // idle | processing | done | error
  const [mockMode, setMockMode] = useState(false);
  const [resultUrl, setResultUrl] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const pollRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetch("/api/languages")
      .then((r) => r.json())
      .then((d) => setLanguages(d.languages || []))
      .catch(() => setLanguages([]));
    return () => clearInterval(pollRef.current);
  }, []);

  function pickFile(f) {
    if (!f) return;
    if (!f.type.startsWith("audio/") && !f.type.startsWith("video/")) {
      setErrorMsg("Please choose an audio (or video) file.");
      return;
    }
    setErrorMsg("");
    setFile(f);
    setFileUrl(URL.createObjectURL(f));
    setPhase("idle");
    setResultUrl(null);
  }

  async function startConversion() {
    if (!file) {
      setErrorMsg("Add a song first.");
      return;
    }
    clearInterval(pollRef.current);
    setErrorMsg("");
    setResultUrl(null);
    setPhase("processing");

    const form = new FormData();
    form.append("file", file);
    form.append("targetLang", targetLang);
    form.append("sourceLang", sourceLang);
    form.append("keepInstrumental", String(keepInstrumental));

    try {
      const res = await fetch("/api/dub", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Conversion failed to start.");

      if (data.mockMode) {
        setMockMode(true);
        setTimeout(() => {
          setResultUrl(fileUrl);
          setPhase("done");
        }, 1800);
        return;
      }

      setMockMode(false);
      const dubbingId = data.dubbingId;
      pollRef.current = setInterval(async () => {
        try {
          const sRes = await fetch(`/api/dub/${dubbingId}/status`);
          const sData = await sRes.json();
          if (!sRes.ok) throw new Error(sData.error || "Status check failed.");
          if (sData.status === "dubbed") {
            clearInterval(pollRef.current);
            setResultUrl(`/api/dub/${dubbingId}/audio?lang=${targetLang}`);
            setPhase("done");
          } else if (sData.status === "failed") {
            clearInterval(pollRef.current);
            setErrorMsg(sData.error || "The dubbing job failed.");
            setPhase("error");
          }
        } catch (err) {
          clearInterval(pollRef.current);
          setErrorMsg(String(err.message || err));
          setPhase("error");
        }
      }, POLL_MS);
    } catch (err) {
      setErrorMsg(String(err.message || err));
      setPhase("error");
    }
  }

  return (
    <div className="rounded-xl2 border border-border bg-surface p-5 shadow-[0_20px_50px_-25px_rgba(26,21,34,0.35)] flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <span className="eyebrow">Convert a song</span>
        {mockMode && phase !== "idle" && (
          <span className="text-[11px] font-mono px-2 py-1 rounded-full bg-surface2 text-muted">
            mock mode — no API key set
          </span>
        )}
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          pickFile(e.dataTransfer.files?.[0]);
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer transition-colors ${
          dragOver ? "border-coral bg-coralsoft/40" : "border-border bg-surface2"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*,video/*"
          className="hidden"
          onChange={(e) => pickFile(e.target.files?.[0])}
        />
        {file ? (
          <div>
            <div className="font-semibold text-sm">{file.name}</div>
            <div className="text-xs text-muted mt-1">
              {(file.size / (1024 * 1024)).toFixed(1)} MB · click to choose a different file
            </div>
          </div>
        ) : (
          <div>
            <div className="font-semibold text-sm">Drop a song here, or click to browse</div>
            <div className="text-xs text-muted mt-1">MP3, WAV, M4A — up to 50MB</div>
          </div>
        )}
      </div>

      {fileUrl && <audio className="w-full" controls src={fileUrl} />}

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-xs text-muted">
          Source language
          <select
            value={sourceLang}
            onChange={(e) => setSourceLang(e.target.value)}
            className="rounded-full border border-border bg-surface2 px-3 py-2 text-sm font-semibold text-ink"
          >
            <option value="auto">Auto-detect</option>
            {languages.map((l) => (
              <option key={l.code} value={l.code}>
                {l.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted">
          Translate to
          <select
            value={targetLang}
            onChange={(e) => setTargetLang(e.target.value)}
            className="rounded-full border border-border bg-surface2 px-3 py-2 text-sm font-semibold text-ink"
          >
            {(languages.length ? languages : [{ code: "ta", name: "Tamil" }]).map((l) => (
              <option key={l.code} value={l.code}>
                {l.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-xl bg-surface2 px-3 py-2.5">
        <div>
          <div className="text-sm font-semibold">Keep the original instrumental</div>
          <div className="text-xs text-muted mt-0.5">
            {keepInstrumental ? "Music untouched, only the vocal is re-sung" : "Vocal-only output, no backing track"}
          </div>
        </div>
        <button
          type="button"
          aria-pressed={keepInstrumental}
          onClick={() => setKeepInstrumental((v) => !v)}
          className={`w-11 h-6 rounded-full relative shrink-0 transition-colors ${
            keepInstrumental ? "bg-teal" : "bg-border"
          }`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
              keepInstrumental ? "left-[22px]" : "left-0.5"
            }`}
          />
        </button>
      </div>

      <button
        type="button"
        onClick={startConversion}
        disabled={phase === "processing" || !file}
        className="rounded-full bg-coral text-white font-semibold text-sm py-3 disabled:opacity-50 disabled:cursor-not-allowed transition-transform active:scale-[0.98]"
      >
        {phase === "processing" ? "Converting…" : "Convert with original voice"}
      </button>

      {phase === "processing" && (
        <div className="text-xs text-muted flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-full border-2 border-coral border-t-transparent animate-spin" />
          Separating vocals, translating, and re-singing in the original voice — this can take a few minutes for a full track.
        </div>
      )}

      {phase === "error" && (
        <div className="text-xs text-red-500 bg-red-500/10 rounded-lg px-3 py-2">{errorMsg}</div>
      )}
      {errorMsg && phase !== "error" && (
        <div className="text-xs text-red-500 bg-red-500/10 rounded-lg px-3 py-2">{errorMsg}</div>
      )}

      {phase === "done" && resultUrl && (
        <div className="rounded-xl bg-tealsoft/60 border border-teal/30 p-3">
          <div className="text-sm font-semibold mb-1">
            {mockMode ? "Mock preview (original audio)" : "Converted"}
          </div>
          {mockMode && (
            <div className="text-xs text-muted mb-2">
              No ELEVENLABS_API_KEY is configured, so this plays back your original upload unchanged — add a key
              to hear a real voice-preserving conversion.
            </div>
          )}
          <audio className="w-full" controls src={resultUrl} />
        </div>
      )}
    </div>
  );
}
