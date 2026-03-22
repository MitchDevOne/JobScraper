import { NextRequest, NextResponse } from "next/server";
import { filterJobs } from "@/lib/jobs";
import { SectorType, WorkMode } from "@/lib/types";

export function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const sector = (searchParams.get("sector") ?? "all") as SectorType | "all";
  const q = searchParams.get("q") ?? "";
  const workMode = (searchParams.get("workMode") ?? "all") as WorkMode | "all";
  const includeRemote = searchParams.get("includeRemote") === "true";
  const city = searchParams.get("city") ?? "Torino";

  const result = filterJobs({
    sector,
    q,
    workMode,
    includeRemote,
    city
  });

  return NextResponse.json({
    total: result.length,
    filters: { sector, q, workMode, includeRemote, city },
    jobs: result
  });
}
