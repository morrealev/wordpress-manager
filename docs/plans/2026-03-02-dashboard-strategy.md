# Dashboard Operativi — Strategia e Architettura

**Data**: 2026-03-02
**Versione**: 1.0.0
**Stato**: Approvato (strategia)
**Prerequisito**: [Content Framework Architecture](2026-03-02-content-framework-architecture.md)
**Deriva da**: Brainstorming sessione 2026-03-02 (post Content Framework v2.13.0)

---

## 1. Contesto e Motivazione

### 1.1 Stato Attuale

Con il Content Framework v2.13.0 il plugin gestisce un ciclo completo:

```
GenSignal (intelligence) → Editorial Calendar (planning) → Content Pipeline (execution) → WP Publish → Analytics → GenSignal (feedback loop)
```

I dati operativi vivono in file `.content-state/`:

| File | Contiene | Aggiornamento |
|------|----------|---------------|
| `{site}.config.md` | Brand voice, canali, cadenza, defaults | Raro (setup) |
| `YYYY-MM-editorial.state.md` | Piano editoriale con stati per riga | Ogni sessione operativa |
| `pipeline-active/*.brief.md` | Brief in lavorazione con frontmatter YAML | Durante pipeline |
| `signals-feed.md` | Metriche normalizzate + anomalie | Periodico (settimanale) |

**Problema**: questi file sono leggibili da Claude ma non *visualizzabili* dall'operatore umano. L'operatore deve leggere YAML e tabelle Markdown per capire "dove siamo" prima di decidere "cosa fare".

### 1.2 Bisogno Identificato

L'operatore umano ha bisogno di **vedere a bocce ferme** — cioè avere una rappresentazione visiva dello stato operativo prima di iniziare una sessione di lavoro. Questo contesto visivo permette:

- **Decisioni informate**: quale brief lavorare, quale post schedulare
- **Pattern recognition**: colli di bottiglia, gap nel calendario, anomalie
- **Comunicazione**: condividere lo stato con stakeholder non tecnici

### 1.3 Evoluzione del Pensiero

Nel documento [Strategic Reflections](2026-03-02-content-framework-strategic-reflections.md), sezione 6, "Dashboard React/HTML per stato" era elencato come **anti-pattern** con motivazione:

> "Appesantisce il plugin con frontend code"

Questa valutazione resta valida per un **dashboard-app** (SPA React, stato persistente, API backend). Tuttavia il brainstorming del 2026-03-02 ha identificato una forma diversa:

| Caratteristica | Dashboard-App (anti-pattern) | Dashboard-Report (approccio adottato) |
|---------------|------------------------------|---------------------------------------|
| Natura | Applicazione web interattiva | File HTML statico generato on-demand |
| Stato | Mantiene stato proprio | Legge stato da `.content-state/` |
| Aggiornamento | Real-time / polling | Ri-generato ad ogni invocazione |
| Dipendenze | Framework JS, API, build system | Zero (HTML + CSS inline) |
| Durata | Persistente | Effimero (usa e getta) |
| Complessità | Alta (manutenzione continua) | Bassa (template string) |

**Principio rivisto**: un **report HTML statico generato on-demand** non è un dashboard-app. È un **artefatto di visualizzazione effimero** — equivalente a un `console.log` evoluto aperto nel browser.

---

## 2. Architettura: Approccio Ibrido

### 2.1 Due Livelli di Contesto

Il brainstorming ha converguto su un approccio a due livelli che serve bisogni diversi:

```
┌─────────────────────────────────────────────────────────────┐
│                    LIVELLO 1: VISIONE STRATEGICA            │
│                                                             │
│  Skill dedicata: wp-dashboard                               │
│  Output: HTML statico → browser                             │
│  Trigger: su richiesta dell'operatore                       │
│  Contenuto: vista completa, multi-dimensione                │
│  Uso: prima di una sessione di planning/review              │
│                                                             │
│  "Mostrami dove siamo"                                      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    LIVELLO 2: CONTESTO OPERATIVO            │
│                                                             │
│  Step 0 inline nelle content skill                          │
│  Output: testo terminale (3-5 righe)                        │
│  Trigger: automatico, ogni invocazione skill                │
│  Contenuto: solo lo slice rilevante per la skill attiva     │
│  Uso: prima di ogni operazione content                      │
│                                                             │
│  "Ecco cosa sto per toccare"                                │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Perché Due Livelli

| Criterio | Solo Livello 1 | Solo Livello 2 | Ibrido |
|----------|---------------|---------------|---------|
| Contesto prima di operare | Richiede azione esplicita | Automatico | Automatico |
| Visione d'insieme | Completa | Parziale (solo slice) | Completa su richiesta |
| Overhead per skill | Zero | Minimo (3-5 righe) | Minimo |
| Condivisibilità | HTML → browser → screenshot | Solo terminale | HTML per stakeholder |
| Scalabilità multi-sito | Dashboard multi-tab | Snippet per sito attivo | Entrambi |

### 2.3 Principio di Separazione

```
shared/context-scanner.mjs    ← SCAN + AGGREGATE (modulo condiviso)
  │
  ├── wp-dashboard/            ← RENDER → HTML (Livello 1)
  │     Skill dedicata, template HTML, apre browser
  │
  └── step 0 nelle skill       ← RENDER → terminal text (Livello 2)
        Funzione importata, output compatto
```

La logica di **lettura e aggregazione** dei file `.content-state/` è scritta una volta sola. Solo il rendering cambia.

---

## 3. Pattern: SCAN → AGGREGATE → RENDER

### 3.1 SCAN

Lettura dei file `.content-state/` con parsing del frontmatter YAML:

```
Input:
  .content-state/
  ├── mysite.config.md        → brand, canali, cadenza
  ├── 2026-03-editorial.state.md  → piano editoriale corrente
  ├── pipeline-active/            → brief in lavorazione
  │   └── BRF-2026-005.brief.md
  ├── pipeline-archive/           → brief completati
  └── signals-feed.md             → metriche + anomalie

Output: oggetto JavaScript con tutti i dati strutturati
```

### 3.2 AGGREGATE

Calcolo di metriche derivate:

| Metrica | Formula | Sorgente |
|---------|---------|----------|
| Pipeline velocity | brief `ready` / brief totali | editorial.state.md |
| Calendar fill rate | slot assegnati / slot totali | editorial.state.md |
| Content health | media(seo_score, readability) per brief | pipeline-active/*.brief.md |
| Signal intensity | count(anomalie > threshold) | signals-feed.md |
| Channel coverage | canali attivi / canali configurati | {site}.config.md |

### 3.3 RENDER

Due renderer dallo stesso dataset aggregato:

**Renderer HTML (Livello 1)**:
- Kanban board con colonne stato (planned → draft → ready → scheduled → published)
- Card per ogni contenuto con titolo, data, canali, brief ID
- Barra laterale con metriche aggregate
- Sezione anomalie/segnali da signals-feed
- Self-contained: zero dipendenze esterne (CSS inline, no JS framework)

**Renderer Terminal (Livello 2)**:
- 3-5 righe di testo formattato
- Solo lo slice rilevante per la skill corrente
- Esempio per `wp-content-pipeline`:
  ```
  ── Editorial Context ──────────────────────
    mysite.example.com | Mar 2026
    Pipeline: 2 draft → 1 ready → 0 scheduled
    Next deadline: Mar 18 — "Acqua premium..."
    Briefs attivi: BRF-2026-005
  ───────────────────────────────────────────
  ```

---

## 4. Tipi di Vista Dashboard

### 4.1 Roadmap delle Viste

| Priorità | Vista | Oggetto Primario | Dimensioni |
|----------|-------|------------------|------------|
| **P0** | Editorial Kanban | Content (brief/post) | stato × tempo |
| P1 | Signal Radar | Anomalie/pattern | intensità × tipo |
| P2 | Distribution Calendar | Canali social/email | canale × data |
| P3 | Site Health | Metriche tecniche | CWV, uptime, security |

**Scope iniziale**: solo P0 (Editorial Kanban). Gli altri seguono se il pattern funziona.

### 4.2 Pattern Replicabile

Ogni vista segue lo stesso contratto:

```javascript
// Interfaccia concettuale (non codice — guida per l'implementazione)
{
  scan(contentStatePath, siteId) → rawData,
  aggregate(rawData, viewType) → metrics,
  renderHTML(metrics, template) → htmlString,
  renderTerminal(metrics, sliceType) → terminalString
}
```

Le dimensioni per cui il pattern si replica:

| Dimensione | Esempio | Impatto su SCAN |
|------------|---------|-----------------|
| **Per sito** | mysite, othersite | Filtro su `site_id` nei file `.content-state/` |
| **Per tipo tool** | content, analytics, social | Filtro su tipo di dato nel dataset |
| **Per obiettivo** | awareness, conversion, retention | Filtro su categorie/tag nel editorial plan |
| **Per timeframe** | settimana, mese, quarter | Filtro temporale su date nel calendar |

### 4.3 Index File (Ottimizzazione Futura)

A basso volume (1-2 siti, < 20 brief/mese) lo scan diretto dei file è sufficiente. Per scaling:

```yaml
# .content-state/index.yml (auto-generato, gitignored)
sites:
  - id: mysite
    config: mysite.config.md
    calendar: 2026-03-editorial.state.md
    active_briefs: 1
    published_this_month: 2
    signals_last_updated: "2026-03-01T09:00:00Z"
```

L'index è un **cache file**, non una sorgente primaria. Si rigenera leggendo i file MD.

---

## 5. Vincoli Architetturali

### 5.1 Allineamento con Principi Esistenti

| Principio (da Strategic Reflections) | Applicazione Dashboard |
|--------------------------------------|----------------------|
| "Non creare sovrastrutture" | HTML statico, zero framework, zero stato proprio |
| "File MD come configuration layer" | Lo SCAN legge gli stessi file `.content-state/` |
| "Zero nuovi MCP tool TypeScript" | Il renderer è uno script Node.js standalone |
| "Claude = orchestratore naturale" | Claude invoca la skill, il renderer produce l'HTML |
| "Reversible" | Rimuovere = cancellare la skill + lo script |

### 5.2 Vincoli Tecnici

| Vincolo | Motivazione |
|---------|-------------|
| HTML self-contained | Nessuna dipendenza CDN, offline-first |
| CSS inline | Un solo file `.html` da aprire |
| Zero JavaScript interattivo | Report statico, non app |
| Dimensione < 50 KB | Rendering istantaneo |
| `open` command per launch | Cross-platform (Linux xdg-open, macOS open) |

### 5.3 Dove NON Andare

| Tentazione | Perché No |
|------------|-----------|
| Framework CSS (Tailwind, Bootstrap) | Over-engineering per un report statico |
| Chart.js / D3 | Complessità sproporzionata; se servono grafici, si valuta dopo |
| WebSocket per live update | Anti-pattern: il report si rigenera, non si aggiorna |
| Template engine (EJS, Handlebars) | Template literal ES6 è sufficiente |
| Multi-page HTML | Un file, una vista, un `open` |

---

## 6. Roadmap Implementativa

### Fase A: Editorial Kanban Dashboard (wp-dashboard skill)

**Obiettivo**: Prima vista HTML funzionante con Kanban editoriale.

**Deliverable**:
- Skill `wp-dashboard/` con `SKILL.md`
- Script `scripts/dashboard-renderer.mjs` (SCAN + AGGREGATE + RENDER HTML)
- Template HTML inline nel renderer
- Comando `open` per aprire nel browser

**Documenti operativi derivati**:
- `docs/plans/2026-03-02-dashboard-kanban-design.md` — Design document
- `docs/plans/2026-03-02-dashboard-kanban-implementation.md` — Implementation plan

### Fase B: Context Snippet (Step 0 nelle Content Skill)

**Obiettivo**: Ogni content skill stampa 3-5 righe di contesto operativo.

**Deliverable**:
- Funzione `renderContextSnippet()` in `scripts/context-scanner.mjs`
- Integrazione in `wp-content-pipeline/SKILL.md` e `wp-editorial-planner/SKILL.md`
- Documentazione pattern per future skill

**Prerequisito**: Fase A completata (la logica SCAN+AGGREGATE è scritta lì, Fase B la riusa).

**Documenti operativi derivati**:
- `docs/plans/2026-03-02-context-snippet-design.md` — Design document

### Fase C: Viste Aggiuntive (se pattern validato)

**Trigger**: dopo 2+ settimane di uso reale del Kanban dashboard.

**Candidati**:
1. Signal Radar — se `signals-feed.md` viene usato regolarmente
2. Distribution Calendar — se multi-channel posting è attivo
3. Site Health — se monitoring è attivo

**Documenti operativi derivati**: uno per vista, solo se/quando necessario.

---

## 7. Criteri di Successo

| Criterio | Metrica | Fase |
|----------|---------|------|
| **Tempo di generazione** | < 2 secondi da invocazione a browser aperto | A |
| **Self-contained** | Un singolo file `.html`, zero dipendenze | A |
| **Leggibilità** | Operatore capisce lo stato in < 10 secondi | A |
| **Condivisibilità** | Screenshot del Kanban usabile in comunicazione | A |
| **Overhead skill** | Step 0 aggiunge < 500ms alla skill | B |
| **Zero manutenzione** | Nessun aggiornamento necessario se i file MD non cambiano schema | A, B |
| **WCOP preserved** | Score WCOP ≥ 9.2/10 dopo implementazione | A, B |

---

## 8. Impatto sul Plugin

### 8.1 Nuovi File

| File | Tipo | Fase |
|------|------|------|
| `skills/wp-dashboard/SKILL.md` | Skill definition | A |
| `scripts/dashboard-renderer.mjs` | Node.js script | A |
| `scripts/context-scanner.mjs` | Shared module (SCAN + AGGREGATE) | A (usato da B) |

### 8.2 File Modificati

| File | Modifica | Fase |
|------|----------|------|
| `skills/wp-content-pipeline/SKILL.md` | Aggiunta step 0 context snippet | B |
| `skills/wp-editorial-planner/SKILL.md` | Aggiunta step 0 context snippet | B |
| `package.json` | Bump versione, aggiornamento descrizione | A |
| `.claude-plugin/plugin.json` | Bump versione, keyword `dashboard` | A |
| `CHANGELOG.md` | Entry per dashboard | A |
| `docs/GUIDE.md` | Skill count update | A |

### 8.3 Version Bump

- Dashboard Kanban (Fase A): `v2.13.0` → `v2.14.0` (minor — nuova capability)
- Context Snippet (Fase B): `v2.14.0` → `v2.14.1` (patch — enhancement interno)

---

## 9. Catena Documentale

```
docs/plans/2026-03-02-content-framework-strategic-reflections.md
  └── docs/plans/2026-03-02-content-framework-architecture.md
        └── docs/plans/2026-03-02-dashboard-strategy.md           ← QUESTO DOCUMENTO
              ├── docs/plans/2026-03-02-dashboard-kanban-design.md      (prossimo)
              │     └── docs/plans/2026-03-02-dashboard-kanban-implementation.md
              └── docs/plans/2026-03-02-context-snippet-design.md       (dopo Fase A)
```

---

*Documento strategico per l'evoluzione del WordPress Manager Plugin con dashboard operativi. Deriva dal brainstorming post-Content Framework v2.13.0.*
