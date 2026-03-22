import { Job, JobFilters } from "@/lib/types";

export const jobs: Job[] = [
  {
    id: "1",
    title: "Frontend Developer",
    company: "Reply",
    sector: "privato",
    location: "Torino, Piemonte, Italia",
    city: "Torino",
    workMode: "hybrid",
    source: "Company Careers",
    sourceType: "company-site",
    originalUrl: "https://www.reply.com",
    postedAt: "2026-03-20",
    discoveredAt: "2026-03-22",
    tags: ["react", "typescript", "frontend"],
    summary: "Ruolo frontend con stack React e TypeScript, presenza in sede 2 giorni a settimana.",
    status: "nuova"
  },
  {
    id: "2",
    title: "Data Analyst",
    company: "Intesa Sanpaolo",
    sector: "privato",
    location: "Torino, Piemonte, Italia",
    city: "Torino",
    workMode: "hybrid",
    source: "Company Careers",
    sourceType: "company-site",
    originalUrl: "https://group.intesasanpaolo.com",
    postedAt: "2026-03-18",
    discoveredAt: "2026-03-22",
    tags: ["sql", "python", "data"],
    summary: "Analisi dati e reporting su processi interni, team basato su Torino.",
    status: "vista"
  },
  {
    id: "3",
    title: "Istruttore Amministrativo",
    company: "Comune di Torino",
    sector: "pubblico",
    location: "Torino, Piemonte, Italia",
    city: "Torino",
    workMode: "on-site",
    source: "Portale Concorsi",
    sourceType: "public-portal",
    originalUrl: "https://www.comune.torino.it",
    postedAt: "2026-03-17",
    discoveredAt: "2026-03-22",
    tags: ["amministrazione", "concorso", "ente-locale"],
    summary: "Concorso pubblico per profilo amministrativo con attivita in presenza.",
    status: "nuova"
  },
  {
    id: "4",
    title: "Software Engineer",
    company: "Prima Industrie",
    sector: "privato",
    location: "Collegno, Torino, Italia",
    city: "Torino",
    workMode: "on-site",
    source: "Company Careers",
    sourceType: "company-site",
    originalUrl: "https://www.primaindustrie.com",
    postedAt: "2026-03-19",
    discoveredAt: "2026-03-22",
    tags: ["csharp", "automation", "industry"],
    summary: "Sviluppo software per sistemi industriali con sede nell'area torinese.",
    status: "salvata"
  },
  {
    id: "5",
    title: "Project Management Officer",
    company: "CSI Piemonte",
    sector: "pubblico",
    location: "Torino, Piemonte, Italia",
    city: "Torino",
    workMode: "hybrid",
    source: "Public Organization Jobs",
    sourceType: "public-portal",
    originalUrl: "https://www.csipiemonte.it",
    postedAt: "2026-03-15",
    discoveredAt: "2026-03-22",
    tags: ["project-management", "pmo", "digitale"],
    summary: "Supporto a progetti digitali della PA piemontese con modello ibrido.",
    status: "nuova"
  },
  {
    id: "6",
    title: "Backend Developer",
    company: "Alten Italia",
    sector: "privato",
    location: "Torino, Piemonte, Italia",
    city: "Torino",
    workMode: "remote",
    source: "Indeed mirror",
    sourceType: "aggregator",
    originalUrl: "https://it.indeed.com",
    postedAt: "2026-03-21",
    discoveredAt: "2026-03-22",
    tags: ["java", "spring", "backend"],
    summary: "Ruolo fully remote, presente nel seed solo per dimostrare l'esclusione di default.",
    status: "nuova"
  }
];

export const sources = [
  {
    name: "Company Careers",
    focus: "Siti aziendali selezionati con pagine stabili e piu facili da mantenere.",
    status: "MVP"
  },
  {
    name: "Portale Concorsi / enti locali",
    focus: "Fonti per il settore pubblico e organizzazioni partecipate.",
    status: "MVP"
  },
  {
    name: "Indeed / aggregatori",
    focus: "Da usare come supporto o discovery, non come fondazione del prodotto.",
    status: "Later"
  }
];

export function filterJobs(filters: JobFilters = {}) {
  const {
    sector = "all",
    q = "",
    workMode = "all",
    includeRemote = false,
    city = "Torino"
  } = filters;

  const query = q.trim().toLowerCase();

  return jobs.filter((job) => {
    if (!includeRemote && job.workMode === "remote") {
      return false;
    }

    if (sector !== "all" && job.sector !== sector) {
      return false;
    }

    if (workMode !== "all" && job.workMode !== workMode) {
      return false;
    }

    if (city && job.city.toLowerCase() !== city.toLowerCase()) {
      return false;
    }

    if (!query) {
      return true;
    }

    const haystack = [
      job.title,
      job.company,
      job.location,
      job.summary,
      ...job.tags
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(query);
  });
}
