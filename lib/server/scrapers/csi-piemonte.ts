import { Job } from "@/lib/types";

const LIST_URL = "https://www.csipiemonte.it/it/chi-siamo/azienda/lavora-con-noi/avvisi-di-selezione";
const ROOT_URL = "https://www.csipiemonte.it";

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

function extractTags(title: string, summary: string) {
  const haystack = `${title} ${summary}`.toLowerCase();
  const dictionary = [
    "cloud",
    "security",
    "network",
    "database",
    "data",
    "analytics",
    "developer",
    "devops",
    "system",
    "architect",
    "project-management",
    "supporto",
    "windows",
    "cisco",
    "palo-alto"
  ];

  return dictionary.filter((tag) => haystack.includes(tag.replace(/-/g, " ")));
}

export async function scrapeCsiPiemonteJobs(): Promise<Job[]> {
  const response = await fetch(LIST_URL, {
    headers: { "user-agent": "JobScraperMVP/1.0" },
    next: { revalidate: 0 }
  });

  if (!response.ok) {
    throw new Error(`CSI Piemonte jobs fetch failed: ${response.status}`);
  }

  const html = await response.text();
  const today = new Date().toISOString().slice(0, 10);
  const blockRegex = /<div class="selezioni-aperte-no-accordion">([\s\S]*?)<\/div>/gi;
  const jobs: Job[] = [];

  for (const match of html.matchAll(blockRegex)) {
    const block = match[1];
    const plainText = decodeHtml(stripTags(block));
    const titleMatch = plainText.match(/^(.+?)\s+(?:â€“|–|-)\s*Rif\s+\d+\/\d{4}/i);
    const deadlineMatch = plainText.match(/Scadenza\s+\S+\s+(\d{1,2}\s+[a-z]+\s+\d{4})/i);
    const summaryMatch = block.match(/<\/small><\/p>(?:<p>(.*?)<\/p>)?/i);
    const pdfMatch = block.match(/href="([^"]+\.pdf)"/i);
    const expired = /ANNUNCIO SCADUTO/i.test(block);
    const title = decodeHtml(stripTags(titleMatch?.[1] ?? ""));
    const expiresAt = deadlineMatch ? toIsoDate(deadlineMatch[1]) : null;
    const summary = decodeHtml(stripTags(summaryMatch?.[1] ?? ""));

    if (!title || expired || !expiresAt || expiresAt < today || !pdfMatch) {
      continue;
    }

    const originalUrl = pdfMatch[1].startsWith("http") ? pdfMatch[1] : `${ROOT_URL}${pdfMatch[1]}`;
    jobs.push({
      id: `csi-${slugify(title)}-${expiresAt}`,
      title,
      company: "CSI Piemonte",
      sector: "privato",
      location: "Torino, Piemonte, Italia",
      city: "Torino",
      workMode: "hybrid",
      source: "CSI Piemonte - Avvisi di selezione",
      sourceType: "company-site",
      originalUrl,
      postedAt: today,
      expiresAt,
      discoveredAt: today,
      tags: extractTags(title, summary),
      summary: summary || "Selezione aperta pubblicata sul sito ufficiale di CSI Piemonte.",
      status: "nuova"
    });
  }

  return jobs;
}
