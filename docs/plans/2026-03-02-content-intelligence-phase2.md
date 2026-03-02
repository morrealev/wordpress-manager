# Content Intelligence Layer (Phase 2) — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create a feedback loop where WordPress analytics data is transformed into structured signals compatible with GenSignal, enabling data-driven content decisions.

**Architecture:** Extend the existing `wp-analytics` skill with a new Step 7 that collects GA4, GSC, Plausible, and CWV data, calculates deltas vs previous period, maps metrics to GenSignal's NormalizedEvent format, identifies anomalies (±30% threshold), matches 3+ GenSignal patterns, and writes `.content-state/signals-feed.md`. A new schema reference file documents the feed format. Zero new TypeScript — all orchestration lives in skill prompts and MD schemas.

**Tech Stack:** Markdown + YAML frontmatter, Claude Code skill system, existing MCP tools (14 analytics tools + GSC tools)

**Reference Docs:**
- Architecture: `docs/plans/2026-03-02-content-framework-architecture.md` (Sections 2.1–2.4)
- Strategic context: `docs/plans/2026-03-02-content-framework-strategic-reflections.md` (Section 5B)
- GenSignal schemas: `gensignal:references:schemas` (NormalizedEvent, SignalCard, PatternRule)
- GenSignal patterns: `gensignal:references:pattern-library` (26 patterns, 3 relevant for WP analytics)
- Existing skill: `skills/wp-analytics/SKILL.md` (6 sections, 14 MCP tools)
- Phase 1 artifacts: `skills/wp-content-pipeline/references/content-brief-schema.md`, `skills/wp-content-pipeline/references/site-config-schema.md`

---

### Task 1: Create Signals Feed Schema Reference

**Files:**
- Create: `skills/wp-analytics/references/signals-feed-schema.md`

**Step 1: Create the references directory if needed**

```bash
mkdir -p skills/wp-analytics/references
```

Note: the `references/` directory likely already exists (from ga4-integration.md, plausible-setup.md, etc.). This is a safety check.

**Step 2: Write the signals feed schema**

Create `skills/wp-analytics/references/signals-feed-schema.md` with complete schema documentation. This file defines the YAML frontmatter structure and body format for `.content-state/signals-feed.md` files.

The schema must include these sections:

**A. Overview** — One paragraph explaining: signals-feed.md is the bridge between wp-analytics output and GenSignal input. It translates WordPress metrics into the NormalizedEvent format that GenSignal can consume for pattern detection and scoring.

**B. Frontmatter fields** with types, required/optional status, and defaults:
- `feed_id` (string, required, format: `FEED-{site_id}-YYYY-MM`)
- `site_id` (string, required, must match a `.content-state/{site_id}.config.md`)
- `generated` (ISO 8601 timestamp, auto-set at generation time)
- `period` (string, required, format: `YYYY-MM-DD..YYYY-MM-DD`)
- `comparison_period` (string, auto-calculated, same duration offset backward)
- `source_tools` (string array, required, list of MCP tools that contributed data)
- `anomaly_threshold` (number, default: 30, percentage delta that qualifies as anomaly)
- `status` (enum: `generated | reviewed | actioned`, default: `generated`)

**C. NormalizedEvent format** — Detailed field-by-field documentation:
- `entity_id` (string, required) — Format: `{EntityType}:{identifier}`. Entity types:
  - `Page:/path` — A specific page or post URL path
  - `Keyword:term` — A search keyword from GSC
  - `Source:name` — A traffic source (e.g., linkedin, google, direct)
  - `Site:site_id` — Site-level aggregate metric
- `relation` (string, required) — The metric being measured. Valid relations per entity type:
  - Page: `pageviews`, `sessions`, `avg_engagement_time`, `bounce_rate`, `conversions`
  - Keyword: `search_impressions`, `search_clicks`, `search_ctr`, `search_position`
  - Source: `referral_sessions`, `referral_conversions`, `referral_bounce_rate`
  - Site: `total_sessions`, `total_pageviews`, `total_conversions`, `lcp`, `cls`, `inp`, `fcp`, `ttfb`
- `value` (number, required) — The metric value for the current period
- `unit` (string, required) — One of: `count`, `seconds`, `percentage`, `position`
- `ts` (ISO 8601 timestamp, required) — End of measurement period
- `delta_pct` (number, optional) — Percentage change vs comparison period. Positive = increase, negative = decrease. Omitted if no comparison data available.
- `provenance` (object, required):
  - `source_id` (string) — The MCP tool that produced this data (e.g., `ga4_top_pages`, `gsc_query_analytics`)
  - `site` (string) — The site_id

**D. Body sections** — The MD body after frontmatter contains YAML code blocks organized by signal category:

1. `# Normalized Events` — All NormalizedEvent entries organized by subsection:
   - `## Traffic Signals` — Page-level metrics from GA4/Plausible
   - `## Search Signals` — Keyword-level metrics from GSC
   - `## Source Signals` — Traffic source metrics from GA4
   - `## Performance Signals` — CWV metrics from CrUX/PageSpeed

2. `# Anomalies & Patterns` — A Markdown table summarizing detected anomalies and pattern matches:
   - Columns: `Entity | Metric | Delta | Pattern Match | Action`
   - Only entries where `|delta_pct| >= anomaly_threshold` appear here
   - Pattern Match column uses GenSignal pattern names (see section F)
   - Action column contains a brief recommended next step

**E. Delta calculation rules:**
- Period comparison: current period vs same-length previous period (e.g., Feb vs Jan)
- Formula: `delta_pct = ((current - previous) / previous) * 100`, rounded to nearest integer
- If previous value is 0: use `+999` for any positive current value, `0` if both zero
- If no previous data exists: omit `delta_pct` field entirely
- The `comparison_period` frontmatter field records which period was used for baseline

**F. GenSignal pattern matching** — Three patterns from the GenSignal pattern library (26 total) that can be detected from WP analytics data alone:

1. **Search Intent Shift** (PTRN from GenSignal pattern library)
   - **Detection**: GSC data shows `search_ctr` increasing while `search_position` stays flat or drops — users clicking more on existing rankings, suggesting intent shift toward transactional
   - **Trigger**: `search_ctr` delta ≥ +20% sustained over 2+ measurement windows, OR `search_impressions` delta ≥ +50% on keywords with commercial modifiers
   - **Data sources**: `gsc_query_analytics`
   - **Action template**: "Investigate: content cluster opportunity" or "Optimize: test transactional CTAs"

2. **Early-Adopter Surge** (PTRN from GenSignal pattern library)
   - **Detection**: Single traffic source shows disproportionate session growth compared to other sources — early adoption signal from a specific community/channel
   - **Trigger**: Single `Source:*` referral_sessions delta ≥ +50% while total site sessions delta < +20%
   - **Data sources**: `ga4_traffic_sources`
   - **Action template**: "Scale: increase posting frequency on {source}" or "Investigate: identify content resonating with {source} audience"

3. **Hype→Utility Crossover** (PTRN from GenSignal pattern library)
   - **Detection**: Page engagement metrics (avg_engagement_time, low bounce_rate) improving while raw pageviews plateau or decrease — shift from curiosity traffic to utility traffic
   - **Trigger**: `avg_engagement_time` delta ≥ +15% AND `bounce_rate` delta ≤ -10%, with `pageviews` delta between -20% and +10%
   - **Data sources**: `ga4_top_pages`, `ga4_report`
   - **Action template**: "Shift: move spend from awareness to activation" or "Optimize: add conversion touchpoints to high-engagement pages"

**G. Status lifecycle**: `generated → reviewed → actioned`
- `generated`: Feed was just created by wp-analytics Step 7
- `reviewed`: User or Claude has reviewed the anomalies and confirmed/dismissed findings
- `actioned`: Findings have been acted upon (briefs created, campaigns launched, etc.)

**H. Integration notes:**
- GenSignal compatibility: NormalizedEvent fields map 1:1 to GenSignal Harvest stage input. The `entity_id` format uses GenSignal's `{Type}:{identifier}` convention. The `provenance` block ensures source tracking for GenSignal's `quality.corroboration` scoring.
- Phase 1 bridge: Anomalies with "content cluster opportunity" actions can feed directly into `wp-content-pipeline` by creating brief files in `pipeline-active/`.
- Phase 3 bridge: The Anomalies & Patterns table feeds `wp-editorial-planner` for topic suggestions when creating calendar entries.
- Overwrite semantics: `signals-feed.md` is overwritten each time Step 7 runs. Previous feeds are not archived (they represent point-in-time snapshots). The `comparison_period` field preserves the baseline reference.

**I. Example feed** — A complete, realistic example for mysite with:
- 2-3 Traffic Signals (page-level)
- 2 Search Signals (keyword-level)
- 1 Source Signal
- 1 Performance Signal
- 2-3 rows in Anomalies & Patterns table matching the 3 patterns above

Use the exact examples from the architecture doc (section 2.2) as the basis, ensuring field names and formats match the schema defined above.

**J. Validation rules:**
- `feed_id` must follow `FEED-{site_id}-YYYY-MM` format
- `site_id` must match an existing `.content-state/{site_id}.config.md`
- Every event must have `entity_id`, `relation`, `value`, `unit`, `ts`, and `provenance`
- `entity_id` must use a recognized prefix: `Page:`, `Keyword:`, `Source:`, `Site:`
- `relation` must be valid for the entity type (see table in section C)
- `delta_pct` values should be integers (round to nearest)
- `anomaly_threshold` must be a positive number

**Step 3: Verify file exists and is valid markdown**

Run: `head -5 skills/wp-analytics/references/signals-feed-schema.md`

Expected: file exists with `# Signals Feed Schema` header.

**Step 4: Commit**

```bash
git add skills/wp-analytics/references/signals-feed-schema.md
git commit -m "feat(content-intelligence): add signals feed schema reference

Defines the NormalizedEvent format for bridging wp-analytics output
to GenSignal input. Covers entity types, relations, delta calculation,
and 3 auto-detectable GenSignal patterns (Search Intent Shift,
Early-Adopter Surge, Hype→Utility Crossover)."
```

---

### Task 2: Extend `wp-analytics` SKILL.md with Signal Feed Generation

**Files:**
- Modify: `skills/wp-analytics/SKILL.md`

**Step 1: Read the current SKILL.md**

Read: `skills/wp-analytics/SKILL.md`

Understand the current 6 sections and the structure. The new content will be added as a new Section 7 and a new workflow step.

**Step 2: Add Section 7 to the Sections list**

After the existing `### Section 6: Cross-Platform Comparison` block (around line 93-98), add:

```markdown
### Section 7: Signal Feed Generation (Content Intelligence)
See `references/signals-feed-schema.md`
- Generating `.content-state/signals-feed.md` from analytics data
- NormalizedEvent format for GenSignal compatibility
- Delta calculation against previous period
- Anomaly detection with configurable threshold (default ±30%)
- Pattern matching: Search Intent Shift, Early-Adopter Surge, Hype→Utility Crossover
- Integration with wp-content-pipeline (Phase 1) and wp-editorial-planner (Phase 3)
```

**Step 3: Add the reference file to the Reference Files table**

In the `## Reference Files` table (around line 100-108), add a new row:

```markdown
| `references/signals-feed-schema.md` | NormalizedEvent format, delta rules, pattern matching, anomaly detection |
```

**Step 4: Add the Signal Feed Generation workflow**

After the Reference Files table and before the `## MCP Tools` section, add a new section:

```markdown
## Signal Feed Generation Workflow

### When to Use

- User asks to "generate signals", "analyze performance and create signals", "run content intelligence"
- User wants to understand which analytics trends are actionable
- User mentions GenSignal integration or NormalizedEvent
- After running a standard analytics report (Sections 1-6), user wants structured output for strategic planning

### Prerequisites

1. At least one analytics service configured (GA4, Plausible, or GSC)
2. A `.content-state/{site_id}.config.md` exists for the target site (created in Phase 1)
3. Historical data for at least 2 periods (to calculate deltas)

### Step 7: GENERATE SIGNAL FEED

```
COLLECT → BASELINE → NORMALIZE → DELTA → ANOMALY → PATTERN → WRITE
```

**7.1 COLLECT — Gather current period data**

Call the following MCP tools for the requested period (default: last 30 days):

| Tool | Data Collected | Entity Type |
|------|---------------|-------------|
| `ga4_top_pages` | Top 20 pages by pageviews, sessions, engagement time | Page |
| `ga4_traffic_sources` | Source/medium breakdown with sessions, bounce rate | Source |
| `ga4_report` | Site-level aggregate: total sessions, pageviews, conversions | Site |
| `gsc_query_analytics` | Top 20 keywords by impressions, clicks, CTR, position | Keyword |
| `pl_aggregate` | If Plausible configured: visitors, pageviews, bounce_rate | Site (cross-validate) |
| `cwv_crux_origin` | If CrUX available: LCP, CLS, INP, FCP, TTFB | Site |

Not all tools need to succeed. Generate events only from tools that return data. Record which tools contributed in `source_tools` frontmatter.

**7.2 BASELINE — Load comparison period data**

Read the existing `.content-state/signals-feed.md` if present. Extract the `period` and `events` to use as baseline for delta calculation.

If no previous feed exists:
- Call the same tools with date range offset by the period length (e.g., if current = Feb, baseline = Jan)
- If baseline tools fail: proceed without deltas (omit `delta_pct` fields)

Record the comparison period in `comparison_period` frontmatter field.

**7.3 NORMALIZE — Map to NormalizedEvent format**

For each data point from Step 7.1, create a NormalizedEvent:

```yaml
- entity_id: "{EntityType}:{identifier}"
  relation: "{metric_name}"
  value: {numeric_value}
  unit: "{count|seconds|percentage|position}"
  ts: "{period_end_ISO8601}"
  provenance:
    source_id: "{mcp_tool_name}"
    site: "{site_id}"
```

**Entity ID mapping rules:**
- GA4 top pages: `Page:{page_path}` (e.g., `Page:/premium-water-benefici`)
- GA4 traffic sources: `Source:{source_name}` (e.g., `Source:linkedin`)
- GA4 site aggregates: `Site:{site_id}` (e.g., `Site:mysite`)
- GSC keywords: `Keyword:{query}` (e.g., `Keyword:acqua premium`)
- CWV metrics: `Site:{site_id}` with relation = metric name (e.g., `lcp`)

**Relation mapping rules:**
- GA4 `screenPageViews` → `pageviews`
- GA4 `sessions` → `sessions` (page-level) or `total_sessions` (site-level)
- GA4 `averageSessionDuration` → `avg_engagement_time`
- GA4 `bounceRate` → `bounce_rate`
- GSC `impressions` → `search_impressions`
- GSC `clicks` → `search_clicks`
- GSC `ctr` → `search_ctr`
- GSC `position` → `search_position`
- CWV metrics → lowercase (e.g., `lcp`, `cls`, `inp`)

**7.4 DELTA — Calculate percentage changes**

For each NormalizedEvent, find the matching baseline event (same `entity_id` + `relation`) and calculate:

```
delta_pct = round(((current_value - baseline_value) / baseline_value) * 100)
```

Special cases:
- Baseline value = 0 and current > 0: set `delta_pct: +999`
- Both values = 0: set `delta_pct: 0`
- No baseline match found: omit `delta_pct` field

Add the calculated `delta_pct` to each NormalizedEvent.

**7.5 ANOMALY — Identify significant changes**

Read `anomaly_threshold` from feed frontmatter (default: 30).

Filter events where `|delta_pct| >= anomaly_threshold`. These are anomalies.

For each anomaly, prepare a row for the Anomalies & Patterns table:
- Entity: the `entity_id`
- Metric: the `relation`
- Delta: the `delta_pct` with sign and % symbol

**7.6 PATTERN — Match GenSignal patterns**

For each anomaly, check against the 3 detectable patterns:

**Search Intent Shift:**
- Condition: Entity is `Keyword:*` AND (`search_ctr` delta ≥ +20% with `search_position` delta ≤ +5%) OR (`search_impressions` delta ≥ +50%)
- Action: "Investigate: content cluster opportunity"

**Early-Adopter Surge:**
- Condition: Entity is `Source:*` AND `referral_sessions` delta ≥ +50% AND site-level `total_sessions` delta < +20%
- Action: "Scale: increase posting frequency on {source}"

**Hype→Utility Crossover:**
- Condition: Entity is `Page:*` AND `avg_engagement_time` delta ≥ +15% AND `bounce_rate` delta ≤ -10% AND `pageviews` delta between -20% and +10%
- Requires checking multiple relations for the same entity
- Action: "Shift: add conversion touchpoints to {page}"

If no pattern matches: set Pattern Match to "Unclassified anomaly" and Action to "Review: investigate cause of {delta_pct}% change in {relation}"

**7.7 WRITE — Generate signals-feed.md**

Write `.content-state/signals-feed.md` with:
1. YAML frontmatter: `feed_id`, `site_id`, `generated`, `period`, `comparison_period`, `source_tools`, `anomaly_threshold`, `status: generated`
2. Body: organized by signal category (Traffic, Search, Source, Performance)
3. Anomalies & Patterns table at the end

**After writing**, present a summary to the user:
```
Signal Feed generato per {site_id}:
- Periodo: {period}
- Eventi normalizzati: {count}
- Anomalie rilevate: {anomaly_count}
- Pattern riconosciuti: {pattern_list}

Anomalie principali:
1. {entity} — {relation} {delta}% → {pattern}: {action}
2. ...

Per approfondire un segnale con GenSignal: "approfondisci il segnale N con GenSignal"
Per creare brief dai segnali: "crea brief per i segnali azionabili"
```
```

**Step 5: Update Related Skills**

In the `## Related Skills` section (around line 133-138), add:

```markdown
- **`wp-content-pipeline`** — use signal insights to create content briefs for publishing
```

**Step 6: Update Cross-references**

In the `## Cross-references` section (around line 140-145), add:

```markdown
- Signal feed generation bridges to `wp-content-pipeline` for data-driven content creation
- GenSignal integration: signals-feed.md is the exchange format between wp-analytics and GenSignal pattern detection
```

**Step 7: Verify SKILL.md structure**

Run: `grep -n "### Section" skills/wp-analytics/SKILL.md`

Expected: 7 sections listed (Section 1 through Section 7).

Run: `grep -n "Step 7" skills/wp-analytics/SKILL.md`

Expected: at least 1 match for the new Step 7 content.

**Step 8: Commit**

```bash
git add skills/wp-analytics/SKILL.md
git commit -m "feat(content-intelligence): extend wp-analytics with signal feed generation

Adds Step 7: GENERATE SIGNAL FEED workflow (COLLECT → BASELINE →
NORMALIZE → DELTA → ANOMALY → PATTERN → WRITE). Maps GA4, GSC,
Plausible, CWV metrics to GenSignal NormalizedEvent format. Detects
3 patterns: Search Intent Shift, Early-Adopter Surge, Hype→Utility
Crossover. Writes .content-state/signals-feed.md."
```

---

### Task 3: Create Example Signals Feed Instance

**Files:**
- Create: `.content-state/signals-feed.md`

**Step 1: Write a realistic test feed**

Create `.content-state/signals-feed.md` with:

- Frontmatter targeting mysite, period: 2026-02-01..2026-02-28, comparison_period: 2026-01-01..2026-01-31
- source_tools: `[ga4_top_pages, ga4_traffic_sources, ga4_report, gsc_query_analytics]`
- anomaly_threshold: 30
- status: generated

Events section with realistic data:

**Traffic Signals (3 events):**
- `Page:/benefici-acqua-premium-idratazione-naturale` — pageviews: 3240, delta: +47%
- `Page:/benefici-acqua-premium-idratazione-naturale` — avg_engagement_time: 185s, delta: +12%
- `Page:/prodotti` — pageviews: 1850, delta: +8%

**Search Signals (2 events):**
- `Keyword:acqua premium` — search_impressions: 8500, delta: +120%
- `Keyword:acqua premium benefici` — search_ctr: 4.2%, delta: -8%

**Source Signals (1 event):**
- `Source:linkedin` — referral_sessions: 420, delta: +85%

**Performance Signals (1 event):**
- `Site:mysite` — lcp: 2.1s, no delta (first CWV measurement)

**Anomalies & Patterns table (3 rows):**

| Entity | Metric | Delta | Pattern Match | Action |
|--------|--------|-------|---------------|--------|
| Keyword:acqua premium | search_impressions | +120% | Search Intent Shift | Investigate: content cluster opportunity |
| Source:linkedin | referral_sessions | +85% | Early-Adopter Surge | Scale: increase LinkedIn posting frequency |
| Page:/benefici-acqua-premium-idratazione-naturale | pageviews | +47% | Unclassified anomaly | Review: investigate cause of +47% change in pageviews |

This feed serves as the integration test artifact. The wp-analytics Step 7 will produce files in this exact format.

**Step 2: Verify feed structure**

Run: `head -15 .content-state/signals-feed.md`

Expected: valid YAML frontmatter with `feed_id: FEED-mysite-2026-02` and `status: generated`.

**Step 3: No commit** — this file is gitignored (instance data). It lives locally for testing.

---

### Task 4: Update Architecture Doc Status

**Files:**
- Modify: `docs/plans/2026-03-02-content-framework-architecture.md`

**Step 1: Read current acceptance criteria**

Read lines around 582-588 of the architecture doc to find the Phase 2 checklist.

**Step 2: Update Phase 2 checklist**

Check off the implemented criteria:

```markdown
### Fase 2: Content Intelligence

- [x] `signals-feed.schema.md` compatibile con GenSignal NormalizedEvent
- [x] `wp-analytics` estesa con Step 7 (signal feed generation)
- [x] Delta calculation funzionante (confronto con periodo precedente)
- [x] Almeno 3 GenSignal patterns riconosciuti automaticamente
- [ ] Flusso testato: analytics → signals-feed.md → insight azionabili
```

Note: "Flusso testato" left unchecked — that requires a live analytics test with real GA4/GSC data, which is a separate manual validation step (same pattern as Phase 1).

**Step 3: Update document status**

Change `**Stato**: Fase 1 Implementata` to `**Stato**: Fase 2 Implementata`

**Step 4: Commit**

```bash
git add docs/plans/2026-03-02-content-framework-architecture.md
git commit -m "docs: update architecture status — Phase 2 implemented

Signals feed schema, wp-analytics Step 7 extension, delta calculation,
and 3 GenSignal patterns in place. Live analytics flow test pending."
```

---

### Task 5: Update GUIDE.md with Phase 2 Documentation

**Files:**
- Modify: `docs/GUIDE.md`

**Step 1: Read current Content Framework section**

Read the Content Framework section in GUIDE.md (added in Phase 1 as section 17) to find where to insert Phase 2 content.

**Step 2: Add Content Intelligence subsection**

After the existing `### 17.2 Content Pipeline (Phase 1)` subsection, add a new subsection:

```markdown
### 17.5 Content Intelligence (Phase 2)

**Skill**: `wp-analytics` (extended with Step 7: Signal Feed Generation)

The intelligence layer creates a feedback loop: analytics data → structured signals → actionable insights.

**Generating a signals feed**:
1. Run `wp-analytics` signal feed generation for a site
2. Step 7 collects data from GA4, GSC, Plausible, CWV tools
3. Calculates delta % vs previous period
4. Maps metrics to GenSignal NormalizedEvent format
5. Identifies anomalies (±30% threshold by default)
6. Matches 3 GenSignal patterns automatically
7. Writes `.content-state/signals-feed.md`

**Detectable patterns**:

| Pattern | Detection Source | Trigger |
|---------|-----------------|---------|
| Search Intent Shift | GSC queries | CTR ≥ +20% with stable position |
| Early-Adopter Surge | GA4 traffic sources | Single source ≥ +50% vs site < +20% |
| Hype→Utility Crossover | GA4 page metrics | Engagement ≥ +15% with bounce ≤ -10% |

**Acting on signals**:
- "Approfondisci con GenSignal" → Full SignalCard with scoring and next_actions
- "Crea brief dai segnali" → Auto-generate content briefs in pipeline-active/
- Signals feed topic suggestions → Editorial calendar (Phase 3)

**Signal feed file**: `.content-state/signals-feed.md` (overwritten each generation)
```

Note: The subsection numbering should follow whatever the last subsection is in the current GUIDE.md Content Framework section. Read the file first to determine the correct number.

**Step 3: Commit**

```bash
git add docs/GUIDE.md
git commit -m "docs: add Content Intelligence (Phase 2) section to GUIDE.md

Documents signal feed generation workflow, 3 detectable GenSignal
patterns, and integration with content pipeline and editorial calendar."
```

---

## Summary

| Task | Deliverable | Type |
|------|-------------|------|
| 1 | `signals-feed-schema.md` | Schema reference |
| 2 | `wp-analytics/SKILL.md` Step 7 extension | Skill modification |
| 3 | `.content-state/signals-feed.md` example | Test artifact (gitignored) |
| 4 | Architecture doc status update | Documentation |
| 5 | GUIDE.md Content Intelligence section | Documentation |

**Total new files**: 1 tracked + 1 gitignored instance
**Total modified files**: 3 (wp-analytics/SKILL.md, architecture doc, GUIDE.md)
**New TypeScript**: 0

**Acceptance Criteria (from architecture doc)**:
- [x] `signals-feed.schema.md` compatible with GenSignal NormalizedEvent → Task 1
- [x] `wp-analytics` extended with Step 7 → Task 2
- [x] Delta calculation working → Task 1 (rules) + Task 2 (workflow step 7.4)
- [x] At least 3 GenSignal patterns recognized → Task 1 (section F) + Task 2 (step 7.6)
- [ ] Flow tested: analytics → signals-feed.md → actionable insights → Manual test (post-implementation)
