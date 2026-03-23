import { sourceCatalog } from "@/lib/source-catalog";
import { shouldIncludePrivateSource } from "@/lib/server/agents/private-source-agent";
import { shouldIncludePublicSource } from "@/lib/server/agents/public-source-agent";
import { scrapeCittaMetropolitanaTorinoJobs } from "@/lib/server/scrapers/citta-metropolitana-torino";
import { scrapeComuneTorinoJobs } from "@/lib/server/scrapers/comune-torino";
import { scrapeCsiPiemonteJobs } from "@/lib/server/scrapers/csi-piemonte";
import { scrapeInpaJobs } from "@/lib/server/scrapers/inpa";
import { scrapeGreenhouseJobs, scrapeLeverJobs, scrapeSmartRecruitersJobs } from "@/lib/server/scrapers/private-ats";
import { JobFilters } from "@/lib/types";

type SourceFetcher = (filters: JobFilters) => Promise<Awaited<ReturnType<typeof scrapeComuneTorinoJobs>>>;

type LiveSourceRegistryEntry = {
  id: string;
  fetcher: SourceFetcher;
  isRelevant: (filters: JobFilters) => boolean;
};

export const liveSourceRegistry: LiveSourceRegistryEntry[] = [
  {
    id: "inpa",
    fetcher: async (filters) => scrapeInpaJobs(filters.location ?? ""),
    isRelevant: (filters) => shouldIncludePublicSource("inpa", filters)
  },
  {
    id: "comune-torino",
    fetcher: async () => scrapeComuneTorinoJobs(),
    isRelevant: (filters) => shouldIncludePublicSource("comune-torino", filters)
  },
  {
    id: "citta-metropolitana-torino",
    fetcher: async () => scrapeCittaMetropolitanaTorinoJobs(),
    isRelevant: (filters) => shouldIncludePublicSource("citta-metropolitana-torino", filters)
  },
  {
    id: "csi-piemonte",
    fetcher: async () => scrapeCsiPiemonteJobs(),
    isRelevant: (filters) => shouldIncludePrivateSource("csi-piemonte", filters)
  },
  {
    id: "greenhouse-private-boards",
    fetcher: async () => scrapeGreenhouseJobs(),
    isRelevant: (filters) => shouldIncludePrivateSource("greenhouse-private-boards", filters)
  },
  {
    id: "lever-private-boards",
    fetcher: async () => scrapeLeverJobs(),
    isRelevant: (filters) => shouldIncludePrivateSource("lever-private-boards", filters)
  },
  {
    id: "smartrecruiters-private-boards",
    fetcher: async () => scrapeSmartRecruitersJobs(),
    isRelevant: (filters) => shouldIncludePrivateSource("smartrecruiters-private-boards", filters)
  }
];

export function getEnabledSourceCatalog() {
  return sourceCatalog.filter((source) => source.enabled);
}
