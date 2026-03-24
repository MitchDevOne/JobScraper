# CV Matching Refactor Report

Data: 2026-03-24

## Ambito eseguito

Il refactor completato in questo blocco copre il primo tratto operativo del playbook sul layer fonti e sulla separazione retrieval/filtering/ranking.

In particolare sono stati introdotti:

- un modello tipizzato per `SourceCapabilities`;
- una `SourceQuery` strutturata per la fase di retrieval;
- un `sourceRegistry` dichiarativo che unifica catalogo, capability e fetcher;
- metriche base per fonte durante `fetchJobs(...)`;
- esposizione delle metriche nella response API;
- test baseline aggiuntivi su registry e `fetchJobs(...)` con fixture locali.

## Modifiche principali

### Dominio

In [lib/types.ts](c:\Users\Lenovo\Desktop\JobScraper\lib\types.ts) sono stati aggiunti:

- tipi per capability delle fonti;
- `SourceQuery`;
- `SourceFetchMetrics`;
- estensione opzionale di `SearchResponse` con le metriche di fetch.

### Registry fonti

In [lib/server/source-registry.ts](c:\Users\Lenovo\Desktop\JobScraper\lib\server\source-registry.ts) il registry e stato rifattorizzato in forma dichiarativa.

Ogni entry ora definisce:

- identita e settore;
- `adapterId`;
- capability flags;
- regola di eligibility;
- costruzione della `SourceQuery`;
- fetcher live opzionale.

Il seed resta nel registry come fonte dichiarata ma non viene eseguito come fetch live.

### Job search

In [lib/server/job-search.ts](c:\Users\Lenovo\Desktop\JobScraper\lib\server\job-search.ts):

- il retrieval usa le entry eleggibili del nuovo registry;
- per ogni fonte vengono raccolte metriche di fetch;
- retrieval e filtering sono piu separati a livello di responsabilita;
- il matching successivo continua a lavorare sul dominio `Job` gia normalizzato.

### API

In [app/api/jobs/route.ts](c:\Users\Lenovo\Desktop\JobScraper\app\api\jobs\route.ts) la response include `sourceFetchMetrics`.

### Test

Sono stati aggiunti:

- [tests/baseline/source-registry.test.ts](c:\Users\Lenovo\Desktop\JobScraper\tests\baseline\source-registry.test.ts)
- [tests/baseline/fetch-jobs.test.ts](c:\Users\Lenovo\Desktop\JobScraper\tests\baseline\fetch-jobs.test.ts)

Coprono:

- mapping della query in base alle capability della fonte;
- presenza del seed nel registry dichiarativo ma non nel live execution path;
- esecuzione di `fetchJobs(...)` con fixture locali, senza dipendenza da fonti remote;
- raccolta delle metriche per fonte;
- esclusione dei job remote non richiesti.

## Verifica eseguita

Comandi eseguiti con esito positivo:

- `npm.cmd run lint`
- `npm.cmd run test:baseline`
- `npm.cmd run build`

## Allineamento al playbook

Step coperti parzialmente o completamente:

- introdurre `SourceCapabilities` nel dominio;
- rifattorizzare `source-registry.ts`;
- migrare le fonti esistenti al nuovo modello;
- introdurre fetch metrics;
- aggiungere test baseline su `fetchJobs(...)` con fixture locali.

Step non ancora completati in questo blocco:

- tassonomie esterne come unica source of truth per parser e matching;
- trace strutturato di estrazione CV/job;
- nuovi adapter ATS come `Ashby` e `Personio`;
- formalizzazione completa di eligibility, compatibility e ranking come layer separati.

## Rischi residui

- le capability sono tipizzate ma ancora dichiarate in codice, non caricate da file JSON validato;
- `SourceQuery` e pronta per il retrieval query-aware, ma la maggior parte delle fonti non supporta ancora query lato sorgente;
- le metriche sono restituite dalla API ma non ancora persistite o aggregate.

## Prossimo sprint consigliato

1. esternalizzare le capability in un artefatto validato contro schema JSON;
2. introdurre un adapter ATS nuovo ad alta priorita (`Ashby` o `Personio`);
3. separare esplicitamente nel codice `eligibility`, `compatibility` e `ranking`;
4. aggiungere trace strutturato di esclusione/promozione per job.
