import { ContractType, Job } from "@/lib/types";

type GreenhouseBoardJob = {
  id: number;
  title: string;
  absolute_url: string;
  updated_at?: string | null;
  location?: { name?: string | null } | null;
  metadata?: Array<{ name?: string | null; value?: string | null }> | null;
  departments?: Array<{ name?: string | null }> | null;
};

type LeverPosting = {
  id: string;
  text: string;
  hostedUrl: string;
  categories?: {
    commitment?: string | null;
    department?: string | null;
    location?: string | null;
    team?: string | null;
    allLocations?: string[] | null;
  } | null;
  createdAt?: number | null;
  descriptionPlain?: string | null;
  additionalPlain?: string | null;
  lists?: Array<{ text?: string | null; content?: string | null }> | null;
};

type SmartRecruitersPosting = {
  id: string;
  name: string;
  releasedDate?: string | null;
  refNumber?: string | null;
  location?: {
    city?: string | null;
    region?: string | null;
    country?: string | null;
    remote?: boolean | null;
    hybrid?: boolean | null;
    fullLocation?: string | null;
  } | null;
  industry?: { label?: string | null } | null;
  department?: { label?: string | null } | null;
  function?: { label?: string | null } | null;
  typeOfEmployment?: { label?: string | null } | null;
  experienceLevel?: { label?: string | null } | null;
  jobAd?: {
    sections?: Array<{ title?: string | null; text?: string | null }>;
  } | null;
};

type GreenhouseBoardConfig = {
  id: string;
  company: string;
  boardToken: string;
  source: string;
  companyUrl: string;
  defaultLocation: string;
};

type LeverBoardConfig = {
  id: string;
  company: string;
  site: string;
  source: string;
  companyUrl: string;
  defaultLocation: string;
};

type SmartRecruitersCompanyConfig = {
  id: string;
  company: string;
  identifier: string;
  source: string;
  companyUrl: string;
  defaultLocation: string;
};

const greenhouseBoards: GreenhouseBoardConfig[] = [
  {
    id: "thefork-greenhouse",
    company: "TheFork",
    boardToken: "thefork",
    source: "TheFork - Greenhouse board",
    companyUrl: "https://job-boards.greenhouse.io/thefork",
    defaultLocation: "Torino, Milano, Italia"
  }
];

const leverBoards: LeverBoardConfig[] = [
  {
    id: "ion-lever",
    company: "ION Group",
    site: "ion",
    source: "ION Group - Lever board",
    companyUrl: "https://jobs.lever.co/ion",
    defaultLocation: "Torino, Italia"
  }
];

const smartRecruitersCompanies: SmartRecruitersCompanyConfig[] = [
  {
    id: "everience-smartrecruiters",
    company: "EVERIENCE",
    identifier: "EVERIENCE",
    source: "EVERIENCE - SmartRecruiters board",
    companyUrl: "https://jobs.smartrecruiters.com/EVERIENCE",
    defaultLocation: "Piemonte, Italia"
  },
  {
    id: "lav-smartrecruiters",
    company: "LAV",
    identifier: "LAV-LEGAANTIVIVISEZIONE",
    source: "LAV - SmartRecruiters board",
    companyUrl: "https://jobs.smartrecruiters.com/LAV-LEGAANTIVIVISEZIONE",
    defaultLocation: "Torino, Italia"
  }
];

const ATS_FETCH_TIMEOUT_MS = 4500;

function normalize(input: string) {
  return input.trim().toLowerCase();
}

async function fetchJsonWithTimeout<T>(url: string) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ATS_FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: { "user-agent": "JobScraperMVP/1.0" },
      next: { revalidate: 0 },
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`ATS fetch failed: ${url} ${response.status}`);
    }

    return (await response.json()) as T;
  } finally {
    clearTimeout(timeoutId);
  }
}

function stripTags(input: string) {
  return input.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function toIsoDate(input: string | number | null | undefined) {
  if (!input) {
    return null;
  }

  const date = typeof input === "number" ? new Date(input) : new Date(input);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

function inferWorkMode(text: string) {
  const haystack = normalize(text);

  if (haystack.includes("remote")) {
    return "remote" as const;
  }

  if (haystack.includes("hybrid")) {
    return "hybrid" as const;
  }

  return "on-site" as const;
}

function inferContractType(text: string): ContractType {
  const haystack = normalize(text);

  if (
    haystack.includes("tirocinio") ||
    haystack.includes("stage") ||
    haystack.includes("internship") ||
    haystack.includes("intern ")
  ) {
    return "tirocinio-retribuito";
  }

  if (
    haystack.includes("tempo indeterminato") ||
    haystack.includes("permanent") ||
    haystack.includes("full time employee")
  ) {
    return "indeterminato";
  }

  if (
    haystack.includes("tempo determinato") ||
    haystack.includes("fixed term") ||
    haystack.includes("contract") ||
    haystack.includes("temporary")
  ) {
    return "determinato";
  }

  return "altro";
}

function inferCityFromLocation(location: string) {
  const normalized = normalize(location);

  if (normalized.includes("torino") || normalized.includes("turin")) {
    return "Torino";
  }

  if (normalized.includes("milano") || normalized.includes("milan")) {
    return "Milano";
  }

  if (normalized.includes("roma") || normalized.includes("rome")) {
    return "Roma";
  }

  if (normalized.includes("pisa")) {
    return "Pisa";
  }

  return location.split(",")[0]?.trim() || "Italia";
}

function buildTags(...groups: Array<Array<string | null | undefined>>) {
  const tags = new Set<string>();

  for (const group of groups) {
    for (const item of group) {
      const normalized = normalize(item ?? "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

      if (normalized) {
        tags.add(normalized);
      }
    }
  }

  return [...tags].slice(0, 10);
}

function buildGreenhouseLocation(job: GreenhouseBoardJob, config: GreenhouseBoardConfig) {
  const location = job.location?.name?.trim();
  return location || config.defaultLocation;
}

function buildGreenhouseSummary(job: GreenhouseBoardJob) {
  const metadataValues = (job.metadata ?? [])
    .map((item) => [item.name, item.value].filter(Boolean).join(": "))
    .filter(Boolean);

  return metadataValues[0] || "Posizione pubblicata sul board ufficiale Greenhouse.";
}

async function fetchGreenhouseBoard(config: GreenhouseBoardConfig): Promise<Job[]> {
  const payload = await fetchJsonWithTimeout<{ jobs?: GreenhouseBoardJob[] }>(
    `https://boards-api.greenhouse.io/v1/boards/${config.boardToken}/jobs`
  );
  const today = new Date().toISOString().slice(0, 10);

  return (payload.jobs ?? []).map((job) => {
    const location = buildGreenhouseLocation(job, config);
    const metadata = job.metadata ?? [];
    const workMode = inferWorkMode(
      [location, ...metadata.map((item) => `${item.name ?? ""} ${item.value ?? ""}`)].join(" ")
    );

    return {
      id: `${config.id}-${job.id}`,
      title: stripTags(job.title),
      company: config.company,
      sector: "privato",
      location,
      city: inferCityFromLocation(location),
      workMode,
      contractType: inferContractType([location, ...metadata.map((item) => `${item.name ?? ""} ${item.value ?? ""}`)].join(" ")),
      source: config.source,
      sourceType: "company-site",
      originalUrl: job.absolute_url || config.companyUrl,
      postedAt: toIsoDate(job.updated_at) ?? today,
      expiresAt: null,
      discoveredAt: today,
      tags: buildTags(
        metadata.map((item) => item.value ?? item.name ?? ""),
        (job.departments ?? []).map((item) => item.name ?? ""),
        [location, "greenhouse", "career-site"]
      ),
      summary: buildGreenhouseSummary(job),
      status: "nuova"
    } satisfies Job;
  });
}

function buildLeverLocation(job: LeverPosting, config: LeverBoardConfig) {
  const allLocations = job.categories?.allLocations?.filter(Boolean) ?? [];
  const primaryLocation = job.categories?.location?.trim();
  const locations = allLocations.length > 0 ? allLocations : primaryLocation ? [primaryLocation] : [];
  return locations.length > 0 ? locations.join(", ") : config.defaultLocation;
}

function buildLeverSummary(job: LeverPosting) {
  const summaryCandidate =
    stripTags(job.descriptionPlain ?? "") ||
    stripTags(job.additionalPlain ?? "") ||
    stripTags((job.lists ?? []).map((item) => item.text ?? item.content ?? "").join(" "));

  return summaryCandidate || "Posizione pubblicata sul board ufficiale Lever.";
}

async function fetchLeverBoard(config: LeverBoardConfig): Promise<Job[]> {
  const payload = await fetchJsonWithTimeout<LeverPosting[]>(`https://api.lever.co/v0/postings/${config.site}?mode=json`);
  const today = new Date().toISOString().slice(0, 10);

  return payload.map((job) => {
    const location = buildLeverLocation(job, config);
    const department = job.categories?.department ?? "";
    const team = job.categories?.team ?? "";
    const commitment = job.categories?.commitment ?? "";
    const workMode = inferWorkMode([location, commitment, stripTags(job.descriptionPlain ?? "")].join(" "));

    return {
      id: `${config.id}-${job.id}`,
      title: stripTags(job.text),
      company: config.company,
      sector: "privato",
      location,
      city: inferCityFromLocation(location),
      workMode,
      contractType: inferContractType([department, team, commitment, job.descriptionPlain ?? "", job.additionalPlain ?? ""].join(" ")),
      source: config.source,
      sourceType: "company-site",
      originalUrl: job.hostedUrl || config.companyUrl,
      postedAt: toIsoDate(job.createdAt) ?? today,
      expiresAt: null,
      discoveredAt: today,
      tags: buildTags(
        [department, team, commitment, location, "lever", "career-site"],
        job.categories?.allLocations ?? []
      ),
      summary: buildLeverSummary(job),
      status: "nuova"
    } satisfies Job;
  });
}

function buildSmartRecruitersLocation(job: SmartRecruitersPosting, config: SmartRecruitersCompanyConfig) {
  return job.location?.fullLocation || [job.location?.city, job.location?.region, job.location?.country].filter(Boolean).join(", ") || config.defaultLocation;
}

function buildSmartRecruitersSummary(job: SmartRecruitersPosting) {
  const section = job.jobAd?.sections?.find((item) => item.text)?.text;
  const summaryCandidate = stripTags(section ?? "");
  return summaryCandidate || "Posizione pubblicata sul board ufficiale SmartRecruiters.";
}

async function fetchSmartRecruitersCompany(config: SmartRecruitersCompanyConfig): Promise<Job[]> {
  const payload = await fetchJsonWithTimeout<{ content?: SmartRecruitersPosting[] }>(
    `https://api.smartrecruiters.com/v1/companies/${config.identifier}/postings?limit=100&offset=0`
  );
  const today = new Date().toISOString().slice(0, 10);

  return (payload.content ?? []).map((job) => {
    const location = buildSmartRecruitersLocation(job, config);
    const workMode = job.location?.remote ? "remote" : job.location?.hybrid ? "hybrid" : "on-site";

    return {
      id: `${config.id}-${job.id}`,
      title: stripTags(job.name),
      company: config.company,
      sector: "privato",
      location,
      city: inferCityFromLocation(location),
      workMode,
      contractType: inferContractType(
        [
          job.typeOfEmployment?.label ?? "",
          job.experienceLevel?.label ?? "",
          job.department?.label ?? "",
          buildSmartRecruitersSummary(job)
        ].join(" ")
      ),
      source: config.source,
      sourceType: "company-site",
      originalUrl: `${config.companyUrl}/${job.id}`,
      postedAt: toIsoDate(job.releasedDate) ?? today,
      expiresAt: null,
      discoveredAt: today,
      tags: buildTags(
        [
          job.location?.city ?? "",
          job.location?.region ?? "",
          job.industry?.label ?? "",
          job.department?.label ?? "",
          job.function?.label ?? "",
          job.typeOfEmployment?.label ?? "",
          job.experienceLevel?.label ?? "",
          "smartrecruiters",
          "career-site"
        ]
      ),
      summary: buildSmartRecruitersSummary(job),
      status: "nuova"
    } satisfies Job;
  });
}

export async function scrapeGreenhouseJobs() {
  return Promise.all(greenhouseBoards.map((board) => fetchGreenhouseBoard(board).catch(() => []))).then((items) => items.flat());
}

export async function scrapeLeverJobs() {
  return Promise.all(leverBoards.map((board) => fetchLeverBoard(board).catch(() => []))).then((items) => items.flat());
}

export async function scrapeSmartRecruitersJobs() {
  return Promise.all(
    smartRecruitersCompanies.map((company) => fetchSmartRecruitersCompany(company).catch(() => []))
  ).then((items) => items.flat());
}
