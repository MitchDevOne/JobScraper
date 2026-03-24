import { describe, expect, it } from "vitest";
import { evaluatePrivateExperienceAlignment } from "@/lib/server/agents/private-experience-agent";
import { CvProfile, Job } from "@/lib/types";

function createPrivateJob(overrides: Partial<Job> = {}): Job {
  return {
    id: "private-job-1",
    title: "Product Manager",
    company: "Demo Company",
    sector: "privato",
    location: "Torino, Piemonte, Italia",
    city: "Torino",
    workMode: "hybrid",
    source: "Demo Careers",
    sourceType: "company-site",
    originalUrl: "https://example.com/private-job",
    postedAt: "2026-03-20",
    expiresAt: null,
    discoveredAt: "2026-03-24",
    tags: ["product", "digital"],
    summary: "Ruolo di product management con stakeholder management e roadmap digitale.",
    status: "nuova",
    ...overrides
  };
}

const productCv: CvProfile = {
  keywords: ["product", "roadmap", "stakeholder"],
  titles: ["product manager"],
  skills: ["scrum", "project management"],
  experienceAreas: ["project management", "digital transformation"],
  educationLevels: ["master"],
  studyAreas: ["business administration"],
  yearsOfExperience: 6,
  preferredLocations: ["torino"]
};

describe("baseline private gate", () => {
  it("treats a family-aligned product role as compatible", () => {
    const result = evaluatePrivateExperienceAlignment(
      {
        roleMatches: 1,
        skillMatches: 2,
        experienceMatches: 1,
        educationMatches: 1,
        developerOnlyJob: false,
        developerProfile: false
      },
      createPrivateJob(),
      productCv
    );

    expect(result.passes).toBe(true);
    expect(result.status).toBe("compatible");
    expect(result.reasons).toEqual(expect.arrayContaining(["titolo coerente col CV", "skill dal CV"]));
  });

  it("penalizes a developer-only job for a non developer profile", () => {
    const result = evaluatePrivateExperienceAlignment(
      {
        roleMatches: 0,
        skillMatches: 1,
        experienceMatches: 0,
        educationMatches: 0,
        developerOnlyJob: true,
        developerProfile: false
      },
      createPrivateJob({
        title: "Backend Developer",
        tags: ["java", "spring", "backend"],
        summary: "Ruolo backend developer con Java e Spring."
      }),
      productCv
    );

    expect(result.passes).toBe(false);
    expect(result.status).toBe("partial");
    expect(result.reasons).toEqual(expect.arrayContaining(["profilo non pienamente developer"]));
    expect(result.scoreBoost).toBeLessThan(0);
  });
});
