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
import { CvProfile, Job, JobFilters, SourceCapabilities, SourceQuery } from "@/lib/types";

type SourceFetcher = (query: SourceQuery, filters: JobFilters) => Promise<Job[]>;

export type SourceRegistryEntry = {
  id: string;
  label: string;
  sector: "pubblico" | "privato";
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

function buildBaseSourceQuery(filters: JobFilters, cvProfile?: CvProfile | null): SourceQuery {
  return {
    roleKeywords: uniqueTerms([...(filters.roleTargets ?? []), ...(cvProfile?.titles ?? [])]),
    skillKeywords: uniqueTerms([...(cvProfile?.skills ?? []), filters.q ?? ""]),
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

  if (!getSourceEligibility(sourceId)(filters)) {
    return null;
  }

  return {
    ...baseQuery,
    roleKeywords: capabilities.supportsKeywordSearch ? baseQuery.roleKeywords : [],
    skillKeywords: capabilities.supportsKeywordSearch ? baseQuery.skillKeywords : [],
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
