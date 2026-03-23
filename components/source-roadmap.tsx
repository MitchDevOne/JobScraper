import { sourceCatalog } from "@/lib/source-catalog";

const sourceStrategyLabels = {
  seed: "Seed curato",
  "html-parser": "Parser HTML",
  "json-api": "API pubblica"
} as const;

const sourceCoverageLabels = {
  "torino-city": "Torino citta",
  "torino-metro": "Area metropolitana",
  piemonte: "Piemonte",
  italy: "Italia"
} as const;

export function SourceRoadmap() {
  return (
    <section className="mx-auto max-w-7xl px-6 pb-20">
      <div className="grid gap-4 lg:grid-cols-3">
        {sourceCatalog.filter((source) => source.enabled).map((source) => (
          <article key={source.id} className="rounded-[28px] border border-black/10 bg-[#fffaf4] p-6 shadow-card">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-black/50">
              {source.statusLabel}
            </p>
            <h3 className="mt-3 font-[var(--font-display)] text-2xl font-bold">{source.label}</h3>
            <p className="mt-3 text-sm leading-6 text-black/70">{source.focus}</p>
            <p className="mt-4 text-xs uppercase tracking-[0.14em] text-black/45">
              {source.sector} · {sourceStrategyLabels[source.strategy]} · {sourceCoverageLabels[source.coverage]}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
