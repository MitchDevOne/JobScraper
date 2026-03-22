# Deploy su Vercel Hobby

## Obiettivo

Tenere il progetto leggero e senza costi nella fase iniziale.

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
