"use client";

import { FormEvent, ReactNode, startTransition, useCallback, useEffect, useMemo, useState } from "react";
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
    "bg-[#eef5f1] text-[#155b4a] border-[#cfe2d9]",
    "bg-[#f7ede5] text-[#8c4b1f] border-[#e7cfbb]",
    "bg-white text-black/75 border-black/10"
  ];

  return tones[index % tones.length];
}

function sectorBadgeClass(sector: SectorType) {
  return sector === "pubblico"
    ? "bg-[#d6efe7] text-[#155b4a]"
    : "bg-[#f4dfce] text-[#8c4b1f]";
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
          ? "border-[#155b4a] bg-[#d6efe7] text-[#155b4a] shadow-card"
          : done
            ? "border-[#d7c1ae] bg-[#f7ede5] text-[#8c4b1f]"
            : "border-black/10 bg-white/70 text-black/60"
      }`}
    >
      <div className="flex items-center gap-3">
        <span
          className={`inline-flex h-9 w-9 items-center justify-center rounded-full border text-xs font-semibold uppercase tracking-[0.18em] ${
            active
              ? "border-[#155b4a]/30 bg-white/60 text-[#155b4a]"
              : done
                ? "border-[#8c4b1f]/20 bg-white/60 text-[#8c4b1f]"
                : "border-black/10 bg-white/80 text-black/45"
          }`}
        >
          {step}
        </span>
        <div className="space-y-1">
          <p className="font-semibold">{title}</p>
          <p className={`text-sm leading-6 ${active ? "text-[#155b4a]/80" : done ? "text-[#8c4b1f]/80" : "text-black/50"}`}>
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
        dark ? "border-black/5 bg-[#17312b] text-white shadow-card" : "border-black/10 bg-white/78 shadow-card"
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
      ? "bg-[#f7ede5]"
      : tone === "cool"
        ? "bg-[#e7f4ef]"
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
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    let active = true;

    async function loadInitialJobs() {
      try {
        const payload = await requestJobs(false, []);

        if (!active) {
          return;
        }

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
      } catch {
        if (!active) {
          return;
        }

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
      }
    }

    void loadInitialJobs();

    return () => {
      active = false;
    };
  }, [requestJobs]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAnalysisReady(false);
    setSelectedSuggestedRoles([]);

    try {
      const payload = await requestJobs(true, []);
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
      setSelectedSuggestedRoles([]);
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

  async function handleTargetedSearch() {
    const roleTargets = [...new Set([...(cvProfile?.titles ?? []), ...selectedSuggestedRoles])];

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
      return;
    }
  }

  function renderJobCard(job: Job, featured = false) {
    return (
      <article
        key={job.id}
        className={`flex min-h-0 h-[440px] flex-col overflow-hidden rounded-[28px] border border-black/10 bg-white/82 p-6 shadow-card transition-transform duration-200 hover:-translate-y-1 ${
          featured ? "ring-1 ring-[#d7c1ae] xl:h-[460px]" : ""
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
              <span className="block rounded-full bg-[#17312b] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-white">
                Score {job.relevanceScore}
              </span>
            ) : null}
            <span className="block rounded-full bg-[#f3ebe3] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-black/70">
              Pubblicato {formatDate(job.postedAt)}
            </span>
            <span className="block rounded-full bg-[#ece7df] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-black/60">
              {job.expiresAt ? `Scade ${formatDate(job.expiresAt)}` : "Scadenza non indicata"}
            </span>
          </div>
        </div>

        <div className="mt-5 min-h-0 flex-1 overflow-hidden">
          <div className="h-full min-h-0 space-y-4 overflow-y-auto pr-2">
            <p className="text-sm leading-6 text-black/70">{job.summary}</p>

            {job.matchReasons && job.matchReasons.length > 0 ? (
              <div className="rounded-[22px] bg-[#eef5f1] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#155b4a]">Perche lo vedi</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {job.matchReasons.slice(0, 4).map((reason) => (
                    <span
                      key={reason}
                      className="rounded-full border border-[#c6e3d8] bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#155b4a]"
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
              <div className="rounded-2xl bg-[#f7ede5] p-3 text-xs text-black/65">
                <p className="font-semibold uppercase tracking-[0.12em] text-black/45">Requisiti analizzati</p>
                <p className="mt-2 leading-5">{job.requirementHighlights[0]}</p>
              </div>
            ) : null}

            {job.sector === "privato" && job.privateFitStatus === "partial" ? (
              <div className="rounded-2xl bg-[#fff5ec] p-3 text-xs text-[#8c4b1f]">
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
              className="rounded-full bg-[#17312b] px-4 py-2 font-semibold text-white"
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
      <div className="relative overflow-hidden rounded-[36px] border border-black/10 bg-[rgba(255,250,245,0.82)] p-6 shadow-card md:p-8">
        <div className="hero-grid absolute inset-0 opacity-70" />
        <div className="relative space-y-8">
          <div className="space-y-5">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)] lg:items-center">
              <StepCard
                step="01"
                title="Carica CV"
                description="Importa il profilo da analizzare e prepara il contesto di ricerca."
                active={currentStep === 1}
                done={currentStep > 1}
              />
              <div className="hidden text-center text-xl text-black/20 lg:block">→</div>
              <StepCard
                step="02"
                title="Leggi il profilo"
                description="Estrarre skill, ruoli e segnali utili per capire il match."
                active={currentStep === 2}
                done={currentStep > 2}
              />
              <div className="hidden text-center text-xl text-black/20 lg:block">→</div>
              <StepCard
                step="03"
                title="Affina la ricerca"
                description="Mostrare opportunita mirate e verificabili per Torino."
                active={currentStep === 3}
                done={false}
              />
            </div>

            <div className="space-y-4">
              <h1 className="max-w-4xl font-[var(--font-display)] text-4xl font-bold leading-tight md:text-6xl">
                Job Scraper Torino
              </h1>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label className="rounded-[24px] border border-black/10 bg-white/80 p-4 xl:col-span-2">
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

            <div className="rounded-[24px] border border-black/10 bg-white/80 p-4 xl:col-span-2">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-black/55">
                Location bloccata
              </span>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-base font-semibold">{SEARCH_LOCATION}</p>
                  <p className="text-sm text-black/55">Perimetro geografico ristretto e coerente.</p>
                </div>
                <span className="rounded-full bg-[#eef5f1] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#155b4a]">
                  Torino only
                </span>
              </div>
            </div>

            <label className="rounded-[24px] border border-black/10 bg-white/80 p-4 xl:col-span-2">
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

            <label className="rounded-[24px] border border-black/10 bg-white/80 p-4 xl:col-span-2">
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
                className="w-full text-sm text-black/70 file:mr-4 file:rounded-full file:border-0 file:bg-[#17312b] file:px-4 file:py-2 file:font-semibold file:text-white"
              />
              <p className="mt-3 text-sm text-black/60">
                Il CV viene analizzato nella sessione corrente appena lo carichi e va ricaricato a ogni nuova analisi.
              </p>
            </label>

            <div className="rounded-[24px] border border-black/10 bg-[#17312b] p-4 text-white xl:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55">Stato workflow</p>
              <p className="mt-3 text-2xl font-semibold">
                {loading
                  ? "Sto aggiornando il matching."
                  : analysisReady
                    ? "CV analizzato e ricerca affinata."
                    : cvFile
                      ? "CV caricato, analisi in preparazione."
                      : "Carica un CV per attivare il matching guidato."}
              </p>
              <p className="mt-2 text-sm text-white/70">
                {analysisReady
                  ? "Puoi selezionare i ruoli suggeriti e rilanciare la ricerca con un target piu stretto."
                  : cvFile
                    ? "Sto leggendo il CV per estrarre profilo, keyword operative e ruoli affini."
                    : "La ricerca iniziale funziona anche senza CV, ma l'analisi del profilo migliora il ranking."}
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !cvFile}
              className="rounded-[24px] bg-[#b4622a] px-6 py-4 text-base font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 xl:col-span-1"
            >
              {loading ? "Analizzo..." : "Rianalizza CV"}
            </button>

            <button
              type="button"
              onClick={() => void handleTargetedSearch()}
              disabled={!analysisReady || loading || !cvProfile}
              className="rounded-[24px] border border-black/10 bg-white/80 px-6 py-4 text-base font-semibold text-black transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-50 xl:col-span-1"
            >
              {loading ? "Attendi..." : "Applica ruoli suggeriti"}
            </button>
          </form>

          {errorMessage ? (
            <div className="rounded-[24px] border border-[#e7b89a] bg-[#fff3ea] px-5 py-4 text-sm text-[#8c4b1f]" role="alert">
              <p className="font-semibold uppercase tracking-[0.14em]">Errore ricerca</p>
              <p className="mt-2">{errorMessage}</p>
            </div>
          ) : null}

          <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <div className="space-y-6">
              <Panel title="Sintesi matching" subtitle="Contatori principali e stato del ranking">
                <div className="grid gap-3 sm:grid-cols-2">
                  <InfoCard label="Totale" value={total} hint="Risultati compatibili mostrati in lista." tone="warm" />
                  <InfoCard label="Privato" value={privateJobs.length} hint="Posizioni da aziende o board privati." />
                  <InfoCard label="Pubblico" value={publicJobs.length} hint="Concorsi e avvisi compatibili." tone="cool" />
                  <InfoCard label="PA da verificare" value={publicPotentialJobs.length} hint="Requisiti non ancora pienamente certi." />
                </div>
              </Panel>

              <Panel title="Profilo CV estratto" subtitle="Titoli, skill, esperienza e studio normalizzati">
                {cvProfile ? (
                  <div className="space-y-5 text-sm text-black/75">
                    <div className="rounded-[22px] border border-[#d7c1ae] bg-[#f7ede5] p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8c4b1f]">Sintesi profilo</p>
                      <p className="mt-3 text-sm leading-6 text-black/75">{profileSummary}</p>
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-black/45">Ruoli trovati</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {cvProfile.titles.length > 0 ? (
                          cvProfile.titles.map((title) => (
                            <span key={title} className="rounded-full border border-black/10 bg-[#eef5f1] px-3 py-1 text-xs">
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

                    <div className="grid gap-3 md:grid-cols-2">
                      <p>Esperienza: {cvProfile.experienceAreas.length > 0 ? cvProfile.experienceAreas.join(", ") : "non trovata"}</p>
                      <p>Studio: {cvProfile.studyAreas.length > 0 ? cvProfile.studyAreas.join(", ") : "non trovato"}</p>
                      <p>Titoli di studio: {cvProfile.educationLevels.length > 0 ? cvProfile.educationLevels.join(", ") : "non trovati"}</p>
                      <p>Anni stimati: {cvProfile.yearsOfExperience ?? "n.d."}</p>
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-black/45">Keyword CV</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {cvKeywords.length > 0 ? (
                          cvKeywords.slice(0, 10).map((keyword) => (
                            <span key={keyword} className="rounded-full border border-black/10 bg-white px-3 py-1 text-xs">
                              {titleCase(keyword)}
                            </span>
                          ))
                        ) : (
                          <EmptyPill text="Keyword non ancora disponibili." />
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm leading-6 text-black/65">
                    Carica un CV PDF per generare un sommario ragionato del profilo lavorativo, con ruolo prevalente,
                    competenze chiave, esperienza e contesto formativo.
                  </p>
                )}
              </Panel>

              <Panel title="Ruoli suggeriti" subtitle="Target simili al profilo estratto che puoi rilanciare">
                {suggestedRoles.length > 0 ? (
                  <>
                    <div className="flex flex-wrap gap-2">
                      {suggestedRoles.map((role) => (
                        <button
                          key={role}
                          type="button"
                          onClick={() => toggleSuggestedRole(role)}
                          className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                            selectedSuggestedRoles.includes(role)
                              ? "border-[#155b4a] bg-[#d6efe7] text-[#155b4a]"
                              : "border-black/10 bg-white hover:bg-[#f3ebe3]"
                          }`}
                        >
                          {titleCase(role)}
                        </button>
                      ))}
                    </div>
                    <p className="mt-3 text-sm text-black/60">
                      {selectedSuggestedRoles.length > 0
                        ? `Selezionati per il prossimo rilancio: ${selectedSuggestedRoles.map(titleCase).join(", ")}`
                        : "Seleziona uno o piu ruoli per restringere la ricerca reale."}
                    </p>
                  </>
                ) : (
                  <p className="text-sm leading-6 text-black/65">
                    Dopo la lettura del CV qui compaiono ruoli affini derivati da titoli, skill, esperienza e keyword
                    estratte, da usare per affinare la ricerca.
                  </p>
                )}
              </Panel>

              <Panel title="Keyword CV" subtitle="Segnali lessicali piu frequenti estratti dal profilo">
                <div className="space-y-4">
                  <p className="text-sm leading-6 text-black/65">
                    Queste keyword vengono estratte dall&apos;agent e usate come segnali operativi per cercare e ordinare posizioni
                    pubbliche e private, insieme al contesto completo del CV.
                  </p>

                  {cvKeywords.length > 0 || cvProfile ? (
                    <>
                      <div className="flex flex-wrap gap-2">
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

                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="rounded-[22px] border border-black/10 bg-white/70 p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-black/45">Ruoli e famiglie</p>
                          <p className="mt-3 text-sm leading-6 text-black/70">
                            {cvProfile
                              ? formatList(
                                  [...cvProfile.titles, ...suggestedRoles],
                                  "I ruoli estratti compariranno qui dopo l'analisi",
                                  6
                                )
                              : "I ruoli estratti compariranno qui dopo l'analisi."}
                          </p>
                        </div>

                        <div className="rounded-[22px] border border-black/10 bg-white/70 p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-black/45">Skill e contesto</p>
                          <p className="mt-3 text-sm leading-6 text-black/70">
                            {cvProfile
                              ? `${formatList(cvProfile.skills, "Skill in attesa", 5)}. Esperienza: ${formatList(
                                  cvProfile.experienceAreas,
                                  "non classificata",
                                  3
                                )}.`
                              : "Skill ed esperienza del CV saranno usate per raffinare il matching oltre alle keyword."}
                          </p>
                        </div>
                      </div>

                      <div className="rounded-[22px] border border-[#d6e6de] bg-[#eef5f1] p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#155b4a]">Come viene usato</p>
                        <p className="mt-3 text-sm leading-6 text-black/75">
                          Le keyword aiutano soprattutto su bandi e avvisi pubblici, mentre per il privato vengono combinate con
                          titoli, skill, seniority stimata e aree di esperienza per evitare match troppo superficiali.
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="rounded-[22px] border border-black/10 bg-[#fbf7f3] p-4">
                      <p className="text-sm leading-6 text-black/65">
                        Dopo la lettura del CV qui vedrai keyword operative, ruoli affini e segnali di contesto usati dal
                        motore per cercare offerte pubbliche e private con un matching piu preciso.
                      </p>
                    </div>
                  )}
                </div>
              </Panel>

              <Panel title="Fonti consultate" subtitle="Elenco sintetico delle sorgenti davvero interrogate">
                <div className="flex flex-wrap gap-2">
                  {consultedSources.length > 0 ? (
                    consultedSources.map((source) => (
                      <span key={source} className="rounded-full border border-black/10 bg-[#f7ede5] px-3 py-1 text-xs">
                        {source}
                      </span>
                    ))
                  ) : (
                    <EmptyPill text="Nessuna fonte disponibile per i filtri correnti." />
                  )}
                </div>
              </Panel>
            </div>

            <div className="space-y-6">
              <Panel dark title="Fonti e osservabilita" subtitle="Risposta delle sorgenti e segnali di retrieval">
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
                              metric.success ? "bg-[#d6efe7] text-[#155b4a]" : "bg-[#f4dfce] text-[#8c4b1f]"
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

                        {!metric.success && metric.error ? <p className="mt-3 text-xs text-[#ffd4b5]">{metric.error}</p> : null}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-white/70">Le metriche per fonte compariranno dopo la prima ricerca utile.</p>
                  )}
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
                <div className="rounded-[28px] border border-black/10 bg-[#17312b] p-5 text-white shadow-card">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55">Top match</p>
                  <h2 className="mt-2 font-[var(--font-display)] text-3xl font-bold">Le prime posizioni da aprire adesso</h2>
                  <p className="mt-2 text-sm text-white/70">
                    Questa sezione evidenzia i risultati piu alti nel ranking corrente.
                  </p>
                </div>
                <div className="grid gap-4 xl:grid-cols-3">{featuredJobs.map((job) => renderJobCard(job, true))}</div>
              </section>
            ) : null}
            {renderJobSection("Posizioni Pubbliche", "Sezione PA", publicJobs, "bg-[#eef5f1]")}
            {renderJobSection(
              "PA Potenzialmente Compatibili",
              "Verifica titoli di studio e requisiti specifici",
              publicPotentialJobs,
              "bg-[#f7ede5]"
            )}
            {renderJobSection("Posizioni Private", "Sezione aziende", privateJobs, "bg-[#fff6ef]")}
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
