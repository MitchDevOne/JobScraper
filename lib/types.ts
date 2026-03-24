export type SectorType = "pubblico" | "privato";
export type WorkMode = "on-site" | "hybrid" | "remote";
export type JobStatus = "nuova" | "vista" | "salvata" | "scartata" | "applicata";
export type LocationScope = "city" | "metro";
export type SourceOriginType = "official" | "ats" | "aggregator" | "seed" | "partner-api" | "experimental";
export type SourceRetrievalMode = "listing-page" | "public-api" | "partner-api" | "xml-feed" | "seed" | "manual-import";
export type SourceAuthMode = "none" | "api-key" | "oauth" | "partner-only";
export type SourceQualityTier = "high" | "medium" | "experimental";
export type SourceDedupeStrategy = "url" | "title-company-location" | "external-id" | "hybrid";

export type Job = {
  id: string;
  title: string;
  company: string;
  sector: SectorType;
  location: string;
  city: string;
  workMode: WorkMode;
  source: string;
  sourceType: "company-site" | "public-portal" | "aggregator";
  originalUrl: string;
  postedAt: string;
  expiresAt: string | null;
  discoveredAt: string;
  tags: string[];
  summary: string;
  status: JobStatus;
  relevanceScore?: number;
  matchReasons?: string[];
  requirementHighlights?: string[];
  requirementsText?: string | null;
  paRequirementStatus?: "compatible" | "potential" | "incompatible";
  privateFitStatus?: "compatible" | "partial" | "weak";
  requirementSourceUrl?: string | null;
};

export type JobFilters = {
  sector?: SectorType | "all";
  q?: string;
  workMode?: WorkMode | "all";
  includeRemote?: boolean;
  location?: string;
  locationScope?: LocationScope;
  roleTargets?: string[];
};

export type SourceQuery = {
  roleKeywords: string[];
  skillKeywords: string[];
  location: string | null;
  locationScope: LocationScope | null;
  workMode: WorkMode | null;
  seniority: string | null;
};

export type SourceCapabilities = {
  originType: SourceOriginType;
  retrievalMode: SourceRetrievalMode;
  authMode: SourceAuthMode;
  coverage: "torino-city" | "torino-metro" | "piemonte" | "italy" | "eu" | "global";
  qualityTier: SourceQualityTier;
  supportsKeywordSearch: boolean;
  supportsLocationSearch: boolean;
  supportsPagination: boolean;
  supportsDetailEnrichment: boolean;
  supportsIncrementalSync: boolean;
  supportsWorkModeFiltering?: boolean;
  supportsSeniorityFiltering?: boolean;
  supportsStructuredSalary?: boolean;
  defaultPriority?: number;
  rateLimitNotes?: string;
  dedupeStrategy: SourceDedupeStrategy;
  knownLimitations?: string[];
};

export type SourceFetchMetrics = {
  sourceId: string;
  sourceLabel: string;
  fetchedJobs: number;
  validJobs: number;
  dedupedJobs: number;
  durationMs: number;
  success: boolean;
  error?: string;
  query: SourceQuery | null;
};

export type CvProfile = {
  keywords: string[];
  titles: string[];
  skills: string[];
  experienceAreas: string[];
  educationLevels: string[];
  studyAreas: string[];
  yearsOfExperience: number | null;
  preferredLocations: string[];
};

export type SearchResponse = {
  total: number;
  jobs: Job[];
  publicPotentialJobs: Job[];
  cvKeywords: string[];
  cvProfile: CvProfile | null;
  lastUpdatedAt: string;
  searchedLocation: string;
  consultedSources: string[];
  previewJobs: Job[];
  suggestedRoles: string[];
  activeRoleTargets: string[];
  searchedLocationScope: LocationScope;
  sourceFetchMetrics?: SourceFetchMetrics[];
};
