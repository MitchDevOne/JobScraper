export type SectorType = "pubblico" | "privato";
export type WorkMode = "on-site" | "hybrid" | "remote";
export type JobStatus = "nuova" | "vista" | "salvata" | "scartata" | "applicata";
export type LocationScope = "city" | "metro";

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
  cvKeywords: string[];
  cvProfile: CvProfile | null;
  lastUpdatedAt: string;
  searchedLocation: string;
  consultedSources: string[];
  previewJobs: Job[];
  suggestedRoles: string[];
  activeRoleTargets: string[];
  searchedLocationScope: LocationScope;
};
