import { describe, expect, it } from "vitest";
import { evaluatePublicAdministrationRequirements } from "@/lib/server/agents/public-requirements-agent";
import { CvProfile, Job } from "@/lib/types";

function createPublicJob(overrides: Partial<Job> = {}): Job {
  return {
    id: "public-job-1",
    title: "Funzionario amministrativo",
    company: "Comune Demo",
    sector: "pubblico",
    location: "Torino, Piemonte, Italia",
    city: "Torino",
    workMode: "on-site",
    source: "Demo Source",
    sourceType: "public-portal",
    originalUrl: "https://example.com/public-job",
    postedAt: "2026-03-20",
    expiresAt: "2026-04-20",
    discoveredAt: "2026-03-24",
    tags: ["pubblico", "amministrativo"],
    summary: "Concorso pubblico per profilo amministrativo.",
    status: "nuova",
    ...overrides
  };
}

const businessCv: CvProfile = {
  keywords: ["economia", "management"],
  titles: ["project management officer"],
  skills: ["project management", "power bi"],
  experienceAreas: ["project management", "public administration"],
  educationLevels: ["master", "mba"],
  studyAreas: ["business administration"],
  yearsOfExperience: 5,
  preferredLocations: ["torino"]
};

describe("baseline public administration gate", () => {
  it("marks a strongly aligned PA job as compatible", () => {
    const job = createPublicJob({
      requirementHighlights: [
        "Titolo di studio richiesto: laurea magistrale in economia, management o discipline equipollenti."
      ],
      requirementsText:
        "Requisiti di ammissione: laurea magistrale in economia, management o discipline equipollenti."
    });

    const result = evaluatePublicAdministrationRequirements(
      {
        roleMatches: 1,
        skillMatches: 1,
        experienceMatches: 1,
        educationMatches: 2
      },
      job,
      businessCv
    );

    expect(result.passes).toBe(true);
    expect(result.potentialPasses).toBe(false);
    expect(result.reasons).toEqual(expect.arrayContaining(["titolo di studio coerente", "area di studio compatibile"]));
  });

  it("keeps an ambiguous PA job as potential instead of fully compatible", () => {
    const job = createPublicJob({
      title: "Istruttore amministrativo",
      requirementHighlights: ["Titolo di studio richiesto: diploma di laurea o titolo equipollente."],
      requirementsText: "E' richiesto un titolo di studio universitario. Preferenze per esperienza in enti pubblici."
    });

    const result = evaluatePublicAdministrationRequirements(
      {
        roleMatches: 0,
        skillMatches: 0,
        experienceMatches: 0,
        educationMatches: 0
      },
      job,
      businessCv
    );

    expect(result.passes).toBe(false);
    expect(result.potentialPasses).toBe(true);
    expect(result.reasons).toEqual(expect.arrayContaining(["laurea presente nel CV"]));
  });
});
