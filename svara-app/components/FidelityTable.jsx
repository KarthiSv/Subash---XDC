const ROWS = [
  ["Original singer's voice", "Kept exactly", "Replaced with a stock TTS voice"],
  ["Meaning of the lyric", "Translated, not paraphrased", "Often loosely approximated"],
  ["Melody, key & tempo", "Untouched", "Frequently re-timed or re-sung"],
  ["Breath, vibrato, ad-libs", "Carried over", "Smoothed away by synthesis"],
  ["Instrumental & mix", "Never re-rendered", "Sometimes regenerated in full"],
];

function Check() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" className="inline mr-1.5 -mt-0.5">
      <path d="M4 12l6 6L20 6" stroke="var(--teal)" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function FidelityTable() {
  return (
    <section id="fidelity" className="max-w-[1120px] mx-auto px-6 py-16">
      <div className="max-w-[56ch] mb-7">
        <p className="eyebrow">The promise</p>
        <h2 className="text-[clamp(1.6rem,3vw,2.15rem)] mt-2">Built to disappear, not to impress</h2>
        <p className="text-muted mt-2.5 leading-relaxed">
          The goal is a version a native speaker would believe was recorded that way — not something that sounds "AI-translated."
        </p>
      </div>
      <div className="rounded-2xl border border-border bg-surface overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="text-left px-4 py-3.5 bg-surface2 font-semibold border-b border-border">What's preserved</th>
              <th className="text-left px-4 py-3.5 bg-surface2 font-semibold border-b border-border text-coral">Svara</th>
              <th className="text-left px-4 py-3.5 bg-surface2 font-semibold border-b border-border">Typical AI dubbing</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map(([label, us, them]) => (
              <tr key={label}>
                <td className="px-4 py-3.5 border-b border-border font-medium">{label}</td>
                <td className="px-4 py-3.5 border-b border-border text-muted"><Check />{us}</td>
                <td className="px-4 py-3.5 border-b border-border text-muted">{them}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
