# JobScraper Startup Plan

## 1. Obiettivo

Costruire un tool personale per la ricerca lavoro con:

- interfaccia moderna e semplice da usare
- separazione tra offerte del settore pubblico e privato
- raccolta annunci da piu' fonti
- possibilita' di salvare, filtrare e confrontare offerte
- deployment semplice su Vercel per frontend e API leggere

Obiettivo iniziale: creare un MVP affidabile prima di puntare a scraping esteso e automazioni complesse.

## 2. Problema Reale da Risolvere

La difficolta' non e' solo trovare annunci, ma:

- centralizzare fonti disperse
- distinguere offerte rilevanti da rumore
- separare pubblico vs privato
- capire se l'offerta e' attiva, duplicata o vecchia
- avere una vista personale dei job piu' adatti al proprio profilo

Per questo il prodotto deve partire da qualita' dei dati e UX, non da scraping aggressivo.

## 3. Vincoli Importanti

### Scraping e piattaforme

- `LinkedIn`: scraping diretto e' ad alto rischio tecnico e legale; puo' bloccare facilmente IP o account.
- `Google Jobs`: non e' una sorgente primaria semplice da scrapare in modo stabile; spesso aggrega dati da altre fonti.
- `Indeed`: possibile da analizzare tecnicamente, ma con rischio di cambi frequenti, rate limit e policy restrittive.
- `Siti aziendali`: sono spesso la fonte piu' affidabile per annunci attivi e completi.
- `Portali pubblici`: spesso hanno strutture meno moderne, ma sono utili per classificazione settore pubblico.

Conclusione: per un MVP personale conviene usare una strategia ibrida.

## 4. Strategia Consigliata per le Fonti

### Fase 1: fonti a rischio basso / medio

Partire con:

- siti careers di aziende target
- portali pubblici selezionati
- eventuali feed RSS, sitemap o API ufficiali dove esistono
- import manuale di URL annuncio come fallback

### Fase 2: aggregatori

Valutare dopo il MVP:

- Indeed
- altri job board con pagine pubbliche stabili

### Fase 3: enrichment

- classificazione automatica pubblico / privato
- deduplicazione cross-source
- scoring di rilevanza rispetto al CV

## 5. Scelta Architetturale

## Frontend

Consigliato:

- `Next.js` su Vercel
- `TypeScript`
- `Tailwind CSS`
- componenti UI curate, non template generici

Motivo:

- ottimo fit per Vercel
- UI moderna e veloce da iterare
- routing, API routes e SSR disponibili

## Backend

Per il backend ci sono due opzioni realistiche.

### Opzione A: tutto in Next.js

Usare:

- `Next.js` frontend
- route handlers / server actions
- cron o trigger esterni per scraping

Pro:

- stack semplice
- deployment rapido
- ideale per MVP

Contro:

- scraping pesante o browser automation non e' ideale su Vercel serverless

### Opzione B: frontend su Vercel + scraper separato

Usare:

- `Next.js` su Vercel per interfaccia e API leggere
- worker separato per scraping (`Python` o `Node.js`)
- database condiviso

Pro:

- piu' robusto per scraping reale
- piu' facile usare Playwright, code e retry

Contro:

- architettura un po' piu' complessa

Raccomandazione:

Per il tuo caso conviene `Opzione B`.

## 6. Stack Tecnico Consigliato

### UI / app

- `Next.js`
- `TypeScript`
- `Tailwind CSS`
- `shadcn/ui` o libreria simile come base, poi personalizzazione forte

### Database

Una di queste:

- `Postgres` con `Supabase`
- `Neon Postgres`

Per MVP personale: `Supabase` e' molto pratica.

### Scraper / ingestion

Scelta consigliata:

- `Python`
- `Playwright`
- `BeautifulSoup` o `parsel`
- scheduling esterno

Motivo:

- Python e' ottimo per scraping, parsing e classificazione testo

### Infra / orchestration

- frontend: `Vercel`
- scraper: `Railway`, `Render`, `Fly.io` o VPS leggero
- cron: scheduler della piattaforma o GitHub Actions per task semplici

## 7. Feature MVP

Le feature migliori da fare subito sono queste.

### Core

- ricerca offerte da una lista iniziale di fonti configurabili
- classificazione `pubblico` / `privato`
- tag per ruolo, localita', seniority e fonte
- salvataggio offerte in database
- deduplicazione base per URL + titolo + azienda
- dashboard con ricerca e filtri

### UX

- vista card + tabella
- stato offerta: `nuova`, `vista`, `salvata`, `scartata`, `applicata`
- dettaglio annuncio pulito
- link diretto alla fonte originale

### Non fare subito

- auto-apply
- scraping aggressivo di LinkedIn
- ranking AI complesso
- browser extension
- autenticazione multiutente

## 8. Feature V2

- matching CV -> job score
- alert email o Telegram
- riassunto automatico annuncio
- estrazione requisiti principali
- suggerimenti skill gap
- note personali per candidatura
- tracking pipeline candidature

## 9. Modello Dati Iniziale

Tabelle minime:

### `sources`

- id
- name
- type
- base_url
- sector_hint
- active

### `companies`

- id
- name
- website
- sector_type

### `jobs`

- id
- source_id
- company_id
- title
- location
- country
- sector_type
- employment_type
- seniority
- description
- original_url
- posted_at
- discovered_at
- status
- hash

### `job_tags`

- id
- job_id
- tag

## 10. Classificazione Pubblico / Privato

Regola iniziale semplice:

- se la fonte e' un portale PA o ente pubblico -> `pubblico`
- se l'azienda e' privata -> `privato`
- se ambiguo -> `da_verificare`

Approccio corretto:

- partire con regole esplicite
- introdurre ML o LLM solo dopo avere dati sufficienti

## 11. Rischi Principali

### Tecnici

- scraper fragili su siti dinamici
- blocchi anti-bot
- deduplicazione difficile tra fonti diverse
- annunci incompleti o inconsistenti

### Legali / policy

- termini d'uso restrittivi di alcuni portali
- possibili limiti sul crawling automatizzato
- necessità di rate limiting e rispetto robots/policy quando applicabile

### Prodotto

- troppe fonti troppo presto
- dati sporchi che peggiorano l'esperienza
- UI bella ma poco utile senza workflow chiaro

## 12. Roadmap Consigliata

### Sprint 0

- definire stack
- creare repo app
- definire schema dati
- scegliere 5-10 fonti iniziali

### Sprint 1

- costruire UI base
- creare database
- ingestione manuale o semiautomatica da 2-3 fonti
- lista offerte con filtri

### Sprint 2

- aggiungere scraper per siti aziendali
- deduplicazione
- classificazione pubblico / privato
- stato candidatura

### Sprint 3

- alert
- scoring rilevanza
- analytics personali

## 13. Decisioni Consigliate Adesso

Per partire bene, io sceglierei:

- `Next.js + TypeScript + Tailwind` per il frontend
- `Supabase Postgres` per il database
- `Python + Playwright` per gli scraper
- `Vercel` per app frontend
- `Railway` o `Render` per i job di scraping

## 14. Primo MVP Realistico

Un MVP molto concreto potrebbe essere:

1. dashboard moderna
2. import da 5-10 siti aziendali selezionati
3. classificazione pubblico / privato
4. salvataggio e filtri
5. stato candidatura

Questo ti da' un prodotto utile quasi subito, senza dipendere troppo da scraping fragile di grandi piattaforme.

## 15. Criteri per Scegliere le Feature

Tieni una feature se:

- aumenta utilita' personale immediata
- riduce tempo di ricerca reale
- e' sostenibile da mantenere
- non dipende da scraping instabile

Scarta o rimanda una feature se:

- e' tecnicamente interessante ma poco utile
- introduce rischio legale elevato
- richiede troppo lavoro per poca affidabilita'

## 16. Prossimi Passi

Le prossime scelte sensate sono:

1. decidere lo stack finale MVP
2. selezionare le prime fonti da integrare
3. definire lo schema database
4. creare il progetto `Next.js`
5. progettare la UI principale

Se vuoi, nel passo successivo possiamo trasformare questo file in:

- PRD piu' strutturato
- backlog MVP prioritizzato
- architettura tecnica
- schema database SQL iniziale
- wireframe della dashboard

## 17. Scope MVP scelto adesso

Per partire in modo sostenibile su Vercel Hobby:

- focus geografico: `Torino, Italia`
- esclusione iniziale dei ruoli `fully remote`
- nessun database obbligatorio nella fase 1
- dataset seed locale e API leggere in `Next.js`
- scraping reale rimandato alla fase 2 con worker separato

## 18. Deliverable implementati

Base MVP avviata con:

- app `Next.js + TypeScript + Tailwind`
- dashboard moderna con filtri
- route `GET /api/jobs`
- dataset seed con esempi `pubblico` e `privato`
- documentazione iniziale per deploy su `Vercel`
