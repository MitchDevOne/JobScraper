import { Job } from "@/lib/types";

export const privateJobsSeed: Job[] = [
  {
    id: "reply-frontend-developer",
    title: "Frontend Developer",
    company: "Reply",
    sector: "privato",
    location: "Torino, Piemonte, Italia",
    city: "Torino",
    workMode: "hybrid",
    source: "Company Careers",
    sourceType: "company-site",
    originalUrl: "https://www.reply.com/it/careers/job-details/frontend-developer-torino",
    postedAt: "2026-03-20",
    expiresAt: null,
    discoveredAt: "2026-03-23",
    tags: ["react", "typescript", "frontend"],
    summary: "Ruolo frontend con stack React e TypeScript, presenza in sede 2 giorni a settimana.",
    status: "nuova"
  },
  {
    id: "intesa-data-analyst",
    title: "Data Analyst",
    company: "Intesa Sanpaolo",
    sector: "privato",
    location: "Torino, Piemonte, Italia",
    city: "Torino",
    workMode: "hybrid",
    source: "Company Careers",
    sourceType: "company-site",
    originalUrl: "https://group.intesasanpaolo.com/it/careers/posizioni-aperta/data-analyst-torino",
    postedAt: "2026-03-18",
    expiresAt: null,
    discoveredAt: "2026-03-23",
    tags: ["sql", "python", "data"],
    summary: "Analisi dati e reporting su processi interni, team basato su Torino.",
    status: "vista"
  },
  {
    id: "prima-software-engineer",
    title: "Software Engineer",
    company: "Prima Industrie",
    sector: "privato",
    location: "Collegno, Torino, Italia",
    city: "Torino",
    workMode: "on-site",
    source: "Company Careers",
    sourceType: "company-site",
    originalUrl: "https://www.primaindustrie.com/careers/software-engineer-collegno",
    postedAt: "2026-03-19",
    expiresAt: null,
    discoveredAt: "2026-03-23",
    tags: ["csharp", "automation", "industry"],
    summary: "Sviluppo software per sistemi industriali con sede nell'area torinese.",
    status: "salvata"
  },
  {
    id: "csi-pmo",
    title: "Project Management Officer",
    company: "CSI Piemonte",
    sector: "privato",
    location: "Torino, Piemonte, Italia",
    city: "Torino",
    workMode: "hybrid",
    source: "Organization Jobs",
    sourceType: "company-site",
    originalUrl: "https://www.csipiemonte.it/lavora-con-noi/project-management-officer-2026",
    postedAt: "2026-03-15",
    expiresAt: null,
    discoveredAt: "2026-03-23",
    tags: ["project-management", "pmo", "digitale"],
    summary: "Supporto a progetti digitali in un'organizzazione ICT con base a Torino.",
    status: "nuova"
  },
  {
    id: "alten-backend-remote",
    title: "Backend Developer",
    company: "Alten Italia",
    sector: "privato",
    location: "Torino, Piemonte, Italia",
    city: "Torino",
    workMode: "remote",
    source: "Indeed mirror",
    sourceType: "aggregator",
    originalUrl: "https://it.indeed.com/viewjob?jk=backend-developer-remote-torino",
    postedAt: "2026-03-21",
    expiresAt: null,
    discoveredAt: "2026-03-23",
    tags: ["java", "spring", "backend"],
    summary: "Ruolo fully remote, mantenuto solo per testare l'esclusione automatica.",
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
    name: "Comune di Torino - concorsi",
    focus: "Scraping live della fonte pubblica ufficiale, con filtro solo bandi ancora attivi.",
    status: "Live"
  },
  {
    name: "Indeed / aggregatori",
    focus: "Da usare come supporto o discovery, non come fondazione del prodotto.",
    status: "Later"
  }
];
