import { SectorType } from "@/lib/types";

export type SourceStrategy = "seed" | "html-parser" | "json-api";
export type SourceReliability = "high" | "medium";
export type SourceCoverage = "torino-city" | "torino-metro" | "piemonte" | "italy";

export type SourceCatalogEntry = {
  id: string;
  label: string;
  sector: SectorType;
  strategy: SourceStrategy;
  reliability: SourceReliability;
  coverage: SourceCoverage;
  enabled: boolean;
  officialUrl: string;
  statusLabel: string;
  focus: string;
};

export const sourceCatalog: SourceCatalogEntry[] = [
  {
    id: "inpa",
    label: "inPA - Bandi e avvisi",
    sector: "pubblico",
    strategy: "json-api",
    reliability: "high",
    coverage: "italy",
    enabled: true,
    officialUrl: "https://www.inpa.gov.it/bandi-e-avvisi/",
    statusLabel: "Live",
    focus: "Fonte pubblica primaria nazionale con bandi e avvisi consultabili per area geografica, ente e stato."
  },
  {
    id: "comune-torino",
    label: "Comune di Torino - Concorsi",
    sector: "pubblico",
    strategy: "html-parser",
    reliability: "high",
    coverage: "torino-city",
    enabled: true,
    officialUrl: "https://www.comune.torino.it/lavorare-comune/concorsi",
    statusLabel: "Live",
    focus: "Fonte ufficiale del Comune di Torino per concorsi e selezioni locali ancora attivi."
  },
  {
    id: "citta-metropolitana-torino",
    label: "Citta Metropolitana di Torino - Bandi di concorso",
    sector: "pubblico",
    strategy: "html-parser",
    reliability: "high",
    coverage: "torino-metro",
    enabled: true,
    officialUrl: "https://trasparenza.cittametropolitana.torino.it/bandi-concorso",
    statusLabel: "Live",
    focus: "Portale trasparenza ufficiale per concorsi pubblici e procedure dell'area metropolitana."
  },
  {
    id: "csi-piemonte",
    label: "CSI Piemonte - Avvisi di selezione",
    sector: "privato",
    strategy: "html-parser",
    reliability: "high",
    coverage: "piemonte",
    enabled: true,
    officialUrl: "https://www.csipiemonte.it/it/chi-siamo/azienda/lavora-con-noi/avvisi-di-selezione",
    statusLabel: "Live",
    focus: "Fonte diretta ufficiale per selezioni ICT pubblicate da CSI Piemonte."
  },
  {
    id: "greenhouse-private-boards",
    label: "Career boards Greenhouse",
    sector: "privato",
    strategy: "json-api",
    reliability: "high",
    coverage: "italy",
    enabled: true,
    officialUrl: "https://job-boards.greenhouse.io/thefork",
    statusLabel: "Live",
    focus: "Board ufficiali Greenhouse interrogati via API pubblica per aziende con posizioni in Italia e su Torino."
  },
  {
    id: "lever-private-boards",
    label: "Career boards Lever",
    sector: "privato",
    strategy: "json-api",
    reliability: "high",
    coverage: "italy",
    enabled: true,
    officialUrl: "https://jobs.lever.co/ion",
    statusLabel: "Live",
    focus: "Board ufficiali Lever interrogati via endpoint pubblici e normalizzati nel modello privato."
  },
  {
    id: "smartrecruiters-private-boards",
    label: "Career boards SmartRecruiters",
    sector: "privato",
    strategy: "json-api",
    reliability: "high",
    coverage: "italy",
    enabled: true,
    officialUrl: "https://developers.smartrecruiters.com/docs/customer-overview",
    statusLabel: "Live",
    focus: "Board ufficiali SmartRecruiters interrogati via endpoint pubblici per aziende con sedi in Italia."
  },
  {
    id: "company-careers-seed",
    label: "Career sites aziendali curati",
    sector: "privato",
    strategy: "seed",
    reliability: "medium",
    coverage: "italy",
    enabled: true,
    officialUrl: "https://job-scraper-2-xi.vercel.app",
    statusLabel: "Curated",
    focus: "Seed normalizzato di career page aziendali usato come fallback mentre crescono gli adapter live ufficiali."
  }
];
