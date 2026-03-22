import { sources } from "@/lib/data/private-jobs";

export function SourceRoadmap() {
  return (
    <section className="mx-auto max-w-7xl px-6 pb-20">
      <div className="grid gap-4 lg:grid-cols-3">
        {sources.map((source) => (
          <article key={source.name} className="rounded-[28px] border border-black/10 bg-[#fffaf4] p-6 shadow-card">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-black/50">
              {source.status}
            </p>
            <h3 className="mt-3 font-[var(--font-display)] text-2xl font-bold">{source.name}</h3>
            <p className="mt-3 text-sm leading-6 text-black/70">{source.focus}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
