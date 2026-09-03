export default function Nav() {
  return (
    <div className="sticky top-0 z-40 backdrop-blur bg-bg/85 border-b border-border">
      <div className="max-w-[1120px] mx-auto px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5 font-display font-bold text-xl">
          <span className="w-[30px] h-[30px] rounded-[9px] flex items-center justify-center bg-gradient-to-br from-coral to-teal shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 3v12M8 9l4-6 4 6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="12" cy="18" r="3" stroke="#fff" strokeWidth="2" />
            </svg>
          </span>
          Svara
        </div>
        <div className="hidden md:flex gap-7 items-center text-sm text-muted font-medium">
          <a href="#how" className="hover:text-ink">How it works</a>
          <a href="#languages" className="hover:text-ink">Languages</a>
          <a href="#fidelity" className="hover:text-ink">Fidelity</a>
          <a href="#convert" className="hover:text-ink">Convert</a>
        </div>
        <a
          href="#convert"
          className="inline-flex items-center gap-2 rounded-full bg-coral text-white text-sm font-semibold px-5 py-2.5"
        >
          Try a song
        </a>
      </div>
    </div>
  );
}
