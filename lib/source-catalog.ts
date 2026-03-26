import { SectorType, SourceDomain, SourceGovernance } from "@/lib/types";

export type SourceStrategy = "seed" | "html-parser" | "json-api";
export type SourceReliability = "high" | "medium";
export type SourceCoverage = "torino-city" | "torino-metro" | "piemonte" | "italy";

export type SourceCatalogEntry = {
  id: string;
  label: string;
  sector: SectorType;
  governance: SourceGovernance;
  domain: SourceDomain;
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
    governance: "public",
    domain: "public-admin",
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
    governance: "public",
    domain: "public-admin",
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
    governance: "public",
    domain: "public-admin",
    strategy: "html-parser",
    reliability: "high",
    coverage: "torino-metro",
    enabled: true,
    officialUrl: "https://trasparenza.cittametropolitana.torino.it/bandi-concorso",
    statusLabel: "Live",
    focus: "Portale trasparenza ufficiale per concorsi pubblici e procedure dell'area metropolitana."
  },
  {
    id: "camera-commercio-torino",
    label: "Camera di commercio di Torino - Selezioni pubbliche",
    sector: "pubblico",
    governance: "public",
    domain: "public-admin",
    strategy: "html-parser",
    reliability: "high",
    coverage: "torino-city",
    enabled: true,
    officialUrl: "https://www.to.camcom.it/selezioni-corso",
    statusLabel: "Live",
    focus: "Fonte ufficiale della Camera di commercio di Torino per concorsi e selezioni aperte."
  },
  {
    id: "regione-piemonte",
    label: "Regione Piemonte - Bandi di concorso",
    sector: "pubblico",
    governance: "public",
    domain: "public-admin",
    strategy: "html-parser",
    reliability: "high",
    coverage: "piemonte",
    enabled: true,
    officialUrl: "https://trasparenza.regione.piemonte.it/bandi-concorso",
    statusLabel: "Live",
    focus: "Fonte istituzionale regionale con procedure concorsuali, mobilita e selezioni della Regione Piemonte."
  },
  {
    id: "csi-piemonte",
    label: "CSI Piemonte - Avvisi di selezione",
    sector: "privato",
    governance: "hybrid",
    domain: "company-careers",
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
    governance: "private",
    domain: "company-careers",
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
    governance: "private",
    domain: "company-careers",
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
    governance: "private",
    domain: "company-careers",
    strategy: "json-api",
    reliability: "high",
    coverage: "italy",
    enabled: true,
    officialUrl: "https://developers.smartrecruiters.com/docs/customer-overview",
    statusLabel: "Live",
    focus: "Board ufficiali SmartRecruiters interrogati via endpoint pubblici per aziende con sedi in Italia."
  },
  {
    id: "torino-private-careers",
    label: "Career page Torino e cintura",
    sector: "privato",
    governance: "private",
    domain: "company-careers",
    strategy: "html-parser",
    reliability: "medium",
    coverage: "torino-metro",
    enabled: true,
    officialUrl: "https://www.intesasanpaolo.com",
    statusLabel: "Live",
    focus:
      "Discovery mirato di aziende, associazioni e realta economiche della citta metropolitana di Torino con parsing di pagine lavora con noi e offerte locali."
  },
  {
    id: "torino-eu-network",
    label: "Agenzie UE e network europei Torino",
    sector: "pubblico",
    governance: "public",
    domain: "international-public",
    strategy: "seed",
    reliability: "medium",
    coverage: "torino-metro",
    enabled: true,
    officialUrl: "https://torino.eurodesk.it/",
    statusLabel: "Planned",
    focus:
      "Perimetro di agenzie, programmi, desk europei e network istituzionali presenti a Torino da trattare come fonti pubblico-internazionali."
  },
  {
    id: "torino-un-network",
    label: "Nazioni Unite e organismi internazionali Torino",
    sector: "pubblico",
    governance: "public",
    domain: "international-public",
    strategy: "seed",
    reliability: "medium",
    coverage: "torino-city",
    enabled: true,
    officialUrl: "https://unssc.org/",
    statusLabel: "Planned",
    focus:
      "Perimetro di entita ONU e organismi multilaterali presenti a Torino da includere nelle ricerche istituzionali e policy-oriented."
  },
  {
    id: "torino-foundations-network",
    label: "Fondazioni Torino e Piemonte",
    sector: "privato",
    governance: "hybrid",
    domain: "foundation",
    strategy: "seed",
    reliability: "medium",
    coverage: "torino-metro",
    enabled: true,
    officialUrl: "https://www.compagniadisanpaolo.it/",
    statusLabel: "Planned",
    focus:
      "Fondazioni bancarie, culturali e sociali come Compagnia di San Paolo, Fondazione CRT e network collegati da trattare come ecosistema ibrido."
  },
  {
    id: "torino-third-sector-network",
    label: "Terzo settore e associazioni Torino",
    sector: "privato",
    governance: "hybrid",
    domain: "third-sector",
    strategy: "seed",
    reliability: "medium",
    coverage: "torino-metro",
    enabled: true,
    officialUrl: "https://www.arci.it/",
    statusLabel: "Planned",
    focus:
      "Associazioni, cooperative, enti civici e organizzazioni del terzo settore torinese da includere in una traccia dedicata social-impact."
  },
  {
    id: "torino-neighborhood-houses-network",
    label: "Case del Quartiere Torino",
    sector: "privato",
    governance: "hybrid",
    domain: "neighborhood-houses",
    strategy: "seed",
    reliability: "medium",
    coverage: "torino-city",
    enabled: true,
    officialUrl: "https://www.casedelquartiere.org/",
    statusLabel: "Planned",
    focus:
      "Network delle Case del Quartiere come ecosistema civico-culturale torinese da trattare separatamente nel sourcing territoriale."
  },
  {
    id: "torino-museums-network",
    label: "Musei e patrimonio culturale Torino",
    sector: "privato",
    governance: "hybrid",
    domain: "museum",
    strategy: "seed",
    reliability: "medium",
    coverage: "torino-city",
    enabled: true,
    officialUrl: "https://www.museitorino.it/",
    statusLabel: "Planned",
    focus:
      "Musei, fondazioni museali, patrimonio culturale e organizzazioni espositive torinesi da includere come cluster culturale dedicato."
  },
  {
    id: "torino-education-associations-network",
    label: "Educatori e associazioni educative Torino",
    sector: "privato",
    governance: "hybrid",
    domain: "education-association",
    strategy: "seed",
    reliability: "medium",
    coverage: "torino-metro",
    enabled: true,
    officialUrl: "https://www.istruzionepiemonte.it/",
    statusLabel: "Planned",
    focus:
      "Associazioni di educatori, reti formative, enti educativi civici e organizzazioni socio-educative del territorio torinese."
  },
  {
    id: "torino-education-network",
    label: "Istruzione pubblica e privata Torino",
    sector: "privato",
    governance: "hybrid",
    domain: "education",
    strategy: "seed",
    reliability: "medium",
    coverage: "torino-metro",
    enabled: true,
    officialUrl: "https://www.unito.it/",
    statusLabel: "Planned",
    focus:
      "Scuole, enti di formazione, universita, ITS, academy e operatori dell'istruzione anche privata presenti su Torino e cintura."
  },
  {
    id: "torino-ngo-network",
    label: "ONG e cooperazione internazionale Torino",
    sector: "privato",
    governance: "hybrid",
    domain: "ngo",
    strategy: "seed",
    reliability: "medium",
    coverage: "torino-metro",
    enabled: true,
    officialUrl: "https://www.ongpiemonte.org/",
    statusLabel: "Planned",
    focus:
      "Organizzazioni non governative e soggetti di cooperazione internazionale presenti sul territorio torinese."
  },
  {
    id: "torino-incubators-network",
    label: "Incubatori e startup hub Torino",
    sector: "privato",
    governance: "private",
    domain: "incubator",
    strategy: "seed",
    reliability: "medium",
    coverage: "torino-metro",
    enabled: true,
    officialUrl: "https://2i3t.it/",
    statusLabel: "Planned",
    focus:
      "Incubatori, acceleratori e hub startup del territorio torinese per ampliare la ricerca verso innovation, venture e digital."
  },
  {
    id: "torino-finance-network",
    label: "Banche e finance Torino",
    sector: "privato",
    governance: "private",
    domain: "finance",
    strategy: "seed",
    reliability: "medium",
    coverage: "torino-metro",
    enabled: true,
    officialUrl: "https://group.intesasanpaolo.com/",
    statusLabel: "Planned",
    focus:
      "Banche, assicurazioni, asset management e realta finanziarie da valorizzare come cluster prioritario del sourcing privato torinese."
  },
  {
    id: "torino-fintech-network",
    label: "Fintech Torino",
    sector: "privato",
    governance: "private",
    domain: "fintech",
    strategy: "seed",
    reliability: "medium",
    coverage: "torino-metro",
    enabled: true,
    officialUrl: "https://www.sellalab.com/",
    statusLabel: "Planned",
    focus:
      "Cluster fintech torinese con startup, innovation lab, pagamenti, open banking e piattaforme digitali per i servizi finanziari."
  },
  {
    id: "torino-insurance-network",
    label: "Assicurativo Torino",
    sector: "privato",
    governance: "private",
    domain: "insurance",
    strategy: "seed",
    reliability: "medium",
    coverage: "torino-metro",
    enabled: true,
    officialUrl: "https://www.realegroup.eu/",
    statusLabel: "Planned",
    focus:
      "Compagnie, broker, insurtech e funzioni assicurative con presenza nel territorio torinese."
  },
  {
    id: "torino-ict-network",
    label: "ICT Torino",
    sector: "privato",
    governance: "private",
    domain: "ict",
    strategy: "seed",
    reliability: "medium",
    coverage: "torino-metro",
    enabled: true,
    officialUrl: "https://www.csipiemonte.it/",
    statusLabel: "Planned",
    focus:
      "System integrator, software house, consulenza IT, cloud, cybersecurity, infrastrutture digitali e servizi ICT presenti a Torino e cintura."
  },
  {
    id: "torino-biotech-network",
    label: "Biotech e life sciences Torino",
    sector: "privato",
    governance: "private",
    domain: "biotech",
    strategy: "seed",
    reliability: "medium",
    coverage: "torino-metro",
    enabled: true,
    officialUrl: "https://2i3t.it/",
    statusLabel: "Planned",
    focus:
      "Biotecnologie, medtech, pharma, life sciences e trasferimento tecnologico collegati all'ecosistema torinese."
  },
  {
    id: "torino-automotive-network",
    label: "Automotive Torino",
    sector: "privato",
    governance: "private",
    domain: "automotive",
    strategy: "seed",
    reliability: "medium",
    coverage: "torino-metro",
    enabled: true,
    officialUrl: "https://www.stellantis.com/",
    statusLabel: "Planned",
    focus:
      "OEM, componentistica, mobility tech e supply chain automotive dell'area torinese e piemontese."
  },
  {
    id: "torino-aerospace-network",
    label: "Aerospace Torino",
    sector: "privato",
    governance: "private",
    domain: "aerospace",
    strategy: "seed",
    reliability: "medium",
    coverage: "torino-metro",
    enabled: true,
    officialUrl: "https://www.argotecgroup.com/",
    statusLabel: "Planned",
    focus:
      "Spazio, avionica, sistemi satellitari e filiera aerospace presenti su Torino e cintura."
  },
  {
    id: "company-careers-seed",
    label: "Career sites aziendali curati",
    sector: "privato",
    governance: "private",
    domain: "company-careers",
    strategy: "seed",
    reliability: "medium",
    coverage: "italy",
    enabled: true,
    officialUrl: "https://job-scraper-2-xi.vercel.app",
    statusLabel: "Curated",
    focus: "Seed normalizzato di career page aziendali usato come fallback mentre crescono gli adapter live ufficiali."
  }
];
