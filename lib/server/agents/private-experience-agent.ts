import { CvProfile } from "@/lib/types";

export type PrivateSignalSnapshot = {
  roleMatches: number;
  skillMatches: number;
  experienceMatches: number;
  educationMatches: number;
  developerOnlyJob: boolean;
  developerProfile: boolean;
};

export function evaluatePrivateExperienceAlignment(signals: PrivateSignalSnapshot, cvProfile: CvProfile | null) {
  const passesCoreFit =
    signals.roleMatches > 0 ||
    signals.skillMatches > 0 ||
    signals.experienceMatches > 0 ||
    signals.educationMatches > 0;
  const yearsBoost = cvProfile?.yearsOfExperience && cvProfile.yearsOfExperience >= 3 ? 2 : 0;
  const developerMismatchPenalty = signals.developerOnlyJob && !signals.developerProfile && signals.roleMatches === 0 ? -18 : 0;

  return {
    passes: signals.developerOnlyJob && !signals.developerProfile ? signals.roleMatches > 0 : passesCoreFit,
    scoreBoost:
      signals.roleMatches * 12 +
      signals.skillMatches * 6 +
      signals.experienceMatches * 5 +
      signals.educationMatches * 4 +
      yearsBoost +
      developerMismatchPenalty,
    reasons: [
      signals.roleMatches > 0 ? "titolo coerente col CV" : "",
      signals.skillMatches > 0 ? "skill dal CV" : "",
      signals.experienceMatches > 0 ? "esperienza rilevante" : ""
    ].filter(Boolean)
  };
}
