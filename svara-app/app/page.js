import Nav from "../components/Nav";
import Converter from "../components/Converter";
import HowItWorks from "../components/HowItWorks";
import LanguageGrid from "../components/LanguageGrid";
import FidelityTable from "../components/FidelityTable";
import Footer from "../components/Footer";

export default function Page() {
  return (
    <>
      <Nav />

      <header className="py-16 pb-10">
        <div className="max-w-[1120px] mx-auto px-6 grid md:grid-cols-[1.05fr_1fr] gap-12 md:gap-14 items-start">
          <div>
            <p className="eyebrow">Voice-true translation</p>
            <h1 className="text-[clamp(2.3rem,4.6vw,3.5rem)] leading-[1.04] mt-2">
              Same voice.
              <br />
              Every <span className="text-coral">language</span>.
            </h1>
            <p className="mt-4 max-w-[46ch] text-muted text-[1.06rem] leading-relaxed">
              Svara rewrites a song&apos;s words into your language while keeping the original singer&apos;s voice,
              breath, vibrato and timing exactly as they performed it — so it still sounds like them, singing to
              you, not a dubbed cover.
            </p>
            <div className="flex gap-3 mt-7 flex-wrap">
              <a
                href="#convert"
                className="inline-flex items-center gap-2 rounded-full bg-coral text-white text-sm font-semibold px-5 py-2.5"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M5 3l16 9-16 9V3z" fill="#fff" />
                </svg>
                Try a song
              </a>
              <a
                href="#how"
                className="inline-flex items-center rounded-full border border-border text-sm font-semibold px-5 py-2.5"
              >
                See how it works
              </a>
            </div>
            <p className="mt-3.5 text-[0.82rem] text-muted flex gap-2 items-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
                <path d="M12 8v5M12 16h.01" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
              Runs on the real ElevenLabs Dubbing API — add your key below to hear a genuine conversion.
            </p>
          </div>

          <div id="convert">
            <Converter />
          </div>
        </div>
      </header>

      <HowItWorks />
      <LanguageGrid />
      <FidelityTable />
      <Footer />
    </>
  );
}
