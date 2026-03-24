import { describe, expect, it } from "vitest";
import {
  buildEnhancedCvProfile,
  inferPreferredPrivateRoleFamilies,
  normalizeRoleLabel
} from "@/lib/server/agents/cv-intelligence-agent";

describe("baseline cv extraction", () => {
  it("extracts normalized roles, skills and education signals from a mixed CV", () => {
    const cvText = `
      Product Owner - 01/01/2021
      Product Manager con 5 years of experience in digital transformation.
      Laurea magistrale in Economia e Management (LM-77).
      Competenze: Scrum, Power BI, SQL, stakeholder management.
      Esperienza in pubblica amministrazione e project management.
      Torino, Italia.
    `;

    const profile = buildEnhancedCvProfile(cvText);

    expect(profile.titles).toContain("product manager");
    expect(profile.skills).toEqual(expect.arrayContaining(["scrum", "power bi", "sql"]));
    expect(profile.experienceAreas).toEqual(
      expect.arrayContaining(["digital transformation", "project management", "public administration"])
    );
    expect(profile.educationLevels).toEqual(expect.arrayContaining(["master", "mba"]));
    expect(profile.studyAreas).toContain("business administration");
    expect(profile.yearsOfExperience).toBe(5);
    expect(profile.preferredLocations).toContain("torino");
  });

  it("maps role labels and preferred private families consistently", () => {
    expect(normalizeRoleLabel("React Developer")).toBe("frontend developer");
    expect(normalizeRoleLabel("Product Owner")).toBe("product manager");

    const profile = buildEnhancedCvProfile(`
      Data Analyst
      Product Manager
      Laurea magistrale in Economia
      Analytics, reporting, Power BI
    `);

    expect(inferPreferredPrivateRoleFamilies(profile)).toEqual(
      expect.arrayContaining(["data", "product", "business"])
    );
  });
});
