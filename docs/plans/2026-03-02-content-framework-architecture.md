# Content Framework — Proposta Architetturale di Dettaglio

**Data**: 2026-03-02
**Versione**: 1.0.0
**Stato**: Fase 1 Implementata
**Prerequisito**: [Riflessioni Strategiche](2026-03-02-content-framework-strategic-reflections.md)

---

## Sommario Esecutivo

Questo documento definisce l'architettura di dettaglio per evolvere il WordPress Manager Plugin in un Content Framework. L'implementazione si basa su **3 schema MD**, **4 nuove/estese skill**, e **zero nuovi MCP tool TypeScript**. L'intera orchestrazione vive nel CLI via prompt + file strutturati.

---

## Fase 1: Content Pipeline Engine

### 1.1 Obiettivo

Connettere l'output delle Gen* skill (GenCorpComm, GenBrand, GenMarketing) alla pubblicazione WordPress, eliminando il gap manuale tra "contenuto generato" e "contenuto pubblicato".

### 1.2 Schema: `content-brief.schema.md`

Questo schema definisce il formato di scambio tra Gen* e WordPress. È un file Markdown con frontmatter YAML che Claude legge per decidere come pubblicare.

```yaml
---
# Content Brief Schema v1.0
brief_id: "BRF-2026-001"
created: "2026-03-15T10:00:00Z"
status: draft | ready | published | archived

# Source — quale Gen* skill ha prodotto il contenuto
source:
  skill: gencorpcomm          # gencorpcomm | genmarketing | manual
  domain: content_marketing    # dal dominio GenCorpComm
  session_id: "abc-123"       # per tracciabilità

# Target — dove pubblicare
target:
  site_id: opencactus          # id dal WP_SITES_CONFIG
  content_type: post           # post | page
  status: draft                # draft | publish | future
  scheduled_date: null         # ISO 8601 se status=future
  categories: [blog, seo]
  tags: [cactus-water, wellness]

# Content Parameters — passati a wp-content per la creazione
content:
  title: ""
  excerpt: ""
  featured_image: null         # URL o media library ID
  author: null                 # WP user ID, null = default

# Distribution — canali post-pubblicazione
distribution:
  channels: []                 # linkedin | twitter | mailchimp | buffer
  adapt_format: true           # usare wp-content-repurposing?
  schedule_offset_hours: 2     # pubblicare sui social N ore dopo WP

# SEO — parametri per wp-content-optimization
seo:
  focus_keyword: ""
  meta_description: ""
  schema_type: Article         # Article | HowTo | FAQPage
  internal_links: auto         # auto | manual | none

# Quality Gates
gates:
  seo_score_min: 70            # minimo SEO score per publish
  readability_min: 60          # minimo readability score
  require_review: false        # se true, resta in draft per review umana
---

# Contenuto

[Il corpo del contenuto in Markdown, generato da GenCorpComm o scritto manualmente]
```

**Dove vive**: `.content-state/pipeline-active/{brief_id}.brief.md`

### 1.3 Schema: `site.config.md`

Configurazione persistente per sito — brand voice, canali attivi, parametri di default.

```yaml
---
# Site Configuration v1.0
site_id: opencactus
site_url: "https://opencactus.com"
last_updated: "2026-03-02"

# Brand Voice — alimentato da GenBrand output
brand:
  tone: professional_warm      # dal tone_of_voice spectrum di GenCorpComm
  language: it                 # lingua principale
  style_notes: |
    Stile divulgativo-scientifico. Evitare iperboli.
    Preferire dati concreti a claim generici.
    Valorizzare il territorio siciliano.

# Default Content Parameters
defaults:
  content_type: post
  status: draft
  categories: [blog]
  author: 1                    # WP user ID

# Active Distribution Channels
channels:
  linkedin:
    enabled: true
    profile_id: "buf-profile-123"
    format: article            # post | article
  twitter:
    enabled: false
  mailchimp:
    enabled: true
    audience_id: "mc-aud-456"
    segment: newsletter

# SEO Defaults
seo:
  default_schema: Article
  min_score: 70
  auto_internal_links: true

# Content Cadence
cadence:
  posts_per_week: 2
  preferred_days: [tuesday, thursday]
  publish_time: "09:00"
---

# Note Operative

Appunti liberi per contesto aggiuntivo che Claude legge prima di ogni operazione su questo sito.
```

**Dove vive**: `.content-state/{site_id}.config.md`

### 1.4 Nuova Skill: `wp-content-pipeline`

Questa skill orchestra il flusso brief → publish → distribute.

**Trigger**: "pubblica il brief", "processa i brief pronti", "pubblica da GenCorpComm"

**Workflow**:

```
1. SCAN — Leggi .content-state/pipeline-active/ per brief con status=ready
2. CONFIG — Leggi .content-state/{site_id}.config.md per parametri sito
3. VALIDATE — Controlla quality gates (SEO score, readability)
   └─ Se gates non superati → segnala all'utente, resta in draft
4. PUBLISH — Usa MCP tool esistenti:
   ├─ create_content (title, body, excerpt, status, categories, tags)
   ├─ sd_inject (schema.org markup dal seo.schema_type)
   └─ assign_terms_to_content (categories + tags)
5. DISTRIBUTE — Se distribution.channels non vuoto:
   ├─ Invoca wp-content-repurposing per adattare formato
   ├─ li_create_post / tw_create_tweet / buf_create_update
   └─ mc_create_campaign + mc_set_campaign_content + mc_send_campaign
6. UPDATE — Aggiorna brief: status=published, aggiungi post_id e post_url
7. ARCHIVE — Sposta brief in .content-state/pipeline-archive/
```

**MCP Tool utilizzati** (tutti già esistenti):
- `create_content`, `update_content`, `assign_terms_to_content` (da wp-content)
- `sd_inject` (da wp-structured-data)
- `li_create_post`, `tw_create_tweet`, `buf_create_update` (da wp-social-email)
- `mc_create_campaign`, `mc_set_campaign_content`, `mc_send_campaign` (da wp-social-email)

**Dipendenze skill**: `wp-content`, `wp-content-optimization`, `wp-content-repurposing`, `wp-social-email`, `wp-structured-data`

### 1.5 Flusso Operativo End-to-End

```
Utente: "Genera un articolo sul cactus water per opencactus"
                │
                ▼
    GenCorpComm (content_marketing domain)
    → produce Markdown + metadata
                │
                ▼
    Claude scrive: .content-state/pipeline-active/BRF-2026-001.brief.md
    → frontmatter compilato da GenCorpComm output + site.config.md defaults
    → status: ready
                │
                ▼
    Utente: "pubblica i brief pronti"
                │
                ▼
    wp-content-pipeline (skill)
    → legge brief → valida gates → crea post WP → distribuisce → archivia
                │
                ▼
    Output: "Pubblicato: https://opencactus.com/cactus-water-benefici/
             LinkedIn: schedulato in 2h
             Newsletter: campagna creata, pronta per invio"
```

---

## Fase 2: Content Intelligence Layer

### 2.1 Obiettivo

Creare un feedback loop: WP analytics → segnali strutturati → decisioni → azioni. I dati di wp-analytics e wp-search-console alimentano GenSignal per produrre insight azionabili.

### 2.2 Schema: `signals-feed.schema.md`

Formato di scambio tra wp-analytics e GenSignal. Traduce metriche WP nel formato NormalizedEvent di GenSignal.

```yaml
---
# Signals Feed Schema v1.0
feed_id: "FEED-opencactus-2026-03"
site_id: opencactus
generated: "2026-03-02T12:00:00Z"
period: "2026-02-01..2026-02-28"
source_tools:
  - ga4_report
  - ga4_top_pages
  - ga4_traffic_sources
  - gsc_query_analytics
  - pl_aggregate
---

# Normalized Events

## Traffic Signals

```yaml
events:
  - entity_id: "Page:/cactus-water-benefici"
    relation: pageviews
    value: 3240
    unit: count
    ts: "2026-02-28T23:59:59Z"
    delta_pct: +47        # variazione vs periodo precedente
    provenance:
      source_id: "ga4_top_pages"
      site: opencactus

  - entity_id: "Page:/cactus-water-benefici"
    relation: avg_engagement_time
    value: 185
    unit: seconds
    ts: "2026-02-28T23:59:59Z"
    delta_pct: +12
    provenance:
      source_id: "ga4_report"
      site: opencactus
```

## Search Signals

```yaml
  - entity_id: "Keyword:acqua di cactus"
    relation: search_impressions
    value: 8500
    unit: count
    ts: "2026-02-28T23:59:59Z"
    delta_pct: +120
    provenance:
      source_id: "gsc_query_analytics"
      site: opencactus

  - entity_id: "Keyword:acqua di cactus benefici"
    relation: search_ctr
    value: 4.2
    unit: percentage
    ts: "2026-02-28T23:59:59Z"
    delta_pct: -8
    provenance:
      source_id: "gsc_query_analytics"
      site: opencactus
```

## Source Signals

```yaml
  - entity_id: "Source:linkedin"
    relation: referral_sessions
    value: 420
    unit: count
    ts: "2026-02-28T23:59:59Z"
    delta_pct: +85
    provenance:
      source_id: "ga4_traffic_sources"
      site: opencactus
```

## Performance Signals

```yaml
  - entity_id: "Site:opencactus"
    relation: lcp
    value: 2.1
    unit: seconds
    ts: "2026-02-28T23:59:59Z"
    provenance:
      source_id: "cwv_crux_origin"
      site: opencactus
```

# Anomalies & Patterns

Sezione che Claude popola dopo aver analizzato i delta:

| Entity | Metric | Delta | Pattern Match | Action |
|--------|--------|-------|---------------|--------|
| Keyword:acqua di cactus | impressions | +120% | Search Intent Shift | Investigate: content cluster opportunity |
| Source:linkedin | referrals | +85% | Early-Adopter Surge | Scale: increase LinkedIn posting frequency |
| Page:/cactus-water-benefici | CTR | -8% | Hype→Utility Crossover | Optimize: refresh meta description, test titles |
```

**Dove vive**: `.content-state/signals-feed.md` (sovrascritta ad ogni generazione)

### 2.3 Skill Estesa: `wp-analytics` (+ feed generation)

Estendere la skill `wp-analytics` con una sezione aggiuntiva per generare il signals feed.

**Nuovo workflow step** (aggiunto dopo i 6 step esistenti):

```
Step 7: GENERATE SIGNAL FEED
  ├─ Raccogli output da ga4_report, ga4_top_pages, ga4_traffic_sources, gsc_query_analytics
  ├─ Calcola delta % vs periodo precedente (leggi feed precedente per baseline)
  ├─ Mappa metriche → NormalizedEvent format (entity_id, relation, value, unit, ts, provenance)
  ├─ Identifica anomalie (delta > ±30% come soglia default)
  ├─ Match pattern GenSignal (Search Intent Shift, Early-Adopter Surge, etc.)
  └─ Scrivi .content-state/signals-feed.md
```

**MCP tool utilizzati** (tutti già esistenti):
- `ga4_report`, `ga4_top_pages`, `ga4_traffic_sources` (da wp-analytics)
- `gsc_query_analytics`, `gsc_list_pages` (da wp-search-console)
- `cwv_crux_origin` (da wp-analytics)
- `pl_aggregate`, `pl_breakdown` (da wp-analytics)

### 2.4 Flusso Intelligence Loop

```
Utente: "analizza performance opencactus ultimo mese e genera segnali"
                │
                ▼
    wp-analytics (skill estesa)
    → ga4_report + gsc_query_analytics + pl_aggregate
    → calcola delta vs mese precedente
    → genera .content-state/signals-feed.md
                │
                ▼
    Claude presenta: "3 anomalie rilevate:
     1. 'acqua di cactus' impressions +120% → Search Intent Shift
     2. LinkedIn referrals +85% → Early-Adopter Surge
     3. CTR -8% su pagina top → possibile title fatigue"
                │
                ▼
    Utente: "approfondisci il segnale 1 con GenSignal"
                │
                ▼
    GenSignal (gensignal skill)
    → legge signals-feed.md come input Harvest
    → produce SignalCard con score, next_actions
                │
                ▼
    Claude: "SignalScore: 72 → ACTION_PRIORITY
     Next actions:
     - Creare cluster di 3 articoli su varianti keyword
     - A/B test meta description pagina esistente"
                │
                ▼
    Utente: "crea i brief per il cluster"
                │
                ▼
    GenCorpComm → 3 file brief.md in pipeline-active/
    → wp-content-pipeline li pubblica quando pronti
```

---

## Fase 3: Editorial Calendar & Content Planner

### 3.1 Obiettivo

Pianificare contenuti nel tempo con un file `.state.md` che funge da calendario editoriale, convertibile in post WP schedulati.

### 3.2 Schema: `editorial.schema.md`

```yaml
---
# Editorial Calendar Schema v1.0
calendar_id: "CAL-2026-03"
site_id: opencactus
period: "2026-03-01..2026-03-31"
created: "2026-02-28"
last_updated: "2026-03-02"
status: active                 # active | archived

# Monthly Goals
goals:
  posts_target: 8
  posts_published: 2
  focus_topics: [cactus-water, sustainability, wellness]
  seo_targets:
    - keyword: "acqua di cactus"
      target_position: top-5
    - keyword: "bevanda zero calorie naturale"
      target_position: top-10
---

# Piano Editoriale — Marzo 2026

## Settimana 1 (1-7 Mar)

| Data | Titolo | Tipo | Status | Brief ID | Post ID | Canali |
|------|--------|------|--------|----------|---------|--------|
| Mar 4 | Acqua di cactus: 5 benefici scientifici | post | published | BRF-2026-001 | 1234 | linkedin, newsletter |
| Mar 6 | Come il fico d'India diventa bevanda | post | published | BRF-2026-002 | 1235 | linkedin, twitter |

## Settimana 2 (8-14 Mar)

| Data | Titolo | Tipo | Status | Brief ID | Post ID | Canali |
|------|--------|------|--------|----------|---------|--------|
| Mar 11 | Zero calorie, tutto gusto: la scienza | post | ready | BRF-2026-003 | — | linkedin, newsletter |
| Mar 13 | Sicilia e sostenibilità: la filiera | post | draft | BRF-2026-004 | — | linkedin |

## Settimana 3 (15-21 Mar)

| Data | Titolo | Tipo | Status | Brief ID | Post ID | Canali |
|------|--------|------|--------|----------|---------|--------|
| Mar 18 | [da assegnare — topic da signals] | post | planned | — | — | — |
| Mar 20 | [da assegnare] | post | planned | — | — | — |

## Settimana 4 (22-31 Mar)

| Data | Titolo | Tipo | Status | Brief ID | Post ID | Canali |
|------|--------|------|--------|----------|---------|--------|
| Mar 25 | [da assegnare] | post | planned | — | — | — |
| Mar 27 | [da assegnare] | post | planned | — | — | — |

# Note

- Settimana 3-4: topic da definire basandosi su signals-feed.md del 15 marzo
- Newsletter quindicinale: raccoglie i 4 post della quindicina precedente
- LinkedIn: ogni post va distribuito il giorno stesso alle 09:00
```

**Dove vive**: `.content-state/{YYYY-MM}-editorial.state.md`

### 3.3 Nuova Skill: `wp-editorial-planner`

Orchestra la pianificazione editoriale e la conversione piano → brief → post schedulati.

**Trigger**: "crea piano editoriale", "aggiorna calendario marzo", "schedula i post pronti"

**Workflow**:

```
1. PLAN — Crea/aggiorna calendario editoriale
   ├─ Leggi site.config.md per cadence e parametri
   ├─ Leggi signals-feed.md per topic suggestions (se disponibile)
   ├─ Opzionale: invoca GenMarketing per content calendar strategy
   └─ Scrivi {YYYY-MM}-editorial.state.md

2. BRIEF — Converti entry planned/draft → brief files
   ├─ Per ogni riga con status=planned e titolo definito:
   │   ├─ Genera content-brief usando site.config.md defaults
   │   ├─ Se brief_id assegnato, aggiorna il brief esistente
   │   └─ Se nessun brief_id, crea nuovo brief in pipeline-active/
   └─ Aggiorna calendario: status planned→draft, assegna brief_id

3. SCHEDULE — Converti brief ready → post WP schedulati
   ├─ Per ogni riga con status=ready:
   │   ├─ Chiama create_content con status=future, date=scheduled_date
   │   ├─ Aggiorna calendario: status ready→scheduled, assegna post_id
   │   └─ Se distribution.channels: configura scheduling social
   └─ Report: "X post schedulati per la settimana"

4. SYNC — Sincronizza stato WP → calendario
   ├─ Per ogni post_id nel calendario:
   │   ├─ Verifica stato su WP (list_content con filtro post_id)
   │   └─ Se published → aggiorna calendario status=published
   └─ Aggiorna goals.posts_published
```

**MCP Tool utilizzati** (tutti già esistenti):
- `create_content` con `status: future` e `date` (da wp-content)
- `list_content` per sync stato (da wp-content)
- `buf_create_update` con scheduling (da wp-social-email)
- `mc_create_campaign` con send_time (da wp-social-email)

### 3.4 Integrazione con Fase 1 e 2

```
                    Fase 2: Intelligence
                    signals-feed.md
                         │
                         ▼ topic suggestions
                    ┌────────────┐
                    │  Editorial  │ ← GenMarketing (strategy)
                    │  Calendar   │
                    │  .state.md  │
                    └─────┬──────┘
                          │ genera brief per entry planned
                          ▼
                    pipeline-active/
                    ├─ BRF-001.brief.md (ready)
                    ├─ BRF-002.brief.md (draft)
                    └─ BRF-003.brief.md (ready)
                          │
                          ▼ Fase 1: Pipeline
                    wp-content-pipeline
                    → publish → distribute → archive
```

---

## Directory Structure

```
.content-state/
├─ opencactus.config.md           # Fase 1: config sito
├─ bioinagro.config.md            # config per altro sito
├─ signals-feed.md                # Fase 2: ultimo feed segnali
├─ 2026-03-editorial.state.md     # Fase 3: calendario corrente
├─ 2026-02-editorial.state.md     # calendario precedente (archived)
├─ pipeline-active/               # Fase 1: brief in lavorazione
│   ├─ BRF-2026-003.brief.md
│   └─ BRF-2026-004.brief.md
└─ pipeline-archive/              # brief completati
    ├─ BRF-2026-001.brief.md
    └─ BRF-2026-002.brief.md
```

**Posizione**: dentro la directory del plugin, accanto a `skills/`, `servers/`, `docs/`.

---

## Inventory Deliverable

### Nuovi File MD Schema (6)

| File | Fase | Scopo |
|------|------|-------|
| `skills/wp-content-pipeline/references/content-brief-schema.md` | 1 | Schema del brief |
| `skills/wp-content-pipeline/references/site-config-schema.md` | 1 | Schema config sito |
| `skills/wp-content-pipeline/SKILL.md` | 1 | Skill definition |
| `skills/wp-analytics/references/signals-feed-schema.md` | 2 | Schema feed segnali |
| `skills/wp-editorial-planner/references/editorial-schema.md` | 3 | Schema calendario |
| `skills/wp-editorial-planner/SKILL.md` | 3 | Skill definition |

### File Modificati (1)

| File | Fase | Modifica |
|------|------|----------|
| `skills/wp-analytics/SKILL.md` | 2 | Aggiunta Step 7: Signal Feed generation |

### Nuove Directory (1)

| Directory | Scopo |
|-----------|-------|
| `.content-state/` | Stato persistente del content framework (gitignored in produzione) |

### Nessun Nuovo TypeScript

Zero file `.ts` aggiunti. Tutte le operazioni usano i 148 MCP tool esistenti orchestrati via skill prompt + file MD strutturati.

---

## Criteri di Accettazione per Fase

### Fase 1: Content Pipeline

- [x] `content-brief.schema.md` definito e documentato
- [x] `site.config.md` schema definito e documentato
- [x] `wp-content-pipeline` skill creata con workflow completo
- [x] Flusso end-to-end testato: brief.md → WP post (distribuzione LinkedIn skipped — wp-rest-bridge non connesso, tool AIWU usato per WP)
- [x] Supporto multi-sito (opencactus + almeno un altro)

### Fase 2: Content Intelligence

- [ ] `signals-feed.schema.md` compatibile con GenSignal NormalizedEvent
- [ ] `wp-analytics` estesa con Step 7 (signal feed generation)
- [ ] Delta calculation funzionante (confronto con periodo precedente)
- [ ] Almeno 3 GenSignal patterns riconosciuti automaticamente
- [ ] Flusso testato: analytics → signals-feed.md → insight azionabili

### Fase 3: Editorial Calendar

- [ ] `editorial.schema.md` definito con tabelle settimanali
- [ ] `wp-editorial-planner` skill creata con 4 workflow steps
- [ ] Conversione calendar entry → brief automatica
- [ ] Scheduling WP post con status=future funzionante
- [ ] Sync bidirezionale: WP publish status → calendar update

---

## Priorità e Sequenza

```
Fase 1 (Content Pipeline)     ← fondazione, abilita il flusso base
  └─ Fase 2 (Intelligence)    ← feedback loop, richiede Fase 1 per agire sui segnali
      └─ Fase 3 (Calendar)    ← orchestrazione temporale, usa Fase 1 + 2
```

Fase 1 è autosufficiente. Fase 2 e 3 si costruiscono incrementalmente sopra.

---

*Proposta architetturale generata come output del brainstorming strategico. Prossimo passo: approvazione utente → design document → implementation plan.*
