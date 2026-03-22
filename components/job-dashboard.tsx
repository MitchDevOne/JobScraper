"use client";

import { useEffect, useState } from "react";
import { Job, SectorType, WorkMode } from "@/lib/types";

type ApiPayload = {
  total: number;
  jobs: Job[];
};

const sectors: Array<{ label: string; value: SectorType | "all" }> = [
  { label: "Tutti", value: "all" },
  { label: "Privato", value: "privato" },
  { label: "Pubblico", value: "pubblico" }
];

const modes: Array<{ label: string; value: WorkMode | "all" }> = [
  { label: "Tutti i modi", value: "all" },
  { label: "On-site", value: "on-site" },
  { label: "Hybrid", value: "hybrid" }
];

function formatDate(input: string) {
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "short"
  }).format(new Date(input));
}

export function JobDashboard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [sector, setSector] = useState<SectorType | "all">("all");
  const [workMode, setWorkMode] = useState<WorkMode | "all">("all");

  useEffect(() => {
    const controller = new AbortController();

    async function loadJobs() {
      setLoading(true);

      const params = new URLSearchParams({
        city: "Torino",
        q: query,
        sector,
        workMode,
        includeRemote: "false"
      });

      const response = await fetch(`/api/jobs?${params.toString()}`, {
        signal: controller.signal
      });

      if (!response.ok) {
        setJobs([]);
        setTotal(0);
        setLoading(false);
        return;
      }

      const payload = (await response.json()) as ApiPayload;
      setJobs(payload.jobs);
      setTotal(payload.total);
      setLoading(false);
    }

    loadJobs().catch(() => {
      setJobs([]);
      setTotal(0);
      setLoading(false);
    });

    return () => controller.abort();
  }, [query, sector, workMode]);

  return (
    <section className="relative mx-auto max-w-7xl px-6 pb-16">
      <div className="glass relative overflow-hidden rounded-[32px] border border-black/10 p-6 shadow-card md:p-8">
        <div className="grid-pattern absolute inset-0 opacity-40" />
        <div className="relative grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <div className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-pine">
                Torino focus
              </p>
              <h1 className="max-w-3xl font-[var(--font-display)] text-4xl font-bold leading-tight md:text-6xl">
                Job radar personale per trovare ruoli utili, non rumore.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-black/70 md:text-lg">
                MVP leggero per monitorare offerte su Torino, Italia, separare pubblico e privato,
                e lasciare fuori i ruoli fully remote nella fase iniziale.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-[1.5fr_1fr_1fr]">
              <label className="rounded-[24px] border border-black/10 bg-white/70 p-4">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-black/55">
                  Cerca ruolo
                </span>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="w-full border-none bg-transparent text-base outline-none"
                  placeholder="frontend, data, concorso, Java..."
                />
              </label>

              <label className="rounded-[24px] border border-black/10 bg-white/70 p-4">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-black/55">
                  Settore
                </span>
                <select
                  value={sector}
                  onChange={(event) => setSector(event.target.value as SectorType | "all")}
                  className="w-full border-none bg-transparent text-base outline-none"
                >
                  {sectors.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="rounded-[24px] border border-black/10 bg-white/70 p-4">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-black/55">
                  Modalita
                </span>
                <select
                  value={workMode}
                  onChange={(event) => setWorkMode(event.target.value as WorkMode | "all")}
                  className="w-full border-none bg-transparent text-base outline-none"
                >
                  {modes.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="rounded-[28px] bg-ink p-6 text-white">
            <p className="text-sm uppercase tracking-[0.2em] text-white/60">Approccio MVP</p>
            <div className="mt-6 grid gap-4">
              <div>
                <p className="text-5xl font-bold">{total}</p>
                <p className="text-sm text-white/70">annunci Torino non fully remote</p>
              </div>
              <div className="grid gap-3 text-sm text-white/70">
                <p>Fonti iniziali: siti aziendali, enti pubblici, sorgenti stabili.</p>
                <p>Deploy cheap: frontend e API su Vercel Hobby, seed locale senza database.</p>
                <p>Passo successivo: adapter per import reale e persistenza su Postgres free.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="animate-pulse rounded-[28px] border border-black/10 bg-white/60 p-6">
              <div className="h-5 w-2/3 rounded bg-black/10" />
              <div className="mt-4 h-4 w-1/2 rounded bg-black/10" />
              <div className="mt-6 h-20 rounded bg-black/10" />
            </div>
          ))
        ) : jobs.length > 0 ? (
          jobs.map((job) => (
            <article
              key={job.id}
              className="rounded-[28px] border border-black/10 bg-white/75 p-6 shadow-card transition-transform duration-200 hover:-translate-y-1"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="inline-flex rounded-full bg-mist px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-pine">
                    {job.sector}
                  </span>
                  <h2 className="mt-4 text-2xl font-semibold">{job.title}</h2>
                  <p className="mt-2 text-sm font-medium text-black/65">{job.company}</p>
                </div>
                <span className="rounded-full bg-sand px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-black/70">
                  {formatDate(job.postedAt)}
                </span>
              </div>

              <p className="mt-5 text-sm leading-6 text-black/70">{job.summary}</p>

              <div className="mt-5 flex flex-wrap gap-2">
                {job.tags.map((tag) => (
                  <span key={tag} className="rounded-full border border-black/10 px-3 py-1 text-xs text-black/75">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="mt-6 flex items-center justify-between gap-4 border-t border-black/10 pt-5 text-sm text-black/60">
                <div>
                  <p>{job.location}</p>
                  <p className="mt-1 uppercase tracking-[0.14em]">{job.workMode}</p>
                </div>
                <a
                  href={job.originalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full bg-clay px-4 py-2 font-semibold text-white"
                >
                  Apri fonte
                </a>
              </div>
            </article>
          ))
        ) : (
          <div className="col-span-full rounded-[28px] border border-dashed border-black/20 bg-white/65 p-8 text-center">
            <p className="text-xl font-semibold">Nessun annuncio con questi filtri.</p>
            <p className="mt-2 text-sm text-black/65">
              Per ora il dataset seed esclude in automatico i ruoli fully remote.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
