import { privateJobsSeed } from "@/lib/data/private-jobs";
import { scrapeComuneTorinoJobs } from "@/lib/server/scrapers/comune-torino";
import { Job, JobFilters } from "@/lib/types";

function normalize(input: string) {
  return input.trim().toLowerCase();
}

function computeScore(job: Job, queryTokens: string[], cvTokens: string[]) {
  const haystack = [
    job.title,
    job.company,
    job.summary,
    job.location,
    ...job.tags
  ]
    .join(" ")
    .toLowerCase();

  let score = 0;

  for (const token of queryTokens) {
    if (haystack.includes(token)) {
      score += 6;
    }
  }

  for (const token of cvTokens) {
    if (haystack.includes(token)) {
      score += 3;
    }
  }

  if (job.sector === "pubblico") {
    score += 1;
  }

  return score;
}

export async function fetchJobs(filters: JobFilters, cvKeywords: string[] = []) {
  const publicJobs = await scrapeComuneTorinoJobs();
  const jobs = [...publicJobs, ...privateJobsSeed];

  const queryTokens = normalize(filters.q ?? "")
    .split(/\s+/)
    .filter(Boolean);
  const cvTokens = cvKeywords.map(normalize).filter(Boolean);

  return jobs
    .filter((job) => {
      if (!filters.includeRemote && job.workMode === "remote") {
        return false;
      }

      if (filters.sector && filters.sector !== "all" && job.sector !== filters.sector) {
        return false;
      }

      if (filters.workMode && filters.workMode !== "all" && job.workMode !== filters.workMode) {
        return false;
      }

      if (filters.city && normalize(job.city) !== normalize(filters.city)) {
        return false;
      }

      if (!queryTokens.length && !cvTokens.length) {
        return true;
      }

      const haystack = [
        job.title,
        job.company,
        job.summary,
        job.location,
        ...job.tags
      ]
        .join(" ")
        .toLowerCase();

      return [...queryTokens, ...cvTokens].some((token) => haystack.includes(token));
    })
    .map((job) => ({
      ...job,
      relevanceScore: computeScore(job, queryTokens, cvTokens)
    }))
    .sort((a, b) => {
      if ((b.relevanceScore ?? 0) !== (a.relevanceScore ?? 0)) {
        return (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0);
      }

      return b.postedAt.localeCompare(a.postedAt);
    });
}
