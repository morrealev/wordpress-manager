# Content Framework — Riflessioni Strategiche Preliminari

**Data**: 2026-03-02
**Versione**: 1.0.0
**Stato**: Approvato (riflessioni preliminari)
**Contesto**: Evoluzione WordPress Manager Plugin (v2.12.2, WCOP 9.2/10) verso Content Framework unificato

---

## 1. Vincolo Architetturale Fondamentale

> "Non creare sovrastrutture che degradano la potenza nativa dell'intelligenza."

L'ecosistema Claude Code + MCP funziona già come sistema di orchestrazione naturale:
- **LLM** = motore decisionale (routing, context aggregation, reasoning)
- **MCP tool** = attuatori (148 tool registrati per operazioni WordPress)
- **Skill** = istruzioni operative (43 skill specializzate)
- **Agent** = orchestratori autonomi (12 agent per task complessi)

Aggiungere uno strato applicativo (pipeline engine in codice, calendar app, dashboard React) significherebbe:
- **Duplicare** ciò che Claude fa nativamente
- **Irrigidire** ciò che oggi è fluido (ogni sessione è un'istanza adattiva)
- **Appesantire** il plugin con centinaia di righe di TypeScript che fanno meno bene ciò che un prompt ben strutturato fa già

**Principio**: non costruire un framework *sopra* il framework — rendere **esplicite le connessioni** tra componenti che oggi sono implicite.

---

## 2. Mappa delle Capacità Esistenti

### Plugin WordPress Manager (148 tool, 43 skill)

| Area | Skill | Capacità |
|------|-------|----------|
| Content creation | `wp-content`, `wp-content-generation` | Blog post, pagine, custom post type |
| Content optimization | `wp-content-optimization`, `wp-programmatic-seo` | SEO scoring, readability, meta, headline |
| Distribution | `wp-social-email`, `wp-linkedin`, `wp-twitter` | Multi-channel publish |
| Analytics | `wp-analytics`, `wp-search-console` | GA4, GSC, metriche sito |
| Workflow | `wp-content-workflows` | Status editoriale (draft→review→publish) |
| Repurposing | `wp-content-repurposing` | Multi-format da contenuto base |
| Attribution | `wp-content-attribution` | Tracciamento fonti e crediti |

### Ecosistema Gen* (commands/)

| Skill | Agenti | Capacità | Output chiave |
|-------|--------|----------|---------------|
| **GenCorpComm** | Multi-agente | 10 domini comunicazione, parametric tone/stakeholder | Pitch deck, white paper, press release, social content |
| **GenMarketing** | CMO agent | Channel strategy, campaign plan, content calendar | Marketing strategy MD, budget allocation |
| **GenSignal** | 3 agenti | 26 pattern detector, scoring, experiment design | SignalCard, TrendReport, AlertNotifications |
| **GenExecution** | 4 agenti | 3C model (CHI-COSA-COME), ClickUp integration | Task hierarchy, assignment matrix |
| **GenBrand** | 11 agenti | Brand strategy S0-S7, identity system | Brand brief, positioning, messaging, governance |
| **GenReport** | 8 agenti | Market intelligence, competitive analysis | ReportZero, MetaProjects, InsightCards |
| **GenContext** | HITL system | Background intelligence, opportunity mapping | Asset inventory, value chain map |

### Orchestrazione Esistente (skills-orchestration.yaml v1.2.0)

4 pattern di orchestrazione già definiti:
1. **Product Development Pipeline**: GenReport → GenProduct → GenExecution
2. **Market-Driven Innovation**: GenSignal → GenReport → GenProduct
3. **Competitive Response**: GenProduct (Reverse) → GenExecution
4. **Cost Optimization**: GenProduct (Cost-Down) → GenProduct (Validate) → Loop

**Nessuno di questi pattern include WordPress come endpoint di pubblicazione.** Questo è il gap principale.

---

## 3. Gap Analysis

| Gap | Descrizione | Impatto |
|-----|-------------|---------|
| **Gen* → WP publish** | GenCorpComm produce contenuti multi-formato ma non li pubblica su WordPress | Il contenuto resta in file locali, richiede copia manuale |
| **WP analytics → Gen* intelligence** | `wp-analytics` raccoglie dati ma GenSignal non li consuma | Nessun feedback loop: i dati non informano la strategia |
| **Piano editoriale** | Nessun sistema strutturato per pianificare contenuti nel tempo | Pubblicazione reattiva, non strategica |
| **Brand consistency WP** | WP non ha accesso al brand system di GenBrand | Inconsistenza tra brand guidelines e contenuti pubblicati |
| **Coordinamento task** | GenExecution produce task ClickUp, `wp-content-workflows` gestisce status WP | Due sistemi di task indipendenti senza ponte |

---

## 4. Approccio: File MD come Configuration Layer

Invece di codice applicativo, usiamo **file Markdown strutturati come strato di configurazione e stato persistente**.

### Tre Tipi di File MD

| Tipo | Suffisso | Scopo | Esempio |
|------|----------|-------|---------|
| **Schema** | `.schema.md` | Template strutturato con frontmatter YAML, definisce la struttura | `content-brief.schema.md` |
| **Instance** | `.state.md` | Stato corrente di un'istanza attiva, aggiornato tra sessioni | `2026-03-editorial.state.md` |
| **Config** | `.config.md` | Parametri di tuning per un sito, brand, o workflow | `mysite.config.md` |

### Perché Funziona

- **Leggibile da Claude**: per ragionamento, decision-making, context aggregation
- **Leggibile da MCP tool**: per operazioni CRUD via `get_post`, `create_post`, etc.
- **Persistente tra sessioni**: il filesystem è il database
- **Versionabile**: git tracking naturale
- **Editabile dall'utente**: un editor di testo qualsiasi
- **Zero dipendenze**: nessun database, nessuna API, nessun framework

### Analogia con Ecosistema Esistente

Questo pattern è già validato:
- `skills-orchestration.yaml` orchestra le Gen* skill con YAML
- GenSignal usa `signal-card-template.yaml` come schema
- GenBrand produce `brief.yaml`, `positioning_canvas.yaml`
- GenExecution produce `TaskHierarchy.yaml`

Estendiamo lo stesso pattern al bridge Gen*↔WordPress.

---

## 5. Integrazioni Gen* Naturali (Non Forzate)

### A. GenCorpComm → WP Content Pipeline

**Flusso**: GenCorpComm produce contenuto strutturato → file `content-brief.md` → skill WP lo pubblica.

- GenCorpComm ha 10 domini e parametric customization (tone, stakeholder, complexity)
- Il plugin WP ha `wp-content`, `wp-content-generation` per pubblicazione
- **Ponte mancante**: uno schema che traduca output GenCorpComm in input per la skill WP

### B. GenSignal ← WP Analytics Feedback Loop

**Flusso**: `wp-analytics` + `wp-search-console` → aggregano metriche → file `signals-feed.md` → GenSignal interpreta.

- GenSignal ha 26 pattern detector e scoring algorithm
- Il plugin WP raccoglie GA4, GSC, performance data
- **Ponte mancante**: un aggregatore che scriva metriche WP in formato compatibile GenSignal

### C. GenMarketing → WP Editorial Calendar

**Flusso**: GenMarketing produce content calendar → file `.state.md` → skill WP converte in scheduled posts.

- GenMarketing produce campaign plan con date, canali, messaggi
- Il plugin WP può creare post schedulati e distribuire su canali
- **Ponte mancante**: uno schema editoriale che il plugin legge per auto-schedulare

### D. GenExecution → WP Content Workflows

**Flusso**: GenExecution produce task 3C → file `content-tasks.md` → skill WP le esegue come transizioni di stato.

- GenExecution converte piani strategici in task strutturati
- `wp-content-workflows` gestisce draft→review→publish
- **Ponte mancante**: mapping tra task GenExecution e transizioni workflow WP

---

## 6. Anti-Pattern da Evitare

| Anti-Pattern | Perché è Sbagliato | Alternativa |
|-------------|---------------------|-------------|
| Pipeline engine in TypeScript | Duplica il decision-making di Claude | Schema MD + prompt che Claude interpreta |
| Calendar widget/app | Sovrastruttura UI per qualcosa che è un file con date | File `.state.md` con date nel frontmatter |
| Database di stato | Aggiunge dipendenza e complessità | Filesystem = database, file MD = tabelle |
| API per coordinamento Gen*↔WP | Over-engineering per un ponte che è un file condiviso | File MD in directory condivisa |
| Reimplementazione di Gen* capability | Se GenCorpComm sa generare un press release, WP non deve rifarlo | Skill WP sa solo *pubblicare*, non *generare* |
| Dashboard React/HTML per stato | Appesantisce il plugin con frontend code | `wp-analytics` + report MD già esistenti |

---

## 7. Modello Architetturale

```
           Gen* Ecosystem                    WordPress Manager Plugin
           (commands/)                       (skill + MCP tool)

  ┌─────────────┐                    ┌────────────────────┐
  │ GenCorpComm  │──content-brief──▶│ wp-content-publish  │
  │ GenMarketing │──editorial-plan─▶│ wp-content-schedule │
  │ GenSignal    │◀──site-signals───│ wp-analytics        │
  │ GenExecution │──content-tasks──▶│ wp-content-workflows│
  │ GenBrand     │──brand-config───▶│ wp-content (voice)  │
  └─────────────┘                    └────────────────────┘
                    │                  │
                    ▼                  ▼
              ┌──────────────────────────────┐
              │     .content-state/          │
              │  ├─ {site}.config.md         │  ← brand voice, canali, frequenza
              │  ├─ YYYY-MM-editorial.state.md│ ← piano editoriale corrente
              │  ├─ pipeline-active/         │  ← brief in lavorazione
              │  │   └─ {brief-id}.brief.md  │
              │  └─ signals-feed.md          │  ← metriche aggregate per GenSignal
              └──────────────────────────────┘
                    ▲
                    │
              Claude CLI (orchestratore naturale)
```

**Principio operativo**: Claude legge i file `.config.md` e `.state.md`, usa le skill appropriate (Gen* per generazione, WP per pubblicazione), e aggiorna lo stato. L'utente interagisce via CLI.

---

## 8. Fasi Implementative

| Fase | Obiettivo | Deliverable | Costo Stimato |
|------|-----------|-------------|---------------|
| **1. Content Pipeline** | Connettere Gen* output → WP publish | Schema `content-brief.schema.md`, skill `wp-content-publish-from-brief` | 2-3 file MD + 1 skill |
| **2. Content Intelligence** | WP analytics → GenSignal → azioni | Schema `signals-feed.schema.md`, estensione `wp-analytics` | 2 file MD + 1 skill estesa |
| **3. Editorial Calendar** | Piano editoriale come stato MD | Schema `editorial.schema.md`, skill `wp-editorial-planner` | 2-3 file MD + 1-2 skill |

**Costo totale stimato**: 6-8 file MD schema + 3-4 nuove/estese skill. **Zero nuovi MCP tool TypeScript** — usiamo i 148 tool esistenti.

---

## 9. Criteri di Successo

| Criterio | Metrica |
|----------|---------|
| **Zero new TypeScript** | Nessun nuovo file `.ts` nel server MCP |
| **Lightweight** | < 10 nuovi file totali per fase |
| **CLI-native** | Tutta l'interazione via conversazione Claude |
| **Gen* compatible** | Output GenCorpComm/GenMarketing usabili senza modifica |
| **Reversible** | Rimuovere il content framework = cancellare una directory |
| **WCOP preserved** | Score WCOP ≥ 9.2/10 dopo implementazione |

---

## 10. Prossimi Passi

1. ~~Riflessioni strategiche preliminari~~ ✅ (questo documento)
2. **Proposta architetturale di dettaglio** — schema MD esatti, struttura skill, flow operativi
3. **Design document** per Fase 1 (Content Pipeline)
4. **Implementation plan** per Fase 1
5. Iterazione su Fase 2 e 3

---

*Documento generato come output del processo di brainstorming strategico per l'evoluzione del WordPress Manager Plugin verso Content Framework.*
