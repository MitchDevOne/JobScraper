import { CvProfile } from "@/lib/types";

export type JobSignalSnapshot = {
  roleMatches: number;
  skillMatches: number;
  experienceMatches: number;
  educationMatches: number;
};

export function evaluatePublicAdministrationRequirements(signals: JobSignalSnapshot, cvProfile: CvProfile | null) {
  const hasPublicAdministrationBackground =
    (cvProfile?.experienceAreas ?? []).includes("public administration") || (cvProfile?.studyAreas ?? []).length > 0;
  const passes =
    (signals.roleMatches > 0 && (signals.skillMatches > 0 || signals.educationMatches > 0)) ||
    (signals.educationMatches > 0 && (signals.roleMatches > 0 || signals.skillMatches > 0)) ||
    (hasPublicAdministrationBackground && signals.educationMatches > 0);

  return {
    passes,
    scoreBoost: signals.educationMatches * 9 + (hasPublicAdministrationBackground ? 4 : 0),
    reasons: [
      signals.educationMatches > 0 ? "titolo di studio coerente" : "",
      hasPublicAdministrationBackground ? "esperienza in enti pubblici" : ""
    ].filter(Boolean)
  };
}
