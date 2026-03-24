# Deploy su Vercel Hobby

## Obiettivo

Tenere il progetto leggero e senza costi nella fase iniziale.

Per la documentazione tecnica su matching, fonti e refactor, il punto di ingresso e:

- [CV_MATCHING_FLOWS.md](c:\Users\Lenovo\Desktop\JobScraper\docs\CV_MATCHING_FLOWS.md)

## Configurazione consigliata

- frontend e API leggere su Vercel
- dati seed locali o JSON statico
- niente scraping pesante dentro Vercel

## Perche e sostenibile sul piano base

- la UI e statica o quasi statica
- la route `/api/jobs` e molto economica
- niente cron intensivi
- niente browser automation

## Workflow

1. Installa Node.js 20 LTS sul tuo PC.
2. Esegui `npm install`.
3. Verifica il progetto con `npm run build`.
4. Crea un repository GitHub e fai push.
5. Importa il repository in Vercel.

## Quando rischi di uscire dal free tier

- se usi scraping con Playwright dentro funzioni serverless
- se aggiungi cron troppo frequenti
- se fai polling continuo dal frontend
- se usi database o servizi esterni con piano non gratuito

## Strategia corretta per la fase 2

- Vercel solo per frontend e API veloci
- scraping reale eseguito altrove
- database free con limiti bassi ma sufficienti per uso personale

## Coerenza con il refactor in corso

Nel refactor attuale la direzione consigliata resta:

- mantenere Vercel per UI e API leggere;
- non spostare scraping pesante o browser automation dentro funzioni serverless;
- separare progressivamente retrieval, filtering e ranking;
- far crescere il layer fonti tramite adapter e capability model senza aumentare troppo il carico runtime su Vercel.

Se devi lavorare sul sistema di matching o sulle fonti, consulta:

- overview descrittiva:
  - [CV_MATCHING_SYSTEM_OVERVIEW.md](c:\Users\Lenovo\Desktop\JobScraper\docs\CV_MATCHING_SYSTEM_OVERVIEW.md)
- playbook operativo:
  - [CV_MATCHING_REFACTOR_PLAYBOOK.md](c:\Users\Lenovo\Desktop\JobScraper\docs\CV_MATCHING_REFACTOR_PLAYBOOK.md)
