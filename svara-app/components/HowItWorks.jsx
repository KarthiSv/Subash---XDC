const STEPS = [
  {
    n: "01 · Separate",
    title: "Isolate the voice",
    body: "The vocal stem is lifted cleanly from the instrumental — every breath, ad-lib and vibrato kept intact, nothing else touched.",
  },
  {
    n: "02 · Translate & re-fit",
    title: "Meaning first, then meter",
    body: "Lyrics are translated for true meaning, then remapped syllable-by-syllable onto the original melody's rhythm, stresses and rhyme.",
  },
  {
    n: "03 · Resynthesize",
    title: "Rebuilt in their timbre",
    body: "The new words are sung back in the original artist's own voice print, then glued to the untouched instrumental — same key, same take.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how" className="max-w-[1120px] mx-auto px-6 py-16">
      <div className="max-w-[56ch] mb-9">
        <p className="eyebrow">How it works</p>
        <h2 className="text-[clamp(1.6rem,3vw,2.15rem)] mt-2">Three passes, nothing rewritten that shouldn't be</h2>
        <p className="text-muted mt-2.5 leading-relaxed">
          The instrumental never moves. Only the vocal line is touched — and it goes back exactly where it came from.
        </p>
      </div>
      <div className="grid md:grid-cols-3 gap-5">
        {STEPS.map((s) => (
          <div key={s.n} className="rounded-2xl border border-border bg-surface p-5 flex flex-col gap-3">
            <div className="text-[11px] font-mono text-muted">{s.n}</div>
            <h3 className="text-base">{s.title}</h3>
            <p className="text-muted text-sm leading-relaxed m-0">{s.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
