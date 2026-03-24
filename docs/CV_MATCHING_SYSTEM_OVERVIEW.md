# CV Matching System Overview

## Scopo

Questo documento descrive il sistema attuale.

Serve a capire:

- come viene analizzato il CV;
- come vengono normalizzati i dati;
- come funzionano matching e ranking;
- come vengono interrogate e scrappate le fonti;
- quali sono i limiti strutturali prima del refactor.

## File chiave

- `app/api/jobs/route.ts`
- `lib/server/cv-profile.ts`
- `lib/server/job-search.ts`
- `lib/server/source-registry.ts`
- `lib/server/agents/cv-intelligence-agent.ts`
- `lib/server/agents/public-requirements-agent.ts`
- `lib/server/agents/private-experience-agent.ts`
- `lib/server/agents/pa-requirements-extractor.ts`
- `lib/server/scrapers/*.ts`

## Vista generale

Il sistema attuale e un motore euristico CV-aware:

1. riceve un CV PDF e i filtri di ricerca;
2. estrae testo dal PDF;
3. costruisce un `CvProfile`;
4. interroga fonti live note;
5. normalizza i job raccolti;
6. arricchisce parte dei job PA con i requisiti del bando;
7. filtra e ordina i job usando query, CV e segnali di compatibilita.

## Pipeline end-to-end

```text
UI
  -> upload CV PDF
  -> POST /api/jobs
  -> parse PDF
  -> buildCvProfile
  -> fetchJobs
     -> source selection
     -> live retrieval
     -> merge con seed privato
     -> PA requirements enrichment
     -> CV-aware filtering
     -> scoring
  -> response JSON
  -> rendering risultati
```

## Modello dati CV

Il tipo centrale e `CvProfile`:

- `keywords`
- `titles`
- `skills`
- `experienceAreas`
- `educationLevels`
- `studyAreas`
- `yearsOfExperience`
- `preferredLocations`

## Estrazione del CV

### Natura del parser

Il parser attuale:

- non usa LLM;
- non usa embeddings;
- usa alias hardcoded, regex e normalizzazione lessicale.

### Cosa viene estratto

#### Keywords

Generate da frequenza token con stopwords.

#### Ruoli

Estratti:

- dalle righe esperienza;
- dal testo generale del CV;
- poi normalizzati con alias canonici.

Esempi:

- `Product Owner` -> `product manager`
- `React Developer` -> `frontend developer`

#### Skill

Estratte tramite `skillAliases`.

Esempi:

- `next.js` -> `react`
- `ts` -> `typescript`
- `agile` -> `scrum`

#### Aree di esperienza

Categorie larghe come:

- `data`
- `analytics`
- `project management`
- `public administration`

#### Titoli di studio

Livelli:

- `bachelor`
- `master`
- `mba`

Aree:

- `business administration`
- `software`
- `data science`
- `foreign languages`
- `research`

#### Anni di esperienza

Stimati con regex semplici.

## Normalizzazione e aggregazione

Il sistema espande poi i dati del CV per il matching:

- `expandRoleTerms(...)`
- `expandSkillTerms(...)`
- espansione study areas in `job-search.ts`

Produce anche `suggestedRoles` a partire dai job che mostrano segnali affini.

## Fonti e sourcing

## Fonti pubbliche attuali

- `inPA`
- `Comune di Torino`
- `Citta Metropolitana di Torino`
- `Camera di commercio di Torino`
- `Regione Piemonte`

## Fonti private attuali

- `CSI Piemonte`
- board `Greenhouse`
- board `Lever`
- board `SmartRecruiters`
- `privateJobsSeed`

## Modello di sourcing attuale

Il sistema non fa discovery generale sul web.

Fa questo:

1. seleziona fonti note dal registry;
2. interroga ogni fonte con il suo adapter;
3. normalizza i risultati in `Job`;
4. applica query e matching soprattutto dopo il fetch.

### PA

La PA ha fonti piu concentrate e ufficiali.

Per `inPA` esiste anche una vera API con uso di location/region.

Le altre fonti PA sono per lo piu:

- elenco pagina;
- scraping HTML;
- parsing di dettaglio o PDF.

### Privato

Il privato oggi usa soprattutto board noti gia configurati:

- `boardToken`
- `site`
- `identifier`

Quindi il sistema oggi scarica i job da aziende note e poi filtra localmente.

Non fa ancora vera query privata ampia lato sorgente.

## LinkedIn e aggregatori

LinkedIn non va considerato una fonte da scrappare per questo sistema.

La strada corretta per aumentare il sourcing privato e:

- espandere ATS/feed originari;
- aggiungere eventualmente aggregatori API-driven controllati;
- separare retrieval da matching.

## Matching PA

Il matching PA usa:

- ruolo;
- skill;
- esperienza;
- education;
- requisiti estratti dal bando.

Esiti:

- `compatible`
- `potential`
- `incompatible`

Nella PA il titolo di studio pesa molto.

## Matching privato

Il matching privato usa:

- ruolo;
- skill;
- esperienza;
- role family;
- mismatch developer.

Famiglie attuali:

- `developer`
- `data`
- `product`
- `project`
- `business`
- `generic`

Nel privato il peso principale e su esperienza e family fit.

## Ranking

Il ranking combina:

- match query;
- match ruolo;
- match skill;
- match esperienza;
- education;
- location;
- boost specifici PA o privato.

## Limiti attuali

### Estrazione

- tassonomie hardcoded;
- CV parser fragile su layout non standard;
- seniority poco gestita;
- anni di esperienza molto semplificati.

### Matching

- pesi hardcoded;
- soglie euristiche;
- poca explainability strutturata.

### Fonti

- catalogo statico;
- privato poco coperto;
- molte fonti HTML fragili;
- mix live + seed statici;
- nessuna vera query privata lato sorgente.

## Uso di questo documento

Usa questo file quando devi:

- capire il comportamento attuale;
- analizzare un bug;
- ricostruire un flusso prima del refactor.

Per decidere cosa cambiare e in che ordine, usa il playbook operativo.
