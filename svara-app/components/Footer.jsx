export default function Footer() {
  return (
    <footer className="border-t border-border mt-8">
      <div className="max-w-[1120px] mx-auto px-6 py-10 flex flex-wrap justify-between gap-6">
        <div className="flex items-center gap-2.5 font-display font-bold text-lg">
          <span className="w-[30px] h-[30px] rounded-[9px] flex items-center justify-center bg-gradient-to-br from-coral to-teal shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 3v12M8 9l4-6 4 6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="12" cy="18" r="3" stroke="#fff" strokeWidth="2" />
            </svg>
          </span>
          Svara
        </div>
        <p className="max-w-[52ch] text-sm text-muted leading-relaxed">
          Conversion is powered by the ElevenLabs Dubbing API. Set <code className="font-mono text-xs">ELEVENLABS_API_KEY</code> to
          enable real voice-preserving translations — without it, the converter runs in a clearly labeled mock mode.
        </p>
      </div>
    </footer>
  );
}
