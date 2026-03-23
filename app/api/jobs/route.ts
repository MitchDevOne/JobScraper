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

export async function GET(request: NextRequest) {
  const filters = getFilters(request.nextUrl.searchParams);
  const { jobs, publicPotentialJobs, consultedSources, previewJobs, suggestedRoles, activeRoleTargets } = await fetchJobs(filters);

  const response: SearchResponse = {
    total: jobs.length,
    jobs,
    publicPotentialJobs,
    cvKeywords: [],
    cvProfile: null,
    lastUpdatedAt: new Date().toISOString(),
    searchedLocation: filters.location ?? "",
    searchedLocationScope: filters.locationScope ?? "metro",
    consultedSources,
    previewJobs,
    suggestedRoles,
    activeRoleTargets
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

  if (file instanceof File && file.size > 0 && file.type === "application/pdf") {
    const arrayBuffer = await file.arrayBuffer();
    cvProfile = await parsePdfBuffer(Buffer.from(arrayBuffer));
  }

  const { jobs, publicPotentialJobs, consultedSources, previewJobs, suggestedRoles, activeRoleTargets } = await fetchJobs(filters, cvProfile);

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
    activeRoleTargets
  };

  return NextResponse.json(response);
}
