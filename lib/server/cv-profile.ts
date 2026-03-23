import { buildEnhancedCvProfile, extractKeywords } from "@/lib/server/agents/cv-intelligence-agent";

export { extractKeywords };

export function buildCvProfile(text: string) {
  return buildEnhancedCvProfile(text);
}
