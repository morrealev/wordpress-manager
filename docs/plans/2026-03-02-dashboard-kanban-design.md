# Editorial Kanban Dashboard — Design Document

**Data**: 2026-03-02
**Versione**: 1.0.0
**Stato**: In design
**Parent**: [Dashboard Strategy](2026-03-02-dashboard-strategy.md)
**Deliverable**: Skill `wp-dashboard` + script `dashboard-renderer.mjs` + modulo condiviso `context-scanner.mjs`

---

## 1. Obiettivo

Generare un file HTML statico self-contained che visualizza lo stato editoriale di un sito WordPress come Kanban board. L'operatore invoca la skill `wp-dashboard`, lo script legge `.content-state/`, produce l'HTML e lo apre nel browser.

**Non-obiettivi**: interattività (drag & drop), aggiornamento live, persistenza stato proprio, dipendenze esterne.

---

## 2. Layout Visivo

### 2.1 Struttura Generale

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  HEADER: Editorial Dashboard — mysite.example.com — Marzo 2026                   │
│  Generato: 2026-03-02 14:30 | Posts: 2/8 pubblicati | Pipeline: 1 ready     │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │ PLANNED  │ │  DRAFT   │ │  READY   │ │SCHEDULED │ │PUBLISHED │          │
│  │    (3)   │ │   (1)    │ │   (1)    │ │   (0)    │ │   (2)    │          │
│  ├──────────┤ ├──────────┤ ├──────────┤ ├──────────┤ ├──────────┤          │
│  │          │ │          │ │          │ │          │ │          │          │
│  │ ┌──────┐ │ │ ┌──────┐ │ │ ┌──────┐ │ │          │ │ ┌──────┐ │          │
│  │ │ CARD │ │ │ │ CARD │ │ │ │ CARD │ │ │  (vuoto) │ │ │ CARD │ │          │
│  │ └──────┘ │ │ └──────┘ │ │ └──────┘ │ │          │ │ └──────┘ │          │
│  │ ┌──────┐ │ │          │ │          │ │          │ │ ┌──────┐ │          │
│  │ │ CARD │ │ │          │ │          │ │          │ │ │ CARD │ │          │
│  │ └──────┘ │ │          │ │          │ │          │ │ └──────┘ │          │
│  │ ┌──────┐ │ │          │ │          │ │          │ │          │          │
│  │ │ CARD │ │ │          │ │          │ │          │ │          │          │
│  │ └──────┘ │ │          │ │          │ │          │ │          │          │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│  SIGNALS STRIP (se anomalie presenti)                                        │
│  ▲ +120% "acqua premium" impressions | ▲ +85% LinkedIn referrals          │
├──────────────────────────────────────────────────────────────────────────────┤
│  FOOTER: WordPress Manager v2.14.0 | wp-dashboard skill                     │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Anatomia della Card

Ogni card rappresenta un contenuto nel ciclo editoriale.

```
┌─────────────────────────────┐
│ Mar 18                   📝 │  ← data + icona tipo (📝 post, 📄 page)
│                             │
│ Acqua premium: perché le  │  ← titolo (troncato a 60 char)
│ ricerche sono esplose...    │
│                             │
│ BRF-2026-005                │  ← brief ID (se esiste)
│ #wellness #premium-water     │  ← categorie/tag principali
│                             │
│ 🔗 in  📧 nl               │  ← icone canali distribuzione
└─────────────────────────────┘
```

**Varianti card per stato**:

| Stato | Colore bordo sinistro | Note |
|-------|----------------------|------|
| `planned` | grigio `#94a3b8` | Titolo può essere `[da assegnare]` |
| `draft` | giallo `#eab308` | Ha Brief ID |
| `ready` | blu `#3b82f6` | Pronto per scheduling |
| `scheduled` | viola `#8b5cf6` | Ha Post ID, mostra data scheduling |
| `published` | verde `#22c55e` | Ha Post ID + URL |

**Card "da assegnare"** (planned, senza titolo):

```
┌─────────────────────────────┐
│ Mar 20                   📝 │
│                             │
│ [da assegnare]              │  ← testo grigio, italic
│                             │
│ —                           │  ← nessun brief ID
└─────────────────────────────┘
```

### 2.3 Header — Metriche Aggregate

Il header contiene una riga di metriche riassuntive:

```
Editorial Dashboard — mysite.example.com — Marzo 2026
Generato: 2026-03-02 14:30 | Posts: 2/8 pubblicati | Pipeline: 1 ready, 1 draft | Next: Mar 11
```

| Metrica | Calcolo |
|---------|---------|
| Posts X/Y pubblicati | `count(status=published)` / `goals.posts_target` |
| Pipeline: N ready, N draft | count per status nei brief attivi |
| Next: data | prima data con `status` non `published` e non `planned-vuoto` |

### 2.4 Signals Strip

Striscia opzionale sotto il Kanban, presente solo se `signals-feed.md` contiene anomalie:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  ⚡ Signals  ▲ +120% "acqua premium" impressions → content cluster        │
│              ▲ +85% LinkedIn referrals → scale posting frequency            │
│              ▲ +47% /premium-water-benefici pageviews → investigate           │
└──────────────────────────────────────────────────────────────────────────────┘
```

Ogni anomalia mostra: direzione (`▲`/`▼`), delta percentuale, entità, azione suggerita.

### 2.5 Palette Colori

Coerenza con il brand system AcmeBrand/MySite ma neutrale (il dashboard è uno strumento operativo, non un artefatto brand):

```css
/* Background & Structure */
--bg-page:       #f8fafc;    /* slate-50 */
--bg-column:     #f1f5f9;    /* slate-100 */
--bg-card:       #ffffff;
--border:        #e2e8f0;    /* slate-200 */
--text-primary:  #1e293b;    /* slate-800 */
--text-secondary:#64748b;    /* slate-500 */
--text-muted:    #94a3b8;    /* slate-400 */

/* Status Colors */
--status-planned:   #94a3b8; /* slate-400 */
--status-draft:     #eab308; /* yellow-500 */
--status-ready:     #3b82f6; /* blue-500 */
--status-scheduled: #8b5cf6; /* violet-500 */
--status-published: #22c55e; /* green-500 */

/* Signals */
--signal-up:     #22c55e;    /* green */
--signal-down:   #ef4444;    /* red */

/* Typography */
font-family: system-ui, -apple-system, sans-serif;
```

---

## 3. Data Flow: SCAN → AGGREGATE → RENDER

### 3.1 SCAN — Lettura File

Lo scanner legge i file `.content-state/` e produce un oggetto JavaScript strutturato.

**Input files**:

| File | Parsing | Output |
|------|---------|--------|
| `{site_id}.config.md` | Frontmatter YAML | `{ site_id, site_url, brand, defaults, channels, seo, cadence }` |
| `YYYY-MM-editorial.state.md` | Frontmatter YAML + tabelle Markdown | `{ calendar_id, period, goals, entries[] }` |
| `pipeline-active/*.brief.md` | Frontmatter YAML per ogni file | `{ briefs_active[] }` |
| `pipeline-archive/*.brief.md` | Frontmatter YAML per ogni file | `{ briefs_archived[] }` |
| `signals-feed.md` | Frontmatter YAML + tabella anomalie | `{ signals[] }` |

**Parsing delle tabelle Markdown**:

Il calendario editoriale usa tabelle con colonne fisse:

```markdown
| Data | Titolo | Tipo | Status | Brief ID | Post ID | Canali |
```

Lo scanner converte ogni riga in un oggetto:

```javascript
{
  date: "2026-03-18",
  title: "Acqua premium: perché le ricerche sono esplose del 120%",
  type: "post",
  status: "ready",
  briefId: "BRF-2026-005",
  postId: null,
  channels: ["linkedin", "newsletter"]
}
```

**Regole di parsing**:
- Le righe con titolo `[da assegnare]` hanno `title: null`
- Post ID `—` è convertito a `null`
- Canali sono splittati per `, ` (virgola + spazio)
- Le date sono nel formato `Mon DD` (es. `Mar 18`) e vengono risolte con anno/mese dal `period` del calendar

**Risultato SCAN**:

```javascript
{
  site: {
    id: "mysite",
    url: "https://mysite.example.com",
    brand: { tone: "...", language: "it", ... },
    cadence: { posts_per_week: 3, preferred_days: [...], publish_time: "09:00" },
    channels: { linkedin: { enabled: true, ... }, ... }
  },
  calendar: {
    id: "CAL-2026-03",
    period: "2026-03-01..2026-03-31",
    goals: { posts_target: 8, posts_published: 2, ... },
    entries: [
      { date: "2026-03-04", title: "Acqua premium: 5 benefici...", type: "post", status: "published", briefId: "BRF-2026-001", postId: 1234, channels: ["linkedin", "newsletter"] },
      { date: "2026-03-06", title: "Come il frutto mediterraneo diventa bevanda", type: "post", status: "published", briefId: "BRF-2026-002", postId: 1235, channels: ["linkedin", "twitter"] },
      { date: "2026-03-11", title: "Zero calorie, tutto gusto: la scienza", type: "post", status: "ready", briefId: "BRF-2026-003", postId: null, channels: ["linkedin", "newsletter"] },
      { date: "2026-03-13", title: "Mediterraneo e sostenibilità: la filiera", type: "post", status: "draft", briefId: "BRF-2026-004", postId: null, channels: ["linkedin"] },
      { date: "2026-03-18", title: "Acqua premium: perché le ricerche...", type: "post", status: "ready", briefId: "BRF-2026-005", postId: null, channels: ["linkedin", "newsletter"] },
      { date: "2026-03-20", title: null, type: "post", status: "planned", briefId: null, postId: null, channels: [] },
      { date: "2026-03-25", title: null, type: "post", status: "planned", briefId: null, postId: null, channels: [] },
      { date: "2026-03-27", title: null, type: "post", status: "planned", briefId: null, postId: null, channels: [] }
    ]
  },
  briefs: {
    active: [
      { briefId: "BRF-2026-005", status: "ready", title: "Acqua premium: perché...", siteId: "mysite", channels: ["linkedin", "newsletter"], signalRef: "FEED-mysite-2026-02 → Keyword:acqua premium +120%" }
    ],
    archived: [
      { briefId: "BRF-2026-001", status: "published", title: "I Benefici dell'Acqua Premium...", postId: 2456, postUrl: "https://mysite.example.com/benefici-..." }
    ]
  },
  signals: {
    feedId: "FEED-mysite-2026-02",
    period: "2026-02-01..2026-02-28",
    anomalies: [
      { entity: "Keyword:acqua premium", metric: "search_impressions", delta: "+120%", pattern: "Search Intent Shift", action: "Investigate: content cluster opportunity" },
      { entity: "Source:linkedin", metric: "referral_sessions", delta: "+85%", pattern: "Early-Adopter Surge", action: "Scale: increase posting frequency on linkedin" },
      { entity: "Page:/premium-water-benefici", metric: "pageviews", delta: "+47%", pattern: "Unclassified anomaly", action: "Review: investigate cause of +47% change in pageviews" }
    ]
  }
}
```

### 3.2 AGGREGATE — Metriche Derivate

Dall'output SCAN, calcola metriche aggregate per il rendering:

```javascript
{
  // Progress metrics
  postsPublished: 2,
  postsTarget: 8,
  progressPercent: 25,            // 2/8 * 100

  // Pipeline counts (per column)
  columns: {
    planned: 3,                   // entries con status=planned
    draft: 1,                     // entries con status=draft
    ready: 2,                     // entries con status=ready (incluso da brief attivi)
    scheduled: 0,                 // entries con status=scheduled
    published: 2                  // entries con status=published
  },

  // Timeline
  nextDeadline: {
    date: "2026-03-11",
    title: "Zero calorie, tutto gusto: la scienza",
    status: "ready",
    daysFromNow: 9
  },

  // Channel distribution
  channelUsage: {
    linkedin: 5,                  // entries che includono linkedin
    newsletter: 3,
    twitter: 1
  },

  // Signals summary
  signalsCount: 3,
  signalsHighest: { entity: "acqua premium", delta: "+120%", pattern: "Search Intent Shift" },

  // Calendar fill rate
  fillRate: 62.5,                 // 5/8 entries con titolo assegnato * 100

  // Generation metadata
  generatedAt: "2026-03-02T14:30:00+01:00",
  generatorVersion: "1.0.0"
}
```

### 3.3 RENDER — Generazione HTML

Il renderer prende `entries[]` (raggruppate per status) e `metrics`, produce un HTML self-contained.

**Template strategy**: template literal ES6. Nessun template engine esterno.

**Struttura HTML**:

```html
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Editorial Dashboard — {site_id} — {month} {year}</title>
  <style>
    /* Tutti gli stili inline — vedi sezione 2.5 per la palette */
    /* ~150 righe CSS: reset, layout grid, card, header, signals strip */
  </style>
</head>
<body>
  <header>
    <!-- Metriche aggregate: titolo, data generazione, progress bar, pipeline counts -->
  </header>
  <main class="kanban">
    <!-- 5 colonne: planned | draft | ready | scheduled | published -->
    <!-- Ogni colonna contiene N card dalla entries[] filtrata per status -->
  </main>
  <section class="signals-strip">
    <!-- Anomalie da signals-feed, se presenti -->
  </section>
  <footer>
    <!-- Versione plugin, skill, timestamp -->
  </footer>
</body>
</html>
```

**Dimensioni target**: < 30 KB per un mese con 8-12 entries e 3-5 anomalie.

---

## 4. Architettura Script

### 4.1 Moduli

```
scripts/
├── context-scanner.mjs         ← SCAN + AGGREGATE (modulo condiviso)
│     export: scanContentState(contentStatePath, siteId)
│     export: aggregateMetrics(rawData, viewType)
│     export: renderContextSnippet(metrics, sliceType)  ← per Fase B (step 0)
│
└── dashboard-renderer.mjs      ← RENDER HTML + open browser
      import: { scanContentState, aggregateMetrics } from './context-scanner.mjs'
      export: renderKanbanHTML(rawData, metrics)
      main: scan → aggregate → render → write file → open browser
```

### 4.2 `context-scanner.mjs` — API

```javascript
/**
 * Scans .content-state/ directory for a specific site.
 *
 * @param {string} contentStatePath - Path to .content-state/ directory
 * @param {string} siteId - Site identifier (e.g., "mysite")
 * @returns {object} Raw data: { site, calendar, briefs, signals }
 */
export function scanContentState(contentStatePath, siteId) { ... }

/**
 * Computes aggregate metrics from raw scan data.
 *
 * @param {object} rawData - Output of scanContentState()
 * @param {string} viewType - "kanban" | "signals" | "distribution" | "health"
 * @returns {object} Aggregated metrics for the requested view
 */
export function aggregateMetrics(rawData, viewType) { ... }

/**
 * Renders a compact terminal snippet for step 0 context.
 * (Fase B — implementazione differita)
 *
 * @param {object} metrics - Output of aggregateMetrics()
 * @param {string} sliceType - "pipeline" | "calendar" | "signals"
 * @returns {string} Formatted terminal text (3-5 lines)
 */
export function renderContextSnippet(metrics, sliceType) { ... }
```

### 4.3 `dashboard-renderer.mjs` — CLI

```bash
# Uso:
node scripts/dashboard-renderer.mjs                          # sito da config, mese corrente
node scripts/dashboard-renderer.mjs --site=mysite        # sito specifico
node scripts/dashboard-renderer.mjs --month=2026-04          # mese specifico
node scripts/dashboard-renderer.mjs --output=/tmp/dash.html  # output specifico
node scripts/dashboard-renderer.mjs --no-open                # non aprire browser
```

**Flusso main()**:

```
1. Parse CLI args (--site, --month, --output, --no-open)
2. Resolve contentStatePath da plugin root
3. Se --site non fornito:
   a. Cerca tutti i *.config.md in .content-state/
   b. Se uno solo → usa quello
   c. Se multipli → errore con lista siti disponibili
4. Se --month non fornito → usa mese corrente
5. scanContentState(contentStatePath, siteId)
6. aggregateMetrics(rawData, "kanban")
7. renderKanbanHTML(rawData, metrics) → htmlString
8. Scrivi htmlString in file temporaneo (o --output)
   Default: .content-state/.dashboard-{siteId}-{month}.html
9. Se non --no-open: exec("xdg-open {filepath}") su Linux
```

### 4.4 YAML Frontmatter Parsing

Lo scanner parsa il frontmatter YAML manualmente (no dipendenze):

```javascript
function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return { frontmatter: {}, body: content };
  // Simple YAML parser for flat/nested structures
  // Handles: strings, numbers, arrays (inline [a, b] and multi-line - a\n- b), nested objects
  // Does NOT need: anchors, aliases, multi-document, complex types
}
```

**Alternativa**: usare il pacchetto `yaml` già presente come dipendenza transitiva del SDK MCP in `servers/wp-rest-bridge/node_modules/`. Importarlo via `createRequire`.

**Decisione**: usare `yaml` da node_modules se disponibile (più robusto), fallback a parser manuale semplice. Verificare disponibilità a implementazione.

### 4.5 Markdown Table Parsing

Le tabelle editoriali hanno formato fisso:

```markdown
| Data | Titolo | Tipo | Status | Brief ID | Post ID | Canali |
|------|--------|------|--------|----------|---------|--------|
| Mar 4 | Acqua premium: 5 benefici scientifici | post | published | BRF-2026-001 | 1234 | linkedin, newsletter |
```

Parser dedicato:

```javascript
function parseEditorialTable(markdownBody) {
  // 1. Split body in sezioni per "## Settimana N"
  // 2. Per ogni sezione, trova la tabella (righe che iniziano con |)
  // 3. Skip header row (| Data | ...) e separator row (|------|...)
  // 4. Per ogni data row: split per |, trim, map a oggetto
  // 5. Gestisci valori speciali: "—" → null, "[da assegnare]" → null per title
  // Return: array di entry objects
}
```

### 4.6 Dipendenze

| Dipendenza | Tipo | Note |
|------------|------|------|
| `node:fs/promises` | Built-in | Lettura file |
| `node:path` | Built-in | Path resolution |
| `node:child_process` | Built-in | `exec` per `xdg-open` |
| `node:url` | Built-in | `fileURLToPath` per ESM |
| `yaml` (opzionale) | From node_modules | Parsing YAML robusto, via `createRequire` |

**Zero nuove dipendenze npm da installare.**

---

## 5. Skill Definition

### 5.1 `skills/wp-dashboard/SKILL.md`

```yaml
---
name: wp-dashboard
description: This skill should be used when the user asks to "show dashboard",
  "show editorial status", "open kanban", "visualize content state",
  "show content overview", "mostra dashboard", "apri kanban", or wants
  a visual overview of the editorial pipeline. Generates a self-contained
  HTML Kanban board from .content-state/ files and opens it in the browser.
version: 1.0.0
---
```

**Workflow della skill**:

1. Determinare il sito target (da contesto conversazione o chiedere all'utente)
2. Determinare il mese (default: corrente)
3. Eseguire lo script:
   ```bash
   node scripts/dashboard-renderer.mjs --site={siteId} --month={YYYY-MM}
   ```
4. Confermare all'utente che il dashboard è stato aperto nel browser
5. Se l'utente chiede modifiche al contenuto basandosi sul dashboard → suggerire la skill appropriata (`wp-content-pipeline`, `wp-editorial-planner`)

### 5.2 Trigger e Routing

La skill è invocata esplicitamente dall'utente. Non è un step automatico di altre skill (quello è Fase B — context snippet).

**Frasi trigger**:
- "mostra il dashboard" / "show dashboard"
- "apri il kanban" / "open kanban"
- "stato editoriale" / "editorial status"
- "panoramica contenuti" / "content overview"
- "dove siamo con i post?" / "where are we with posts?"

---

## 6. HTML Template — Specifiche di Dettaglio

### 6.1 CSS Layout

**Kanban grid**: CSS Grid con 5 colonne di larghezza uguale.

```css
.kanban {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
  padding: 24px;
  min-height: 400px;
}

.column {
  background: var(--bg-column);
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
```

**Card**: Box bianco con bordo sinistro colorato.

```css
.card {
  background: var(--bg-card);
  border-radius: 6px;
  border-left: 4px solid var(--status-color);
  padding: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}
```

**Responsive**: A viewport < 768px le colonne diventano verticali (stack).

```css
@media (max-width: 768px) {
  .kanban {
    grid-template-columns: 1fr;
  }
}
```

### 6.2 Header con Progress Bar

```html
<header>
  <h1>Editorial Dashboard — mysite.example.com — Marzo 2026</h1>
  <div class="meta">
    Generato: 2026-03-02 14:30 | Next: Mar 11 — "Zero calorie, tutto gusto"
  </div>
  <div class="progress-bar">
    <div class="progress-fill" style="width: 25%"></div>
    <span>2/8 pubblicati</span>
  </div>
  <div class="pipeline-counts">
    <span class="badge planned">3 planned</span>
    <span class="badge draft">1 draft</span>
    <span class="badge ready">2 ready</span>
    <span class="badge scheduled">0 scheduled</span>
    <span class="badge published">2 published</span>
  </div>
</header>
```

### 6.3 Card HTML

```html
<div class="card" style="--status-color: var(--status-ready)">
  <div class="card-header">
    <span class="card-date">Mar 18</span>
    <span class="card-type" title="post">&#x1F4DD;</span>
  </div>
  <div class="card-title">Acqua premium: perch&eacute; le ricerche sono esplose del 120%</div>
  <div class="card-meta">
    <span class="brief-id">BRF-2026-005</span>
  </div>
  <div class="card-tags">
    <span class="tag">#wellness</span>
    <span class="tag">#premium-water</span>
  </div>
  <div class="card-channels">
    <span class="channel" title="LinkedIn">in</span>
    <span class="channel" title="Newsletter">nl</span>
  </div>
</div>
```

**Card "da assegnare"**:

```html
<div class="card card--empty" style="--status-color: var(--status-planned)">
  <div class="card-header">
    <span class="card-date">Mar 20</span>
    <span class="card-type" title="post">&#x1F4DD;</span>
  </div>
  <div class="card-title card-title--placeholder">[da assegnare]</div>
</div>
```

### 6.4 Signals Strip HTML

```html
<section class="signals-strip">
  <h2>Signals</h2>
  <div class="signal-list">
    <div class="signal signal--up">
      <span class="signal-arrow">&#x25B2;</span>
      <span class="signal-delta">+120%</span>
      <span class="signal-entity">&quot;acqua premium&quot; impressions</span>
      <span class="signal-action">content cluster opportunity</span>
    </div>
    <!-- ... altre anomalie ... -->
  </div>
</section>
```

### 6.5 Icone Canali

Abbreviazioni testuali (no icon font, no SVG inline per semplicità):

| Canale | Abbrev | Title attribute |
|--------|--------|-----------------|
| linkedin | `in` | LinkedIn |
| twitter | `tw` | Twitter/X |
| newsletter / mailchimp | `nl` | Newsletter |
| buffer | `bf` | Buffer |

Stile: pill badge con background colorato.

```css
.channel {
  display: inline-block;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
}
.channel[title="LinkedIn"]  { background: #0077b5; color: white; }
.channel[title="Twitter/X"] { background: #1da1f2; color: white; }
.channel[title="Newsletter"]{ background: #f59e0b; color: white; }
.channel[title="Buffer"]    { background: #168eea; color: white; }
```

---

## 7. Gestione Edge Case

### 7.1 File Mancanti

| Scenario | Comportamento |
|----------|--------------|
| `{site_id}.config.md` non esiste | Errore: "Site config not found for '{siteId}'. Run `wp-editorial-planner` first." |
| `YYYY-MM-editorial.state.md` non esiste | Warning: "No calendar for {month}. Dashboard shows empty Kanban." Genera HTML con tutte le colonne vuote. |
| `signals-feed.md` non esiste | Signals strip non renderizzata. |
| `pipeline-active/` vuoto | Sezione brief nella card non mostra dati aggiuntivi. |
| `pipeline-archive/` vuoto | Nessun impatto (i brief archiviati non appaiono nel Kanban). |

### 7.2 Dati Inconsistenti

| Scenario | Comportamento |
|----------|--------------|
| Calendar entry ha Brief ID ma il file brief non esiste | Card mostra il Brief ID con badge `⚠ missing` |
| Brief ha status diverso da calendar entry | Usa lo status del calendar (il calendar è la source of truth per il Kanban) |
| Entry senza data | Skip entry, non appare nel Kanban |
| Titolo > 60 caratteri | Tronca con `...` nel card title, titolo completo nel `title` attribute (hover) |

### 7.3 Multi-Sito (Futuro)

Quando ci sono più siti configurati:

- `--site` è obbligatorio
- Se omesso, lo script lista i siti disponibili e esce
- Ogni sito ha il suo HTML separato
- Non esiste (per ora) un dashboard multi-sito aggregato

---

## 8. File Output

### 8.1 Naming Convention

```
.content-state/.dashboard-{siteId}-{YYYY-MM}.html
```

Esempio: `.content-state/.dashboard-mysite-2026-03.html`

- Prefisso `.` (hidden file) perché è un artefatto generato, non dati
- Nella directory `.content-state/` per coerenza (è uno "stato" derivato)
- **Gitignored**: aggiungere `.content-state/.dashboard-*.html` al `.gitignore`

### 8.2 Apertura Browser

```javascript
import { exec } from 'node:child_process';
import { platform } from 'node:os';

function openInBrowser(filepath) {
  const cmd = platform() === 'darwin' ? 'open' :
              platform() === 'win32'  ? 'start' :
              'xdg-open';
  exec(`${cmd} "${filepath}"`);
}
```

---

## 9. Verifica Design

### 9.1 Checklist Pre-Implementazione

- [ ] La palette colori è leggibile su sfondo chiaro?
- [ ] Le abbreviazioni canali sono intuitive?
- [ ] L'HTML è < 30 KB con i dati di esempio (8 entries, 3 anomalie)?
- [ ] Il layout responsivo funziona a 768px?
- [ ] Il parser frontmatter gestisce tutti i campi dei file reali?
- [ ] Il parser tabelle gestisce `—`, `[da assegnare]`, virgole nei canali?
- [ ] `xdg-open` funziona su WSL2?

### 9.2 Test con Dati Reali

Il dataset di test è lo stato corrente di `.content-state/` per mysite (Marzo 2026):
- 8 entries nel calendario (2 published, 1 draft, 2 ready, 3 planned)
- 1 brief attivo (BRF-2026-005)
- 1 brief archiviato (BRF-2026-001)
- 3 anomalie nel signals feed

Questo dataset è sufficiente per validare tutti i casi: card con titolo, card vuota, card con brief, card senza brief, card pubblicata con post ID.

---

## 10. Documenti Derivati

Da questo design document deriva:

```
docs/plans/2026-03-02-dashboard-kanban-design.md        ← QUESTO DOCUMENTO
  └── docs/plans/2026-03-02-dashboard-kanban-implementation.md  (prossimo passo)
```

Il piano di implementazione conterrà i task operativi TDD per:
1. `scripts/context-scanner.mjs` (SCAN + AGGREGATE)
2. `scripts/dashboard-renderer.mjs` (RENDER + CLI)
3. `skills/wp-dashboard/SKILL.md`
4. Test con dati reali
5. Version bump e changelog

---

*Design document per il Kanban editoriale del WordPress Manager Plugin. Fase A della Dashboard Strategy.*
