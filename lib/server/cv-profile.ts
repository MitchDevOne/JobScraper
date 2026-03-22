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
  "degli",
  "delle",
  "dei",
  "del",
  "job",
  "work",
  "curriculum",
  "vitae"
]);

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
