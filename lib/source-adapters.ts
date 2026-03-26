import { sourceRegistry } from "@/lib/server/source-registry";

export type SourceAdapter = {
  id: string;
  label: string;
  sector: "pubblico" | "privato";
  strategy: "manual-import" | "html-parser" | "api";
  enabled: boolean;
  notes: string;
};

export const sourceAdapters: SourceAdapter[] = sourceRegistry.map((source) => ({
  id: source.id,
  label: source.label,
  sector: source.sector,
  strategy:
    source.capabilities.retrievalMode === "seed" || source.capabilities.retrievalMode === "manual-import"
      ? "manual-import"
      : source.capabilities.retrievalMode === "public-api" || source.capabilities.retrievalMode === "partner-api"
        ? "api"
        : "html-parser",
  enabled: source.enabled,
  notes: `${source.capabilities.originType} / ${source.capabilities.qualityTier} / ${source.governance} / ${source.domain}`
}));
