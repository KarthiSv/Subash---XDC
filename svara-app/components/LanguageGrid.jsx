const LANGS = [
  ["Tamil", "TA"], ["Korean", "KO"], ["Japanese", "JA"], ["Spanish", "ES"],
  ["Portuguese", "PT"], ["Arabic", "AR"], ["Hindi", "HI"], ["French", "FR"],
  ["Turkish", "TR"], ["Vietnamese", "VI"], ["German", "DE"], ["Polish", "PL"],
];

export default function LanguageGrid() {
  return (
    <section id="languages" className="max-w-[1120px] mx-auto px-6 py-16">
      <div className="max-w-[56ch] mb-7">
        <p className="eyebrow">Coverage</p>
        <h2 className="text-[clamp(1.6rem,3vw,2.15rem)] mt-2">Any source, any destination</h2>
        <p className="text-muted mt-2.5 leading-relaxed">
          Every pairing runs through the same voice — not a shared "multilingual" model voice standing in for the artist.
        </p>
      </div>
      <div className="grid gap-2.5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(128px, 1fr))" }}>
        {LANGS.map(([name, code]) => (
          <div key={code} className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm font-medium flex items-center justify-between">
            {name}
            <small className="font-mono text-[11px] text-muted">{code}</small>
          </div>
        ))}
      </div>
    </section>
  );
}
