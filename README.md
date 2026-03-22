# Torino Job Radar

MVP leggero per cercare offerte su Torino, Italia, con focus su:

- separazione pubblico / privato
- esclusione dei ruoli fully remote di default
- UI moderna in Next.js
- deploy economico su Vercel Hobby

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- dataset seed locale
- API route `/api/jobs`

## Perche questa base e leggera

- nessun database obbligatorio nella fase 1
- nessuna browser automation su Vercel
- nessun servizio a pagamento richiesto per partire
- puoi deployare l'app sul piano Hobby

## Avvio locale

Serve Node.js 20 o superiore.

```bash
npm install
npm run dev
```

Apri `http://localhost:3000`.

## Deploy su Vercel

1. Pusha il progetto su GitHub.
2. In Vercel scegli `Add New -> Project`.
3. Importa il repository.
4. Lascia le impostazioni di default per Next.js.
5. Deploy.

Non servono variabili ambiente per questo MVP.

## Limiti attuali

- gli annunci arrivano da un seed locale, non da scraping reale
- nessuna persistenza utente
- niente scheduler o database

## Prossimi passi

1. Spostare i job in Postgres free (`Neon` o `Supabase`).
2. Aggiungere adapter per fonti reali di Torino.
3. Eseguire ingestione fuori da Vercel, con job schedulati separati.
