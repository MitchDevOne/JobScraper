import { Job } from "@/lib/types";

const LIST_URL = "https://trasparenza.cittametropolitana.torino.it/bandi-concorso";

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

function inferPostedAt(title: string) {
  const yearMatch = title.match(/\/(\d{4})/);
  const year = yearMatch?.[1] ?? new Date().toISOString().slice(0, 4);
  return `${year}-01-01`;
}

function inferTags(title: string) {
  const haystack = title.toLowerCase();
  const tags = [
    "ingegnere",
    "istruttore",
    "tecnico",
    "amministrativo",
    "elaborazione-dati",
    "vigilanza",
    "viabilita",
    "trasporti"
  ];

  return tags.filter((tag) => haystack.includes(tag.replace(/-/g, " ")));
}

export async function scrapeCittaMetropolitanaTorinoJobs(): Promise<Job[]> {
  const response = await fetch(LIST_URL, {
    headers: { "user-agent": "JobScraperMVP/1.0" },
    next: { revalidate: 0 }
  });

  if (!response.ok) {
    throw new Error(`Citta Metropolitana di Torino jobs fetch failed: ${response.status}`);
  }

  const html = await response.text();
  const today = new Date().toISOString().slice(0, 10);
  const sectionMatch = html.match(/<strong>CONCORSI PUBBLICI 2025<\/strong>([\s\S]*?)<hr>/i);
  const section = sectionMatch?.[1] ?? "";
  const itemRegex = /<p><a href="([^"]+)">([^<]+)<\/a><\/p>/gi;
  const jobs: Job[] = [];

  for (const match of section.matchAll(itemRegex)) {
    const originalUrl = decodeHtml(match[1]);
    const title = decodeHtml(stripTags(match[2]));

    if (!title.toLowerCase().includes("concorso pubblico")) {
      continue;
    }

    jobs.push({
      id: `cmto-${slugify(title)}`,
      title,
      company: "Citta Metropolitana di Torino",
      sector: "pubblico",
      location: "Torino, Piemonte, Italia",
      city: "Torino",
      workMode: "on-site",
      source: "Citta Metropolitana di Torino - Bandi di concorso",
      sourceType: "public-portal",
      originalUrl,
      postedAt: inferPostedAt(title),
      expiresAt: null,
      discoveredAt: today,
      tags: inferTags(title),
      summary: "Bando pubblico pubblicato nel portale trasparenza della Citta Metropolitana di Torino.",
      status: "nuova"
    });
  }

  return jobs.slice(0, 8);
}
