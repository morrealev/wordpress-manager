# Context Snippet — Design Document (Fase B)

**Data**: 2026-03-02
**Versione**: 1.0.0
**Stato**: Implementazione
**Prerequisito**: [Dashboard Strategy](2026-03-02-dashboard-strategy.md) (Fase A completata in v2.14.0)
**Deriva da**: Dashboard Strategy, sezione 6 — Fase B

---

## 1. Obiettivo

Ogni content skill stampa automaticamente 3-5 righe di contesto editoriale operativo **prima** di iniziare il proprio workflow. Questo "Step 0" fornisce a Claude e all'operatore umano una fotografia istantanea dello stato corrente senza richiedere un'azione esplicita (come invocare `wp-dashboard`).

```
┌─────────────────────────────────────────────────────────────┐
│                    LIVELLO 2: CONTESTO OPERATIVO            │
│                                                             │
│  Step 0 inline nelle content skill                          │
│  Output: testo terminale (3-5 righe)                        │
│  Trigger: automatico, ogni invocazione skill                │
│  Contenuto: solo lo slice rilevante per la skill attiva     │
│                                                             │
│  "Ecco cosa sto per toccare"                                │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Architettura

### 2.1 Componenti

```
scripts/context-scanner.mjs
  ├── scanContentState()       ← legge .content-state/ (già esistente)
  ├── aggregateMetrics()       ← calcola metriche (già esistente)
  ├── renderContextSnippet()   ← formatta 3-5 righe terminal (già esistente)
  └── CLI: --snippet --site=X  ← NUOVO: entry point per invocazione da skill

skills/wp-content-pipeline/SKILL.md
  └── Step 0: CONTEXT          ← NUOVO: istruzioni per Claude

skills/wp-editorial-planner/SKILL.md
  └── Step 0: CONTEXT          ← NUOVO: istruzioni per Claude
```

### 2.2 Flusso di Esecuzione

```
Utente invoca skill
  → Claude legge SKILL.md
    → Step 0: CONTEXT
      → Claude legge .content-state/{site_id}.config.md
      → Claude legge .content-state/{YYYY-MM}-editorial.state.md
      → Claude legge .content-state/pipeline-active/*.brief.md
      → Claude formatta e stampa snippet (3-5 righe)
    → Step 1+: workflow normale della skill
```

### 2.3 Due Modalità di Rendering

| Modalità | Quando | Come |
|----------|--------|------|
| **Claude-native** | Sempre (Step 0 nelle skill) | Claude legge i file direttamente e formatta il testo seguendo le istruzioni SKILL.md |
| **Script CLI** | Opzionale, per automazione | `node scripts/context-scanner.mjs --snippet --site=mysite` |

La modalità Claude-native è il default. La modalità CLI serve come backup e per uso in script/automazione.

---

## 3. Formato Snippet

### 3.1 Formato Base (tutte le skill)

```
── Editorial Context ──────────────────────
  mysite.example.com | 2026-03-01 → 2026-03-31
  Pipeline: 2 draft → 1 ready → 0 scheduled
  Posts: 3/12 pubblicati
───────────────────────────────────────────
```

### 3.2 Slice: Pipeline (wp-content-pipeline)

Aggiunge dettaglio sui brief attivi:

```
── Editorial Context ──────────────────────
  mysite.example.com | 2026-03-01 → 2026-03-31
  Pipeline: 2 draft → 1 ready → 0 scheduled
  Briefs: BRF-2026-005 (ready), BRF-2026-006 (draft)
  Posts: 3/12 pubblicati
───────────────────────────────────────────
```

### 3.3 Slice: Calendar (wp-editorial-planner)

Aggiunge prossima scadenza:

```
── Editorial Context ──────────────────────
  mysite.example.com | 2026-03-01 → 2026-03-31
  Pipeline: 2 draft → 1 ready → 0 scheduled
  Next: Mar 18 — "Acqua Premium: La Rivoluzione..."
  Posts: 3/12 pubblicati
───────────────────────────────────────────
```

### 3.4 Slice: Signals (future — wp-analytics)

Aggiunge anomalie rilevanti:

```
── Editorial Context ──────────────────────
  mysite.example.com | 2026-03-01 → 2026-03-31
  Pipeline: 2 draft → 1 ready → 0 scheduled
  Signals: 3 anomalie | Top: /blog/benefici +45%
  Posts: 3/12 pubblicati
───────────────────────────────────────────
```

---

## 4. Step 0 nelle Skill

### 4.1 Template Step 0

Ogni content skill riceve un blocco Step 0 identico nella struttura, con `sliceType` diverso:

```markdown
## Step 0: CONTEXT

**What it does:** Provides editorial context before the main workflow begins.

**Trigger:** Automatic — run this step at every skill invocation, before Step 1.

**Procedure:**
1. Determine the active site from user context or ask the user
2. Read `.content-state/{site_id}.config.md` for site URL
3. Read the most recent `.content-state/*-editorial.state.md`
4. Count entries by status (planned, draft, ready, scheduled, published)
5. Read `.content-state/pipeline-active/*.brief.md` for active brief IDs and statuses
6. Display the context snippet

**Format:**
[specific to slice type]

**If files are missing:**
- If no config file exists → skip snippet, report "No site config found"
- If no editorial calendar exists → show partial snippet with "no calendar"
- If no active briefs → show "0 active briefs"
- Never stop the workflow because of missing context — Step 0 is informational only
```

### 4.2 Differenze per Skill

| Skill | sliceType | Riga Extra |
|-------|-----------|------------|
| `wp-content-pipeline` | `pipeline` | Lista brief attivi con status |
| `wp-editorial-planner` | `calendar` | Prossima scadenza (data + titolo troncato) |
| Future: `wp-analytics` | `signals` | Anomalie top dal signals-feed |

---

## 5. CLI Entry Point

### 5.1 Aggiunta a context-scanner.mjs

```javascript
// CLI entry point (when run directly, not imported)
if (process.argv[1] && process.argv[1].endsWith('context-scanner.mjs')) {
  const args = process.argv.slice(2);
  if (args.includes('--snippet')) {
    // Parse --site=X and --slice=Y
    // Run scanContentState + aggregateMetrics + renderContextSnippet
    // Output to stderr (consistent with MCP server logging pattern)
  }
}
```

### 5.2 Interfaccia CLI

```
node scripts/context-scanner.mjs --snippet --site=mysite [--slice=pipeline|calendar|signals] [--month=2026-03]
```

| Flag | Required | Default | Description |
|------|----------|---------|-------------|
| `--snippet` | Yes | — | Attiva modalità snippet (senza questo flag, il modulo è solo libreria) |
| `--site` | Yes | — | Site ID per il contesto |
| `--slice` | No | `pipeline` | Tipo di slice: `pipeline`, `calendar`, `signals` |
| `--month` | No | Mese corrente | Mese del calendario editoriale |

---

## 6. Vincoli

| Vincolo | Valore | Motivazione |
|---------|--------|-------------|
| Overhead < 500ms | Sì | Step 0 non deve rallentare la skill |
| Informational only | Sì | Step 0 non blocca mai il workflow |
| No nuovi file .content-state/ | Sì | Step 0 legge, non scrive |
| Stesso formato di renderContextSnippet() | Sì | Consistenza tra modalità |

---

## 7. Deliverable

| File | Azione | Descrizione |
|------|--------|-------------|
| `scripts/context-scanner.mjs` | Modifica | Aggiunta CLI `--snippet` + rimozione label "stub" |
| `skills/wp-content-pipeline/SKILL.md` | Modifica | Aggiunta Step 0: CONTEXT (pipeline slice) |
| `skills/wp-editorial-planner/SKILL.md` | Modifica | Aggiunta Step 0: CONTEXT (calendar slice) |
| `docs/plans/2026-03-02-context-snippet-design.md` | Nuovo | Questo documento |
| `package.json` | Modifica | Bump `v2.14.0` → `v2.14.1` |
| `CHANGELOG.md` | Modifica | Entry per context snippet |

---

## 8. Catena Documentale

```
docs/plans/2026-03-02-dashboard-strategy.md
  ├── docs/plans/2026-03-02-dashboard-kanban-design.md        (Fase A — completata)
  │     └── docs/plans/2026-03-02-dashboard-kanban-implementation.md
  └── docs/plans/2026-03-02-context-snippet-design.md         ← QUESTO DOCUMENTO (Fase B)
```

---

*Design document per Fase B del sistema dashboard — context snippet inline nelle content skill.*
