"use client";

import { FormEvent, useEffect, useState } from "react";
import { Job, SearchResponse, SectorType, WorkMode } from "@/lib/types";

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

function formatDate(input: string | null) {
  if (!input) {
    return "N.D.";
  }

  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "short"
  }).format(new Date(input));
}

function formatTimestamp(input: string) {
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(input));
}

function sectorBadgeClass(sector: SectorType) {
  return sector === "pubblico"
    ? "bg-[#d7e7ff] text-[#113a7a]"
    : "bg-mist text-pine";
}

export function JobDashboard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [sector, setSector] = useState<SectorType | "all">("all");
  const [workMode, setWorkMode] = useState<WorkMode | "all">("all");
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvKeywords, setCvKeywords] = useState<string[]>([]);
  const [lastUpdatedAt, setLastUpdatedAt] = useState("");

  async function runSearch(usePost: boolean) {
    if (usePost) {
      setLoading(true);
      const formData = new FormData();
      formData.set("city", "Torino");
      formData.set("q", query);
      formData.set("sector", sector);
      formData.set("workMode", workMode);
      formData.set("includeRemote", "false");

      if (cvFile) {
        formData.set("cv", cvFile);
      }

      const response = await fetch("/api/jobs", {
        method: "POST",
        body: formData
      });
      const payload = (await response.json()) as SearchResponse;
      setJobs(payload.jobs);
      setTotal(payload.total);
      setCvKeywords(payload.cvKeywords);
      setLastUpdatedAt(payload.lastUpdatedAt);
      setLoading(false);
      return;
    }

    const params = new URLSearchParams({
      city: "Torino",
      q: query,
      sector,
      workMode,
      includeRemote: "false"
    });

    const response = await fetch(`/api/jobs?${params.toString()}`);
    const payload = (await response.json()) as SearchResponse;
    setJobs(payload.jobs);
    setTotal(payload.total);
    setCvKeywords(payload.cvKeywords);
    setLastUpdatedAt(payload.lastUpdatedAt);
    setLoading(false);
  }

  useEffect(() => {
    let active = true;

    async function loadInitialJobs() {
      try {
        const params = new URLSearchParams({
          city: "Torino",
          q: "",
          sector: "all",
          workMode: "all",
          includeRemote: "false"
        });
        const response = await fetch(`/api/jobs?${params.toString()}`);
        const payload = (await response.json()) as SearchResponse;

        if (!active) {
          return;
        }

        setJobs(payload.jobs);
        setTotal(payload.total);
        setCvKeywords(payload.cvKeywords);
        setLastUpdatedAt(payload.lastUpdatedAt);
      } catch {
        if (!active) {
          return;
        }

        setJobs([]);
        setTotal(0);
        setCvKeywords([]);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadInitialJobs();

    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      await runSearch(true);
    } catch {
      setJobs([]);
      setTotal(0);
      setCvKeywords([]);
      setLoading(false);
    }
  }

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
                Premi Enter o usa il pulsante per lanciare uno scraping aggiornato del pubblico
                ufficiale e combinare i risultati con il privato, anche in base al tuo CV.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-[1.4fr_0.9fr_0.9fr]">
              <label className="rounded-[24px] border border-black/10 bg-white/70 p-4">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-black/55">
                  Cerca ruolo o premi Enter
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

              <label className="rounded-[24px] border border-black/10 bg-white/70 p-4 md:col-span-2">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-black/55">
                  Carica CV PDF
                </span>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(event) => setCvFile(event.target.files?.[0] ?? null)}
                  className="w-full text-sm text-black/70 file:mr-4 file:rounded-full file:border-0 file:bg-ink file:px-4 file:py-2 file:font-semibold file:text-white"
                />
              </label>

              <button
                type="submit"
                className="rounded-[24px] bg-clay px-6 py-4 text-base font-semibold text-white transition-opacity hover:opacity-90"
              >
                {loading ? "Aggiorno..." : "Aggiorna con scraping live"}
              </button>
            </form>
          </div>

          <div className="rounded-[28px] bg-ink p-6 text-white">
            <p className="text-sm uppercase tracking-[0.2em] text-white/60">Approccio MVP</p>
            <div className="mt-6 grid gap-4">
              <div>
                <p className="text-5xl font-bold">{total}</p>
                <p className="text-sm text-white/70">annunci Torino non fully remote</p>
              </div>
              <div className="grid gap-3 text-sm text-white/70">
                <p>Pubblico: scraping live del Comune di Torino con filtro solo bandi ancora attivi.</p>
                <p>Privato: seed iniziale con scadenza opzionale quando il sito non la espone.</p>
                <p>{lastUpdatedAt ? `Ultimo refresh ${formatTimestamp(lastUpdatedAt)}` : "Pronto al refresh live."}</p>
              </div>
              {cvKeywords.length > 0 ? (
                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-white/60">Keyword CV</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {cvKeywords.map((keyword) => (
                      <span key={keyword} className="rounded-full border border-white/15 px-3 py-1 text-xs">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
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
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${sectorBadgeClass(job.sector)}`}
                  >
                    {job.sector}
                  </span>
                  <h2 className="mt-4 text-2xl font-semibold">{job.title}</h2>
                  <p className="mt-2 text-sm font-medium text-black/65">{job.company}</p>
                </div>
                <div className="space-y-2 text-right">
                  <span className="block rounded-full bg-sand px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-black/70">
                    Pubblicato {formatDate(job.postedAt)}
                  </span>
                  <span className="block rounded-full bg-[#f9dfd5] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#8c3216]">
                    {job.expiresAt ? `Scade ${formatDate(job.expiresAt)}` : "Scadenza non indicata"}
                  </span>
                </div>
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
                  Apri offerta
                </a>
              </div>
            </article>
          ))
        ) : (
          <div className="col-span-full rounded-[28px] border border-dashed border-black/20 bg-white/65 p-8 text-center">
            <p className="text-xl font-semibold">Nessun annuncio attivo con questi filtri.</p>
            <p className="mt-2 text-sm text-black/65">
              Per il pubblico mostriamo solo bandi con scadenza futura; per il privato la
              scadenza resta opzionale se non pubblicata dal sito.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
