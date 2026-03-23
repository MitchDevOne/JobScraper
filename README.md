# Torino Job Radar

MVP leggero per cercare offerte su Torino, Italia, con focus su:

- separazione pubblico / privato
- esclusione dei ruoli fully remote di default
- matching basato su CV PDF caricato in sessione
- ranking per coerenza con titoli, skill, esperienza e titolo di studio
- ricerca live su fonti pubbliche e board aziendali
- UI moderna in Next.js
- deploy economico su Vercel Hobby

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- parser PDF server-side
- fonti live via API pubbliche e parser HTML
- dataset seed locale come fallback
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

## Fonti attive

- `inPA`
- `Comune di Torino`
- `Citta Metropolitana di Torino`
- `CSI Piemonte`
- board `Greenhouse`
- board `Lever`
- board `SmartRecruiters`
- seed locale privato come fallback

## Flusso ricerca

1. Carichi un CV PDF nella UI.
2. L'API estrae keyword, titoli, skill, esperienza e titolo di studio.
3. Le fonti live vengono interrogate in base a settore, location e perimetro geografico.
4. I risultati vengono filtrati e riordinati con scoring CV-aware.
5. La UI propone ruoli affini per una seconda ricerca piu mirata.

## Limiti attuali

- nessuna persistenza utente
- niente scheduler o database
- alcune fonti private restano dipendenti da board pubbliche o seed curato
- il CV viene analizzato solo nella sessione corrente

## Prossimi passi

1. Spostare i job in Postgres free (`Neon` o `Supabase`).
2. Aggiungere cache e ingestione schedulata fuori da Vercel.
3. Ampliare il catalogo fonti con altri enti e career site rilevanti per Torino.
