import { Job } from "@/lib/types";

const LIST_URL = "https://www.comune.torino.it/lavorare-comune/concorsi";
const ROOT_URL = "https://www.comune.torino.it";

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
    dicembre: "12",
    gen: "01",
    feb: "02",
    mar: "03",
    apr: "04",
    mag: "05",
    giu: "06",
    lug: "07",
    ago: "08",
    set: "09",
    ott: "10",
    nov: "11",
    dic: "12"
  };

  const normalized = input.replace(/\s+/g, " ").trim().toLowerCase();
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

async function scrapeDetail(url: string) {
  const response = await fetch(url, {
    headers: { "user-agent": "JobScraperMVP/1.0" },
    next: { revalidate: 0 }
  });

  if (!response.ok) {
    throw new Error(`Comune di Torino detail fetch failed: ${response.status}`);
  }

  const html = await response.text();
  const plainText = stripTags(html);
  const expiryMatch = plainText.match(/Scadenza invio candidature\s+(\d{1,2}\s+[A-Za-z]+\s+\d{4})/i);
  const descriptionMatch = plainText.match(/## Descrizione ## Testo\s+(.+?)\s+Aggiornamento del/i);
  const descriptionFallback = plainText.match(/## Descrizione ## Testo\s+(.+?)\s+## Tempi e scadenze/i);

  return {
    expiresAt: expiryMatch ? toIsoDate(expiryMatch[1]) : null,
    summary: decodeHtml((descriptionMatch?.[1] ?? descriptionFallback?.[1] ?? "").trim())
  };
}

export async function scrapeComuneTorinoJobs(): Promise<Job[]> {
  const response = await fetch(LIST_URL, {
    headers: { "user-agent": "JobScraperMVP/1.0" },
    next: { revalidate: 0 }
  });

  if (!response.ok) {
    throw new Error(`Comune di Torino list fetch failed: ${response.status}`);
  }

  const html = await response.text();
  const today = new Date().toISOString().slice(0, 10);
  const itemRegex =
    /## Data di pubblicazione\s*([\s\S]{0,40}?\d{1,2}\s+[A-Za-z]+\s+\d{4})[\s\S]{0,120}?###\s*<a[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a>/gi;

  const listings: Array<{ postedAt: string; url: string; title: string }> = [];

  for (const match of html.matchAll(itemRegex)) {
    const postedAt = toIsoDate(stripTags(match[1]));
    const href = match[2];
    const title = decodeHtml(stripTags(match[3]));

    if (!postedAt || !href || !title.toLowerCase().includes("concorso")) {
      continue;
    }

    listings.push({
      postedAt,
      url: href.startsWith("http") ? href : `${ROOT_URL}${href}`,
      title
    });
  }

  const detailedJobs = await Promise.all(
    listings.slice(0, 8).map(async (item, index) => {
      try {
        const detail = await scrapeDetail(item.url);

        if (!detail.expiresAt || detail.expiresAt < today) {
          return null;
        }

        return {
          id: `comune-torino-${index}-${detail.expiresAt}`,
          title: item.title,
          company: "Comune di Torino",
          sector: "pubblico",
          location: "Torino, Piemonte, Italia",
          city: "Torino",
          workMode: "on-site",
          source: "Comune di Torino - Concorsi",
          sourceType: "public-portal",
          originalUrl: item.url,
          postedAt: item.postedAt,
          expiresAt: detail.expiresAt,
          discoveredAt: today,
          tags: ["concorso", "pubblico", "comune-di-torino"],
          summary: detail.summary || "Bando pubblico del Comune di Torino.",
          status: "nuova"
        } satisfies Job;
      } catch {
        return null;
      }
    })
  );

  return detailedJobs.filter((job): job is NonNullable<typeof job> => job !== null);
}
