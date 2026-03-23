import { Job } from "@/lib/types";

const API_BASE_URL = "https://portale.inpa.gov.it";
const PUBLIC_SITE_URL = "https://www.inpa.gov.it";
const USER_AGENT = "JobScraperMVP/1.0";

type InpaListing = {
  id: string;
  titolo: string;
  descrizione?: string | null;
  descrizioneBreve?: string | null;
  figuraRicercata?: string | null;
  dataPubblicazione?: string | null;
  dataScadenza?: string | null;
  linkReindirizzamento?: string | null;
  sedi?: string[] | null;
  settori?: string[] | null;
  categorie?: string[] | null;
  entiRiferimento?: string[] | null;
  numPosti?: number | null;
  calculatedStatus?: string | null;
  salaryMax?: number | null;
};

type InpaSearchResponse = {
  content?: InpaListing[];
  totalPages?: number;
};

const regionIdsByLocation: Record<string, string> = {
  torino: "12",
  piemonte: "12",
  milano: "9",
  lombardia: "9",
  roma: "7",
  lazio: "7",
  bologna: "5",
  emilia: "5"
};

const metroCommunes = [
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

function normalize(input: string) {
  return input.trim().toLowerCase();
}

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

function guessRegionId(location: string) {
  const normalizedLocation = normalize(location);

  for (const [key, value] of Object.entries(regionIdsByLocation)) {
    if (normalizedLocation.includes(key)) {
      return value;
    }
  }

  return null;
}

function buildDetailUrl(id: string) {
  return `${PUBLIC_SITE_URL}/bandi-e-avvisi/dettaglio-bando-avviso/?concorso_id=${id}`;
}

function inferCity(listing: InpaListing) {
  const haystack = normalize(
    [
      ...(listing.sedi ?? []),
      listing.titolo,
      listing.figuraRicercata ?? "",
      stripTags(listing.descrizione ?? ""),
      stripTags(listing.descrizioneBreve ?? "")
    ].join(" ")
  );

  for (const commune of metroCommunes) {
    if (haystack.includes(commune)) {
      return commune === "torino" ? "Torino" : commune.replace(/\b\w/g, (char) => char.toUpperCase());
    }
  }

  const locationCandidate = (listing.sedi ?? []).find((item) => normalize(item) !== "piemonte");
  return locationCandidate ?? "Italia";
}

function buildLocation(listing: InpaListing) {
  const segments = (listing.sedi ?? []).filter(Boolean);
  return segments.length > 0 ? `${segments.join(", ")}, Italia` : "Italia";
}

function buildSummary(listing: InpaListing) {
  const pieces = [
    decodeHtml(stripTags(listing.descrizioneBreve ?? "")),
    decodeHtml(stripTags(listing.figuraRicercata ?? "")),
    listing.numPosti ? `${listing.numPosti} posti` : "",
    listing.salaryMax ? `RAL fino a EUR ${Math.round(listing.salaryMax)}` : ""
  ].filter(Boolean);

  return pieces[0] ?? (pieces.join(" - ") || "Bando pubblico consultato da inPA.");
}

function buildTags(listing: InpaListing) {
  const tags = new Set<string>();
  const rawTags = [
    ...(listing.categorie ?? []),
    ...(listing.settori ?? []),
    listing.figuraRicercata ?? "",
    ...(listing.sedi ?? [])
  ];

  for (const item of rawTags) {
    const normalized = normalize(item).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

    if (normalized) {
      tags.add(normalized);
    }
  }

  tags.add("inpa");
  tags.add("pubblico");
  return [...tags].slice(0, 8);
}

export async function scrapeInpaJobs(location: string): Promise<Job[]> {
  const regionId = guessRegionId(location);
  const normalizedLocation = normalize(location);
  const body = {
    text: normalizedLocation.includes("torino") ? "" : location,
    categoriaId: null,
    regioneId: regionId,
    status: ["OPEN"],
    settoreId: null,
    provinciaCodice: null,
    dateFrom: null,
    dateTo: null,
    livelliAnzianitaIds: null,
    tipoImpiegoId: null,
    salaryMin: null,
    salaryMax: null,
    enteRiferimentoName: ""
  };

  const today = new Date().toISOString().slice(0, 10);
  const pageSize = 60;
  const maxPages = 4;
  const pages = await Promise.all(
    Array.from({ length: maxPages }, async (_, page) => {
      const response = await fetch(
        `${API_BASE_URL}/concorsi-smart/api/concorso-public-area/search-better?page=${page}&size=${pageSize}`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "user-agent": USER_AGENT
          },
          body: JSON.stringify(body),
          next: { revalidate: 0 }
        }
      );

      if (!response.ok) {
        throw new Error(`inPA jobs fetch failed: ${response.status}`);
      }

      return (await response.json()) as InpaSearchResponse;
    })
  );

  return pages
    .flatMap((payload) => payload.content ?? [])
    .filter((listing) => listing.calculatedStatus === "OPEN" && !!listing.id && !!listing.titolo && !!listing.dataScadenza)
    .filter((listing) => (listing.dataScadenza ?? "").slice(0, 10) >= today)
    .map((listing) => {
      const originalUrl = listing.linkReindirizzamento || buildDetailUrl(listing.id);

      return {
        id: `inpa-${listing.id}`,
        title: decodeHtml(stripTags(listing.titolo)),
        company: listing.entiRiferimento?.[0] ?? "Ente pubblico su inPA",
        sector: "pubblico",
        location: buildLocation(listing),
        city: inferCity(listing),
        workMode: "on-site",
        source: "inPA - Bandi e avvisi",
        sourceType: "public-portal",
        originalUrl,
        postedAt: (listing.dataPubblicazione ?? today).slice(0, 10),
        expiresAt: (listing.dataScadenza ?? null)?.slice(0, 10) ?? null,
        discoveredAt: today,
        tags: buildTags(listing),
        summary: buildSummary(listing),
        status: "nuova"
      } satisfies Job;
    });
}
