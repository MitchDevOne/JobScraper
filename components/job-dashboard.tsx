"use client";

import { FormEvent, useEffect, useState } from "react";
import { CvProfile, Job, LocationScope, SearchResponse, SectorType, WorkMode } from "@/lib/types";

const SEARCH_LOCATION = "Torino";

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

const locationScopes: Array<{ label: string; value: LocationScope; description: string }> = [
  {
    label: "Torino citta",
    value: "city",
    description: "Solo posizioni nel comune di Torino."
  },
  {
    label: "Citta metropolitana",
    value: "metro",
    description: "Include Torino e i comuni della provincia."
  }
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

function truncateText(input: string, maxLength = 170) {
  if (input.length <= maxLength) {
    return input;
  }

  return `${input.slice(0, maxLength).trimEnd()}...`;
}

function titleCase(input: string) {
  return input.replace(/\b\w/g, (char) => char.toUpperCase());
}

function sectorBadgeClass(sector: SectorType) {
  return sector === "pubblico" ? "bg-[#d7e7ff] text-[#113a7a]" : "bg-mist text-pine";
}

function setResponseState(
  payload: SearchResponse,
  setters: {
    setJobs: (jobs: Job[]) => void;
    setPublicPotentialJobs: (jobs: Job[]) => void;
    setTotal: (total: number) => void;
    setCvKeywords: (keywords: string[]) => void;
    setCvProfile: (profile: CvProfile | null) => void;
    setLastUpdatedAt: (value: string) => void;
    setConsultedSources: (sources: string[]) => void;
    setPreviewJobs: (jobs: Job[]) => void;
    setSuggestedRoles: (roles: string[]) => void;
    setActiveRoleTargets: (roles: string[]) => void;
  }
) {
  setters.setJobs(payload.jobs);
  setters.setPublicPotentialJobs(payload.publicPotentialJobs);
  setters.setTotal(payload.total);
  setters.setCvKeywords(payload.cvKeywords);
  setters.setCvProfile(payload.cvProfile);
  setters.setLastUpdatedAt(payload.lastUpdatedAt);
  setters.setConsultedSources(payload.consultedSources);
  setters.setPreviewJobs(payload.previewJobs);
  setters.setSuggestedRoles(payload.suggestedRoles);
  setters.setActiveRoleTargets(payload.activeRoleTargets);
}

function InfoAccordion({
  title,
  subtitle,
  defaultOpen = false,
  children
}: {
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details open={defaultOpen} className="rounded-2xl bg-white/10 p-4 open:bg-white/12">
      <summary className="flex cursor-pointer list-none items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-white/60">{title}</p>
          {subtitle ? <p className="mt-1 text-sm text-white/65">{subtitle}</p> : null}
        </div>
        <span className="rounded-full border border-white/15 px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-white/55">
          apri
        </span>
      </summary>
      <div className="mt-4">{children}</div>
    </details>
  );
}

function EmptyPill({ text }: { text: string }) {
  return <span className="text-sm text-white/75">{text}</span>;
}

export function JobDashboard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [publicPotentialJobs, setPublicPotentialJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [sector, setSector] = useState<SectorType | "all">("all");
  const [workMode, setWorkMode] = useState<WorkMode | "all">("all");
  const [locationScope, setLocationScope] = useState<LocationScope>("metro");
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvKeywords, setCvKeywords] = useState<string[]>([]);
  const [cvProfile, setCvProfile] = useState<CvProfile | null>(null);
  const [consultedSources, setConsultedSources] = useState<string[]>([]);
  const [previewJobs, setPreviewJobs] = useState<Job[]>([]);
  const [suggestedRoles, setSuggestedRoles] = useState<string[]>([]);
  const [selectedSuggestedRoles, setSelectedSuggestedRoles] = useState<string[]>([]);
  const [activeRoleTargets, setActiveRoleTargets] = useState<string[]>([]);
  const [analysisReady, setAnalysisReady] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState("");

  const publicJobs = jobs.filter((job) => job.sector === "pubblico");
  const privateJobs = jobs.filter((job) => job.sector === "privato");
  const selectedLocationScope = locationScopes.find((item) => item.value === locationScope);

  async function runSearch(usePost: boolean, roleTargets: string[] = []) {
    if (usePost) {
      setLoading(true);
      const formData = new FormData();
      formData.set("q", query);
      formData.set("sector", sector);
      formData.set("workMode", workMode);
      formData.set("includeRemote", "false");
      formData.set("location", SEARCH_LOCATION);
      formData.set("locationScope", locationScope);
      formData.set("roleTargets", JSON.stringify(roleTargets));

      if (cvFile) {
        formData.set("cv", cvFile);
      }

      const response = await fetch("/api/jobs", {
        method: "POST",
        body: formData
      });
      const payload = (await response.json()) as SearchResponse;
      setResponseState(payload, {
        setJobs,
        setPublicPotentialJobs,
        setTotal,
        setCvKeywords,
        setCvProfile,
        setLastUpdatedAt,
        setConsultedSources,
        setPreviewJobs,
        setSuggestedRoles,
        setActiveRoleTargets
      });
      setLoading(false);
      return;
    }

    const params = new URLSearchParams({
      q: query,
      sector,
      workMode,
      includeRemote: "false",
      location: SEARCH_LOCATION,
      locationScope
    });
    for (const roleTarget of roleTargets) {
      params.append("roleTarget", roleTarget);
    }

    const response = await fetch(`/api/jobs?${params.toString()}`);
    const payload = (await response.json()) as SearchResponse;
    setResponseState(payload, {
      setJobs,
      setPublicPotentialJobs,
      setTotal,
      setCvKeywords,
      setCvProfile,
      setLastUpdatedAt,
      setConsultedSources,
      setPreviewJobs,
      setSuggestedRoles,
      setActiveRoleTargets
    });
    setLoading(false);
  }

  useEffect(() => {
    let active = true;

    async function loadInitialJobs() {
      try {
        const response = await fetch(
          "/api/jobs?location=Torino&locationScope=metro&sector=all&workMode=all&includeRemote=false&q="
        );
        const payload = (await response.json()) as SearchResponse;

        if (!active) {
          return;
        }

        setResponseState(payload, {
          setJobs,
          setPublicPotentialJobs,
          setTotal,
          setCvKeywords,
          setCvProfile,
          setLastUpdatedAt,
          setConsultedSources,
          setPreviewJobs,
          setSuggestedRoles,
          setActiveRoleTargets
        });
      } catch {
        if (!active) {
          return;
        }

        setJobs([]);
        setPublicPotentialJobs([]);
        setTotal(0);
        setCvKeywords([]);
        setCvProfile(null);
        setConsultedSources([]);
        setPreviewJobs([]);
        setSuggestedRoles([]);
        setSelectedSuggestedRoles([]);
        setActiveRoleTargets([]);
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
      setAnalysisReady(false);
      setSelectedSuggestedRoles([]);
      await runSearch(true, []);
      setAnalysisReady(true);
    } catch {
      setJobs([]);
      setPublicPotentialJobs([]);
      setTotal(0);
      setCvKeywords([]);
      setCvProfile(null);
      setConsultedSources([]);
      setPreviewJobs([]);
      setSuggestedRoles([]);
      setSelectedSuggestedRoles([]);
      setActiveRoleTargets([]);
      setAnalysisReady(false);
      setLoading(false);
    }
  }

  function toggleSuggestedRole(role: string) {
    setSelectedSuggestedRoles((current) =>
      current.includes(role) ? current.filter((item) => item !== role) : [...current, role]
    );
  }

  async function handleTargetedSearch() {
    const roleTargets = [...(cvProfile?.titles ?? []), ...selectedSuggestedRoles];

    try {
      await runSearch(true, roleTargets);
    } catch {
      setLoading(false);
    }
  }

  function renderJobCard(job: Job) {
    return (
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
            <h3 className="mt-4 text-2xl font-semibold">{job.title}</h3>
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

        <p className="mt-5 text-sm leading-6 text-black/70">{truncateText(job.summary)}</p>

        <div className="mt-5 flex flex-wrap gap-2">
          {job.tags.slice(0, 6).map((tag) => (
            <span key={tag} className="rounded-full border border-black/10 px-3 py-1 text-xs text-black/75">
              {tag}
            </span>
          ))}
        </div>

        {job.matchReasons && job.matchReasons.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {job.matchReasons.map((reason) => (
              <span
                key={reason}
                className="rounded-full bg-[#efe3da] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#8c4a2f]"
              >
                {reason}
              </span>
            ))}
          </div>
        ) : null}

        {job.sector === "pubblico" && job.requirementHighlights && job.requirementHighlights.length > 0 ? (
          <div className="mt-4 rounded-2xl bg-[#f6f7fb] p-3 text-xs text-black/65">
            <p className="font-semibold uppercase tracking-[0.12em] text-black/45">Requisiti analizzati</p>
            <p className="mt-2 leading-5">{truncateText(job.requirementHighlights[0], 180)}</p>
          </div>
        ) : null}

        <div className="mt-6 flex items-center justify-between gap-4 border-t border-black/10 pt-5 text-sm text-black/60">
          <div>
            <p>{job.location}</p>
            <p className="mt-1 uppercase tracking-[0.14em]">{job.workMode}</p>
          </div>
          <div className="flex items-center gap-3">
            {job.sector === "pubblico" && job.requirementSourceUrl ? (
              <a
                href={job.requirementSourceUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-black/10 px-4 py-2 font-semibold text-black/70"
              >
                Apri bando
              </a>
            ) : null}
            <a
              href={job.originalUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-clay px-4 py-2 font-semibold text-white"
            >
              Apri offerta
            </a>
          </div>
        </div>
      </article>
    );
  }

  function renderJobSection(title: string, subtitle: string, items: Job[], tint: string) {
    if (items.length === 0) {
      return null;
    }

    return (
      <section className="space-y-4">
        <div className={`rounded-[28px] border border-black/10 ${tint} p-5`}>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-black/50">{subtitle}</p>
          <h2 className="mt-2 font-[var(--font-display)] text-3xl font-bold">{title}</h2>
          <p className="mt-2 text-sm text-black/65">{items.length} risultati in questa sezione.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{items.map((job) => renderJobCard(job))}</div>
      </section>
    );
  }

  return (
    <section className="relative mx-auto max-w-7xl px-6 pb-16">
      <div className="glass relative overflow-hidden rounded-[32px] border border-black/10 p-6 shadow-card md:p-8">
        <div className="grid-pattern absolute inset-0 opacity-40" />
        <div className="relative grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <div className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-pine">Torino focus</p>
              <h1 className="max-w-3xl font-[var(--font-display)] text-4xl font-bold leading-tight md:text-6xl">
                Analizza il CV e cerca ruoli coerenti solo su Torino citta o area metropolitana.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-black/70 md:text-lg">
                La ricerca geografica e ora ristretta su due perimetri chiari, mentre il ranking
                aggrega ruoli simili e separa meglio offerte pubbliche e private.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <label className="rounded-[24px] border border-black/10 bg-white/70 p-4 xl:col-span-2">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-black/55">
                  Cerca ruolo o keyword
                </span>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="w-full border-none bg-transparent text-base outline-none"
                  placeholder="frontend, data, PMO, Java..."
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

              <div className="rounded-[24px] border border-black/10 bg-white/70 p-4 xl:col-span-2">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-black/55">
                  Location bloccata
                </span>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-base font-semibold">{SEARCH_LOCATION}</p>
                    <p className="text-sm text-black/55">Ricerca geografica ristretta e coerente.</p>
                  </div>
                  <span className="rounded-full bg-sand px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-black/70">
                    Torino only
                  </span>
                </div>
              </div>

              <label className="rounded-[24px] border border-black/10 bg-white/70 p-4 xl:col-span-2">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-black/55">
                  Perimetro geografico
                </span>
                <select
                  value={locationScope}
                  onChange={(event) => setLocationScope(event.target.value as LocationScope)}
                  className="w-full border-none bg-transparent text-base outline-none"
                >
                  {locationScopes.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
                <p className="mt-3 text-sm text-black/60">{selectedLocationScope?.description}</p>
              </label>

              <label className="rounded-[24px] border border-black/10 bg-white/70 p-4 xl:col-span-2">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-black/55">
                  Carica CV PDF
                </span>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(event) => setCvFile(event.target.files?.[0] ?? null)}
                  className="w-full text-sm text-black/70 file:mr-4 file:rounded-full file:border-0 file:bg-ink file:px-4 file:py-2 file:font-semibold file:text-white"
                />
                <p className="mt-3 text-sm text-black/60">
                  Il CV viene usato solo nella sessione corrente e va ricaricato a ogni nuova analisi.
                </p>
              </label>

              <button
                type="submit"
                disabled={loading || !cvFile}
                className="rounded-[24px] bg-clay px-6 py-4 text-base font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 xl:col-span-1"
              >
                {loading ? "Analizzo..." : "1. Analizza CV"}
              </button>

              <button
                type="button"
                onClick={() => void handleTargetedSearch()}
                disabled={!analysisReady || loading || !cvProfile}
                className="rounded-[24px] border border-black/10 bg-white/70 px-6 py-4 text-base font-semibold text-black transition-opacity hover:bg-white disabled:cursor-not-allowed disabled:opacity-50 xl:col-span-1"
              >
                {loading ? "Attendi..." : "2. Avvia ricerca reale"}
              </button>
            </form>
          </div>

          <div className="rounded-[28px] bg-ink p-6 text-white">
            <p className="text-sm uppercase tracking-[0.2em] text-white/60">Profilo CV + fonti</p>
            <div className="mt-6 grid gap-4">
              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <p className="text-5xl font-bold">{total}</p>
                  <p className="text-sm text-white/70">risultati totali compatibili</p>
                </div>
                <div>
                  <p className="text-3xl font-bold">{publicJobs.length}</p>
                  <p className="text-sm text-white/70">pubblici</p>
                </div>
                <div>
                  <p className="text-3xl font-bold">{publicPotentialJobs.length}</p>
                  <p className="text-sm text-white/70">PA da verificare</p>
                </div>
                <div>
                  <p className="text-3xl font-bold">{privateJobs.length}</p>
                  <p className="text-sm text-white/70">privati</p>
                </div>
              </div>

              <div className="grid gap-3 text-sm text-white/70">
                <p>Location attiva: {SEARCH_LOCATION}</p>
                <p>Perimetro: {locationScope === "city" ? "Torino citta" : "Citta metropolitana di Torino"}</p>
                <p>Fonti consultate: {consultedSources.length}</p>
                <p>Ruoli target attivi: {activeRoleTargets.length}</p>
                <p>{lastUpdatedAt ? `Ultimo refresh ${formatTimestamp(lastUpdatedAt)}` : "Pronto alla ricerca."}</p>
              </div>

              <InfoAccordion title="Fonti usate" subtitle="Elenco delle sorgenti realmente interrogate" defaultOpen>
                <div className="flex flex-wrap gap-2">
                  {consultedSources.length > 0 ? (
                    consultedSources.map((source) => (
                      <span key={source} className="rounded-full border border-white/15 px-3 py-1 text-xs">
                        {source}
                      </span>
                    ))
                  ) : (
                    <EmptyPill text="Nessuna fonte disponibile per i filtri correnti." />
                  )}
                </div>
              </InfoAccordion>

              <InfoAccordion
                title="Profili estratti dal CV"
                subtitle="Titoli, skill, esperienza e studio normalizzati"
                defaultOpen
              >
                {cvProfile ? (
                  <div className="grid gap-4 text-sm text-white/75">
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-white/55">Ruoli trovati</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {cvProfile.titles.length > 0 ? (
                          cvProfile.titles.map((title) => (
                            <span key={title} className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs">
                              {titleCase(title)}
                            </span>
                          ))
                        ) : (
                          <EmptyPill text="Nessun ruolo chiaro estratto dal CV." />
                        )}
                      </div>
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-white/55">Skill rilevate</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {cvProfile.skills.length > 0 ? (
                          cvProfile.skills.map((skill) => (
                            <span key={skill} className="rounded-full border border-white/15 px-3 py-1 text-xs">
                              {titleCase(skill)}
                            </span>
                          ))
                        ) : (
                          <EmptyPill text="Nessuna skill rilevata." />
                        )}
                      </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <p>Esperienza: {cvProfile.experienceAreas.length > 0 ? cvProfile.experienceAreas.join(", ") : "non trovata"}</p>
                      <p>Studio: {cvProfile.studyAreas.length > 0 ? cvProfile.studyAreas.join(", ") : "non trovato"}</p>
                      <p>Titoli di studio: {cvProfile.educationLevels.length > 0 ? cvProfile.educationLevels.join(", ") : "non trovati"}</p>
                      <p>Anni stimati: {cvProfile.yearsOfExperience ?? "n.d."}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-white/75">
                    Carica un CV PDF in questa sessione per attivare estrazione e ranking.
                  </p>
                )}
              </InfoAccordion>

              <InfoAccordion title="Ruoli suggeriti simili" subtitle="Ruoli aggregati e correlati al profilo estratto">
                {suggestedRoles.length > 0 ? (
                  <>
                    <div className="flex flex-wrap gap-2">
                      {suggestedRoles.map((role) => (
                        <button
                          key={role}
                          type="button"
                          onClick={() => toggleSuggestedRole(role)}
                          className={`rounded-full border px-3 py-1 text-xs text-white transition-colors ${
                            selectedSuggestedRoles.includes(role)
                              ? "border-white bg-white/20"
                              : "border-white/15 hover:bg-white/10"
                          }`}
                        >
                          {titleCase(role)}
                        </button>
                      ))}
                    </div>
                    {selectedSuggestedRoles.length > 0 ? (
                      <p className="mt-3 text-xs text-white/65">
                        Selezionati per la ricerca reale: {selectedSuggestedRoles.map(titleCase).join(", ")}
                      </p>
                    ) : null}
                  </>
                ) : (
                  <p className="text-sm text-white/75">
                    Dopo il parsing del CV qui compariranno ruoli affini aggregati dal matching.
                  </p>
                )}
              </InfoAccordion>

              <InfoAccordion title="Preview posizioni" subtitle="Anteprima breve prima di aprire la fonte">
                <div className="grid gap-3">
                  {previewJobs.length > 0 ? (
                    previewJobs.map((job) => (
                      <div key={job.id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-white">{job.title}</p>
                            <p className="mt-1 text-xs text-white/65">
                              {job.company} · {job.location}
                            </p>
                          </div>
                          <span className="rounded-full border border-white/15 px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-white/60">
                            {job.sector}
                          </span>
                        </div>
                        <p className="mt-2 text-xs leading-5 text-white/75">{truncateText(job.summary, 120)}</p>
                        <p className="mt-2 text-xs text-white/60">
                          {job.matchReasons?.slice(0, 2).join(" · ") || "match rilevante dal CV"}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-white/75">
                      La preview apparira dopo l&apos;analisi del CV e della ricerca.
                    </p>
                  )}
                </div>
              </InfoAccordion>

              <InfoAccordion title="Keyword CV" subtitle="Segnali lessicali piu frequenti">
                <div className="flex flex-wrap gap-2">
                  {cvKeywords.length > 0 ? (
                    cvKeywords.map((keyword) => (
                      <span key={keyword} className="rounded-full border border-white/15 px-3 py-1 text-xs">
                        {keyword}
                      </span>
                    ))
                  ) : (
                    <EmptyPill text="Le keyword compariranno dopo l'analisi del CV." />
                  )}
                </div>
              </InfoAccordion>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-8">
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="animate-pulse rounded-[28px] border border-black/10 bg-white/60 p-6">
                <div className="h-5 w-2/3 rounded bg-black/10" />
                <div className="mt-4 h-4 w-1/2 rounded bg-black/10" />
                <div className="mt-6 h-20 rounded bg-black/10" />
              </div>
            ))}
          </div>
        ) : jobs.length > 0 || publicPotentialJobs.length > 0 ? (
          <>
            {renderJobSection("Posizioni Pubbliche", "Sezione PA", publicJobs, "bg-[#eef5ff]")}
            {renderJobSection(
              "PA Potenzialmente Compatibili",
              "Verifica titoli di studio e requisiti specifici",
              publicPotentialJobs,
              "bg-[#f5f0ff]"
            )}
            {renderJobSection("Posizioni Private", "Sezione aziende", privateJobs, "bg-[#fbf3ea]")}
          </>
        ) : (
          <div className="col-span-full rounded-[28px] border border-dashed border-black/20 bg-white/65 p-8 text-center">
            <p className="text-xl font-semibold">Nessun annuncio attivo con questi filtri.</p>
            <p className="mt-2 text-sm text-black/65">
              Prova a cambiare perimetro geografico o carica il CV per ampliare il matching su
              titoli, skill ed esperienza.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
