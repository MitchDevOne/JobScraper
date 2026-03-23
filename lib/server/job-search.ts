import {
  aggregateRoleLabels,
  expandRoleTerms,
  expandSkillTerms,
  normalizeForMatch,
  normalizeRoleLabel,
  textContainsPhrase
} from "@/lib/server/agents/cv-intelligence-agent";
import { evaluatePrivateExperienceAlignment } from "@/lib/server/agents/private-experience-agent";
import { evaluatePublicAdministrationRequirements } from "@/lib/server/agents/public-requirements-agent";
import { privateJobsSeed } from "@/lib/data/private-jobs";
import { liveSourceRegistry } from "@/lib/server/source-registry";
import { CvProfile, Job, JobFilters } from "@/lib/types";

type SearchJobsResult = {
  jobs: Job[];
  consultedSources: string[];
  previewJobs: Job[];
  suggestedRoles: string[];
  activeRoleTargets: string[];
};

const studyAreaSynonyms: Record<string, string[]> = {
  "data science": ["data science", "analisi dati", "business intelligence", "data analyst", "data engineer", "analytics"],
  "business administration": ["business administration", "economia", "management", "tributario", "accounting", "amministrazione"],
  "foreign languages": ["foreign languages", "lingue", "international relations", "traduzione", "english", "inglese"],
  software: ["software", "developer", "python", "java", "frontend", "backend", "full stack"],
  research: ["research", "ricerca", "scientifica", "scientifico", "laboratorio", "sperimentale"]
};

const educationLevelSignals: Record<string, string[]> = {
  master: ["master", "laurea magistrale", "magistrale", "specialistica"],
  mba: ["mba", "master in business administration", "lm-77"],
  bachelor: ["bachelor", "laurea", "triennale", "degree"]
};

const developerFamilyTitles = [
  "frontend developer",
  "backend developer",
  "full stack developer",
  "software engineer",
  "data engineer",
  "cloud engineer",
  "devops engineer"
];

const torinoMetroCommunes = new Set([
  "torino",
  "collegno",
  "grugliasco",
  "rivoli",
  "moncalieri",
  "nichelino",
  "settimo torinese",
  "san mauro torinese",
  "venaria reale",
  "beinasco",
  "orbassano",
  "pianezza",
  "alpignano",
  "rivalta di torino",
  "trofarello",
  "borgaro torinese",
  "caselle torinese",
  "chieri",
  "ivrea",
  "giaveno"
]);

function escapeRegex(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function tokenize(input: string) {
  return normalizeForMatch(input)
    .split(/[\s,./-]+/)
    .filter(Boolean);
}

function expandStudyAreaTerms(studyAreas: string[]) {
  const expanded = new Set<string>();

  for (const area of studyAreas.map(normalizeForMatch).filter(Boolean)) {
    expanded.add(area);

    for (const synonym of studyAreaSynonyms[area] ?? []) {
      expanded.add(normalizeForMatch(synonym));
    }
  }

  return [...expanded];
}

function textContainsTerm(text: string, term: string) {
  const normalizedTerm = normalizeForMatch(term);

  if (!normalizedTerm) {
    return false;
  }

  if (/^[a-z0-9 ]+$/.test(normalizedTerm)) {
    const pattern = new RegExp(
      `(^|[^a-z0-9])${escapeRegex(normalizedTerm).replace(/\s+/g, "\\s+")}(?=$|[^a-z0-9])`,
      "i"
    );
    return pattern.test(text);
  }

  return text.includes(normalizedTerm);
}

function countMatches(text: string, tokens: string[]) {
  return tokens.reduce((count, token) => count + (textContainsTerm(text, token) ? 1 : 0), 0);
}

function extractTorinoCommune(job: Job) {
  const candidates = [job.city, job.location]
    .map((item) => normalizeForMatch(item))
    .filter(Boolean);

  for (const candidate of candidates) {
    for (const commune of torinoMetroCommunes) {
      if (candidate === commune || candidate.includes(commune)) {
        return commune;
      }
    }
  }

  return null;
}

function matchesLocation(job: Job, requestedLocation: string, locationScope: JobFilters["locationScope"] = "metro") {
  const normalizedLocation = normalizeForMatch(requestedLocation);

  if (!normalizedLocation) {
    return true;
  }

  if (normalizedLocation.includes("torino")) {
    const commune = extractTorinoCommune(job);

    if (locationScope === "city") {
      return commune === "torino";
    }

    return commune !== null && torinoMetroCommunes.has(commune);
  }

  const city = normalizeForMatch(job.city);
  const location = normalizeForMatch(job.location);
  return tokenize(requestedLocation).every((token) => location.includes(token) || city.includes(token));
}

function buildJobSignals(
  job: Job,
  queryTokens: string[],
  roleTargets: string[],
  cvProfile: CvProfile | null,
  requestedLocation: string,
  locationScope: JobFilters["locationScope"]
) {
  const titleLower = normalizeForMatch(job.title);
  const detailsLower = normalizeForMatch([job.summary, ...job.tags].join(" "));
  const expandedCvTitles = expandRoleTerms(cvProfile?.titles ?? []);
  const expandedCvSkills = expandSkillTerms(cvProfile?.skills ?? []);
  const expandedStudyAreas = expandStudyAreaTerms(cvProfile?.studyAreas ?? []);
  const educationLevels = cvProfile?.educationLevels.map(normalizeForMatch) ?? [];

  const roleMatches =
    countMatches(titleLower, roleTargets) +
    countMatches(titleLower, expandedCvTitles) +
    countMatches(detailsLower, expandedCvTitles);
  const skillMatches =
    countMatches(titleLower, expandedCvSkills) +
    countMatches(detailsLower, expandedCvSkills) +
    countMatches(titleLower, queryTokens);
  const experienceMatches = countMatches(detailsLower, cvProfile?.experienceAreas.map(normalizeForMatch) ?? []);
  const studyAreaMatches = countMatches(titleLower, expandedStudyAreas) + countMatches(detailsLower, expandedStudyAreas);
  const educationLevelMatches = educationLevels.reduce(
    (count, level) => count + countMatches(detailsLower, educationLevelSignals[level] ?? []),
    0
  );

  return {
    roleMatches,
    skillMatches,
    experienceMatches,
    educationMatches: studyAreaMatches + educationLevelMatches,
    hasLocationMatch: requestedLocation ? matchesLocation(job, requestedLocation, locationScope) : true
  };
}

function isDeveloperFamilyTitle(title: string) {
  const normalizedTitle = normalizeForMatch(title);

  if (developerFamilyTitles.some((role) => textContainsPhrase(normalizedTitle, role))) {
    return true;
  }

  return (
    /\b(developer|engineer|programmer|architect)\b/i.test(normalizedTitle) &&
    !/\b(product|project|business|data analyst|program analyst|analyst|manager|officer|administrator)\b/i.test(
      normalizedTitle
    )
  );
}

function hasDeveloperFamilyProfile(cvProfile: CvProfile | null) {
  return (cvProfile?.titles ?? []).some((title) => developerFamilyTitles.includes(normalizeRoleLabel(title)));
}

function scoreTokenMatches(text: string, tokens: string[], weight: number) {
  return tokens.reduce((score, token) => score + (textContainsTerm(text, token) ? weight : 0), 0);
}

function buildMatchReasons(
  job: Job,
  queryTokens: string[],
  roleTargets: string[],
  cvProfile: CvProfile | null,
  requestedLocation: string,
  locationScope: JobFilters["locationScope"]
) {
  const reasons: string[] = [];
  const signals = buildJobSignals(job, queryTokens, roleTargets, cvProfile, requestedLocation, locationScope);
  const publicFit = evaluatePublicAdministrationRequirements(signals, cvProfile);
  const privateFit = evaluatePrivateExperienceAlignment(
    {
      ...signals,
      developerOnlyJob: isDeveloperFamilyTitle(job.title),
      developerProfile: hasDeveloperFamilyProfile(cvProfile)
    },
    cvProfile
  );

  if (signals.roleMatches > 0) {
    reasons.push("ruolo target");
    reasons.push("titolo coerente col CV");
  }

  if (queryTokens.some((token) => textContainsTerm(normalizeForMatch(job.title), token))) {
    reasons.push("query nel titolo");
  }

  reasons.push(...(job.sector === "pubblico" ? publicFit.reasons : privateFit.reasons));

  if (requestedLocation && signals.hasLocationMatch) {
    reasons.push(locationScope === "city" ? "torino citta" : "citta metropolitana");
  }

  return [...new Set(reasons)].slice(0, 4);
}

function computeScore(
  job: Job,
  queryTokens: string[],
  roleTargets: string[],
  cvProfile: CvProfile | null,
  requestedLocation: string,
  locationScope: JobFilters["locationScope"]
) {
  const titleText = normalizeForMatch(job.title);
  const detailsText = normalizeForMatch([job.company, job.summary, job.location, ...job.tags].join(" "));
  const signals = buildJobSignals(job, queryTokens, roleTargets, cvProfile, requestedLocation, locationScope);
  const publicFit = evaluatePublicAdministrationRequirements(signals, cvProfile);
  const privateFit = evaluatePrivateExperienceAlignment(
    {
      ...signals,
      developerOnlyJob: isDeveloperFamilyTitle(job.title),
      developerProfile: hasDeveloperFamilyProfile(cvProfile)
    },
    cvProfile
  );

  let score = 0;
  score += scoreTokenMatches(titleText, queryTokens, 10);
  score += scoreTokenMatches(detailsText, queryTokens, 5);

  if (job.sector === "pubblico") {
    score += signals.roleMatches * 12;
    score += signals.skillMatches * 6;
    score += signals.experienceMatches * 5;
    score += publicFit.scoreBoost;
  } else {
    score += privateFit.scoreBoost;
  }

  if (cvProfile) {
    score += scoreTokenMatches(detailsText, cvProfile.keywords.map(normalizeForMatch), 2);
  }

  if (requestedLocation && signals.hasLocationMatch) {
    score += locationScope === "city" ? 12 : 10;
  }

  if (job.sector === "pubblico") {
    score += 1;
  }

  return score;
}

function buildConsultedSources(jobs: Job[], requestedLocation: string, locationScope: JobFilters["locationScope"]) {
  const sources = new Set<string>();

  for (const job of jobs) {
    if (!requestedLocation || matchesLocation(job, requestedLocation, locationScope)) {
      sources.add(job.source);
    }
  }

  return [...sources];
}

function buildSuggestedRoles(cvProfile: CvProfile | null, jobs: Job[]) {
  if (!cvProfile) {
    return [];
  }

  const explicitTitles = new Set(aggregateRoleLabels(cvProfile.titles, 16));
  const candidateRoles: string[] = [];

  for (const title of cvProfile.titles) {
    candidateRoles.push(title);
  }

  for (const job of jobs) {
    const normalizedTitle = normalizeRoleLabel(job.title);

    if (explicitTitles.has(normalizedTitle)) {
      continue;
    }

    if (job.matchReasons?.some((reason) => reason === "skill dal CV" || reason === "esperienza rilevante")) {
      candidateRoles.push(normalizedTitle);
    }
  }

  return aggregateRoleLabels(candidateRoles.filter((role) => !explicitTitles.has(normalizeRoleLabel(role))), 8);
}

function dedupeJobs(jobs: Job[]) {
  const seen = new Set<string>();

  return jobs.filter((job) => {
    const key = normalizeForMatch([job.title, job.company, job.location, job.originalUrl].join("|"));

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function passesCvFitGate(
  job: Job,
  queryTokens: string[],
  roleTargets: string[],
  cvProfile: CvProfile | null,
  requestedLocation: string,
  locationScope: JobFilters["locationScope"]
) {
  if (!cvProfile) {
    return true;
  }

  const signals = buildJobSignals(job, queryTokens, roleTargets, cvProfile, requestedLocation, locationScope);

  if (job.sector === "pubblico") {
    return evaluatePublicAdministrationRequirements(signals, cvProfile).passes;
  }

  return evaluatePrivateExperienceAlignment(
    {
      ...signals,
      developerOnlyJob: isDeveloperFamilyTitle(job.title),
      developerProfile: hasDeveloperFamilyProfile(cvProfile)
    },
    cvProfile
  ).passes;
}

export async function fetchJobs(filters: JobFilters, cvProfile: CvProfile | null = null): Promise<SearchJobsResult> {
  const requestedLocation = filters.location?.trim() ?? "";
  const locationScope = filters.locationScope ?? "metro";
  const activeRoleTargets = aggregateRoleLabels(filters.roleTargets ?? [], 12);
  const roleTargets = expandRoleTerms(activeRoleTargets);
  const queryTokens = tokenize(filters.q ?? "");
  const liveJobs = await Promise.all(
    liveSourceRegistry
      .filter((source) => source.isRelevant(filters))
      .map(async (source) => source.fetcher(filters).catch(() => []))
  ).then((items) => items.flat());
  const jobs = dedupeJobs([...liveJobs, ...privateJobsSeed]);
  const cvTokens = cvProfile
    ? [
        ...cvProfile.keywords.map(normalizeForMatch),
        ...expandSkillTerms(cvProfile.skills),
        ...expandRoleTerms(cvProfile.titles),
        ...cvProfile.experienceAreas.map(normalizeForMatch)
      ]
    : [];

  const filteredJobs = jobs
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

      if (requestedLocation && !matchesLocation(job, requestedLocation, locationScope)) {
        return false;
      }

      if (!passesCvFitGate(job, queryTokens, roleTargets, cvProfile, requestedLocation, locationScope)) {
        return false;
      }

      if (!queryTokens.length && !cvTokens.length && !roleTargets.length) {
        return true;
      }

      const haystack = normalizeForMatch([job.title, job.company, job.summary, job.location, ...job.tags].join(" "));
      const roleTargetMatch = roleTargets.length === 0 || roleTargets.some((role) => textContainsTerm(haystack, role));

      if (!roleTargetMatch) {
        return false;
      }

      return [...queryTokens, ...cvTokens, ...roleTargets].some((token) => textContainsTerm(haystack, token));
    })
    .map((job) => ({
      ...job,
      relevanceScore: computeScore(job, queryTokens, roleTargets, cvProfile, requestedLocation, locationScope),
      matchReasons: buildMatchReasons(job, queryTokens, roleTargets, cvProfile, requestedLocation, locationScope)
    }))
    .sort((a, b) => {
      if ((b.relevanceScore ?? 0) !== (a.relevanceScore ?? 0)) {
        return (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0);
      }

      return b.postedAt.localeCompare(a.postedAt);
    });

  return {
    jobs: filteredJobs,
    consultedSources: buildConsultedSources(jobs, requestedLocation, locationScope),
    previewJobs: filteredJobs.slice(0, 3),
    suggestedRoles: buildSuggestedRoles(cvProfile, filteredJobs),
    activeRoleTargets
  };
}
