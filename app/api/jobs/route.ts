import { NextRequest, NextResponse } from "next/server";
import { buildCvProfile } from "@/lib/server/cv-profile";
import { fetchJobs } from "@/lib/server/job-search";
import { LocationScope, SearchResponse, SectorType, WorkMode } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getFilters(searchParams: URLSearchParams) {
  return {
    sector: (searchParams.get("sector") ?? "all") as SectorType | "all",
    q: searchParams.get("q") ?? "",
    workMode: (searchParams.get("workMode") ?? "all") as WorkMode | "all",
    includeRemote: searchParams.get("includeRemote") === "true",
    location: searchParams.get("location") ?? "Torino",
    locationScope: (searchParams.get("locationScope") ?? "metro") as LocationScope,
    roleTargets: searchParams.getAll("roleTarget")
  };
}

async function parsePdfBuffer(buffer: Buffer) {
  const { default: pdfParse } = await import("pdf-parse/lib/pdf-parse.js");
  const parsed = await pdfParse(buffer);
  return buildCvProfile(parsed.text);
}

function isPdfUpload(file: File) {
  const mimeType = file.type.toLowerCase();
  const fileName = file.name.toLowerCase();

  return file.size > 0 && (mimeType === "application/pdf" || mimeType === "" || fileName.endsWith(".pdf"));
}

export async function GET(request: NextRequest) {
  const filters = getFilters(request.nextUrl.searchParams);
  const response: SearchResponse = {
    total: 0,
    jobs: [],
    publicPotentialJobs: [],
    cvKeywords: [],
    cvProfile: null,
    lastUpdatedAt: new Date().toISOString(),
    searchedLocation: filters.location ?? "",
    searchedLocationScope: filters.locationScope ?? "metro",
    consultedSources: [],
    previewJobs: [],
    suggestedRoles: [],
    activeRoleTargets: [],
    sourceFetchMetrics: []
  };

  return NextResponse.json(response);
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const filters = {
    sector: (formData.get("sector")?.toString() ?? "all") as SectorType | "all",
    q: formData.get("q")?.toString() ?? "",
    workMode: (formData.get("workMode")?.toString() ?? "all") as WorkMode | "all",
    includeRemote: formData.get("includeRemote")?.toString() === "true",
    location: formData.get("location")?.toString() ?? "Torino",
    locationScope: (formData.get("locationScope")?.toString() ?? "metro") as LocationScope,
    roleTargets: JSON.parse(formData.get("roleTargets")?.toString() ?? "[]") as string[]
  };

  const file = formData.get("cv");
  let cvProfile = null;

  if (file instanceof File && isPdfUpload(file)) {
    const arrayBuffer = await file.arrayBuffer();
    cvProfile = await parsePdfBuffer(Buffer.from(arrayBuffer));
  } else {
    return NextResponse.json({ error: "Carica un CV PDF valido per avviare l'analisi." }, { status: 400 });
  }

  const { jobs, publicPotentialJobs, consultedSources, previewJobs, suggestedRoles, activeRoleTargets, sourceFetchMetrics } =
    await fetchJobs(filters, cvProfile);

  const response: SearchResponse = {
    total: jobs.length,
    jobs,
    publicPotentialJobs,
    cvKeywords: cvProfile?.keywords ?? [],
    cvProfile,
    lastUpdatedAt: new Date().toISOString(),
    searchedLocation: filters.location ?? "",
    searchedLocationScope: filters.locationScope ?? "metro",
    consultedSources,
    previewJobs,
    suggestedRoles,
    activeRoleTargets,
    sourceFetchMetrics
  };

  return NextResponse.json(response);
}
