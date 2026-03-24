# CV Matching Refactor Playbook

## Scopo

Questo documento e operativo.

Serve a guidare il refactor del sistema con focus su:

- migliore estrazione e categorizzazione dati;
- migliore precisione nel filtraggio dei job;
- migliore uso delle chiavi di retrieval;
- migliore gestione e copertura delle fonti.

## Priorita strategiche

Le priorita principali sono:

1. rifondazione della tassonomia;
2. miglioramento dell'estrazione CV;
3. separazione tra retrieval, filtering e ranking;
4. refactor del layer fonti;
5. aumento del sourcing privato tramite ATS/feed solidi;
6. introduzione di metriche e tracing.

## Master checklist

### Fase 0: baseline

- [ ] mantenere e ampliare i test baseline
- [ ] aggiungere test su ranking
- [ ] aggiungere test su `fetchJobs(...)` con fixture locali

### Fase 1: tassonomie

- [ ] usare tassonomie esterne come fonte di verita
- [ ] collegare parser e matching alle stesse tassonomie
- [ ] aggiungere validation e test di consistenza

### Fase 2: extraction

- [ ] separare section detection, raw extraction, canonicalization, aggregation
- [ ] migliorare role extraction dalle esperienze
- [ ] distinguere segnale forte/debole/ambiguo
- [ ] migliorare parsing di studio e anni esperienza
- [ ] introdurre trace di estrazione

### Fase 3: query model

- [ ] introdurre `SourceQuery` strutturata
- [ ] distinguere retrieval query da ranking query
- [ ] derivare query candidate dal CV
- [ ] modellare ruolo, skill, location, work mode, seniority

### Fase 4: refactor fonti

- [ ] introdurre `SourceCapabilities`
- [ ] classificare le fonti per origine e capacita
- [ ] rifattorizzare il registry in modo dichiarativo
- [ ] introdurre metriche e logging per fonte

### Fase 5: sourcing privato

- [ ] rafforzare Greenhouse, Lever, SmartRecruiters
- [ ] aggiungere Ashby
- [ ] aggiungere Personio
- [ ] valutare Teamtailor in modalita sostenibile
- [ ] usare aggregatori solo come booster di coverage

### Fase 6: filtering e ranking

- [ ] separare eligibility, compatibility, ranking
- [ ] formalizzare score parziali
- [ ] ridurre falsi positivi su ruoli generici
- [ ] migliorare gestione ruoli ibridi o transizionali

### Fase 7: observability

- [ ] introdurre trace strutturato per CV
- [ ] introdurre trace strutturato per job
- [ ] loggare motivi di esclusione/promozione

### Fase 8: dataset e metriche

- [ ] usare gli schema JSON gia introdotti
- [ ] costruire il dataset di CV fittizi
- [ ] annotare job-level expectations
- [ ] misurare extraction, gating e ranking

## Layer fonti: target di refactor

## Artefatti esistenti

- [source-capabilities.schema.json](c:\Users\Lenovo\Desktop\JobScraper\schemas\source-capabilities.schema.json)
- [source-capabilities.example.json](c:\Users\Lenovo\Desktop\JobScraper\taxonomy\source-capabilities.example.json)

## Capability model

I campi minimi da usare per il refactor iniziale sono:

- `originType`
- `retrievalMode`
- `supportsKeywordSearch`
- `supportsLocationSearch`
- `supportsPagination`
- `supportsDetailEnrichment`
- `qualityTier`
- `dedupeStrategy`

## Target registry

Il registry dovrebbe evolvere verso:

```ts
type SourceRegistryEntry = {
  id: string
  capabilities: SourceCapabilities
  adapterId: string
  isEligibleForFilters: (filters: JobFilters) => boolean
  buildSourceQuery: (filters: JobFilters, cvProfile?: CvProfile | null) => SourceQuery | null
}
```

## Source query target

```ts
type SourceQuery = {
  roleKeywords: string[]
  skillKeywords: string[]
  location: string | null
  locationScope: string | null
  workMode: string | null
  seniority: string | null
}
```

## Refactor delle fonti private

### Regola chiave

Non usare LinkedIn come fonte di scraping.

### Strategia

1. fonti originarie / ATS
2. aggregatori controllati come recall booster
3. matching CV-aware solo dopo retrieval e deduplica

## Roadmap ATS

### Ashby

Priorita: alta

Checklist:

- [ ] identificare aziende target Ashby
- [ ] verificare pattern dei board
- [ ] creare adapter minimale list-only
- [ ] normalizzare location/work mode
- [ ] aggiungere smoke test

### Personio

Priorita: alta

Checklist:

- [ ] identificare aziende target Personio
- [ ] verificare feed XML/endpoint pubblici
- [ ] creare parser XML condiviso
- [ ] implementare adapter Personio
- [ ] aggiungere normalizzazione location/work mode

### Teamtailor

Priorita: media-alta

Checklist:

- [ ] mappare aziende target Teamtailor
- [ ] verificare modalita public-only
- [ ] valutare se serve API key
- [ ] definire approccio sostenibile
- [ ] implementare adapter coerente con auth mode reale

## Metriche da introdurre

### Per fonte

- job grezzi raccolti
- job validi
- errori fetch
- latenza
- deduplica rate
- percentuale top-k

### Per matching

- precision/recall ruoli
- precision/recall skill
- accuracy gate PA
- accuracy gate privato
- Precision@3
- Precision@5
- nDCG

## Ordine pratico dei prossimi sprint

1. introdurre `SourceCapabilities` nel dominio
2. rifattorizzare `source-registry.ts`
3. migrare le fonti esistenti al nuovo modello
4. introdurre fetch metrics
5. implementare `Ashby`
6. implementare `Personio`
7. valutare `Teamtailor`
8. introdurre retrieval query-aware

## Definition of done del primo blocco

Il primo blocco di refactor puo dirsi completato quando:

- parser e matching usano tassonomie condivise;
- il registry usa capability flags strutturati;
- le fonti attuali sono migrate al nuovo modello;
- retrieval, filtering e ranking sono concettualmente separati;
- esiste almeno un nuovo adapter ATS oltre a quelli gia presenti;
- baseline e metriche permettono confronto pre/post refactor.

## Uso di questo documento

Usa questo file quando devi:

- pianificare il refactor;
- implementare un blocco di lavoro;
- decidere l'ordine di attacco dei problemi;
- aggiornare la roadmap tecnica.
