import { ContractType, Job, SourceQuery, WorkMode } from "@/lib/types";

type CareerTarget = {
  id: string;
  company: string;
  homepageUrl: string;
  preferredCareerUrls: string[];
  defaultLocation: string;
  defaultCity: string;
  tags: string[];
};

type HtmlAnchor = {
  href: string;
  text: string;
};

const torinoMetroCommunes = [
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
];

const localCareerTargets: CareerTarget[] = [
  {
    id: "intesa-sanpaolo",
    company: "Intesa Sanpaolo",
    homepageUrl: "https://group.intesasanpaolo.com",
    preferredCareerUrls: [
      "https://group.intesasanpaolo.com/it/careers",
      "https://group.intesasanpaolo.com/it/careers/posizioni-aperte"
    ],
    defaultLocation: "Torino, Piemonte, Italia",
    defaultCity: "Torino",
    tags: ["banking", "finance", "enterprise"]
  },
  {
    id: "reale-group",
    company: "Reale Group",
    homepageUrl: "https://www.realegroup.eu",
    preferredCareerUrls: ["https://www.realegroup.eu/IT/careers"],
    defaultLocation: "Torino, Piemonte, Italia",
    defaultCity: "Torino",
    tags: ["insurance", "finance", "corporate"]
  },
  {
    id: "lavazza",
    company: "Lavazza",
    homepageUrl: "https://www.lavazza.it",
    preferredCareerUrls: ["https://www.lavazza.it/it/lavora-con-noi", "https://careers.lavazza.com"],
    defaultLocation: "Torino, Piemonte, Italia",
    defaultCity: "Torino",
    tags: ["consumer", "international", "operations"]
  },
  {
    id: "prima-industrie",
    company: "Prima Industrie",
    homepageUrl: "https://www.primaindustrie.com",
    preferredCareerUrls: ["https://www.primaindustrie.com/it/lavora-con-noi"],
    defaultLocation: "Collegno, Torino, Italia",
    defaultCity: "Collegno",
    tags: ["industrial", "automation", "software"]
  },
  {
    id: "alpitour-world",
    company: "Alpitour World",
    homepageUrl: "https://www.alpitourworld.com",
    preferredCareerUrls: ["https://www.alpitourworld.com/it/lavora-con-noi"],
    defaultLocation: "Torino, Piemonte, Italia",
    defaultCity: "Torino",
    tags: ["travel", "digital", "consumer"]
  },
  {
    id: "basicnet",
    company: "BasicNet",
    homepageUrl: "https://www.basic.net",
    preferredCareerUrls: ["https://www.basic.net/careers"],
    defaultLocation: "Torino, Piemonte, Italia",
    defaultCity: "Torino",
    tags: ["fashion", "digital", "international"]
  },
  {
    id: "argotec",
    company: "Argotec",
    homepageUrl: "https://www.argotecgroup.com",
    preferredCareerUrls: ["https://www.argotecgroup.com/careers"],
    defaultLocation: "San Mauro Torinese, Torino, Italia",
    defaultCity: "San Mauro Torinese",
    tags: ["space", "engineering", "software"]
  },
  {
    id: "sorint-lab",
    company: "Sorint.Lab",
    homepageUrl: "https://www.sorint.com",
    preferredCareerUrls: ["https://careers.sorint.com"],
    defaultLocation: "Torino, Piemonte, Italia",
    defaultCity: "Torino",
    tags: ["cloud", "it-services", "consulting"]
  }
];

const careerLinkMatchers = [
  "lavora con noi",
  "careers",
  "career",
  "work with us",
  "join us",
  "jobs",
  "job opportunities",
  "posizioni aperte",
  "opportunita",
  "carriere"
];

const jobLinkMatchers = [
  "job",
  "jobs",
  "career",
  "position",
  "positions",
  "opening",
  "opportunity",
  "opportunita",
  "offerta",
  "vacancy",
  "role",
  "application"
];

const CAREER_PAGE_FETCH_TIMEOUT_MS = 3500;
const MAX_COMPANY_TARGETS = 6;
const MAX_CAREER_PAGES_PER_TARGET = 3;
const MAX_OFFER_URLS_PER_TARGET = 6;

function normalize(input: string) {
  return input.trim().toLowerCase();
}

function prioritizeCareerTarget(target: CareerTarget, query: SourceQuery) {
  const semanticHaystack = normalize([target.company, ...target.tags].join(" "));
  let score = 0;

  for (const token of [...query.roleKeywords, ...query.skillKeywords].map(normalize).filter(Boolean)) {
    if (semanticHaystack.includes(token)) {
      score += 3;
    }
  }

  if (target.defaultLocation.toLowerCase().includes("torino")) {
    score += 2;
  }

  return score;
}

function stripTags(input: string) {
  return input.replace(/<[^>]+>/g, " ");
}

function decodeHtmlEntities(input: string) {
  return input
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function cleanText(input: string) {
  return decodeHtmlEntities(stripTags(input)).replace(/\s+/g, " ").trim();
}

function truncate(input: string, limit: number) {
  return input.length <= limit ? input : `${input.slice(0, limit - 3).trim()}...`;
}

function unique<T>(values: T[]) {
  return [...new Set(values)];
}

function slugToTitle(input: string) {
  const value = input
    .replace(/[-_]+/g, " ")
    .replace(/\b(it|en|job|jobs|career|careers|position|positions)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!value) {
    return "";
  }

  return value.replace(/\b\w/g, (char) => char.toUpperCase());
}

function buildId(input: string) {
  let hash = 0;

  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) >>> 0;
  }

  return hash.toString(16);
}

function escapeRegex(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function absolutizeUrl(href: string, baseUrl: string) {
  try {
    return new URL(href, baseUrl).toString();
  } catch {
    return null;
  }
}

function hostOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function pathOf(url: string) {
  try {
    return new URL(url).pathname.toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}

function isLikelyAtsUrl(url: string) {
  const host = hostOf(url);
  return ["greenhouse.io", "lever.co", "smartrecruiters.com", "workdayjobs.com"].some((domain) => host.includes(domain));
}

function isSameSite(candidateUrl: string, referenceUrl: string) {
  const candidateHost = hostOf(candidateUrl);
  const referenceHost = hostOf(referenceUrl);
  return Boolean(candidateHost) && Boolean(referenceHost) && candidateHost === referenceHost;
}

function looksLikeCareerLink(anchor: HtmlAnchor) {
  const text = normalize(anchor.text);
  const href = normalize(anchor.href);
  return careerLinkMatchers.some((token) => text.includes(token) || href.includes(token));
}

function looksLikeJobLink(anchor: HtmlAnchor) {
  const text = normalize(anchor.text);
  const href = normalize(anchor.href);

  if (jobLinkMatchers.some((token) => text.includes(token) || href.includes(token))) {
    return true;
  }

  return /\/(job|jobs|career|careers|position|positions|opening|vacancy|opportunit|offerta|annuncio)\b/.test(href);
}

function extractAnchors(html: string, baseUrl: string) {
  const anchors: HtmlAnchor[] = [];
  const regex = /<a\b[^>]*href=["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi;

  for (const match of html.matchAll(regex)) {
    const absoluteUrl = absolutizeUrl(match[1], baseUrl);
    const text = cleanText(match[2]);

    if (!absoluteUrl || !text) {
      continue;
    }

    anchors.push({ href: absoluteUrl, text });
  }

  return anchors;
}

function extractTitle(html: string) {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return cleanText(titleMatch?.[1] ?? "");
}

function extractMetaDescription(html: string) {
  const metaMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([\s\S]*?)["'][^>]*>/i);
  return cleanText(metaMatch?.[1] ?? "");
}

function extractFirstParagraph(html: string) {
  const paragraphMatch = html.match(/<p\b[^>]*>([\s\S]*?)<\/p>/i);
  return cleanText(paragraphMatch?.[1] ?? "");
}

function inferWorkMode(text: string): WorkMode {
  const haystack = normalize(text);

  if (haystack.includes("remote")) {
    return "remote";
  }

  if (haystack.includes("hybrid") || haystack.includes("ibrido")) {
    return "hybrid";
  }

  return "on-site";
}

function inferContractType(text: string): ContractType {
  const haystack = normalize(text);

  if (
    haystack.includes("tirocinio") ||
    haystack.includes("stage") ||
    haystack.includes("internship") ||
    haystack.includes("curricular") ||
    haystack.includes("extracurricular")
  ) {
    return "tirocinio-retribuito";
  }

  if (haystack.includes("tempo indeterminato") || haystack.includes("permanent")) {
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

function inferPostedAt(html: string, fallbackDate: string) {
  const isoDateMatch = html.match(/\b(20\d{2}-\d{2}-\d{2})\b/);

  if (isoDateMatch) {
    return isoDateMatch[1];
  }

  const italianDateMatch = html.match(/\b(\d{2})\/(\d{2})\/(20\d{2})\b/);

  if (!italianDateMatch) {
    return fallbackDate;
  }

  return `${italianDateMatch[3]}-${italianDateMatch[2]}-${italianDateMatch[1]}`;
}

function inferLocation(text: string, fallbackLocation: string, fallbackCity: string) {
  const haystack = normalize(text);
  const commune = torinoMetroCommunes.find((candidate) => haystack.includes(candidate));

  if (commune) {
    return {
      city: commune
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" "),
      location: `${commune
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")}, Torino, Italia`
    };
  }

  return {
    city: fallbackCity,
    location: fallbackLocation
  };
}

function hasLocalSignal(text: string, fallbackCity: string) {
  const haystack = normalize(text);

  if (haystack.includes("torino") || haystack.includes("turin")) {
    return true;
  }

  if (torinoMetroCommunes.some((commune) => haystack.includes(commune))) {
    return true;
  }

  return haystack.includes(normalize(fallbackCity));
}

function textMatchesSemanticFocus(text: string, query: SourceQuery) {
  const semanticTokens = unique([...query.roleKeywords, ...query.skillKeywords].map(normalize).filter(Boolean));

  if (semanticTokens.length === 0) {
    return true;
  }

  const haystack = normalize(text);
  return semanticTokens.some((token) => haystack.includes(token));
}

async function fetchHtml(url: string) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CAREER_PAGE_FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: { "user-agent": "JobScraperMVP/1.0" },
      next: { revalidate: 0 },
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`Career page fetch failed: ${url} ${response.status}`);
    }

    return response.text();
  } finally {
    clearTimeout(timeoutId);
  }
}

async function resolveCareerPages(target: CareerTarget) {
  const urls = [...target.preferredCareerUrls];

  try {
    const homepageHtml = await fetchHtml(target.homepageUrl);
    const discoveredCareerUrls = extractAnchors(homepageHtml, target.homepageUrl)
      .filter(looksLikeCareerLink)
      .map((anchor) => anchor.href)
      .filter((url) => isSameSite(url, target.homepageUrl) || isLikelyAtsUrl(url));

    urls.push(...discoveredCareerUrls);
  } catch {
    return unique(urls);
  }

  return unique(urls);
}

async function extractOfferUrls(careerUrl: string) {
  const html = await fetchHtml(careerUrl);
  const anchors = extractAnchors(html, careerUrl);

  return unique(
    anchors
      .filter((anchor) => looksLikeJobLink(anchor))
      .map((anchor) => anchor.href)
      .filter((url) => isSameSite(url, careerUrl) || isLikelyAtsUrl(url))
  ).slice(0, 12);
}

async function buildJobFromOfferUrl(target: CareerTarget, offerUrl: string, query: SourceQuery, today: string) {
  if (isLikelyAtsUrl(offerUrl)) {
    return null;
  }

  try {
    const html = await fetchHtml(offerUrl);
    const pageTitle = extractTitle(html);
    const metaDescription = extractMetaDescription(html);
    const firstParagraph = extractFirstParagraph(html);
    const textBlob = [pageTitle, metaDescription, firstParagraph, cleanText(html).slice(0, 4000)].join(" ");

    if (!hasLocalSignal(textBlob, target.defaultCity)) {
      return null;
    }

    if (!textMatchesSemanticFocus(textBlob, query)) {
      return null;
    }

    const titleFromSlug = slugToTitle(pathOf(offerUrl).split("/").filter(Boolean).pop() ?? "");
    const title =
      truncate(
        pageTitle
          .replace(new RegExp(escapeRegex(target.company), "i"), "")
          .replace(/[|\-:].*$/, "")
          .trim() || titleFromSlug,
        90
      ) || "Posizione aperta";
    const summarySource = metaDescription || firstParagraph || pageTitle;
    const location = inferLocation(textBlob, target.defaultLocation, target.defaultCity);

    return {
      id: `${target.id}-${buildId(offerUrl)}`,
      title,
      company: target.company,
      sector: "privato",
      location: location.location,
      city: location.city,
      workMode: inferWorkMode(textBlob),
      contractType: inferContractType(textBlob),
      source: `${target.company} - Career page`,
      sourceType: "company-site",
      originalUrl: offerUrl,
      postedAt: inferPostedAt(html, today),
      expiresAt: null,
      discoveredAt: today,
      tags: unique(
        [...target.tags, ...query.roleKeywords, ...query.skillKeywords, "torino-metro", "career-discovery"].map(normalize)
      ).slice(0, 12),
      summary: truncate(summarySource || `Offerta individuata nella career page ufficiale di ${target.company}.`, 260),
      status: "nuova"
    } satisfies Job;
  } catch {
    return null;
  }
}

async function scrapeCompanyCareerTarget(target: CareerTarget, query: SourceQuery) {
  const today = new Date().toISOString().slice(0, 10);
  const careerPages = await resolveCareerPages(target);
  const offerUrls = unique(
    (
      await Promise.all(
        careerPages
          .filter((url) => !isLikelyAtsUrl(url))
          .slice(0, MAX_CAREER_PAGES_PER_TARGET)
          .map((careerUrl) => extractOfferUrls(careerUrl).catch(() => []))
      )
    ).flat()
  ).slice(0, MAX_OFFER_URLS_PER_TARGET);

  const jobs = await Promise.all(offerUrls.map((offerUrl) => buildJobFromOfferUrl(target, offerUrl, query, today)));
  return jobs.filter((job) => Boolean(job)) as Job[];
}

export async function scrapeTorinoPrivateCareerPages(query: SourceQuery) {
  const prioritizedTargets = [...localCareerTargets]
    .sort((left, right) => prioritizeCareerTarget(right, query) - prioritizeCareerTarget(left, query))
    .slice(0, MAX_COMPANY_TARGETS);
  const results = await Promise.all(
    prioritizedTargets.map((target) => scrapeCompanyCareerTarget(target, query).catch(() => []))
  );
  return results.flat();
}
