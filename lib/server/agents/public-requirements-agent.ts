import { CvProfile, Job } from "@/lib/types";
import { normalizeForMatch } from "@/lib/server/agents/cv-intelligence-agent";

export type JobSignalSnapshot = {
  roleMatches: number;
  skillMatches: number;
  experienceMatches: number;
  educationMatches: number;
};

type PublicEducationMatch = {
  score: number;
  directDegreeMatch: boolean;
  areaMatch: boolean;
  broadAreaMatch: boolean;
  genericDegreeRequired: boolean;
  reasons: string[];
};

const studyAreaBands: Record<string, string[]> = {
  "business administration": [
    "economia",
    "economiche",
    "scienze economiche",
    "management",
    "aziendale",
    "amministrazione",
    "giuridiche",
    "giurisprudenza",
    "contabilita"
  ],
  "foreign languages": ["lingue", "linguistiche", "mediazione linguistica", "lettere", "umanistiche"],
  "data science": ["statistica", "matematica", "informatica", "data", "analytics", "scientifiche"],
  software: ["informatica", "ingegneria informatica", "ingegneria", "software", "ict", "tecniche"],
  research: ["ricerca", "scientifiche", "laboratorio", "biologia", "chimica"]
};

const degreeLevelPatterns: Record<string, string[]> = {
  bachelor: ["laurea", "triennale", "l-", "bachelor"],
  master: ["laurea magistrale", "magistrale", "specialistica", "lm-", "master"],
  mba: ["mba", "master in business administration", "lm-77"]
};

function textContainsAny(text: string, patterns: string[]) {
  return patterns.some((pattern) => text.includes(pattern));
}

function getPublicRequirementText(job: Job) {
  return normalizeForMatch(
    [job.title, job.summary, ...(job.tags ?? []), ...(job.requirementHighlights ?? []), job.requirementsText ?? ""].join(" ")
  );
}

function buildPublicEducationMatch(job: Job, cvProfile: CvProfile | null): PublicEducationMatch {
  const text = getPublicRequirementText(job);
  const profileAreas = cvProfile?.studyAreas ?? [];
  const profileLevels = cvProfile?.educationLevels ?? [];
  const reasons = new Set<string>();
  let score = 0;

  const genericDegreeRequired =
    text.includes("laurea") || text.includes("diploma di laurea") || text.includes("titolo di studio");

  const directDegreeMatch = profileLevels.some((level) => {
    const match = textContainsAny(text, degreeLevelPatterns[level] ?? []);
    if (match) {
      reasons.add("livello di laurea compatibile");
      score += 4;
    }
    return match;
  });

  const areaMatch = profileAreas.some((area) => {
    const match = textContainsAny(text, studyAreaBands[area] ?? []);
    if (match) {
      reasons.add("area di studio compatibile");
      score += 6;
    }
    return match;
  });

  const broadAreaMatch =
    !areaMatch &&
    profileAreas.length > 0 &&
    Object.values(studyAreaBands).some((patterns) => textContainsAny(text, patterns)) &&
    genericDegreeRequired;

  if (broadAreaMatch) {
    reasons.add("requisito laurea da verificare");
    score += 2;
  }

  if (!directDegreeMatch && genericDegreeRequired && profileLevels.length > 0) {
    reasons.add("laurea presente nel CV");
    score += 2;
  }

  return {
    score,
    directDegreeMatch,
    areaMatch,
    broadAreaMatch,
    genericDegreeRequired,
    reasons: [...reasons]
  };
}

export function evaluatePublicAdministrationRequirements(signals: JobSignalSnapshot, job: Job, cvProfile: CvProfile | null) {
  const hasPublicAdministrationBackground = (cvProfile?.experienceAreas ?? []).includes("public administration");
  const education = buildPublicEducationMatch(job, cvProfile);
  const strongProfileAlignment =
    signals.roleMatches > 0 || signals.skillMatches > 0 || signals.experienceMatches > 0;
  const strictPass =
    (strongProfileAlignment && (signals.educationMatches > 0 || education.score >= 4)) ||
    (education.areaMatch && (signals.roleMatches > 0 || hasPublicAdministrationBackground)) ||
    (education.directDegreeMatch && signals.roleMatches > 0);
  const potentialPass =
    !strictPass &&
    (education.score >= 2 ||
      signals.educationMatches > 0 ||
      hasPublicAdministrationBackground ||
      (education.genericDegreeRequired && (cvProfile?.educationLevels.length ?? 0) > 0));

  const reasons = new Set<string>();

  if (signals.educationMatches > 0) {
    reasons.add("titolo di studio coerente");
  }

  for (const reason of education.reasons) {
    reasons.add(reason);
  }

  if (hasPublicAdministrationBackground) {
    reasons.add("esperienza in enti pubblici");
  }

  if (signals.roleMatches > 0) {
    reasons.add("ruolo target");
  }

  return {
    passes: strictPass,
    potentialPasses: potentialPass,
    scoreBoost: signals.educationMatches * 8 + education.score + (hasPublicAdministrationBackground ? 4 : 0),
    reasons: [...reasons].slice(0, 4)
  };
}
