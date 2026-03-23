import { sourceCatalog } from "@/lib/source-catalog";

export type SourceAdapter = {
  id: string;
  label: string;
  sector: "pubblico" | "privato";
  strategy: "manual-import" | "html-parser" | "api";
  enabled: boolean;
  notes: string;
};

export const sourceAdapters: SourceAdapter[] = sourceCatalog.map((source) => ({
  id: source.id,
  label: source.label,
  sector: source.sector,
  strategy:
    source.strategy === "seed"
      ? "manual-import"
      : source.strategy === "json-api"
        ? "api"
        : "html-parser",
  enabled: source.enabled,
  notes: source.focus
}));
