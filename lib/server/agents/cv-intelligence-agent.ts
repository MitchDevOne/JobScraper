import { CvProfile } from "@/lib/types";

const stopWords = new Set([
  "della",
  "delle",
  "degli",
  "dello",
  "dalla",
  "nelle",
  "dati",
  "sono",
  "with",
  "from",
  "your",
  "have",
  "will",
  "this",
  "that",
  "per",
  "con",
  "una",
  "uno",
  "the",
  "and",
  "for",
  "nel",
  "nella",
  "dell",
  "alla",
  "alle",
  "dei",
  "del",
  "job",
  "work",
  "curriculum",
  "vitae"
]);

const titleAliases: Record<string, string[]> = {
  "frontend developer": [
    "frontend developer",
    "frontend engineer",
    "react developer",
    "react engineer",
    "web developer",
    "sviluppatore frontend",
    "ui engineer"
  ],
  "backend developer": [
    "backend developer",
    "java developer",
    "api developer",
    "sviluppatore backend",
    "backend engineer"
  ],
  "full stack developer": ["full stack developer", "fullstack developer", "sviluppatore full stack"],
  "software engineer": ["software engineer", "application engineer", "sviluppatore software"],
  "program analyst": ["program analyst", "analyst programmer", "analista programmatore", "technical analyst"],
  "data analyst": ["data analyst", "data specialist", "bi analyst", "analista dati", "reporting specialist"],
  "data engineer": ["data engineer", "etl developer", "analytics engineer"],
  "business analyst": ["business analyst", "analista di business", "system analyst"],
  "business developer": ["business developer", "business development", "partnership manager", "growth manager"],
  "project manager": ["project manager", "program manager", "delivery manager"],
  "project management officer": [
    "project management officer",
    "pmo",
    "specialista pmo",
    "pmo specialist",
    "program coordinator",
    "specialista pianificazione e supporto"
  ],
  "product manager": ["product manager", "digital product manager", "product owner"],
  "cloud engineer": ["cloud engineer", "cloud developer", "cloud specialist"],
  "devops engineer": ["devops engineer", "devops specialist"],
  "information security specialist": [
    "information security specialist",
    "security specialist",
    "cybersecurity specialist"
  ],
  "network specialist": ["network specialist", "network engineer"],
  "database administrator": ["database administrator", "dba"],
  "technical specialist": ["technical specialist", "support specialist"],
  "solution designer": ["solution designer", "solution architect"],
  "system architect": ["system architect", "enterprise architect"],
  "responsabile relazioni istituzionali": ["responsabile relazioni istituzionali"]
};

const skillAliases: Record<string, string[]> = {
  react: ["react", "react.js", "next.js", "nextjs", "frontend"],
  typescript: ["typescript", "ts"],
  javascript: ["javascript", "js"],
  "node.js": ["node.js", "nodejs"],
  java: ["java", "spring"],
  python: ["python", "pandas"],
  sql: ["sql", "postgres", "mysql", "database"],
  "power bi": ["power bi", "powerbi"],
  excel: ["excel"],
  "c#": ["c#", "csharp"],
  ".net": [".net", "dotnet"],
  git: ["git", "github", "gitlab"],
  docker: ["docker"],
  aws: ["aws"],
  azure: ["azure"],
  scrum: ["scrum", "agile"],
  "project management": ["project management", "program management", "pmo"],
  "data analysis": ["data analysis", "analytics", "reporting", "business intelligence"],
  "machine learning": ["machine learning", "artificial intelligence", "ai", "ml"],
  cloud: ["cloud"],
  cisco: ["cisco"],
  windows: ["windows"]
};

const experienceAliases: Record<string, string[]> = {
  frontend: ["frontend", "digital ux"],
  backend: ["backend", "api"],
  "full stack": ["full stack", "fullstack"],
  analytics: ["analytics", "reporting", "business intelligence"],
  data: ["data", "data management"],
  automation: ["automation"],
  "project management": ["project management", "pmo", "delivery"],
  "digital transformation": ["digital transformation", "trasformazione digitale"],
  cloud: ["cloud"],
  "public administration": ["public administration", "pubblica amministrazione", "enti pubblici"],
  cybersecurity: ["cybersecurity", "security"],
  infrastructure: ["infrastrutture", "infrastructure", "network"]
};

const educationLevelAliases: Record<string, string[]> = {
  master: ["master i livello", "master di primo livello", "master", "laurea magistrale", "master's"],
  mba: ["mba", "master in business administration", "lm-77"],
  bachelor: ["bachelor's degree", "laurea triennale", "l-11", "degree"]
};

const studyAreaAliases: Record<string, string[]> = {
  "data science": ["analisi dati", "business intelligence", "data science", "data analysis", "statistica"],
  "business administration": ["business administration", "economia", "management", "lm-77", "mba"],
  "foreign languages": [
    "foreign languages",
    "lingue e letterature",
    "l-11",
    "english",
    "inglese",
    "spagnolo",
    "russo",
    "tedesco"
  ],
  software: ["sviluppo software", "software", "ingegneria informatica", "informatica"],
  research: ["ricerca", "research", "sperimentale", "scientifica"]
};

const locationMatchers = ["torino", "piemonte", "italia"];

function dedupe(items: string[]) {
  return [...new Set(items)];
}

function escapeRegex(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function normalizeForMatch(input: string) {
  return input.toLowerCase().replace(/\s+/g, " ").trim();
}

export function textContainsPhrase(text: string, phrase: string) {
  const normalizedText = normalizeForMatch(text);
  const normalizedPhrase = normalizeForMatch(phrase);

  if (!normalizedPhrase) {
    return false;
  }

  const pattern = new RegExp(
    `(^|[^a-z0-9])${escapeRegex(normalizedPhrase).replace(/\s+/g, "\\s+")}(?=$|[^a-z0-9])`,
    "i"
  );

  return pattern.test(normalizedText);
}

export function normalizeRoleLabel(input: string) {
  const normalizedInput = normalizeForMatch(input);

  if (!normalizedInput) {
    return "";
  }

  for (const [canonical, variants] of Object.entries(titleAliases)) {
    if ([canonical, ...variants].some((variant) => textContainsPhrase(normalizedInput, variant))) {
      return canonical;
    }
  }

  return normalizedInput
    .replace(/\b(sr|senior|jr|junior|middle)\b/g, "")
    .replace(/\bspecialist\b/g, "specialista")
    .replace(/\s+/g, " ")
    .trim();
}

function collectAliasMatches(text: string, aliases: Record<string, string[]>) {
  const matches: string[] = [];

  for (const [canonical, variants] of Object.entries(aliases)) {
    if (variants.some((variant) => textContainsPhrase(text, variant))) {
      matches.push(canonical);
    }
  }

  return matches;
}

function extractExperienceRoleLines(text: string) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => /(?:-|–|â€“)\s*\d{2}\/\d{2}\/\d{4}/.test(line))
    .map((line) => line.split(/-|–|â€“/)[0]?.trim() ?? "")
    .filter((line) => line.length > 3);
}

function extractRoleSignalsFromExperience(text: string) {
  const roleLines = extractExperienceRoleLines(text);
  const weightedMatches: string[] = [];

  for (const roleLine of roleLines) {
    for (const [canonical, variants] of Object.entries(titleAliases)) {
      if ([canonical, ...variants].some((variant) => textContainsPhrase(roleLine, variant))) {
        weightedMatches.push(canonical);
      }
    }
  }

  return aggregateRoleLabels(weightedMatches);
}

export function aggregateRoleLabels(roles: string[], limit = 8) {
  return dedupe(roles.map(normalizeRoleLabel).filter(Boolean)).slice(0, limit);
}

function inferTitlesFromProfileSignals(input: {
  keywords: string[];
  skills: string[];
  experienceAreas: string[];
  studyAreas: string[];
}) {
  const inferred: string[] = [];
  const skills = new Set(input.skills.map(normalizeForMatch));
  const experience = new Set(input.experienceAreas.map(normalizeForMatch));
  const studyAreas = new Set(input.studyAreas.map(normalizeForMatch));
  const keywords = new Set(input.keywords.map(normalizeForMatch));
  const hasBusinessSignal =
    studyAreas.has("business administration") ||
    experience.has("digital transformation") ||
    keywords.has("business") ||
    keywords.has("supporto") ||
    keywords.has("coordinamento");
  const hasProductSignal =
    skills.has("project management") ||
    experience.has("project management") ||
    keywords.has("product") ||
    keywords.has("roadmap") ||
    keywords.has("stakeholder");
  const hasBusinessDevelopmentSignal =
    keywords.has("business") ||
    keywords.has("partnership") ||
    keywords.has("sviluppo") ||
    experience.has("digital transformation");

  if (skills.has("react") || skills.has("typescript") || experience.has("frontend")) {
    inferred.push("frontend developer");
  }

  if (skills.has("java") || skills.has("python") || skills.has("node.js") || experience.has("backend")) {
    inferred.push("backend developer");
  }

  if ((skills.has("react") || experience.has("frontend")) && (skills.has("java") || skills.has("node.js") || experience.has("backend"))) {
    inferred.push("full stack developer");
  }

  if (skills.has("sql") || skills.has("power bi") || skills.has("data analysis") || experience.has("analytics") || experience.has("data")) {
    inferred.push("data analyst");
  }

  if (skills.has("project management") || experience.has("project management") || keywords.has("pmo")) {
    inferred.push("project management officer", "project manager");
  }

  if (skills.has("aws") || skills.has("azure") || skills.has("docker") || skills.has("cloud") || experience.has("cloud")) {
    inferred.push("cloud engineer");
  }

  if (studyAreas.has("business administration") || keywords.has("business") || experience.has("digital transformation")) {
    inferred.push("business analyst");
  }

  if (hasProductSignal && hasBusinessSignal) {
    inferred.push("product manager");
  }

  if (hasBusinessDevelopmentSignal && hasBusinessSignal) {
    inferred.push("business developer");
  }

  if (studyAreas.has("software") && inferred.length === 0) {
    inferred.push("software engineer");
  }

  return aggregateRoleLabels(inferred, 8);
}

export function expandRoleTerms(roles: string[]) {
  const expanded = new Set<string>();

  for (const role of aggregateRoleLabels(roles, 24)) {
    expanded.add(role);

    for (const alias of titleAliases[role] ?? []) {
      expanded.add(normalizeForMatch(alias));
    }
  }

  return [...expanded];
}

export function expandSkillTerms(skills: string[]) {
  const expanded = new Set<string>();

  for (const skill of skills.map(normalizeForMatch).filter(Boolean)) {
    expanded.add(skill);

    for (const alias of skillAliases[skill] ?? []) {
      expanded.add(normalizeForMatch(alias));
    }
  }

  return [...expanded];
}

export function extractKeywords(text: string, limit = 12) {
  const counts = new Map<string, number>();

  for (const token of text.toLowerCase().match(/[a-z0-9+#.-]{3,}/g) ?? []) {
    if (stopWords.has(token)) {
      continue;
    }

    counts.set(token, (counts.get(token) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([token]) => token);
}

function inferYearsOfExperience(text: string) {
  const matches = [
    ...text.matchAll(/(\d{1,2})\+?\s+(?:anni|years)/gi),
    ...text.matchAll(/experience[^.\n]{0,30}(\d{1,2})\+?\s+(?:anni|years)/gi)
  ];

  if (!matches.length) {
    return null;
  }

  return Math.max(...matches.map((match) => Number.parseInt(match[1], 10)).filter(Number.isFinite));
}

export function buildEnhancedCvProfile(text: string): CvProfile {
  const keywords = extractKeywords(text, 16);
  const experienceTitles = extractRoleSignalsFromExperience(text);
  const genericTitles = collectAliasMatches(text, titleAliases).filter((title) => !experienceTitles.includes(title));
  const skills = dedupe(collectAliasMatches(text, skillAliases));
  const experienceAreas = dedupe(collectAliasMatches(text, experienceAliases));
  const educationLevels = dedupe(collectAliasMatches(text, educationLevelAliases));
  const studyAreas = dedupe(collectAliasMatches(text, studyAreaAliases));
  const preferredLocations = dedupe(locationMatchers.filter((location) => normalizeForMatch(text).includes(location)));
  const yearsOfExperience = inferYearsOfExperience(text);
  const titles = aggregateRoleLabels([...experienceTitles, ...genericTitles]);

  return {
    keywords,
    titles,
    skills,
    experienceAreas,
    educationLevels,
    studyAreas,
    yearsOfExperience,
    preferredLocations
  };
}

export function inferPreferredPrivateRoleFamilies(cvProfile: CvProfile | null) {
  const roles = (cvProfile?.titles ?? []).map(normalizeRoleLabel);
  const families = new Set<string>();

  for (const role of roles) {
    if (role.includes("data")) {
      families.add("data");
    }

    if (role.includes("product")) {
      families.add("product");
    }

    if (role.includes("business")) {
      families.add("business");
    }

    if (role.includes("project")) {
      families.add("project");
    }

    if (role.includes("developer") || role.includes("engineer") || role.includes("software")) {
      families.add("developer");
    }
  }

  if ((cvProfile?.experienceAreas ?? []).includes("data")) {
    families.add("data");
  }

  if ((cvProfile?.studyAreas ?? []).includes("business administration")) {
    families.add("business");
    families.add("product");
  }

  if ((cvProfile?.experienceAreas ?? []).includes("project management")) {
    families.add("product");
    families.add("project");
  }

  if ((cvProfile?.keywords ?? []).some((keyword) => ["business", "partnership", "sviluppo", "go-to-market"].includes(normalizeForMatch(keyword)))) {
    families.add("business");
  }

  if ((cvProfile?.keywords ?? []).some((keyword) => ["product", "roadmap", "stakeholder", "backlog"].includes(normalizeForMatch(keyword)))) {
    families.add("product");
  }

  if ((cvProfile?.skills ?? []).some((skill) => ["sql", "power bi", "data analysis", "machine learning"].includes(normalizeForMatch(skill)))) {
    families.add("data");
  }

  return [...families];
}
