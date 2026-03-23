import { Job } from "@/lib/types";

const LIST_URL = "https://www.to.camcom.it/selezioni-corso";
const ROOT_URL = "https://www.to.camcom.it";

function stripTags(input: string) {
  return input.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function decodeHtml(input: string) {
  return input
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'");
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toIsoDate(input: string) {
  const months: Record<string, string> = {
    gennaio: "01",
    febbraio: "02",
    marzo: "03",
    aprile: "04",
    maggio: "05",
    giugno: "06",
    luglio: "07",
    agosto: "08",
    settembre: "09",
    ottobre: "10",
    novembre: "11",
    dicembre: "12"
  };

  const normalized = input.toLowerCase().replace(/\s+/g, " ").trim();
  const match = normalized.match(/(\d{1,2})\s+([a-z]+)\s+(\d{4})/i);

  if (!match) {
    return null;
  }

  const [, day, month, year] = match;
  const monthNumber = months[month];

  if (!monthNumber) {
    return null;
  }

  return `${year}-${monthNumber}-${day.padStart(2, "0")}`;
}

function inferTags(text: string) {
  const haystack = text.toLowerCase();
  const dictionary = [
    "funzionario",
    "anagrafici",
    "regolazione",
    "e-government",
    "ict",
    "amministrativo",
    "pubblicita-legale",
    "mercato"
  ];

  return dictionary.filter((tag) => haystack.includes(tag.replace(/-/g, " ")));
}

export async function scrapeCameraCommercioTorinoJobs(): Promise<Job[]> {
  const response = await fetch(LIST_URL, {
    headers: { "user-agent": "JobScraperMVP/1.0" },
    next: { revalidate: 0 }
  });

  if (!response.ok) {
    throw new Error(`Camera di Commercio Torino jobs fetch failed: ${response.status}`);
  }

  const html = await response.text();
  const today = new Date().toISOString().slice(0, 10);
  const itemRegex =
    /(Selezione pubblica[\s\S]{30,500}?)(?:<a[^>]+href="([^"]+\.pdf[^"]*)"[^>]*>[^<]*avviso[^<]*<\/a>)([\s\S]{0,400}?)(?=(?:<hr|Selezione pubblica|<\/article>|###|$))/gi;
  const jobs: Job[] = [];

  for (const match of html.matchAll(itemRegex)) {
    const title = decodeHtml(stripTags(match[1]));
    const pdfUrl = match[2].startsWith("http") ? match[2] : `${ROOT_URL}${match[2]}`;
    const trailingBlock = decodeHtml(stripTags(match[3] ?? ""));
    const expiryMatch = trailingBlock.match(/scadenza\s+(\d{1,2}\s+[a-z]+\s+\d{4})/i);
    const expiresAt = expiryMatch ? toIsoDate(expiryMatch[1]) : null;

    if (!title || (expiresAt && expiresAt < today)) {
      continue;
    }

    jobs.push({
      id: `cciaa-to-${slugify(title)}`,
      title,
      company: "Camera di commercio di Torino",
      sector: "pubblico",
      location: "Torino, Piemonte, Italia",
      city: "Torino",
      workMode: "on-site",
      source: "Camera di commercio di Torino - Selezioni pubbliche",
      sourceType: "public-portal",
      originalUrl: pdfUrl,
      postedAt: today,
      expiresAt,
      discoveredAt: today,
      tags: ["camera-commercio-torino", "pubblico", ...inferTags(`${title} ${trailingBlock}`)].slice(0, 8),
      summary: trailingBlock || "Selezione pubblica della Camera di commercio di Torino.",
      status: "nuova",
      requirementSourceUrl: pdfUrl
    });
  }

  return jobs;
}
