import { Job } from "@/lib/types";

type RequirementsExtraction = {
  requirementsText: string | null;
  requirementHighlights: string[];
  requirementSourceUrl: string | null;
};

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

function absolutizeUrl(input: string, baseUrl: string) {
  try {
    return new URL(input, baseUrl).toString();
  } catch {
    return input;
  }
}

function normalize(input: string) {
  return input.toLowerCase().replace(/\s+/g, " ").trim();
}

function extractRelevantParagraphs(text: string) {
  const patterns = [
    "requisiti di ammissione",
    "titolo di studio",
    "titoli di studio",
    "requisiti specifici",
    "abilitazione",
    "iscrizione all'albo",
    "equipoll",
    "equiparat",
    "riserva",
    "preferenze",
    "ammissione"
  ];

  return text
    .split(/\n{2,}|(?<=\.)\s+(?=[A-ZÀ-Ú])/)
    .map((chunk) => decodeHtml(stripTags(chunk)))
    .map((chunk) => chunk.replace(/\s+/g, " ").trim())
    .filter((chunk) => chunk.length > 20)
    .filter((chunk) => patterns.some((pattern) => normalize(chunk).includes(pattern)))
    .slice(0, 10);
}

async function parsePdfUrl(url: string) {
  const response = await fetch(url, {
    headers: { "user-agent": "JobScraperMVP/1.0" },
    next: { revalidate: 0 }
  });

  if (!response.ok) {
    throw new Error(`PDF fetch failed: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const { default: pdfParse } = await import("pdf-parse/lib/pdf-parse.js");
  const parsed = await pdfParse(Buffer.from(arrayBuffer));
  return parsed.text;
}

async function fetchHtml(url: string) {
  const response = await fetch(url, {
    headers: { "user-agent": "JobScraperMVP/1.0" },
    next: { revalidate: 0 }
  });

  if (!response.ok) {
    throw new Error(`HTML fetch failed: ${response.status}`);
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("pdf")) {
    return {
      html: "",
      contentType
    };
  }

  return {
    html: await response.text(),
    contentType
  };
}

async function extractComuneTorinoRequirements(job: Job): Promise<RequirementsExtraction> {
  const { html } = await fetchHtml(job.originalUrl);
  const documentPageMatch = html.match(/href="([^"]*\/amministrazione\/documenti-dati\/documenti\/[^"]+)"/i);
  const detailText = decodeHtml(stripTags(html));

  if (!documentPageMatch) {
    const highlights = extractRelevantParagraphs(detailText);
    return {
      requirementsText: highlights.join("\n\n") || detailText,
      requirementHighlights: highlights,
      requirementSourceUrl: job.originalUrl
    };
  }

  const documentPageUrl = absolutizeUrl(documentPageMatch[1], job.originalUrl);
  const { html: documentHtml } = await fetchHtml(documentPageUrl);
  const pdfMatch = documentHtml.match(/href="([^"]+\.pdf)"/i);

  if (!pdfMatch) {
    const documentText = decodeHtml(stripTags(documentHtml));
    const highlights = extractRelevantParagraphs(documentText);
    return {
      requirementsText: highlights.join("\n\n") || documentText,
      requirementHighlights: highlights,
      requirementSourceUrl: documentPageUrl
    };
  }

  const pdfUrl = absolutizeUrl(pdfMatch[1], documentPageUrl);
  const pdfText = await parsePdfUrl(pdfUrl);
  const highlights = extractRelevantParagraphs(pdfText);

  return {
    requirementsText: highlights.join("\n\n") || pdfText,
    requirementHighlights: highlights,
    requirementSourceUrl: pdfUrl
  };
}

async function extractInpaRequirements(job: Job): Promise<RequirementsExtraction> {
  const { html, contentType } = await fetchHtml(job.originalUrl);

  if (contentType.includes("pdf")) {
    const pdfText = await parsePdfUrl(job.originalUrl);
    const highlights = extractRelevantParagraphs(pdfText);
    return {
      requirementsText: highlights.join("\n\n") || pdfText,
      requirementHighlights: highlights,
      requirementSourceUrl: job.originalUrl
    };
  }

  const pageText = decodeHtml(stripTags(html));
  const pdfLinks = [...html.matchAll(/href="([^"]+\.pdf[^"]*)"/gi)].map((match) => absolutizeUrl(match[1], job.originalUrl));

  if (pdfLinks.length > 0) {
    try {
      const pdfText = await parsePdfUrl(pdfLinks[0]);
      const highlights = extractRelevantParagraphs(pdfText);
      return {
        requirementsText: highlights.join("\n\n") || pdfText,
        requirementHighlights: highlights,
        requirementSourceUrl: pdfLinks[0]
      };
    } catch {
      const highlights = extractRelevantParagraphs(pageText);
      return {
        requirementsText: highlights.join("\n\n") || pageText,
        requirementHighlights: highlights,
        requirementSourceUrl: job.originalUrl
      };
    }
  }

  const highlights = extractRelevantParagraphs(pageText);
  return {
    requirementsText: highlights.join("\n\n") || pageText,
    requirementHighlights: highlights,
    requirementSourceUrl: job.originalUrl
  };
}

export async function extractPublicAdministrationRequirements(job: Job): Promise<RequirementsExtraction> {
  try {
    if (job.source.includes("Comune di Torino")) {
      return await extractComuneTorinoRequirements(job);
    }

    if (job.source.includes("inPA")) {
      return await extractInpaRequirements(job);
    }

    const { html } = await fetchHtml(job.originalUrl);
    const text = decodeHtml(stripTags(html));
    const highlights = extractRelevantParagraphs(text);
    return {
      requirementsText: highlights.join("\n\n") || text,
      requirementHighlights: highlights,
      requirementSourceUrl: job.originalUrl
    };
  } catch {
    return {
      requirementsText: null,
      requirementHighlights: [],
      requirementSourceUrl: job.originalUrl
    };
  }
}
