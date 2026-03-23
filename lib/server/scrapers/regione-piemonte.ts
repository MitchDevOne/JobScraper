import { Job } from "@/lib/types";

const LIST_URL = "https://trasparenza.regione.piemonte.it/bandi-concorso";

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

function inferTags(text: string) {
  const haystack = text.toLowerCase();
  const dictionary = [
    "istruttore",
    "amministrativo",
    "contabile",
    "funzionari",
    "tecnica",
    "fesr",
    "sanita",
    "forestale",
    "torino"
  ];

  return dictionary.filter((tag) => haystack.includes(tag.replace(/-/g, " ")));
}

function inferLocation(text: string) {
  const normalized = text.toLowerCase();

  if (normalized.includes("torino")) {
    return { location: "Torino, Piemonte, Italia", city: "Torino" };
  }

  return { location: "Piemonte, Italia", city: "Piemonte" };
}

function inferExpiryDate(text: string) {
  const match = text.match(/scadenza(?: presentazione candidature)?\s+(\d{1,2})[./](\d{1,2})[./](\d{4})/i);

  if (!match) {
    return null;
  }

  const [, day, month, year] = match;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

export async function scrapeRegionePiemonteJobs(): Promise<Job[]> {
  const response = await fetch(LIST_URL, {
    headers: { "user-agent": "JobScraperMVP/1.0" },
    next: { revalidate: 0 }
  });

  if (!response.ok) {
    throw new Error(`Regione Piemonte jobs fetch failed: ${response.status}`);
  }

  const html = await response.text();
  const today = new Date().toISOString().slice(0, 10);
  const itemRegex =
    /((?:Selezione pubblica|Concorso pubblico|Avviso pubblico di mobilità)[\s\S]{30,900}?)<a[^>]+href="([^"]*bandi\.regione\.piemonte\.it[^"]+)"[^>]*>/gi;
  const jobs: Job[] = [];
  const seen = new Set<string>();

  for (const match of html.matchAll(itemRegex)) {
    const rawText = decodeHtml(stripTags(match[1]));
    const title = rawText.split("BANDO N.")[0]?.trim() ?? rawText;
    const originalUrl = match[2];
    const expiresAt = inferExpiryDate(rawText);
    const dedupeKey = slugify(`${title}-${originalUrl}`);

    if (!title || seen.has(dedupeKey)) {
      continue;
    }

    if (expiresAt && expiresAt < today) {
      continue;
    }

    seen.add(dedupeKey);
    const inferredLocation = inferLocation(rawText);

    jobs.push({
      id: `regione-piemonte-${dedupeKey}`,
      title,
      company: "Regione Piemonte",
      sector: "pubblico",
      location: inferredLocation.location,
      city: inferredLocation.city,
      workMode: "on-site",
      source: "Regione Piemonte - Bandi di concorso",
      sourceType: "public-portal",
      originalUrl,
      postedAt: today,
      expiresAt,
      discoveredAt: today,
      tags: ["regione-piemonte", "pubblico", ...inferTags(rawText)].slice(0, 8),
      summary: rawText,
      status: "nuova",
      requirementSourceUrl: originalUrl
    });
  }

  return jobs.slice(0, 20);
}
