import { beforeEach, describe, expect, it, vi } from "vitest";
import { Job } from "@/lib/types";

const getEligibleSourceRegistryEntries = vi.fn();

vi.mock("@/lib/server/source-registry", () => ({
  getEligibleSourceRegistryEntries
}));

vi.mock("@/lib/data/private-jobs", () => ({
  privateJobsSeed: [
    {
      id: "seed-data-analyst",
      title: "Data Analyst",
      company: "Seed Company",
      sector: "privato",
      location: "Torino, Piemonte, Italia",
      city: "Torino",
      workMode: "hybrid",
      source: "Company Careers",
      sourceType: "company-site",
      originalUrl: "https://example.com/seed-data-analyst",
      postedAt: "2026-03-22",
      expiresAt: null,
      discoveredAt: "2026-03-24",
      tags: ["data", "analytics"],
      summary: "Ruolo seed non allineato alla query.",
      status: "nuova"
    }
  ]
}));

vi.mock("@/lib/server/agents/pa-requirements-extractor", () => ({
  extractPublicAdministrationRequirements: vi.fn(async () => ({
    requirementsText: null,
    requirementHighlights: [],
    requirementSourceUrl: null
  }))
}));

describe("baseline fetchJobs", () => {
  beforeEach(() => {
    getEligibleSourceRegistryEntries.mockReset();
  });

  it("uses local source fixtures, preserves source metrics and filters remote mismatches", async () => {
    const fetchedJobs: Job[] = [
      {
        id: "private-product-manager",
        title: "Product Manager",
        company: "Demo Company",
        sector: "privato",
        location: "Torino, Piemonte, Italia",
        city: "Torino",
        workMode: "hybrid",
        source: "Demo ATS",
        sourceType: "company-site",
        originalUrl: "https://example.com/product-manager",
        postedAt: "2026-03-23",
        expiresAt: null,
        discoveredAt: "2026-03-24",
        tags: ["product", "digital"],
        summary: "Roadmap digitale e stakeholder management.",
        status: "nuova"
      },
      {
        id: "private-backend-remote",
        title: "Backend Developer",
        company: "Demo Company",
        sector: "privato",
        location: "Torino, Piemonte, Italia",
        city: "Torino",
        workMode: "remote",
        source: "Demo ATS",
        sourceType: "company-site",
        originalUrl: "https://example.com/backend-developer",
        postedAt: "2026-03-21",
        expiresAt: null,
        discoveredAt: "2026-03-24",
        tags: ["java", "spring"],
        summary: "Ruolo remoto da escludere.",
        status: "nuova"
      }
    ];

    getEligibleSourceRegistryEntries.mockReturnValue([
      {
        id: "demo-private-source",
        label: "Demo Private Source",
        query: {
          roleKeywords: ["product manager"],
          skillKeywords: ["product"],
          location: "Torino",
          locationScope: "metro",
          workMode: null,
          seniority: null
        },
        fetcher: vi.fn(async () => fetchedJobs)
      }
    ]);

    const { fetchJobs } = await import("@/lib/server/job-search");
    const result = await fetchJobs({
      sector: "privato",
      q: "Product",
      location: "Torino",
      locationScope: "metro",
      includeRemote: false,
      workMode: "all",
      roleTargets: ["Product Manager"]
    });

    expect(result.jobs).toHaveLength(1);
    expect(result.jobs[0]?.id).toBe("private-product-manager");
    expect(result.publicPotentialJobs).toHaveLength(0);
    expect(result.consultedSources).toEqual(["Demo ATS", "Company Careers"]);
    expect(result.sourceFetchMetrics).toHaveLength(1);
    expect(result.sourceFetchMetrics[0]).toMatchObject({
      sourceId: "demo-private-source",
      sourceLabel: "Demo Private Source",
      fetchedJobs: 2,
      validJobs: 2,
      dedupedJobs: 2,
      success: true,
      query: {
        roleKeywords: ["product manager"],
        skillKeywords: ["product"],
        location: "Torino",
        locationScope: "metro",
        workMode: null,
        seniority: null
      }
    });
  });
});
