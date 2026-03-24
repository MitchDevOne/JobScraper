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
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#155b4a]">Source coverage</p>
          <h2 className="mt-2 font-[var(--font-display)] text-3xl font-bold md:text-4xl">
            Copertura fonti pensata per retrieval reale, non per rumore.
          </h2>
        </div>
        <p className="max-w-xl text-sm leading-6 text-black/65">
          La UI mostra fonti ufficiali, ATS e seed curati come livelli diversi del sourcing. Questo rende piu chiaro
          dove nasce ogni opportunita e quanto il catalogo e affidabile.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {sourceCatalog.filter((source) => source.enabled).map((source) => (
          <article key={source.id} className="rounded-[28px] border border-black/10 bg-white/80 p-6 shadow-card">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-black/50">{source.statusLabel}</p>
              <span
                className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${
                  source.sector === "pubblico" ? "bg-[#d6efe7] text-[#155b4a]" : "bg-[#f4dfce] text-[#8c4b1f]"
                }`}
              >
                {source.sector}
              </span>
            </div>

            <h3 className="mt-4 font-[var(--font-display)] text-2xl font-bold">{source.label}</h3>
            <p className="mt-3 text-sm leading-6 text-black/70">{source.focus}</p>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full border border-black/10 px-3 py-1 text-xs text-black/65">
                {sourceStrategyLabels[source.strategy]}
              </span>
              <span className="rounded-full border border-black/10 px-3 py-1 text-xs text-black/65">
                {sourceCoverageLabels[source.coverage]}
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
