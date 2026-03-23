import { CvProfile, Job } from "@/lib/types";
import { inferPreferredPrivateRoleFamilies, normalizeForMatch } from "@/lib/server/agents/cv-intelligence-agent";

export type PrivateSignalSnapshot = {
  roleMatches: number;
  skillMatches: number;
  experienceMatches: number;
  educationMatches: number;
  developerOnlyJob: boolean;
  developerProfile: boolean;
};

type PrivateJobFamily = "data" | "product" | "business" | "project" | "developer" | "generic";

function inferPrivateJobFamily(job: Job): PrivateJobFamily {
  const text = normalizeForMatch([job.title, job.summary, ...job.tags].join(" "));

  if (/\bproduct\b/.test(text)) {
    return "product";
  }

  if (/\bbusiness development\b|\bbusiness developer\b|\bgrowth\b|\bpartnership\b/.test(text)) {
    return "business";
  }

  if (/\bbusiness analyst\b|\banalyst\b/.test(text) && /\bbusiness\b|\bprocess\b|\bstrategy\b/.test(text)) {
    return "business";
  }

  if (/\bdata\b|\banalytics\b|\bbi\b|\breporting\b/.test(text)) {
    return "data";
  }

  if (/\bproject\b|\bpmo\b|\bprogram\b|\bdelivery\b/.test(text)) {
    return "project";
  }

  if (/\bdeveloper\b|\bengineer\b|\bsoftware\b|\bfrontend\b|\bbackend\b|\bfull stack\b/.test(text)) {
    return "developer";
  }

  return "generic";
}

export function evaluatePrivateExperienceAlignment(signals: PrivateSignalSnapshot, job: Job, cvProfile: CvProfile | null) {
  const preferredFamilies = inferPreferredPrivateRoleFamilies(cvProfile);
  const jobFamily = inferPrivateJobFamily(job);
  const familyAligned = jobFamily === "generic" || preferredFamilies.includes(jobFamily);
  const strongFit = signals.roleMatches > 0 || (signals.skillMatches > 1 && signals.experienceMatches > 0);
  const mediumFit =
    signals.roleMatches > 0 ||
    signals.skillMatches > 0 ||
    signals.experienceMatches > 0 ||
    signals.educationMatches > 0;
  const yearsBoost = cvProfile?.yearsOfExperience && cvProfile.yearsOfExperience >= 3 ? 2 : 0;
  const developerMismatchPenalty = signals.developerOnlyJob && !signals.developerProfile && signals.roleMatches === 0 ? -26 : 0;
  const familyPenalty = !familyAligned ? -16 : 0;
  const partialMismatch = mediumFit && !strongFit;
  const status =
    !familyAligned || (signals.developerOnlyJob && !signals.developerProfile)
      ? ("partial" as const)
      : strongFit
        ? ("compatible" as const)
        : ("partial" as const);

  return {
    passes:
      signals.developerOnlyJob && !signals.developerProfile
        ? signals.roleMatches > 0
        : familyAligned
          ? mediumFit
          : strongFit,
    status,
    scoreBoost:
      signals.roleMatches * 12 +
      signals.skillMatches * 6 +
      signals.experienceMatches * 5 +
      signals.educationMatches * 4 +
      yearsBoost +
      developerMismatchPenalty +
      familyPenalty +
      (partialMismatch ? -6 : 0),
    reasons: [
      signals.roleMatches > 0 ? "titolo coerente col CV" : "",
      signals.skillMatches > 0 ? "skill dal CV" : "",
      signals.experienceMatches > 0 ? "esperienza rilevante" : "",
      !familyAligned ? "allineamento parziale col CV" : "",
      signals.developerOnlyJob && !signals.developerProfile ? "profilo non pienamente developer" : ""
    ].filter(Boolean)
  };
}
