import { describe, expect, it } from "vitest";
import { getEligibleSourceRegistryEntries, sourceRegistry } from "@/lib/server/source-registry";

describe("baseline source registry", () => {
  it("builds structured queries according to source capabilities", () => {
    const entries = getEligibleSourceRegistryEntries(
      {
        sector: "all",
        q: "React developer",
        location: "Torino",
        locationScope: "metro",
        workMode: "hybrid",
        roleTargets: ["Frontend Developer"]
      },
      {
        keywords: ["react", "typescript"],
        titles: ["frontend developer"],
        skills: ["react", "typescript"],
        experienceAreas: ["software"],
        educationLevels: ["bachelor"],
        studyAreas: ["software"],
        yearsOfExperience: 4,
        preferredLocations: ["torino"]
      }
    );

    const inpa = entries.find((entry) => entry.id === "inpa");
    const greenhouse = entries.find((entry) => entry.id === "greenhouse-private-boards");

    expect(inpa?.query).toEqual({
      roleKeywords: ["frontend developer"],
      skillKeywords: ["react", "typescript", "react developer"],
      location: "Torino",
      locationScope: "metro",
      workMode: null,
      seniority: null
    });

    expect(greenhouse?.query).toEqual({
      roleKeywords: [],
      skillKeywords: [],
      location: null,
      locationScope: null,
      workMode: null,
      seniority: null
    });
  });

  it("keeps non-live seed sources in the declarative registry but out of live execution", () => {
    const seedEntry = sourceRegistry.find((entry) => entry.id === "company-careers-seed");

    expect(seedEntry).toBeDefined();
    expect(seedEntry?.fetcher).toBeNull();
    expect(seedEntry?.capabilities.retrievalMode).toBe("seed");
  });
});
