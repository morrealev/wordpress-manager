# Editorial Kanban Dashboard — Piano di Implementazione

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implementare la skill `wp-dashboard` con Kanban editoriale HTML generato da `.content-state/`.

**Architecture:** Due script Node.js ESM — `context-scanner.mjs` (SCAN + AGGREGATE condiviso) e `dashboard-renderer.mjs` (RENDER HTML + CLI) — più la skill definition `wp-dashboard/SKILL.md`.

**Tech Stack:** Node.js ESM, template literal HTML, CSS Grid, zero dipendenze esterne.

**Parent**: [Dashboard Kanban Design](2026-03-02-dashboard-kanban-design.md)

---

### Task 1: Create context-scanner.mjs — Frontmatter & Table Parsing

**Files:**
- Create: `scripts/context-scanner.mjs`

**Step 1: Create the file with boilerplate and frontmatter parser**

Create `scripts/context-scanner.mjs` with:
- ESM module header (`#!/usr/bin/env node`)
- Imports: `fs/promises`, `path`, `url`
- `__dirname` and `PROJECT_ROOT` resolution (same pattern as `run-validation.mjs`)
- `CONTENT_STATE_DIR` constant pointing to `.content-state/`
- Function `parseFrontmatter(content)`:
  - Match content between `---\n` delimiters
  - Try to import `yaml` from `servers/wp-rest-bridge/node_modules/yaml` via `createRequire`
  - If available, use `yaml.parse()` for robust parsing
  - If not available, implement minimal manual parser:
    - Handle scalar values (strings, numbers, booleans)
    - Handle inline arrays `[a, b, c]`
    - Handle multi-line arrays (`- item`)
    - Handle one level of nested objects (indented keys)
  - Return `{ frontmatter: object, body: string }`

**Step 2: Add editorial table parser**

Add function `parseEditorialTable(markdownBody, calendarPeriod)`:
- Split body by `## Settimana` headings
- For each section, find lines starting with `|` (skip header and separator rows)
- For each data row:
  - Split by `|`, trim each cell
  - Map to object: `{ date, title, type, status, briefId, postId, channels }`
  - Convert date from `Mon DD` format (e.g., `Mar 18`) to `YYYY-MM-DD` using the year/month from `calendarPeriod`
  - Handle special values: `—` → `null`, `[da assegnare]` → `title: null`
  - Parse channels: split by `, ` into array, empty string → `[]`
- Return array of entry objects

**Step 3: Verify parsing with a quick test**

Run:
```bash
node -e "
import { readFile } from 'fs/promises';
import { resolve } from 'path';
const mod = await import('./scripts/context-scanner.mjs');
// Test frontmatter parsing
const config = await readFile('.content-state/opencactus.config.md', 'utf8');
const parsed = mod.parseFrontmatter(config);
console.log('Config site_id:', parsed.frontmatter.site_id);
console.log('Config channels:', Object.keys(parsed.frontmatter.channels || {}));
// Test table parsing
const cal = await readFile('.content-state/2026-03-editorial.state.md', 'utf8');
const calParsed = mod.parseFrontmatter(cal);
const entries = mod.parseEditorialTable(calParsed.body, calParsed.frontmatter.period);
console.log('Entries count:', entries.length);
console.log('First entry:', JSON.stringify(entries[0]));
console.log('Planned (no title):', entries.filter(e => !e.title).length);
"
```

Expected:
- Config site_id: `opencactus`
- Config channels include `linkedin`, `twitter`, `mailchimp`
- Entries count: `8`
- First entry has `date: "2026-03-04"`, `status: "published"`, `briefId: "BRF-2026-001"`
- Planned (no title): `3`

---

### Task 2: Create context-scanner.mjs — scanContentState Function

**Files:**
- Modify: `scripts/context-scanner.mjs`

**Step 1: Add scanContentState function**

Add `export async function scanContentState(contentStatePath, siteId)`:

1. **Read site config**: `{contentStatePath}/{siteId}.config.md`
   - Parse frontmatter → extract `site_id`, `site_url`, `brand`, `defaults`, `channels`, `seo`, `cadence`
   - If file not found → throw with descriptive message

2. **Find current calendar**: glob `{contentStatePath}/*-editorial.state.md`
   - Filter by most recent (or by `--month` param passed externally)
   - Parse frontmatter → extract `calendar_id`, `period`, `goals`
   - Parse body → `parseEditorialTable()` for entries
   - If no calendar found → return `calendar: null`

3. **Read active briefs**: glob `{contentStatePath}/pipeline-active/*.brief.md`
   - For each file: parse frontmatter, extract key fields
   - Return array of brief summaries

4. **Read archived briefs**: glob `{contentStatePath}/pipeline-archive/*.brief.md`
   - Same as active briefs
   - Return array of brief summaries

5. **Read signals feed**: `{contentStatePath}/signals-feed.md`
   - Parse frontmatter → extract `feed_id`, `period`
   - Parse anomaly table in body (same table parsing logic)
   - If file not found → return `signals: null`

6. Return structured object:
   ```javascript
   { site, calendar, briefs: { active, archived }, signals }
   ```

**Step 2: Implement glob helper without external dependency**

Add function `globFiles(dirPath, pattern)` using `fs.readdir` + simple pattern matching (e.g., `*.brief.md`). No need for a full glob library — the patterns are simple suffix matches.

**Step 3: Verify with real data**

Run:
```bash
node -e "
const mod = await import('./scripts/context-scanner.mjs');
const data = await mod.scanContentState('.content-state', 'opencactus');
console.log('Site:', data.site.id, data.site.url);
console.log('Calendar:', data.calendar?.id, '- entries:', data.calendar?.entries?.length);
console.log('Briefs active:', data.briefs.active.length);
console.log('Briefs archived:', data.briefs.archived.length);
console.log('Signals:', data.signals?.anomalies?.length, 'anomalies');
"
```

Expected:
- Site: `opencactus https://opencactus.com`
- Calendar: `CAL-2026-03` - entries: `8`
- Briefs active: `1`
- Briefs archived: `1`
- Signals: `3` anomalies

---

### Task 3: Create context-scanner.mjs — aggregateMetrics Function

**Files:**
- Modify: `scripts/context-scanner.mjs`

**Step 1: Add aggregateMetrics function**

Add `export function aggregateMetrics(rawData, viewType = 'kanban')`:

For `viewType === 'kanban'`:

1. **Column counts**: count entries by status (`planned`, `draft`, `ready`, `scheduled`, `published`)
2. **Progress**: `postsPublished / postsTarget * 100`
3. **Next deadline**: first entry (by date) with status not `published` and with a title assigned
4. **Channel usage**: count entries per channel across all entries
5. **Fill rate**: entries with title / total entries * 100
6. **Signals summary**: count anomalies, identify highest delta
7. **Generation metadata**: timestamp, version

Return the metrics object as specified in the design document section 3.2.

**Step 2: Add renderContextSnippet stub**

Add `export function renderContextSnippet(metrics, sliceType = 'pipeline')` as a stub that returns a placeholder string. This will be implemented in Fase B but the export must exist now for the module contract.

```javascript
export function renderContextSnippet(metrics, sliceType = 'pipeline') {
  // Fase B implementation — placeholder
  const s = metrics;
  const lines = [
    `── Editorial Context ──────────────────────`,
    `  ${s.siteId} | ${s.calendarPeriod || 'no calendar'}`,
    `  Pipeline: ${s.columns?.draft ?? 0} draft → ${s.columns?.ready ?? 0} ready → ${s.columns?.scheduled ?? 0} scheduled`,
    `  Posts: ${s.postsPublished ?? 0}/${s.postsTarget ?? '?'} pubblicati`,
    `───────────────────────────────────────────`,
  ];
  return lines.join('\n');
}
```

**Step 3: Verify aggregation**

Run:
```bash
node -e "
const mod = await import('./scripts/context-scanner.mjs');
const data = await mod.scanContentState('.content-state', 'opencactus');
const metrics = mod.aggregateMetrics(data, 'kanban');
console.log('Progress:', metrics.postsPublished + '/' + metrics.postsTarget, '(' + metrics.progressPercent + '%)');
console.log('Columns:', JSON.stringify(metrics.columns));
console.log('Next deadline:', metrics.nextDeadline?.date, '-', metrics.nextDeadline?.title?.substring(0, 40));
console.log('Fill rate:', metrics.fillRate + '%');
console.log('Signals:', metrics.signalsCount);
// Test context snippet
console.log('\\nSnippet:\\n' + mod.renderContextSnippet(metrics));
"
```

Expected:
- Progress: `2/8 (25%)`
- Columns: `{"planned":3,"draft":1,"ready":2,"scheduled":0,"published":2}`
- Next deadline: `2026-03-11` - `Zero calorie, tutto gusto: la scienza`
- Fill rate: `62.5%`
- Signals: `3`
- Snippet: 5 lines of formatted terminal text

---

### Task 4: Create dashboard-renderer.mjs — HTML Template

**Files:**
- Create: `scripts/dashboard-renderer.mjs`

**Step 1: Create file with HTML template function**

Create `scripts/dashboard-renderer.mjs` with:
- ESM imports from `context-scanner.mjs`
- Function `renderKanbanHTML(rawData, metrics)` that returns a complete HTML string

The HTML template must include:

1. **`<head>`**: charset, viewport, title, inline `<style>` with full CSS (~150 lines)
2. **`<header>`**: site name, month, generation timestamp, progress bar, pipeline count badges
3. **`<main class="kanban">`**: 5 columns (planned, draft, ready, scheduled, published)
4. **Card generation**: loop through `rawData.calendar.entries`, group by status, render each as a card
5. **`<section class="signals-strip">`**: render anomalies from `rawData.signals` (skip if null)
6. **`<footer>`**: plugin version, skill name

CSS must include:
- CSS custom properties for the full palette (from design doc section 2.5)
- Reset styles (box-sizing, margin)
- Grid layout for kanban (5 columns, gap)
- Column styling (background, border-radius, flex column)
- Card styling (white bg, left border with status color, shadow)
- Card variants (`.card--empty` for planned without title)
- Header with progress bar
- Badge styles for pipeline counts and channels
- Signals strip styling
- Responsive breakpoint at 768px (single column stack)
- Print-friendly styles (`@media print`)

**Step 2: Implement helper functions**

- `escapeHtml(str)` — escape `<`, `>`, `&`, `"`, `'` for safe HTML output
- `truncate(str, maxLen)` — truncate string with `...`, return full string in `title` attribute
- `formatDate(dateStr)` — convert `YYYY-MM-DD` to localized display (e.g., `Mar 18`)
- `groupByStatus(entries)` — group entries array into object keyed by status
- `channelBadge(channel)` — return HTML for channel pill badge with correct color
- `statusColor(status)` — return CSS variable name for the status

**Step 3: Verify template generates valid HTML**

Run:
```bash
node -e "
const scanner = await import('./scripts/context-scanner.mjs');
const renderer = await import('./scripts/dashboard-renderer.mjs');
const data = await scanner.scanContentState('.content-state', 'opencactus');
const metrics = scanner.aggregateMetrics(data, 'kanban');
const html = renderer.renderKanbanHTML(data, metrics);
console.log('HTML length:', html.length, 'bytes');
console.log('Has DOCTYPE:', html.startsWith('<!DOCTYPE'));
console.log('Has 5 columns:', (html.match(/class=\"column\"/g) || []).length);
console.log('Has cards:', (html.match(/class=\"card/g) || []).length);
console.log('Has signals:', html.includes('signals-strip'));
"
```

Expected:
- HTML length: between 5000-30000 bytes
- Has DOCTYPE: `true`
- Has 5 columns: `5`
- Has cards: `8` (one per calendar entry)
- Has signals: `true`

---

### Task 5: Create dashboard-renderer.mjs — CLI Entry Point

**Files:**
- Modify: `scripts/dashboard-renderer.mjs`

**Step 1: Add CLI argument parsing and main function**

Add to `dashboard-renderer.mjs`:

- CLI arg parsing (reuse `getArg`/`hasFlag` pattern from `run-validation.mjs`):
  - `--site=X` — site ID
  - `--month=YYYY-MM` — target month
  - `--output=path` — custom output path
  - `--no-open` — skip browser launch
- `RENDERER_VERSION` constant `'1.0.0'`
- Function `async function main()`:
  1. Parse CLI args
  2. Resolve `CONTENT_STATE_DIR` from `PROJECT_ROOT`
  3. If no `--site`: scan for `*.config.md` files, auto-select if only one, error with list if multiple
  4. If no `--month`: determine current month from the most recent `*-editorial.state.md`
  5. Call `scanContentState()`
  6. Call `aggregateMetrics()`
  7. Call `renderKanbanHTML()`
  8. Write HTML to output path (default: `.content-state/.dashboard-{site}-{month}.html`)
  9. If not `--no-open`: open in browser via `xdg-open` / `open` / `start`
  10. Print summary to terminal:
      ```
      Dashboard generated: .content-state/.dashboard-opencactus-2026-03.html
      Posts: 2/8 published | Pipeline: 1 draft, 2 ready | Signals: 3 anomalies
      ```

- `main().catch(err => { console.error(err.message); process.exit(1); })`

**Step 2: Add platform-aware browser open**

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

Note: on WSL2, `xdg-open` should open the default Windows browser if `wslu` is installed. If not available, the `--no-open` flag allows manual opening.

**Step 3: Test CLI**

Run:
```bash
# Test with --no-open (don't open browser in CI-like context)
node scripts/dashboard-renderer.mjs --site=opencactus --no-open
```

Expected:
- File created at `.content-state/.dashboard-opencactus-2026-03.html`
- Terminal output shows summary line
- Exit code 0

Verify the file:
```bash
wc -c .content-state/.dashboard-opencactus-2026-03.html
head -5 .content-state/.dashboard-opencactus-2026-03.html
```

Expected:
- Size between 5000-30000 bytes
- First line: `<!DOCTYPE html>`

---

### Task 6: Create wp-dashboard Skill Definition

**Files:**
- Create: `skills/wp-dashboard/SKILL.md`

**Step 1: Write the SKILL.md**

Create `skills/wp-dashboard/SKILL.md` with:

- YAML frontmatter: `name`, `description` (with trigger phrases), `version: 1.0.0`
- Overview section explaining what the skill does
- "When to Use" section with trigger phrases (italiano + inglese)
- Workflow section:
  1. Determine target site (from conversation context or ask user)
  2. Determine target month (default: current, or ask)
  3. Execute: `node scripts/dashboard-renderer.mjs --site={siteId} --month={YYYY-MM}`
  4. Report to user that dashboard is open
  5. Suggest next actions based on what the dashboard shows
- "Reading the Dashboard" section explaining:
  - What each column means (planned → published lifecycle)
  - What the card colors indicate
  - What the signals strip shows
  - How to use the dashboard for operational decisions
- "Next Actions" section mapping dashboard observations to skills:
  - Empty `planned` slots → use `wp-editorial-planner` PLAN step
  - `draft` entries needing content → fill briefs in `pipeline-active/`
  - `ready` entries → use `wp-editorial-planner` SCHEDULE step
  - Signals with high delta → use `wp-analytics` for deeper investigation
- Safety rules (same as other skills: always show before acting)
- Related skills section

**Step 2: Verify skill file is valid**

Check that the YAML frontmatter parses correctly:
```bash
node -e "
import { readFile } from 'fs/promises';
const content = await readFile('skills/wp-dashboard/SKILL.md', 'utf8');
const match = content.match(/^---\n([\s\S]*?)\n---/);
console.log('Has frontmatter:', !!match);
console.log('Content preview:', content.substring(0, 200));
"
```

Expected: `Has frontmatter: true`

---

### Task 7: Test with Real Data — Visual Verification

**Files:**
- No files modified (test only)

**Step 1: Generate dashboard and inspect HTML**

```bash
node scripts/dashboard-renderer.mjs --site=opencactus --no-open --output=/tmp/kanban-test.html
```

**Step 2: Verify HTML structure**

```bash
# Check all 5 columns present
grep -c 'class="column"' /tmp/kanban-test.html

# Check all 8 cards present
grep -c 'class="card' /tmp/kanban-test.html

# Check published entries have post IDs
grep 'BRF-2026-001' /tmp/kanban-test.html

# Check signals strip
grep 'acqua di cactus' /tmp/kanban-test.html

# Check progress bar
grep 'pubblicati' /tmp/kanban-test.html

# Check no external dependencies (no http:// or https:// in link/script tags)
grep -E '<(link|script).*https?://' /tmp/kanban-test.html || echo "OK: no external deps"
```

Expected:
- 5 columns
- 8 cards (or close — one per calendar entry)
- BRF-2026-001 present in a published card
- "acqua di cactus" in signals strip
- "pubblicati" in progress area
- No external dependencies

**Step 3: Open in browser for visual check**

```bash
# On WSL2 with wslu installed:
xdg-open /tmp/kanban-test.html
# Or manually open the file in Windows browser
```

Visual check:
- [ ] 5 columns visible with correct headers
- [ ] Cards have colored left border matching status
- [ ] Published cards are green, draft is yellow, ready is blue
- [ ] "[da assegnare]" cards show grey italic text
- [ ] Channel badges show colored pills
- [ ] Progress bar shows 2/8 (25%)
- [ ] Signals strip at bottom shows 3 anomalies
- [ ] Responsive: resize to mobile width → columns stack vertically

---

### Task 8: Update .gitignore and package.json

**Files:**
- Modify: `.gitignore`
- Modify: `package.json`
- Modify: `.claude-plugin/plugin.json`
- Modify: `CHANGELOG.md`
- Modify: `docs/GUIDE.md`

**Step 1: Add dashboard HTML to .gitignore**

Add to `.gitignore`:
```
# Dashboard generated HTML (ephemeral artifacts)
.content-state/.dashboard-*.html
```

**Step 2: Bump version to v2.14.0**

In `package.json`:
- `version`: `"2.13.0"` → `"2.14.0"`
- `description`: add "dashboard" mention, bump skill count from 45 to 46

In `.claude-plugin/plugin.json`:
- `version`: `"2.13.0"` → `"2.14.0"`
- `description`: add "dashboard" mention, bump skill count
- `keywords`: add `"dashboard"`, `"kanban"`, `"editorial-dashboard"`

**Step 3: Add scripts entry in package.json**

Add to `scripts` section:
```json
"dashboard": "node scripts/dashboard-renderer.mjs"
```

**Step 4: Update CHANGELOG.md**

Add `## v2.14.0` entry at top (before v2.13.0):
```markdown
## v2.14.0 — Editorial Kanban Dashboard

**New Skill: `wp-dashboard`** — Visual Kanban dashboard generated as self-contained HTML.

### Dashboard System
- **`scripts/context-scanner.mjs`** — Shared SCAN + AGGREGATE module that reads `.content-state/` files
  - Parses YAML frontmatter from config, calendar, brief, and signals files
  - Parses editorial calendar Markdown tables into structured data
  - Computes aggregate metrics (progress, pipeline counts, fill rate, next deadline)
  - Exports `renderContextSnippet()` stub for future Fase B (step 0 context in content skills)
- **`scripts/dashboard-renderer.mjs`** — HTML renderer + CLI
  - Generates self-contained HTML Kanban board (zero external dependencies)
  - 5 columns: planned → draft → ready → scheduled → published
  - Cards with status-colored borders, channel badges, brief IDs
  - Progress bar, pipeline count badges, signals strip
  - Responsive layout (CSS Grid, mobile stack at 768px)
  - CLI: `--site`, `--month`, `--output`, `--no-open` flags
  - Opens dashboard in default browser via `xdg-open`/`open`
- **`skills/wp-dashboard/SKILL.md`** — Skill definition with trigger phrases and workflow

### Stats
- Skills: 45 → 46
- New scripts: 2 (`context-scanner.mjs`, `dashboard-renderer.mjs`)
```

**Step 5: Update docs/GUIDE.md skill count**

Update skill count: `45` → `46`

**Step 6: Verify all changes**

```bash
# Check version consistency
grep '"version"' package.json .claude-plugin/plugin.json
# Check gitignore has dashboard entry
grep 'dashboard' .gitignore
# Check CHANGELOG has new entry
head -20 CHANGELOG.md
```

Expected: Both files show `2.14.0`, gitignore has dashboard pattern, CHANGELOG starts with v2.14.0.

---

### Task 9: Commit

**Step 1: Stage and commit**

```bash
git add scripts/context-scanner.mjs scripts/dashboard-renderer.mjs skills/wp-dashboard/SKILL.md
git add .gitignore package.json .claude-plugin/plugin.json CHANGELOG.md docs/GUIDE.md
git status
git commit -m "feat: add wp-dashboard skill with Editorial Kanban HTML

Implements Fase A of the Dashboard Strategy:
- scripts/context-scanner.mjs: shared SCAN + AGGREGATE module
  - Parses YAML frontmatter and editorial calendar tables
  - Computes aggregate metrics (progress, pipeline, signals)
  - Exports renderContextSnippet() stub for Fase B
- scripts/dashboard-renderer.mjs: HTML renderer + CLI
  - Self-contained HTML Kanban (zero dependencies)
  - 5 columns: planned → draft → ready → scheduled → published
  - Cards, progress bar, signals strip, responsive layout
  - CLI flags: --site, --month, --output, --no-open
- skills/wp-dashboard/SKILL.md: skill definition

Skills: 45 → 46 | Version: v2.13.0 → v2.14.0

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Sequence Summary

| Task | What | Files | Depends On |
|------|------|-------|------------|
| 1 | Frontmatter + table parser | `context-scanner.mjs` (create) | — |
| 2 | `scanContentState()` | `context-scanner.mjs` (modify) | Task 1 |
| 3 | `aggregateMetrics()` + snippet stub | `context-scanner.mjs` (modify) | Task 2 |
| 4 | HTML template + `renderKanbanHTML()` | `dashboard-renderer.mjs` (create) | Task 3 |
| 5 | CLI entry point + browser open | `dashboard-renderer.mjs` (modify) | Task 4 |
| 6 | Skill definition | `wp-dashboard/SKILL.md` (create) | — |
| 7 | Visual verification test | No files | Task 5 |
| 8 | gitignore, version bump, changelog | Multiple (modify) | Task 7 |
| 9 | Commit | — | Task 8 |

**Task 6 è indipendente** da Task 1-5 e può essere eseguito in parallelo.

---

*Piano di implementazione per il Kanban editoriale del WordPress Manager Plugin. Fase A della Dashboard Strategy.*
