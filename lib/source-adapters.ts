export type SourceAdapter = {
  id: string;
  label: string;
  sector: "pubblico" | "privato";
  strategy: "manual-import" | "html-parser" | "api";
  enabled: boolean;
  notes: string;
};

export const sourceAdapters: SourceAdapter[] = [
  {
    id: "comune-torino",
    label: "Comune di Torino",
    sector: "pubblico",
    strategy: "html-parser",
    enabled: false,
    notes: "Buona candidata per i primi parser dedicati al settore pubblico."
  },
  {
    id: "csi-piemonte",
    label: "CSI Piemonte",
    sector: "pubblico",
    strategy: "manual-import",
    enabled: false,
    notes: "Si puo partire con ingestione manuale o feed strutturati."
  },
  {
    id: "reply",
    label: "Reply Careers",
    sector: "privato",
    strategy: "html-parser",
    enabled: false,
    notes: "Sito aziendale adatto a una integrazione privata iniziale."
  },
  {
    id: "intesa-sanpaolo",
    label: "Intesa Sanpaolo Careers",
    sector: "privato",
    strategy: "html-parser",
    enabled: false,
    notes: "Fonte enterprise utile ma da verificare per stabilita markup."
  }
];
