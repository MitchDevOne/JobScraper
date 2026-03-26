"use client";

import { FormEvent, ReactNode, startTransition, useCallback, useMemo, useState } from "react";
import { CvProfile, Job, LocationScope, SearchResponse, SectorType, SourceFetchMetrics, WorkMode } from "@/lib/types";

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

function formatDuration(input: number) {
  if (input < 1000) {
    return `${input} ms`;
  }

  return `${(input / 1000).toFixed(1)} s`;
}

function titleCase(input: string) {
  return input.replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatList(items: string[], emptyLabel: string, limit = 3) {
  if (items.length === 0) {
    return emptyLabel;
  }

  const visible = items.slice(0, limit).map(titleCase);
  const suffix = items.length > limit ? ` +${items.length - limit}` : "";
  return `${visible.join(", ")}${suffix}`;
}

function buildCvProfileSummary(profile: CvProfile | null) {
  if (!profile) {
    return "";
  }

  const primaryRole = profile.titles[0] ? titleCase(profile.titles[0]) : "profilo professionale da chiarire";
  const secondaryRoles = profile.titles.slice(1, 3).map(titleCase);
  const skills = profile.skills.slice(0, 4).map(titleCase);
  const experience = profile.experienceAreas.slice(0, 3).map(titleCase);
  const study = profile.studyAreas.slice(0, 2).map(titleCase);

  const parts = [`Il CV descrive soprattutto un profilo ${primaryRole}.`];

  if (secondaryRoles.length > 0) {
    parts.push(`Ruoli affini emersi: ${secondaryRoles.join(", ")}.`);
  }

  if (skills.length > 0) {
    parts.push(`Competenze piu evidenti: ${skills.join(", ")}.`);
  }

  if (experience.length > 0) {
    parts.push(`Aree di esperienza: ${experience.join(", ")}.`);
  }

  if (study.length > 0) {
    parts.push(`Contesto formativo: ${study.join(", ")}.`);
  }

  if (profile.yearsOfExperience) {
    parts.push(`Esperienza stimata: circa ${profile.yearsOfExperience}+ anni.`);
  }

  return parts.join(" ");
}

function keywordToneClass(index: number) {
  const tones = [
    "bg-[#eef2ff] text-[#4338ca] border-[#c7d2fe]",
    "bg-[#f3e8ff] text-[#6d28d9] border-[#ddd6fe]",
    "bg-white text-[#312e81] border-[#dbe4ff]"
  ];

  return tones[index % tones.length];
}

function sectorBadgeClass(sector: SectorType) {
  return sector === "pubblico"
    ? "bg-[#e0e7ff] text-[#4338ca]"
    : "bg-[#ede9fe] text-[#6d28d9]";
}

function workModeLabel(workMode: WorkMode) {
  switch (workMode) {
    case "remote":
      return "Remote";
    case "hybrid":
      return "Hybrid";
    default:
      return "On-site";
  }
}

function sourceMetricSummary(metrics: SourceFetchMetrics[]) {
  const successful = metrics.filter((metric) => metric.success);
  const failed = metrics.filter((metric) => !metric.success);
  const avgDuration =
    metrics.length > 0 ? Math.round(metrics.reduce((sum, metric) => sum + metric.durationMs, 0) / metrics.length) : 0;

  return {
    successful: successful.length,
    failed: failed.length,
    avgDuration
  };
}

function resetSearchState(setters: {
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
  setSourceFetchMetrics: (metrics: SourceFetchMetrics[]) => void;
}) {
  setters.setJobs([]);
  setters.setPublicPotentialJobs([]);
  setters.setTotal(0);
  setters.setCvKeywords([]);
  setters.setCvProfile(null);
  setters.setLastUpdatedAt("");
  setters.setConsultedSources([]);
  setters.setPreviewJobs([]);
  setters.setSuggestedRoles([]);
  setters.setActiveRoleTargets([]);
  setters.setSourceFetchMetrics([]);
}

function applyResponseState(
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
    setSourceFetchMetrics: (metrics: SourceFetchMetrics[]) => void;
  }
) {
  const derivedKeywords =
    payload.cvKeywords.length > 0
      ? payload.cvKeywords
      : payload.cvProfile
        ? [
            ...payload.cvProfile.keywords,
            ...payload.cvProfile.skills,
            ...payload.cvProfile.titles,
            ...payload.cvProfile.experienceAreas
          ].filter((value, index, items) => Boolean(value) && items.indexOf(value) === index)
        : [];

  startTransition(() => {
    setters.setJobs(payload.jobs);
    setters.setPublicPotentialJobs(payload.publicPotentialJobs);
    setters.setTotal(payload.total);
    setters.setCvKeywords(derivedKeywords);
    setters.setCvProfile(payload.cvProfile);
    setters.setLastUpdatedAt(payload.lastUpdatedAt);
    setters.setConsultedSources(payload.consultedSources);
    setters.setPreviewJobs(payload.previewJobs);
    setters.setSuggestedRoles(
      payload.suggestedRoles.length > 0
        ? payload.suggestedRoles
        : payload.cvProfile
          ? [
              ...payload.cvProfile.titles,
              ...payload.cvProfile.skills.flatMap((skill) =>
                skill === "react"
                  ? ["frontend developer", "full stack developer"]
                  : ["java", "python", "node.js", ".net"].includes(skill)
                    ? ["backend developer", "software engineer"]
                    : ["sql", "power bi", "data analysis"].includes(skill)
                      ? ["data analyst", "business analyst"]
                      : skill === "project management"
                        ? ["project management officer", "project manager"]
                        : []
              )
            ].filter((value, index, items) => Boolean(value) && items.indexOf(value) === index)
          : []
    );
    setters.setActiveRoleTargets(payload.activeRoleTargets);
    setters.setSourceFetchMetrics(payload.sourceFetchMetrics ?? []);
  });
}

function StepCard({
  step,
  title,
  description,
  active,
  done
}: {
  step: string;
  title: string;
  description: string;
  active: boolean;
  done: boolean;
}) {
  return (
    <div
      className={`rounded-[24px] border p-4 text-sm transition-colors ${
        active
          ? "border-[#6366f1] bg-[linear-gradient(135deg,rgba(224,231,255,0.95),rgba(243,232,255,0.92))] text-[#312e81] shadow-card"
          : done
            ? "border-[#c7d2fe] bg-[linear-gradient(135deg,rgba(224,231,255,0.88),rgba(243,232,255,0.82))] text-[#4338ca]"
            : "border-[#dbe4ff] bg-[linear-gradient(135deg,rgba(224,231,255,0.62),rgba(243,232,255,0.56))] text-[#4338ca]"
      }`}
    >
      <div className="flex items-center gap-3">
        <span
          className={`inline-flex h-9 w-9 items-center justify-center rounded-full border text-xs font-semibold uppercase tracking-[0.18em] ${
            active
              ? "border-[#6366f1]/30 bg-white/70 text-[#4338ca]"
              : done
                ? "border-[#818cf8]/25 bg-white/70 text-[#4f46e5]"
                : "border-[#dbe4ff] bg-white/80 text-[#6366f1]"
          }`}
        >
          {step}
        </span>
        <div className="space-y-1">
          <p className="font-semibold">{title}</p>
          <p className={`text-sm leading-6 ${active ? "text-[#4338ca]/80" : done ? "text-[#4f46e5]/80" : "text-[#4338ca]/72"}`}>
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

function EmptyPill({ text }: { text: string }) {
  return <span className="text-sm text-black/60">{text}</span>;
}

function Panel({
  title,
  subtitle,
  children,
  dark = false
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  dark?: boolean;
}) {
  return (
    <section
      className={`rounded-[28px] border p-5 ${
        dark ? "border-[#312e81]/20 bg-[linear-gradient(180deg,#172554,#1e1b4b)] text-white shadow-card" : "border-[#dbe4ff] bg-[rgba(255,255,255,0.86)] shadow-card"
      }`}
    >
      <div className="mb-4">
        <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${dark ? "text-white/55" : "text-black/45"}`}>
          {title}
        </p>
        {subtitle ? <p className={`mt-2 text-sm ${dark ? "text-white/70" : "text-black/60"}`}>{subtitle}</p> : null}
      </div>
      {children}
    </section>
  );
}

function InfoCard({
  label,
  value,
  hint,
  tone = "default"
}: {
  label: string;
  value: string | number;
  hint: string;
  tone?: "default" | "warm" | "cool";
}) {
  const toneClass =
    tone === "warm"
      ? "bg-[#f3e8ff]"
      : tone === "cool"
        ? "bg-[#eef2ff]"
        : "bg-white/70";

  return (
    <div className={`rounded-[24px] border border-black/10 ${toneClass} p-4`}>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-black/45">{label}</p>
      <p className="mt-3 text-3xl font-bold text-black">{value}</p>
      <p className="mt-2 text-sm text-black/60">{hint}</p>
    </div>
  );
}

export function JobDashboard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [publicPotentialJobs, setPublicPotentialJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
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
  const [sourceFetchMetrics, setSourceFetchMetrics] = useState<SourceFetchMetrics[]>([]);

  const publicJobs = useMemo(() => jobs.filter((job) => job.sector === "pubblico"), [jobs]);
  const privateJobs = useMemo(() => jobs.filter((job) => job.sector === "privato"), [jobs]);
  const featuredJobs = useMemo(() => jobs.slice(0, 3), [jobs]);
  const selectedLocationScope = locationScopes.find((item) => item.value === locationScope);
  const sourceSummary = sourceMetricSummary(sourceFetchMetrics);
  const currentStep = loading ? 1 : analysisReady ? 3 : cvProfile ? 2 : 1;
  const profileSummary = buildCvProfileSummary(cvProfile);

  const requestJobs = useCallback(async (usePost: boolean, roleTargets: string[] = [], cvFileOverride?: File | null) => {
    setLoading(true);
    setErrorMessage("");

    try {
      let response: Response;

      if (usePost) {
        const formData = new FormData();
        formData.set("q", query);
        formData.set("sector", sector);
        formData.set("workMode", workMode);
        formData.set("includeRemote", "false");
        formData.set("location", SEARCH_LOCATION);
        formData.set("locationScope", locationScope);
        formData.set("roleTargets", JSON.stringify(roleTargets));

        const fileToSend = cvFileOverride ?? cvFile;

        if (fileToSend) {
          formData.set("cv", fileToSend);
        }

        response = await fetch("/api/jobs", {
          method: "POST",
          body: formData
        });
      } else {
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

        response = await fetch(`/api/jobs?${params.toString()}`);
      }

      if (!response.ok) {
        throw new Error("La ricerca non ha restituito una risposta valida.");
      }

      return (await response.json()) as SearchResponse;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Errore non previsto durante la ricerca.";
      setErrorMessage(message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [cvFile, locationScope, query, sector, workMode]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const roleTargets =
      cvProfile && suggestedRoles.length > 0
        ? [...new Set([...(cvProfile.titles ?? []), ...(selectedSuggestedRoles.length > 0 ? selectedSuggestedRoles : suggestedRoles)])]
        : [];
    setAnalysisReady(false);

    try {
      const payload = await requestJobs(true, roleTargets);
      applyResponseState(payload, {
        setJobs,
        setPublicPotentialJobs,
        setTotal,
        setCvKeywords,
        setCvProfile,
        setLastUpdatedAt,
        setConsultedSources,
        setPreviewJobs,
        setSuggestedRoles,
        setActiveRoleTargets,
        setSourceFetchMetrics
      });
      setAnalysisReady(true);
    } catch {
      resetSearchState({
        setJobs,
        setPublicPotentialJobs,
        setTotal,
        setCvKeywords,
        setCvProfile,
        setLastUpdatedAt,
        setConsultedSources,
        setPreviewJobs,
        setSuggestedRoles,
        setActiveRoleTargets,
        setSourceFetchMetrics
      });
      setAnalysisReady(false);
    }
  }

  async function runCvAnalysis(file: File) {
    setCvFile(file);
    setAnalysisReady(false);
    setSelectedSuggestedRoles([]);

    try {
      const payload = await requestJobs(true, [], file);
      applyResponseState(payload, {
        setJobs,
        setPublicPotentialJobs,
        setTotal,
        setCvKeywords,
        setCvProfile,
        setLastUpdatedAt,
        setConsultedSources,
        setPreviewJobs,
        setSuggestedRoles,
        setActiveRoleTargets,
        setSourceFetchMetrics
      });
      setAnalysisReady(true);
    } catch {
      resetSearchState({
        setJobs,
        setPublicPotentialJobs,
        setTotal,
        setCvKeywords,
        setCvProfile,
        setLastUpdatedAt,
        setConsultedSources,
        setPreviewJobs,
        setSuggestedRoles,
        setActiveRoleTargets,
        setSourceFetchMetrics
      });
      setAnalysisReady(false);
    }
  }

  function toggleSuggestedRole(role: string) {
    setSelectedSuggestedRoles((current) =>
      current.includes(role) ? current.filter((item) => item !== role) : [...current, role]
    );
  }

  function renderJobCard(job: Job, featured = false) {
    return (
      <article
        key={job.id}
        className={`flex min-h-0 h-[440px] flex-col overflow-hidden rounded-[28px] border border-black/10 bg-white/82 p-6 shadow-card transition-transform duration-200 hover:-translate-y-1 ${
          featured ? "ring-1 ring-[#818cf8] xl:h-[460px]" : ""
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${sectorBadgeClass(job.sector)}`}
            >
              {job.sector}
            </span>
            <h3 className="mt-4 line-clamp-5 text-2xl font-semibold">{job.title}</h3>
            <p className="mt-2 text-sm font-medium text-black/65">{job.company}</p>
          </div>
          <div className="shrink-0 space-y-2 text-right">
            {typeof job.relevanceScore === "number" ? (
              <span className="block rounded-full bg-[linear-gradient(135deg,#4338ca,#7c3aed)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-white">
                Score {job.relevanceScore}
              </span>
            ) : null}
            <span className="block rounded-full bg-[#eef2ff] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#312e81]">
              Pubblicato {formatDate(job.postedAt)}
            </span>
            <span className="block rounded-full bg-[#f5f3ff] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#4c1d95]">
              {job.expiresAt ? `Scade ${formatDate(job.expiresAt)}` : "Scadenza non indicata"}
            </span>
          </div>
        </div>

        <div className="mt-5 min-h-0 flex-1 overflow-hidden">
          <div className="h-full min-h-0 space-y-4 overflow-y-auto pr-2">
            <p className="text-sm leading-6 text-black/70">{job.summary}</p>

            {job.matchReasons && job.matchReasons.length > 0 ? (
              <div className="rounded-[22px] bg-[#eef2ff] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#4338ca]">Perche lo vedi</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {job.matchReasons.slice(0, 4).map((reason) => (
                    <span
                      key={reason}
                      className="rounded-full border border-[#c7d2fe] bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#4338ca]"
                    >
                      {reason}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2">
              {job.tags.slice(0, 6).map((tag) => (
                <span key={tag} className="rounded-full border border-black/10 px-3 py-1 text-xs text-black/75">
                  {tag}
                </span>
              ))}
            </div>

            {job.sector === "pubblico" && job.requirementHighlights && job.requirementHighlights.length > 0 ? (
              <div className="rounded-2xl bg-[#eef2ff] p-3 text-xs text-[#312e81]">
                <p className="font-semibold uppercase tracking-[0.12em] text-black/45">Requisiti analizzati</p>
                <p className="mt-2 leading-5">{job.requirementHighlights[0]}</p>
              </div>
            ) : null}

            {job.sector === "privato" && job.privateFitStatus === "partial" ? (
              <div className="rounded-2xl bg-[#f5f3ff] p-3 text-xs text-[#6d28d9]">
                <p className="font-semibold uppercase tracking-[0.12em]">Allineamento parziale</p>
                <p className="mt-2 leading-5">
                  La posizione condivide alcuni segnali con il CV, ma non combacia del tutto con esperienza e titoli principali.
                </p>
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-5 flex shrink-0 items-center justify-between gap-4 border-t border-black/10 pt-5 text-sm text-black/60">
          <div className="min-w-0">
            <p>{job.location}</p>
            <p className="mt-1 uppercase tracking-[0.14em]">{workModeLabel(job.workMode)}</p>
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
              className="rounded-full bg-[linear-gradient(135deg,#4338ca,#7c3aed)] px-4 py-2 font-semibold text-white"
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
      <div className="relative overflow-hidden rounded-[36px] border border-[#dbe4ff] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(238,242,255,0.88))] p-6 shadow-card md:p-8">
        <div className="hero-grid absolute inset-0 opacity-70" />
        <div className="relative space-y-8">
          <div className="space-y-5">
            <div className="space-y-4">
              <h1 className="max-w-4xl font-[var(--font-display)] text-4xl font-bold leading-tight md:text-6xl">
                Job Scraper Torino
              </h1>
            </div>

            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)] lg:items-center">
              <StepCard
                step="01"
                title="Carica CV"
                description="Importa il profilo da analizzare e prepara il contesto di ricerca."
                active={currentStep === 1}
                done={currentStep > 1}
              />
              <div className="hidden text-center text-xl text-black/20 lg:block">{">"}</div>
              <StepCard
                step="02"
                title="Leggi il profilo"
                description="Estrarre skill, ruoli e segnali utili per capire il match."
                active={currentStep === 2}
                done={currentStep > 2}
              />
              <div className="hidden text-center text-xl text-black/20 lg:block">{">"}</div>
              <StepCard
                step="03"
                title="Affina la ricerca"
                description="Mostrare opportunita mirate e verificabili per Torino."
                active={currentStep === 3}
                done={false}
              />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-4 xl:grid-cols-12">
            <label className="rounded-[24px] border border-black/10 bg-white/80 p-4 md:col-span-6 xl:col-span-6">
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

            <div className="grid gap-4 md:grid-cols-2 md:col-span-12 xl:col-span-6">
              <label className="rounded-[24px] border border-black/10 bg-white/80 p-4">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-black/55">Settore</span>
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

              <label className="rounded-[24px] border border-black/10 bg-white/80 p-4">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-black/55">Modalita</span>
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

            <div className="rounded-[24px] border border-black/10 bg-white/80 p-4 md:col-span-6 xl:col-span-6">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-black/55">
                Location bloccata
              </span>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-base font-semibold">{SEARCH_LOCATION}</p>
                  <p className="text-sm text-black/55">Perimetro geografico ristretto e coerente.</p>
                </div>
                <span className="rounded-full bg-[#eef2ff] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#4338ca]">
                  Torino only
                </span>
              </div>
            </div>

            <label className="rounded-[24px] border border-black/10 bg-white/80 p-4 md:col-span-6 xl:col-span-6">
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

            <label className="rounded-[24px] border border-black/10 bg-white/80 p-4 md:col-span-12 xl:col-span-6">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-black/55">
                Carica CV PDF
              </span>
              <input
                type="file"
                accept="application/pdf"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  setCvFile(file);

                  if (file) {
                    void runCvAnalysis(file);
                  }
                }}
                className="w-full text-sm text-black/70 file:mr-4 file:rounded-full file:border-0 file:bg-[linear-gradient(135deg,#4338ca,#7c3aed)] file:px-4 file:py-2 file:font-semibold file:text-white"
              />
              <p className="mt-3 text-sm text-black/60">
                Il CV viene analizzato nella sessione corrente appena lo carichi e va ricaricato a ogni nuova analisi.
              </p>
            </label>

            <button
              type="submit"
              disabled={loading || !cvFile}
              className="rounded-[24px] bg-[linear-gradient(135deg,#4338ca,#7c3aed)] px-6 py-4 text-base font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 md:col-span-12 xl:col-span-6"
            >
              {loading ? "Analizzo..." : "Rianalizza CV"}
            </button>
          </form>

          {errorMessage ? (
            <div className="rounded-[24px] border border-[#c7d2fe] bg-[#eef2ff] px-5 py-4 text-sm text-[#4338ca]" role="alert">
              <p className="font-semibold uppercase tracking-[0.14em]">Errore ricerca</p>
              <p className="mt-2">{errorMessage}</p>
            </div>
          ) : null}

          <div className="space-y-6">
            <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
              <Panel title="Profilo CV estratto" subtitle="Dopo l'analisi qui compaiono profilo, keyword operative e ruoli suggeriti selezionabili">
                {cvProfile ? (
                  <div className="space-y-5 text-sm text-black/75">
                    <div className="rounded-[22px] border border-[#ddd6fe] bg-[#f5f3ff] p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6d28d9]">Profilo del CV</p>
                      <p className="mt-3 text-sm leading-6 text-black/75">{profileSummary}</p>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-2">
                      <div>
                        <p className="text-xs uppercase tracking-[0.16em] text-black/45">Ruoli trovati</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {cvProfile.titles.length > 0 ? (
                            cvProfile.titles.map((title) => (
                              <span key={title} className="rounded-full border border-[#dbe4ff] bg-[#eef2ff] px-3 py-1 text-xs text-[#312e81]">
                                {titleCase(title)}
                              </span>
                            ))
                          ) : (
                            <EmptyPill text="Nessun ruolo chiaro estratto dal CV." />
                          )}
                        </div>
                      </div>

                      <div>
                        <p className="text-xs uppercase tracking-[0.16em] text-black/45">Skill rilevate</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {cvProfile.skills.length > 0 ? (
                            cvProfile.skills.map((skill) => (
                              <span key={skill} className="rounded-full border border-black/10 px-3 py-1 text-xs">
                                {titleCase(skill)}
                              </span>
                            ))
                          ) : (
                            <EmptyPill text="Nessuna skill rilevata." />
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <p>Esperienza: {cvProfile.experienceAreas.length > 0 ? cvProfile.experienceAreas.join(", ") : "non trovata"}</p>
                      <p>Studio: {cvProfile.studyAreas.length > 0 ? cvProfile.studyAreas.join(", ") : "non trovato"}</p>
                      <p>Titoli di studio: {cvProfile.educationLevels.length > 0 ? cvProfile.educationLevels.join(", ") : "non trovati"}</p>
                      <p>Anni stimati: {cvProfile.yearsOfExperience ?? "n.d."}</p>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-2">
                      <div className="rounded-[22px] border border-black/10 bg-white/70 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-black/45">Ruoli suggeriti selezionabili</p>
                        {suggestedRoles.length > 0 ? (
                          <>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {suggestedRoles.map((role) => (
                                <button
                                  key={role}
                                  type="button"
                                  onClick={() => toggleSuggestedRole(role)}
                                  className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                                    selectedSuggestedRoles.includes(role)
                                      ? "border-[#6366f1] bg-[#e0e7ff] text-[#4338ca]"
                                      : "border-[#dbe4ff] bg-white hover:bg-[#eef2ff]"
                                  }`}
                                >
                                  {titleCase(role)}
                                </button>
                              ))}
                            </div>
                            <p className="mt-3 text-sm leading-6 text-black/60">
                              {selectedSuggestedRoles.length > 0
                                ? `Selezionati per il prossimo rilancio backend: ${selectedSuggestedRoles.map(titleCase).join(", ")}`
                                : "Seleziona uno o piu ruoli: il backend li combinera con keyword, skill e segnali del CV."}
                            </p>
                          </>
                        ) : (
                          <p className="mt-3 text-sm leading-6 text-black/65">
                            Dopo la lettura del CV qui compaiono ruoli affini derivati da titoli, skill, esperienza e keyword.
                          </p>
                        )}
                      </div>

                      <div className="rounded-[22px] border border-black/10 bg-white/70 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-black/45">Keyword operative</p>
                        <p className="mt-3 text-sm leading-6 text-black/65">
                          Queste keyword vengono estratte dal profilo e usate dal backend come segnali operativi per cercare, filtrare e ordinare le posizioni.
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {cvKeywords.length > 0 ? (
                            cvKeywords.map((keyword, index) => (
                              <span
                                key={keyword}
                                className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${keywordToneClass(index)}`}
                              >
                                {keyword}
                              </span>
                            ))
                          ) : (
                            <EmptyPill text="Keyword testuali non ancora disponibili." />
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="rounded-[22px] border border-black/10 bg-white/70 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-black/45">Ruoli e famiglie</p>
                        <p className="mt-3 text-sm leading-6 text-black/70">
                          {formatList(
                            [...cvProfile.titles, ...suggestedRoles],
                            "I ruoli estratti compariranno qui dopo l'analisi",
                            6
                          )}
                        </p>
                      </div>

                      <div className="rounded-[22px] border border-black/10 bg-white/70 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-black/45">Skill e contesto</p>
                        <p className="mt-3 text-sm leading-6 text-black/70">
                          {`${formatList(cvProfile.skills, "Skill in attesa", 5)}. Esperienza: ${formatList(
                            cvProfile.experienceAreas,
                            "non classificata",
                            3
                          )}.`}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-[22px] border border-[#c7d2fe] bg-[#eef2ff] p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#4338ca]">Come viene usato</p>
                      <p className="mt-3 text-sm leading-6 text-black/75">
                        Ruoli suggeriti e keyword vengono inviati al backend insieme a titoli, skill, seniority stimata e aree di esperienza per evitare match troppo superficiali.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm leading-6 text-black/65">
                      Carica un CV PDF per popolare questa card con profilo estratto, keyword operative e ruoli suggeriti selezionabili da usare nel backend di ricerca.
                    </p>
                    <div className="grid gap-3 md:grid-cols-3">
                      <div className="rounded-[22px] border border-[#ddd6fe] bg-[#f8f7ff] p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-black/45">Profilo del CV</p>
                        <p className="mt-3 text-sm leading-6 text-black/65">
                          Qui vedrai sintesi, ruoli trovati, skill rilevate ed elementi di esperienza estratti dal CV.
                        </p>
                      </div>
                      <div className="rounded-[22px] border border-[#ddd6fe] bg-[#f8f7ff] p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-black/45">Ruoli suggeriti selezionabili</p>
                        <p className="mt-3 text-sm leading-6 text-black/65">
                          Dopo la lettura del CV qui compaiono ruoli affini derivati da titoli, skill, esperienza e keyword.
                        </p>
                      </div>
                      <div className="rounded-[22px] border border-[#ddd6fe] bg-[#f8f7ff] p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-black/45">Keyword operative</p>
                        <p className="mt-3 text-sm leading-6 text-black/65">
                          Dopo la lettura del CV qui vedrai keyword operative e segnali di contesto usati dal motore.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </Panel>

              <Panel title="Sintesi matching" subtitle="Contatori principali e stato del ranking">
                <div className="grid gap-3 sm:grid-cols-2">
                  <InfoCard label="Totale" value={total} hint="Risultati compatibili mostrati in lista." tone="warm" />
                  <InfoCard label="Privato" value={privateJobs.length} hint="Posizioni da aziende o board privati." />
                  <InfoCard label="Pubblico" value={publicJobs.length} hint="Concorsi e avvisi compatibili." tone="cool" />
                  <InfoCard label="PA da verificare" value={publicPotentialJobs.length} hint="Requisiti non ancora pienamente certi." />
                </div>
              </Panel>
            </div>

            <div className="grid gap-6 xl:grid-cols-[0.75fr_1.25fr]">
              <Panel title="Fonti consultate" subtitle="Elenco sintetico delle sorgenti davvero interrogate">
                <div className="max-h-[340px] overflow-y-auto pr-2">
                  <div className="flex flex-wrap gap-2">
                    {consultedSources.length > 0 ? (
                      consultedSources.map((source) => (
                        <span key={source} className="rounded-full border border-[#ddd6fe] bg-[#f5f3ff] px-3 py-1 text-xs text-[#4c1d95]">
                          {source}
                        </span>
                      ))
                    ) : (
                      <EmptyPill text="Nessuna fonte disponibile per i filtri correnti." />
                    )}
                  </div>
                </div>
              </Panel>

              <Panel dark title="Fonti e osservabilita" subtitle="Risposta delle sorgenti e segnali di retrieval">
                <div className="max-h-[340px] overflow-y-auto pr-2">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-[22px] border border-white/10 bg-white/8 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-white/50">Fonti ok</p>
                      <p className="mt-3 text-3xl font-bold">{sourceSummary.successful}</p>
                    </div>
                    <div className="rounded-[22px] border border-white/10 bg-white/8 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-white/50">Fonti KO</p>
                      <p className="mt-3 text-3xl font-bold">{sourceSummary.failed}</p>
                    </div>
                    <div className="rounded-[22px] border border-white/10 bg-white/8 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-white/50">Latenza media</p>
                      <p className="mt-3 text-3xl font-bold">{formatDuration(sourceSummary.avgDuration)}</p>
                    </div>
                  </div>

                  <div className="mt-5 space-y-3">
                    {sourceFetchMetrics.length > 0 ? (
                      sourceFetchMetrics.map((metric) => (
                        <div key={metric.sourceId} className="rounded-[22px] border border-white/10 bg-white/5 p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-sm font-semibold text-white">{metric.sourceLabel}</p>
                              <p className="mt-1 text-xs text-white/55">
                                {metric.success ? "Fetch completato" : "Fetch fallito"} - {formatDuration(metric.durationMs)}
                              </p>
                            </div>
                            <span
                              className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${
                                metric.success ? "bg-[#e0e7ff] text-[#4338ca]" : "bg-[#f3e8ff] text-[#6d28d9]"
                              }`}
                            >
                              {metric.success ? "ok" : "errore"}
                            </span>
                          </div>

                          <div className="mt-3 grid gap-2 text-xs text-white/70 sm:grid-cols-3">
                            <p>Raccolti: {metric.fetchedJobs}</p>
                            <p>Validi: {metric.validJobs}</p>
                            <p>Dedupe key: {metric.dedupedJobs}</p>
                          </div>

                          {metric.query ? (
                            <p className="mt-3 text-xs text-white/55">
                              Query: {[...metric.query.roleKeywords, ...metric.query.skillKeywords].slice(0, 4).join(", ") || "nessuna query lato sorgente"}
                            </p>
                          ) : null}

                          {!metric.success && metric.error ? <p className="mt-3 text-xs text-[#ddd6fe]">{metric.error}</p> : null}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-white/70">Le metriche per fonte compariranno dopo la prima ricerca utile.</p>
                    )}
                  </div>
                </div>
              </Panel>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-8" aria-live="polite">
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
            {featuredJobs.length > 0 ? (
              <section className="space-y-4">
                <div className="rounded-[28px] border border-[#312e81]/20 bg-[linear-gradient(135deg,#312e81,#4f46e5)] p-5 text-white shadow-card">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55">Top match</p>
                  <h2 className="mt-2 font-[var(--font-display)] text-3xl font-bold">Le prime posizioni da aprire adesso</h2>
                  <p className="mt-2 text-sm text-white/70">
                    Questa sezione evidenzia i risultati piu alti nel ranking corrente.
                  </p>
                </div>
                <div className="grid gap-4 xl:grid-cols-3">{featuredJobs.map((job) => renderJobCard(job, true))}</div>
              </section>
            ) : null}
            {renderJobSection("Posizioni Pubbliche", "Sezione PA", publicJobs, "bg-[#eef2ff]")}
            {renderJobSection(
              "PA Potenzialmente Compatibili",
              "Verifica titoli di studio e requisiti specifici",
              publicPotentialJobs,
              "bg-[#f5f3ff]"
            )}
            {renderJobSection("Posizioni Private", "Sezione aziende", privateJobs, "bg-[#f8f7ff]")}
          </>
        ) : (
          <div className="col-span-full rounded-[28px] border border-dashed border-black/20 bg-white/65 p-8 text-center">
            <p className="text-xl font-semibold">Nessun annuncio attivo con questi filtri.</p>
            <p className="mt-2 text-sm text-black/65">
              Prova a cambiare perimetro geografico o carica il CV per ampliare il matching su titoli, skill ed esperienza.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
