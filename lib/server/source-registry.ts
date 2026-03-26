import { sourceCatalog } from "@/lib/source-catalog";
import { shouldIncludePrivateSource } from "@/lib/server/agents/private-source-agent";
import { shouldIncludePublicSource } from "@/lib/server/agents/public-source-agent";
import { scrapeCittaMetropolitanaTorinoJobs } from "@/lib/server/scrapers/citta-metropolitana-torino";
import { scrapeCameraCommercioTorinoJobs } from "@/lib/server/scrapers/camera-commercio-torino";
import { scrapeComuneTorinoJobs } from "@/lib/server/scrapers/comune-torino";
import { scrapeCsiPiemonteJobs } from "@/lib/server/scrapers/csi-piemonte";
import { scrapeInpaJobs } from "@/lib/server/scrapers/inpa";
import { scrapeRegionePiemonteJobs } from "@/lib/server/scrapers/regione-piemonte";
import { scrapeGreenhouseJobs, scrapeLeverJobs, scrapeSmartRecruitersJobs } from "@/lib/server/scrapers/private-ats";
import { scrapeTorinoPrivateCareerPages } from "@/lib/server/scrapers/torino-private-careers";
import { CvProfile, Job, JobFilters, SourceCapabilities, SourceDomain, SourceGovernance, SourceQuery } from "@/lib/types";

type SourceFetcher = (query: SourceQuery, filters: JobFilters) => Promise<Job[]>;

export type SourceRegistryEntry = {
  id: string;
  label: string;
  sector: "pubblico" | "privato";
  governance: SourceGovernance;
  domain: SourceDomain;
  enabled: boolean;
  adapterId: string;
  capabilities: SourceCapabilities;
  fetcher: SourceFetcher | null;
  isEligibleForFilters: (filters: JobFilters) => boolean;
  buildSourceQuery: (filters: JobFilters, cvProfile?: CvProfile | null) => SourceQuery | null;
};

export type EligibleSourceRegistryEntry = SourceRegistryEntry & {
  query: SourceQuery;
};

const sourceCapabilitiesById: Record<string, SourceCapabilities> = {
  inpa: {
    originType: "official",
    retrievalMode: "public-api",
    authMode: "none",
    coverage: "italy",
    qualityTier: "high",
    supportsKeywordSearch: true,
    supportsLocationSearch: true,
    supportsPagination: true,
    supportsDetailEnrichment: true,
    supportsIncrementalSync: false,
    supportsStructuredSalary: true,
    defaultPriority: 100,
    dedupeStrategy: "external-id"
  },
  "comune-torino": {
    originType: "official",
    retrievalMode: "listing-page",
    authMode: "none",
    coverage: "torino-city",
    qualityTier: "high",
    supportsKeywordSearch: false,
    supportsLocationSearch: false,
    supportsPagination: false,
    supportsDetailEnrichment: true,
    supportsIncrementalSync: false,
    defaultPriority: 92,
    dedupeStrategy: "url"
  },
  "citta-metropolitana-torino": {
    originType: "official",
    retrievalMode: "listing-page",
    authMode: "none",
    coverage: "torino-metro",
    qualityTier: "high",
    supportsKeywordSearch: false,
    supportsLocationSearch: false,
    supportsPagination: false,
    supportsDetailEnrichment: true,
    supportsIncrementalSync: false,
    defaultPriority: 90,
    dedupeStrategy: "url"
  },
  "camera-commercio-torino": {
    originType: "official",
    retrievalMode: "listing-page",
    authMode: "none",
    coverage: "torino-city",
    qualityTier: "high",
    supportsKeywordSearch: false,
    supportsLocationSearch: false,
    supportsPagination: false,
    supportsDetailEnrichment: true,
    supportsIncrementalSync: false,
    defaultPriority: 88,
    dedupeStrategy: "url"
  },
  "regione-piemonte": {
    originType: "official",
    retrievalMode: "listing-page",
    authMode: "none",
    coverage: "piemonte",
    qualityTier: "high",
    supportsKeywordSearch: false,
    supportsLocationSearch: false,
    supportsPagination: false,
    supportsDetailEnrichment: true,
    supportsIncrementalSync: false,
    defaultPriority: 86,
    dedupeStrategy: "url"
  },
  "csi-piemonte": {
    originType: "official",
    retrievalMode: "listing-page",
    authMode: "none",
    coverage: "piemonte",
    qualityTier: "high",
    supportsKeywordSearch: false,
    supportsLocationSearch: false,
    supportsPagination: false,
    supportsDetailEnrichment: true,
    supportsIncrementalSync: false,
    defaultPriority: 84,
    dedupeStrategy: "title-company-location"
  },
  "greenhouse-private-boards": {
    originType: "ats",
    retrievalMode: "public-api",
    authMode: "none",
    coverage: "italy",
    qualityTier: "high",
    supportsKeywordSearch: false,
    supportsLocationSearch: false,
    supportsPagination: false,
    supportsDetailEnrichment: true,
    supportsIncrementalSync: false,
    defaultPriority: 95,
    dedupeStrategy: "external-id"
  },
  "lever-private-boards": {
    originType: "ats",
    retrievalMode: "public-api",
    authMode: "none",
    coverage: "italy",
    qualityTier: "high",
    supportsKeywordSearch: false,
    supportsLocationSearch: false,
    supportsPagination: false,
    supportsDetailEnrichment: true,
    supportsIncrementalSync: false,
    defaultPriority: 94,
    dedupeStrategy: "external-id"
  },
  "smartrecruiters-private-boards": {
    originType: "ats",
    retrievalMode: "public-api",
    authMode: "none",
    coverage: "italy",
    qualityTier: "high",
    supportsKeywordSearch: false,
    supportsLocationSearch: false,
    supportsPagination: true,
    supportsDetailEnrichment: true,
    supportsIncrementalSync: false,
    defaultPriority: 93,
    dedupeStrategy: "external-id"
  },
  "torino-private-careers": {
    originType: "experimental",
    retrievalMode: "listing-page",
    authMode: "none",
    coverage: "torino-metro",
    qualityTier: "medium",
    supportsKeywordSearch: true,
    supportsLocationSearch: false,
    supportsPagination: false,
    supportsDetailEnrichment: true,
    supportsIncrementalSync: false,
    defaultPriority: 91,
    dedupeStrategy: "hybrid"
  },
  "torino-eu-network": {
    originType: "seed",
    retrievalMode: "seed",
    authMode: "none",
    coverage: "torino-metro",
    qualityTier: "medium",
    supportsKeywordSearch: true,
    supportsLocationSearch: false,
    supportsPagination: false,
    supportsDetailEnrichment: false,
    supportsIncrementalSync: false,
    defaultPriority: 65,
    dedupeStrategy: "hybrid"
  },
  "torino-un-network": {
    originType: "seed",
    retrievalMode: "seed",
    authMode: "none",
    coverage: "torino-city",
    qualityTier: "medium",
    supportsKeywordSearch: true,
    supportsLocationSearch: false,
    supportsPagination: false,
    supportsDetailEnrichment: false,
    supportsIncrementalSync: false,
    defaultPriority: 66,
    dedupeStrategy: "hybrid"
  },
  "torino-foundations-network": {
    originType: "seed",
    retrievalMode: "seed",
    authMode: "none",
    coverage: "torino-metro",
    qualityTier: "medium",
    supportsKeywordSearch: true,
    supportsLocationSearch: false,
    supportsPagination: false,
    supportsDetailEnrichment: false,
    supportsIncrementalSync: false,
    defaultPriority: 62,
    dedupeStrategy: "hybrid"
  },
  "torino-third-sector-network": {
    originType: "seed",
    retrievalMode: "seed",
    authMode: "none",
    coverage: "torino-metro",
    qualityTier: "medium",
    supportsKeywordSearch: true,
    supportsLocationSearch: false,
    supportsPagination: false,
    supportsDetailEnrichment: false,
    supportsIncrementalSync: false,
    defaultPriority: 61,
    dedupeStrategy: "hybrid"
  },
  "torino-neighborhood-houses-network": {
    originType: "seed",
    retrievalMode: "seed",
    authMode: "none",
    coverage: "torino-city",
    qualityTier: "medium",
    supportsKeywordSearch: true,
    supportsLocationSearch: false,
    supportsPagination: false,
    supportsDetailEnrichment: false,
    supportsIncrementalSync: false,
    defaultPriority: 62,
    dedupeStrategy: "hybrid"
  },
  "torino-museums-network": {
    originType: "seed",
    retrievalMode: "seed",
    authMode: "none",
    coverage: "torino-city",
    qualityTier: "medium",
    supportsKeywordSearch: true,
    supportsLocationSearch: false,
    supportsPagination: false,
    supportsDetailEnrichment: false,
    supportsIncrementalSync: false,
    defaultPriority: 62,
    dedupeStrategy: "hybrid"
  },
  "torino-education-associations-network": {
    originType: "seed",
    retrievalMode: "seed",
    authMode: "none",
    coverage: "torino-metro",
    qualityTier: "medium",
    supportsKeywordSearch: true,
    supportsLocationSearch: false,
    supportsPagination: false,
    supportsDetailEnrichment: false,
    supportsIncrementalSync: false,
    defaultPriority: 62,
    dedupeStrategy: "hybrid"
  },
  "torino-education-network": {
    originType: "seed",
    retrievalMode: "seed",
    authMode: "none",
    coverage: "torino-metro",
    qualityTier: "medium",
    supportsKeywordSearch: true,
    supportsLocationSearch: false,
    supportsPagination: false,
    supportsDetailEnrichment: false,
    supportsIncrementalSync: false,
    defaultPriority: 63,
    dedupeStrategy: "hybrid"
  },
  "torino-ngo-network": {
    originType: "seed",
    retrievalMode: "seed",
    authMode: "none",
    coverage: "torino-metro",
    qualityTier: "medium",
    supportsKeywordSearch: true,
    supportsLocationSearch: false,
    supportsPagination: false,
    supportsDetailEnrichment: false,
    supportsIncrementalSync: false,
    defaultPriority: 60,
    dedupeStrategy: "hybrid"
  },
  "torino-incubators-network": {
    originType: "seed",
    retrievalMode: "seed",
    authMode: "none",
    coverage: "torino-metro",
    qualityTier: "medium",
    supportsKeywordSearch: true,
    supportsLocationSearch: false,
    supportsPagination: false,
    supportsDetailEnrichment: false,
    supportsIncrementalSync: false,
    defaultPriority: 63,
    dedupeStrategy: "hybrid"
  },
  "torino-finance-network": {
    originType: "seed",
    retrievalMode: "seed",
    authMode: "none",
    coverage: "torino-metro",
    qualityTier: "medium",
    supportsKeywordSearch: true,
    supportsLocationSearch: false,
    supportsPagination: false,
    supportsDetailEnrichment: false,
    supportsIncrementalSync: false,
    defaultPriority: 64,
    dedupeStrategy: "hybrid"
  },
  "torino-fintech-network": {
    originType: "seed",
    retrievalMode: "seed",
    authMode: "none",
    coverage: "torino-metro",
    qualityTier: "medium",
    supportsKeywordSearch: true,
    supportsLocationSearch: false,
    supportsPagination: false,
    supportsDetailEnrichment: false,
    supportsIncrementalSync: false,
    defaultPriority: 64,
    dedupeStrategy: "hybrid"
  },
  "torino-insurance-network": {
    originType: "seed",
    retrievalMode: "seed",
    authMode: "none",
    coverage: "torino-metro",
    qualityTier: "medium",
    supportsKeywordSearch: true,
    supportsLocationSearch: false,
    supportsPagination: false,
    supportsDetailEnrichment: false,
    supportsIncrementalSync: false,
    defaultPriority: 64,
    dedupeStrategy: "hybrid"
  },
  "torino-ict-network": {
    originType: "seed",
    retrievalMode: "seed",
    authMode: "none",
    coverage: "torino-metro",
    qualityTier: "medium",
    supportsKeywordSearch: true,
    supportsLocationSearch: false,
    supportsPagination: false,
    supportsDetailEnrichment: false,
    supportsIncrementalSync: false,
    defaultPriority: 66,
    dedupeStrategy: "hybrid"
  },
  "torino-biotech-network": {
    originType: "seed",
    retrievalMode: "seed",
    authMode: "none",
    coverage: "torino-metro",
    qualityTier: "medium",
    supportsKeywordSearch: true,
    supportsLocationSearch: false,
    supportsPagination: false,
    supportsDetailEnrichment: false,
    supportsIncrementalSync: false,
    defaultPriority: 63,
    dedupeStrategy: "hybrid"
  },
  "torino-automotive-network": {
    originType: "seed",
    retrievalMode: "seed",
    authMode: "none",
    coverage: "torino-metro",
    qualityTier: "medium",
    supportsKeywordSearch: true,
    supportsLocationSearch: false,
    supportsPagination: false,
    supportsDetailEnrichment: false,
    supportsIncrementalSync: false,
    defaultPriority: 65,
    dedupeStrategy: "hybrid"
  },
  "torino-aerospace-network": {
    originType: "seed",
    retrievalMode: "seed",
    authMode: "none",
    coverage: "torino-metro",
    qualityTier: "medium",
    supportsKeywordSearch: true,
    supportsLocationSearch: false,
    supportsPagination: false,
    supportsDetailEnrichment: false,
    supportsIncrementalSync: false,
    defaultPriority: 65,
    dedupeStrategy: "hybrid"
  },
  "company-careers-seed": {
    originType: "seed",
    retrievalMode: "seed",
    authMode: "none",
    coverage: "italy",
    qualityTier: "medium",
    supportsKeywordSearch: false,
    supportsLocationSearch: false,
    supportsPagination: false,
    supportsDetailEnrichment: false,
    supportsIncrementalSync: false,
    defaultPriority: 20,
    dedupeStrategy: "hybrid"
  }
};

function normalize(input: string) {
  return input.trim().toLowerCase();
}

function uniqueTerms(values: string[]) {
  return [...new Set(values.map(normalize).filter(Boolean))];
}

const studyAreaQueryTerms: Record<string, string[]> = {
  "data science": ["data science", "analytics", "business intelligence", "data analyst", "data engineer"],
  "business administration": ["business administration", "management", "economia", "business analyst", "project manager"],
  "foreign languages": ["foreign languages", "lingue", "international", "english"],
  software: ["software", "developer", "engineer", "backend", "frontend"],
  research: ["research", "ricerca", "scientifica"]
};

const educationLevelQueryTerms: Record<string, string[]> = {
  master: ["master", "laurea magistrale", "magistrale"],
  mba: ["mba", "business administration", "management"],
  bachelor: ["bachelor", "laurea", "triennale"]
};

function expandStudyAreaQueryTerms(studyAreas: string[]) {
  return uniqueTerms(
    studyAreas.flatMap((area) => [area, ...(studyAreaQueryTerms[normalize(area)] ?? [])])
  );
}

function expandEducationQueryTerms(levels: string[]) {
  return uniqueTerms(
    levels.flatMap((level) => [level, ...(educationLevelQueryTerms[normalize(level)] ?? [])])
  );
}

function buildTorinoContextTerms(filters: JobFilters) {
  const location = normalize(filters.location ?? "");
  const scope = filters.locationScope ?? "metro";
  const context = ["torino", "piemonte"];

  if (!location || location.includes("torino") || location.includes("piemonte")) {
    context.push("citta metropolitana di torino");
  }

  if (scope === "city") {
    context.push("torino citta");
  }

  return uniqueTerms(context);
}

const sourceDomainSemanticTerms: Record<string, string[]> = {
  "public-admin": ["ente pubblico", "concorso", "avviso", "selezione", "amministrazione pubblica"],
  "international-public": ["unione europea", "nazioni unite", "policy", "grant", "international affairs", "public policy"],
  foundation: ["fondazione", "grant", "programmi", "social impact", "filantropia", "progettazione"],
  "third-sector": ["terzo settore", "associazione", "cooperativa", "welfare", "community", "inclusione"],
  "neighborhood-houses": ["case del quartiere", "community hub", "spazi civici", "quartiere", "cultura", "partecipazione", "animazione territoriale"],
  museum: ["museo", "mostra", "curation", "public program", "didattica museale", "heritage", "patrimonio culturale"],
  "education-association": ["educatori", "pedagogia", "doposcuola", "formazione civica", "facilitazione", "progettazione educativa"],
  education: ["istruzione", "scuola", "academy", "formazione", "teaching", "docenza", "universita", "its"],
  ngo: ["ong", "cooperazione internazionale", "human rights", "sviluppo", "advocacy", "progetti europei"],
  incubator: ["startup", "innovation", "accelerator", "incubator", "venture", "entrepreneurship"],
  finance: ["banking", "finance", "risk", "audit", "compliance", "operations", "insurance"],
  fintech: ["fintech", "payments", "open banking", "digital banking", "fraud", "wallet", "embedded finance"],
  insurance: ["insurance", "assicurazioni", "claims", "underwriting", "broker", "risk", "insurtech"],
  ict: ["ict", "information technology", "software", "system integration", "cloud", "cybersecurity", "infrastructure", "digital services"],
  biotech: ["biotech", "biotechnology", "life sciences", "medical devices", "medtech", "pharma", "clinical"],
  automotive: ["automotive", "mobility", "vehicle", "powertrain", "aftermarket", "manufacturing", "supplier"],
  aerospace: ["aerospace", "space", "satellite", "avionics", "mission", "propulsion", "earth observation"],
  "company-careers": ["azienda", "career", "lavora con noi"]
};

function buildSourceContextTerms(sourceId: string, filters: JobFilters) {
  const torinoTerms = buildTorinoContextTerms(filters);

  switch (sourceId) {
    case "inpa":
    case "comune-torino":
    case "citta-metropolitana-torino":
    case "camera-commercio-torino":
    case "regione-piemonte":
      return uniqueTerms([...torinoTerms, ...sourceDomainSemanticTerms["public-admin"]]);
    case "torino-eu-network":
    case "torino-un-network":
      return uniqueTerms([...torinoTerms, ...sourceDomainSemanticTerms["international-public"]]);
    case "torino-foundations-network":
      return uniqueTerms([...torinoTerms, ...sourceDomainSemanticTerms.foundation]);
    case "torino-third-sector-network":
      return uniqueTerms([...torinoTerms, ...sourceDomainSemanticTerms["third-sector"]]);
    case "torino-neighborhood-houses-network":
      return uniqueTerms([
        ...torinoTerms,
        ...sourceDomainSemanticTerms["neighborhood-houses"],
        ...sourceDomainSemanticTerms["third-sector"]
      ]);
    case "torino-museums-network":
      return uniqueTerms([...torinoTerms, ...sourceDomainSemanticTerms.museum, ...sourceDomainSemanticTerms.foundation]);
    case "torino-education-associations-network":
      return uniqueTerms([
        ...torinoTerms,
        ...sourceDomainSemanticTerms["education-association"],
        ...sourceDomainSemanticTerms["third-sector"]
      ]);
    case "torino-education-network":
      return uniqueTerms([...torinoTerms, ...sourceDomainSemanticTerms.education]);
    case "torino-ngo-network":
      return uniqueTerms([...torinoTerms, ...sourceDomainSemanticTerms.ngo]);
    case "torino-incubators-network":
      return uniqueTerms([...torinoTerms, ...sourceDomainSemanticTerms.incubator]);
    case "torino-finance-network":
      return uniqueTerms([...torinoTerms, ...sourceDomainSemanticTerms.finance]);
    case "torino-fintech-network":
      return uniqueTerms([...torinoTerms, ...sourceDomainSemanticTerms.fintech, ...sourceDomainSemanticTerms.finance]);
    case "torino-insurance-network":
      return uniqueTerms([...torinoTerms, ...sourceDomainSemanticTerms.insurance, ...sourceDomainSemanticTerms.finance]);
    case "torino-ict-network":
      return uniqueTerms([...torinoTerms, ...sourceDomainSemanticTerms.ict]);
    case "torino-biotech-network":
      return uniqueTerms([...torinoTerms, ...sourceDomainSemanticTerms.biotech]);
    case "torino-automotive-network":
      return uniqueTerms([...torinoTerms, ...sourceDomainSemanticTerms.automotive]);
    case "torino-aerospace-network":
      return uniqueTerms([...torinoTerms, ...sourceDomainSemanticTerms.aerospace]);
    case "torino-private-careers":
      return uniqueTerms([
        ...torinoTerms,
        ...sourceDomainSemanticTerms.finance,
        ...sourceDomainSemanticTerms.fintech,
        ...sourceDomainSemanticTerms.insurance,
        ...sourceDomainSemanticTerms.ict,
        ...sourceDomainSemanticTerms.biotech,
        ...sourceDomainSemanticTerms.automotive,
        ...sourceDomainSemanticTerms.aerospace,
        ...sourceDomainSemanticTerms.foundation,
        ...sourceDomainSemanticTerms["third-sector"],
        ...sourceDomainSemanticTerms["neighborhood-houses"],
        ...sourceDomainSemanticTerms.museum,
        ...sourceDomainSemanticTerms["education-association"],
        ...sourceDomainSemanticTerms.education,
        ...sourceDomainSemanticTerms.incubator
      ]);
    default:
      return torinoTerms;
  }
}

function buildBaseSourceQuery(filters: JobFilters, cvProfile?: CvProfile | null): SourceQuery {
  const semanticSkillTerms = uniqueTerms([
    ...(cvProfile?.skills ?? []),
    ...(cvProfile?.keywords ?? []),
    ...(cvProfile?.experienceAreas ?? []),
    ...expandStudyAreaQueryTerms(cvProfile?.studyAreas ?? []),
    ...expandEducationQueryTerms(cvProfile?.educationLevels ?? []),
    filters.q ?? ""
  ]).slice(0, 16);

  return {
    roleKeywords: uniqueTerms([...(filters.roleTargets ?? []), ...(cvProfile?.titles ?? [])]),
    skillKeywords: semanticSkillTerms,
    location: filters.location?.trim() || null,
    locationScope: filters.locationScope ?? null,
    workMode: filters.workMode && filters.workMode !== "all" ? filters.workMode : null,
    seniority: cvProfile?.yearsOfExperience ? `${cvProfile.yearsOfExperience}+ years` : null
  };
}

function getSourceFetcher(sourceId: string): SourceFetcher | null {
  switch (sourceId) {
    case "inpa":
      return async (query) => scrapeInpaJobs(query.location ?? "");
    case "comune-torino":
      return async () => scrapeComuneTorinoJobs();
    case "citta-metropolitana-torino":
      return async () => scrapeCittaMetropolitanaTorinoJobs();
    case "camera-commercio-torino":
      return async () => scrapeCameraCommercioTorinoJobs();
    case "regione-piemonte":
      return async () => scrapeRegionePiemonteJobs();
    case "csi-piemonte":
      return async () => scrapeCsiPiemonteJobs();
    case "greenhouse-private-boards":
      return async () => scrapeGreenhouseJobs();
    case "lever-private-boards":
      return async () => scrapeLeverJobs();
    case "smartrecruiters-private-boards":
      return async () => scrapeSmartRecruitersJobs();
    case "torino-private-careers":
      return async (query) => scrapeTorinoPrivateCareerPages(query);
    default:
      return null;
  }
}

function getSourceEligibility(sourceId: string) {
  return (filters: JobFilters) => {
    const publicSource = shouldIncludePublicSource(sourceId, filters);
    const privateSource = shouldIncludePrivateSource(sourceId, filters);
    return publicSource || privateSource;
  };
}

function buildSourceQueryForEntry(
  sourceId: string,
  capabilities: SourceCapabilities,
  filters: JobFilters,
  cvProfile?: CvProfile | null
) {
  const baseQuery = buildBaseSourceQuery(filters, cvProfile);
  const sourceContextTerms = buildSourceContextTerms(sourceId, filters);

  if (!getSourceEligibility(sourceId)(filters)) {
    return null;
  }

  return {
    ...baseQuery,
    roleKeywords: capabilities.supportsKeywordSearch ? baseQuery.roleKeywords : [],
    skillKeywords: capabilities.supportsKeywordSearch
      ? uniqueTerms([...baseQuery.skillKeywords, ...sourceContextTerms]).slice(0, 24)
      : [],
    location: capabilities.supportsLocationSearch ? baseQuery.location : null,
    locationScope: capabilities.supportsLocationSearch ? baseQuery.locationScope : null,
    workMode: capabilities.supportsWorkModeFiltering ? baseQuery.workMode : null,
    seniority: capabilities.supportsSeniorityFiltering ? baseQuery.seniority : null
  } satisfies SourceQuery;
}

export const sourceRegistry: SourceRegistryEntry[] = sourceCatalog.map((source) => {
  const capabilities = sourceCapabilitiesById[source.id];

  if (!capabilities) {
    throw new Error(`Missing source capabilities for ${source.id}`);
  }

  return {
    id: source.id,
    label: source.label,
    sector: source.sector,
    governance: source.governance,
    domain: source.domain,
    enabled: source.enabled,
    adapterId: source.id,
    capabilities,
    fetcher: getSourceFetcher(source.id),
    isEligibleForFilters: getSourceEligibility(source.id),
    buildSourceQuery: (filters, cvProfile) => buildSourceQueryForEntry(source.id, capabilities, filters, cvProfile)
  };
});

export const liveSourceRegistry = sourceRegistry.filter((entry) => entry.fetcher !== null);

export function getEnabledSourceCatalog() {
  return sourceCatalog.filter((source) => source.enabled);
}

export function getEligibleSourceRegistryEntries(filters: JobFilters, cvProfile?: CvProfile | null) {
  return liveSourceRegistry
    .filter((entry) => entry.enabled)
    .filter((entry) => entry.isEligibleForFilters(filters))
    .map((entry) => ({
      ...entry,
      query: entry.buildSourceQuery(filters, cvProfile)
    }))
    .filter((entry): entry is EligibleSourceRegistryEntry => entry.query !== null);
}
