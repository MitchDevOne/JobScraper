# CV Matching Refactor Hub

## Scopo

Questo file resta il punto di ingresso principale della documentazione sul sistema di CV matching e sourcing, ma non contiene piu tutti i dettagli operativi.

Da ora in poi la documentazione e divisa in due livelli:

- documento descrittivo del sistema attuale;
- documento operativo per il refactor.

Questo serve a:

- evitare un markdown monolitico difficile da mantenere;
- separare chiaramente stato attuale e piano di evoluzione;
- facilitare il lavoro sui prossimi sprint di refactor.

## Documenti principali

### 1. Documento descrittivo

File:

- [CV_MATCHING_SYSTEM_OVERVIEW.md](c:\Users\Lenovo\Desktop\JobScraper\docs\CV_MATCHING_SYSTEM_OVERVIEW.md)

Contiene:

- architettura logica attuale;
- pipeline end-to-end;
- estrazione del CV;
- categorizzazione e normalizzazione;
- matching PA;
- matching privato;
- sourcing e scraping delle fonti;
- limiti strutturali del sistema attuale.

Usalo quando devi:

- capire come funziona oggi il codice;
- fare analisi;
- confrontare il comportamento reale con quello desiderato;
- ricostruire i flussi prima di cambiare il codice.

### 2. Documento operativo di refactor

File:

- [CV_MATCHING_REFACTOR_PLAYBOOK.md](c:\Users\Lenovo\Desktop\JobScraper\docs\CV_MATCHING_REFACTOR_PLAYBOOK.md)

Contiene:

- checklist di refactor;
- priorita;
- capability model delle fonti;
- roadmap per ATS e nuove fonti;
- schema dei prossimi artefatti;
- metriche e piano di validazione;
- definition of done dei blocchi di lavoro.

Usalo quando devi:

- pianificare sprint;
- implementare refactor;
- decidere priorita tecniche;
- misurare avanzamento del lavoro.

## Artefatti collegati

### Schemi

- [cv-dataset.schema.json](c:\Users\Lenovo\Desktop\JobScraper\schemas\cv-dataset.schema.json)
- [job-annotation.schema.json](c:\Users\Lenovo\Desktop\JobScraper\schemas\job-annotation.schema.json)
- [source-capabilities.schema.json](c:\Users\Lenovo\Desktop\JobScraper\schemas\source-capabilities.schema.json)

### Tassonomie / esempi

- [roles.json](c:\Users\Lenovo\Desktop\JobScraper\taxonomy\roles.json)
- [skills.json](c:\Users\Lenovo\Desktop\JobScraper\taxonomy\skills.json)
- [study.json](c:\Users\Lenovo\Desktop\JobScraper\taxonomy\study.json)
- [source-capabilities.example.json](c:\Users\Lenovo\Desktop\JobScraper\taxonomy\source-capabilities.example.json)

### Test baseline

- [cv-intelligence.test.ts](c:\Users\Lenovo\Desktop\JobScraper\tests\baseline\cv-intelligence.test.ts)
- [public-requirements.test.ts](c:\Users\Lenovo\Desktop\JobScraper\tests\baseline\public-requirements.test.ts)
- [private-experience.test.ts](c:\Users\Lenovo\Desktop\JobScraper\tests\baseline\private-experience.test.ts)

## Come usare questa documentazione

### Se devi capire il sistema

Parti da:

- [CV_MATCHING_SYSTEM_OVERVIEW.md](c:\Users\Lenovo\Desktop\JobScraper\docs\CV_MATCHING_SYSTEM_OVERVIEW.md)

### Se devi modificare il sistema

Parti da:

- [CV_MATCHING_REFACTOR_PLAYBOOK.md](c:\Users\Lenovo\Desktop\JobScraper\docs\CV_MATCHING_REFACTOR_PLAYBOOK.md)

### Se devi implementare nuove fonti

Consulta in ordine:

1. [CV_MATCHING_SYSTEM_OVERVIEW.md](c:\Users\Lenovo\Desktop\JobScraper\docs\CV_MATCHING_SYSTEM_OVERVIEW.md)
2. [CV_MATCHING_REFACTOR_PLAYBOOK.md](c:\Users\Lenovo\Desktop\JobScraper\docs\CV_MATCHING_REFACTOR_PLAYBOOK.md)
3. [source-capabilities.schema.json](c:\Users\Lenovo\Desktop\JobScraper\schemas\source-capabilities.schema.json)
4. [source-capabilities.example.json](c:\Users\Lenovo\Desktop\JobScraper\taxonomy\source-capabilities.example.json)

### Se devi migliorare estrazione e matching

Consulta in ordine:

1. [CV_MATCHING_SYSTEM_OVERVIEW.md](c:\Users\Lenovo\Desktop\JobScraper\docs\CV_MATCHING_SYSTEM_OVERVIEW.md)
2. [roles.json](c:\Users\Lenovo\Desktop\JobScraper\taxonomy\roles.json)
3. [skills.json](c:\Users\Lenovo\Desktop\JobScraper\taxonomy\skills.json)
4. [study.json](c:\Users\Lenovo\Desktop\JobScraper\taxonomy\study.json)
5. [CV_MATCHING_REFACTOR_PLAYBOOK.md](c:\Users\Lenovo\Desktop\JobScraper\docs\CV_MATCHING_REFACTOR_PLAYBOOK.md)

## Prossimo uso consigliato

Per il refactor imminente il percorso consigliato e:

1. usare il documento descrittivo per verificare i flussi attuali;
2. usare il playbook per decidere il prossimo blocco implementativo;
3. aggiornare questo hub solo quando cambia la struttura della documentazione.
