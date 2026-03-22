export type SectorType = "pubblico" | "privato";
export type WorkMode = "on-site" | "hybrid" | "remote";
export type JobStatus = "nuova" | "vista" | "salvata" | "scartata" | "applicata";

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
  discoveredAt: string;
  tags: string[];
  summary: string;
  status: JobStatus;
};

export type JobFilters = {
  sector?: SectorType | "all";
  q?: string;
  workMode?: WorkMode | "all";
  includeRemote?: boolean;
  city?: string;
};
