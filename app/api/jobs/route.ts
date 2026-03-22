import { NextRequest, NextResponse } from "next/server";
import { extractKeywords } from "@/lib/server/cv-profile";
import { fetchJobs } from "@/lib/server/job-search";
import { SectorType, SearchResponse, WorkMode } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getFilters(searchParams: URLSearchParams) {
  return {
    sector: (searchParams.get("sector") ?? "all") as SectorType | "all",
    q: searchParams.get("q") ?? "",
    workMode: (searchParams.get("workMode") ?? "all") as WorkMode | "all",
    includeRemote: searchParams.get("includeRemote") === "true",
    city: searchParams.get("city") ?? "Torino"
  };
}

export async function GET(request: NextRequest) {
  const filters = getFilters(request.nextUrl.searchParams);
  const jobs = await fetchJobs(filters);

  const response: SearchResponse = {
    total: jobs.length,
    jobs,
    cvKeywords: [],
    lastUpdatedAt: new Date().toISOString()
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
    city: formData.get("city")?.toString() ?? "Torino"
  };

  const file = formData.get("cv");
  let cvKeywords: string[] = [];

  if (file instanceof File && file.size > 0 && file.type === "application/pdf") {
    const { default: pdfParse } = await import("pdf-parse");
    const arrayBuffer = await file.arrayBuffer();
    const parsed = await pdfParse(Buffer.from(arrayBuffer));
    cvKeywords = extractKeywords(parsed.text);
  }

  const jobs = await fetchJobs(filters, cvKeywords);

  const response: SearchResponse = {
    total: jobs.length,
    jobs,
    cvKeywords,
    lastUpdatedAt: new Date().toISOString()
  };

  return NextResponse.json(response);
}
