# Editorial Calendar & Content Planner (Phase 3) — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enable strategic content planning over time with a monthly editorial calendar file that integrates with Phase 1 (content pipeline) and Phase 2 (signals intelligence) to convert planned entries into scheduled WordPress posts.

**Architecture:** A new `wp-editorial-planner` skill reads `.content-state/{YYYY-MM}-editorial.state.md` files and orchestrates a 4-step workflow: PLAN → BRIEF → SCHEDULE → SYNC. The calendar file uses Markdown tables (one per week) with YAML frontmatter for monthly goals and SEO targets. Calendar entries flow into `wp-content-pipeline` (Phase 1) as briefs and can be informed by `signals-feed.md` (Phase 2) for topic suggestions. Zero new TypeScript — all orchestration lives in skill prompts and MD schemas.

**Tech Stack:** Markdown + YAML frontmatter, Claude Code skill system, existing MCP tools (`create_content`, `list_content`, `buf_create_update`, `mc_create_campaign`)

**Reference Docs:**
- Architecture: `docs/plans/2026-03-02-content-framework-architecture.md` (Sections 3.1–3.4)
- Phase 1 skill: `skills/wp-content-pipeline/SKILL.md` (brief format, publishing workflow)
- Phase 1 schemas: `skills/wp-content-pipeline/references/content-brief-schema.md`, `skills/wp-content-pipeline/references/site-config-schema.md`
- Phase 2 schema: `skills/wp-analytics/references/signals-feed-schema.md` (anomalies → topic suggestions)
- Existing skill pattern: `skills/wp-analytics/SKILL.md` (for SKILL.md structure reference)

---

### Task 1: Create Editorial Calendar Schema Reference

**Files:**
- Create: `skills/wp-editorial-planner/references/editorial-schema.md`

**Step 1: Create the skill directory**

```bash
mkdir -p skills/wp-editorial-planner/references
```

**Step 2: Write the editorial calendar schema**

Create `skills/wp-editorial-planner/references/editorial-schema.md` with complete schema documentation. This file defines the YAML frontmatter and Markdown table structure for `{YYYY-MM}-editorial.state.md` files.

The schema must include these sections:

**A. Overview** — One paragraph: the editorial calendar is a monthly Markdown file with YAML frontmatter for goals/metadata and weekly Markdown tables for content planning. Each table row represents a content entry that progresses through statuses and bridges to Phase 1 briefs and Phase 2 signals.

**B. Frontmatter fields** with types, required/optional, and defaults:

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `calendar_id` | string | Yes | — | Format: `CAL-YYYY-MM` |
| `site_id` | string | Yes | — | Must match `.content-state/{site_id}.config.md` |
| `period` | string | Yes | — | Format: `YYYY-MM-DD..YYYY-MM-DD` (month boundaries) |
| `created` | ISO 8601 date | Yes | — | Date the calendar was first created |
| `last_updated` | ISO 8601 date | Yes | — | Auto-updated on each modification |
| `status` | enum | No | active | `active \| archived` |
| `goals.posts_target` | integer | Yes | — | Total posts planned for the month |
| `goals.posts_published` | integer | No | 0 | Counter updated by SYNC step |
| `goals.focus_topics` | string[] | No | [] | Topic clusters to prioritize |
| `goals.seo_targets` | object[] | No | [] | Each: `{keyword, target_position}` |

**C. Weekly table structure** — The body contains one `## Settimana N (date range)` section per week, each with a Markdown table:

| Column | Type | Description |
|--------|------|-------------|
| Data | date | Planned publication date (format: `Mon DD`) |
| Titolo | string | Content title, or `[da assegnare]` if not yet defined |
| Tipo | enum | `post \| page \| custom_type` |
| Status | enum | `planned \| draft \| ready \| scheduled \| published` |
| Brief ID | string | Reference to `.brief.md` file (format: `BRF-YYYY-NNN`), or `—` |
| Post ID | integer | WordPress post ID after creation, or `—` |
| Canali | string | Comma-separated distribution channels, or `—` |

**D. Entry status lifecycle:**

```
planned → draft → ready → scheduled → published
```

- `planned`: Slot reserved, title may be `[da assegnare]`
- `draft`: Title assigned, brief created in `pipeline-active/` with `status: draft`
- `ready`: Brief content finalized, `status: ready` in brief file
- `scheduled`: WordPress post created with `status: future` and scheduled date
- `published`: WordPress post is live (confirmed by SYNC step)

**E. Integration with Phase 1 (Content Pipeline):**
- Each calendar entry with a Brief ID references a file in `.content-state/pipeline-active/BRF-YYYY-NNN.brief.md`
- When BRIEF step creates a new brief, it uses the site config defaults from `.content-state/{site_id}.config.md`
- The brief's `target.scheduled_date` is set from the calendar entry's Data column
- The brief's `distribution.channels` is set from the calendar entry's Canali column
- When `wp-content-pipeline` archives a brief (status: published), the SYNC step updates the calendar entry accordingly

**F. Integration with Phase 2 (Signals Intelligence):**
- The PLAN step can read `.content-state/signals-feed.md` to suggest topics for `[da assegnare]` entries
- Anomalies from the signals feed with action "Investigate: content cluster opportunity" are prime candidates for planned entries
- The `goals.focus_topics` field can be informed by high-scoring signal patterns

**G. Notes section:**
- The body may end with a `# Note` section containing free-form editorial notes
- Common uses: newsletter aggregation rules, distribution timing preferences, topic dependencies on signals data

**H. File naming convention:**
- Format: `.content-state/{YYYY-MM}-editorial.state.md`
- One file per month per site (the `site_id` is in the frontmatter, not the filename)
- Previous months' calendars remain in `.content-state/` with `status: archived`
- Files are gitignored (site-specific instance data)

**I. Example calendar** — A complete, realistic example for mysite March 2026 with:
- Frontmatter: calendar_id CAL-2026-03, 8 posts target, 2 published, focus topics, 2 SEO targets
- 4 weekly tables with mixed statuses (published, ready, draft, planned)
- `[da assegnare]` entries for weeks 3-4
- Notes section referencing signals-feed.md and newsletter/LinkedIn timing

Use the exact example from the architecture doc (section 3.2).

**J. Validation rules:**
- `calendar_id` must follow `CAL-YYYY-MM` format
- `site_id` must match an existing `.content-state/{site_id}.config.md`
- `period` must span exactly one calendar month
- Each table must have all 7 columns
- `Status` must be one of the 5 valid values
- `Brief ID` must follow `BRF-YYYY-NNN` format when present
- `Post ID` must be a positive integer when present
- `goals.posts_published` must not exceed `goals.posts_target`
- Entries with `status: scheduled` or `status: published` must have a Post ID

**Step 3: Verify file exists**

Run: `head -5 skills/wp-editorial-planner/references/editorial-schema.md`

Expected: `# Editorial Calendar Schema` header.

**Step 4: Commit**

```bash
git add skills/wp-editorial-planner/
git commit -m "feat(editorial-calendar): add editorial calendar schema reference

Defines {YYYY-MM}-editorial.state.md structure with monthly goals,
weekly Markdown tables, 5-status lifecycle (planned → published),
and integration with Phase 1 briefs and Phase 2 signals feed."
```

---

### Task 2: Create `wp-editorial-planner` SKILL.md

**Files:**
- Create: `skills/wp-editorial-planner/SKILL.md`

**Step 1: Write the skill definition**

Create `skills/wp-editorial-planner/SKILL.md` following the established pattern from `skills/wp-content-pipeline/SKILL.md` and `skills/wp-analytics/SKILL.md`.

**Header (frontmatter):**
```yaml
---
name: wp-editorial-planner
description: This skill should be used when the user asks to "create an editorial
  plan", "update the calendar", "schedule posts", "plan content for March",
  "convert calendar to briefs", "sync calendar with WordPress", "show editorial
  status", or mentions planning content over time. Orchestrates monthly editorial
  calendars that bridge signals intelligence to content publishing.
version: 1.0.0
---
```

**Sections to include:**

1. **Overview** — One paragraph: the editorial planner manages monthly content calendars as `.state.md` files. It reads site config for cadence, optionally consumes signals feed for topic ideas, and produces briefs that flow into the content pipeline. Four-step workflow: PLAN → BRIEF → SCHEDULE → SYNC.

2. **When to Use** — Bullet list:
   - User wants to create a new monthly editorial plan
   - User asks to update or view the current calendar
   - User wants to convert planned entries into content briefs
   - User asks to schedule ready briefs as WordPress future posts
   - User wants to sync WordPress publish status back to the calendar
   - User mentions "piano editoriale", "calendario", "schedula"

3. **Workflow Overview:**
   ```
   PLAN → BRIEF → SCHEDULE → SYNC
   ```

4. **Step 1: PLAN — Create or update editorial calendar**

   **When to run**: User asks to create a new plan or update existing one.

   **Procedure:**
   1. Read `.content-state/{site_id}.config.md` for:
      - `cadence.posts_per_week` → calculate `goals.posts_target` (posts_per_week × weeks in month)
      - `cadence.preferred_days` → determine which days to assign entries
      - `cadence.publish_time` → note for scheduling step
      - `defaults.categories`, `defaults.content_type` → pre-fill entry Tipo
   2. Read `.content-state/signals-feed.md` if it exists:
      - Extract anomalies with action containing "content cluster" or "Investigate"
      - Suggest these as topics for `[da assegnare]` entries
      - Present suggestions to user for approval
   3. Optionally: if user wants strategic planning, suggest invoking GenMarketing for content calendar strategy
   4. Generate or update `.content-state/{YYYY-MM}-editorial.state.md`:
      - Create YAML frontmatter with calendar_id, site_id, period, goals
      - Create weekly tables with one row per preferred_day
      - Fill known titles, leave others as `[da assegnare]`
      - Set all new entries as `status: planned`
   5. Present the calendar to user for review

   **Safety rules:**
   - ALWAYS show the generated calendar to user before writing
   - If a calendar for the month already exists, show diff and ask before overwriting
   - Preserve existing entries that have `status: draft` or higher (don't reset them to planned)

5. **Step 2: BRIEF — Convert calendar entries to brief files**

   **When to run**: User asks to "create briefs from calendar" or "convert planned entries to briefs".

   **Procedure:**
   1. Read the current editorial calendar `.state.md`
   2. For each entry with `status: planned` AND a defined title (not `[da assegnare]`):
      a. Generate a new `brief_id` as `BRF-YYYY-NNN` (sequential, check existing briefs)
      b. Read `.content-state/{site_id}.config.md` for defaults
      c. Create `.content-state/pipeline-active/{brief_id}.brief.md` with:
         - `source.skill: wp-editorial-planner`
         - `source.domain: editorial-calendar`
         - `target.site_id`: from calendar
         - `target.content_type`: from entry Tipo column
         - `target.scheduled_date`: from entry Data column (convert to ISO 8601)
         - `target.categories`: from site config defaults
         - `distribution.channels`: from entry Canali column (parse comma-separated)
         - `content.title`: from entry Titolo column
         - `status: draft` (brief starts as draft, user fills content)
      d. Update calendar entry: `status: planned → draft`, set Brief ID
   3. For entries with existing Brief ID (already has a brief): skip creation, just verify brief file exists
   4. Write updated calendar back to `.state.md`
   5. Report: "N brief creati in pipeline-active/. Compila il contenuto e imposta status: ready."

   **Safety rules:**
   - NEVER create briefs for entries with `[da assegnare]` title — report them as needing titles first
   - NEVER overwrite existing brief files — if Brief ID already exists, skip and report
   - Show summary of briefs to be created and ask user confirmation before writing

6. **Step 3: SCHEDULE — Convert ready briefs to WordPress scheduled posts**

   **When to run**: User asks to "schedule ready posts" or "schedula i post pronti".

   **Procedure:**
   1. Read the current editorial calendar `.state.md`
   2. For each entry with `status: ready`:
      a. Read the corresponding brief file from `pipeline-active/{brief_id}.brief.md`
      b. Verify brief has `status: ready` (consistency check)
      c. Create WordPress post:
         ```
         create_content:
           content_type: {entry.Tipo}
           title: {brief.content.title}
           content: {brief body markdown}
           excerpt: {brief.content.excerpt}
           status: "future"
           date: {entry.Data as ISO 8601 datetime with site config publish_time}
           slug: {auto-generated from title}
         ```
      d. Assign taxonomy terms:
         ```
         assign_terms_to_content:
           content_type: {entry.Tipo}
           id: {post_id}
           categories: {brief.target.categories}
           tags: {brief.target.tags}
         ```
      e. Update calendar entry: `status: ready → scheduled`, set Post ID
      f. Update brief: add `post_id` and `post_url` to frontmatter
   3. If entry has `distribution.channels` (from Canali column):
      - Compute `scheduled_at` using the entry date + `config.cadence.publish_time` + `distribution.schedule_offset_hours`
      - For Buffer: `buf_create_update` with `scheduled_at`
      - For Mailchimp: note for manual campaign creation (not auto-scheduled)
   4. Write updated calendar back to `.state.md`
   5. Report: "N post schedulati su WordPress. Verranno pubblicati automaticamente alla data prevista."

   **Safety rules:**
   - ALWAYS create WP post as `status: future` (never directly `publish`)
   - ALWAYS confirm with user before scheduling, showing the list of posts and dates
   - If `create_content` fails → stop, report error, keep entry as `ready`
   - Verify the scheduled date is in the future before calling `create_content`

7. **Step 4: SYNC — Synchronize WordPress status back to calendar**

   **When to run**: User asks to "sync calendar" or "aggiorna stato calendario".

   **Procedure:**
   1. Read the current editorial calendar `.state.md`
   2. For each entry with a Post ID (status: scheduled or published):
      a. Call `list_content` with content_type and filter by post ID:
         ```
         list_content:
           content_type: {entry.Tipo}
           search: {post_id}
           per_page: 1
         ```
      b. Check the returned post status:
         - If WP status = `publish` and calendar status = `scheduled` → update to `published`
         - If WP status = `future` → keep as `scheduled`
         - If WP status = `draft` → note: post was reverted, update calendar to `draft`
         - If WP status = `trash` → note: post was deleted, report to user
   3. Recalculate `goals.posts_published` = count of entries with `status: published`
   4. Write updated calendar back to `.state.md`
   5. Report:
      ```
      Sync calendario {calendar_id}:
      - Post pubblicati: {posts_published}/{posts_target}
      - Post schedulati: {scheduled_count}
      - Post in lavorazione: {draft_count + ready_count}
      - Slot da assegnare: {planned_count}
      ```

   **Safety rules:**
   - NEVER modify WordPress post status during sync — sync is read-only from WP
   - If a post was deleted/trashed, report to user but don't remove the calendar entry (mark with a note)

8. **Creating a Calendar Manually** — Quick procedure for users:
   - Copy structure from schema reference example
   - Fill in site_id, dates, and known titles
   - Set `status: planned` for all entries
   - Then run BRIEF step to generate brief files

9. **Safety Rules Summary:**
   - ALWAYS show calendar/briefs to user before writing
   - ALWAYS create WP posts as `status: future` (never `publish` directly)
   - NEVER overwrite existing briefs or calendar entries with higher status
   - NEVER modify WP posts during SYNC (read-only)
   - ALWAYS confirm before scheduling posts
   - LOG all scheduling actions in the calendar

10. **Reference Files:**
    - `references/editorial-schema.md`
    - `../wp-content-pipeline/references/content-brief-schema.md` (brief format)
    - `../wp-content-pipeline/references/site-config-schema.md` (site defaults)
    - `../wp-analytics/references/signals-feed-schema.md` (topic suggestions)

11. **Related Skills:**
    - `wp-content-pipeline` — publishes briefs created by the BRIEF step
    - `wp-analytics` — generates signals feed consumed by the PLAN step
    - `wp-content` — content creation and management (provides `create_content`, `list_content`)
    - `wp-social-email` — distribution channel scheduling (Buffer, Mailchimp)
    - `wp-content-repurposing` — multi-format adaptation for social distribution

**Step 2: Verify SKILL.md follows plugin conventions**

Run: `head -10 skills/wp-editorial-planner/SKILL.md`

Expected: YAML frontmatter with `name: wp-editorial-planner`.

**Step 3: Commit**

```bash
git add skills/wp-editorial-planner/SKILL.md
git commit -m "feat(editorial-calendar): add wp-editorial-planner skill

Orchestrates monthly editorial calendars with 4-step workflow:
PLAN (create calendar from config + signals) → BRIEF (convert entries
to pipeline briefs) → SCHEDULE (create WP future posts) → SYNC
(bidirectional status update from WordPress)."
```

---

### Task 3: Create Example Editorial Calendar Instance

**Files:**
- Create: `.content-state/2026-03-editorial.state.md`

**Step 1: Write a realistic test calendar**

Create `.content-state/2026-03-editorial.state.md` with the exact example from the architecture doc (section 3.2):

- Frontmatter: calendar_id CAL-2026-03, site_id mysite, period 2026-03-01..2026-03-31, 8 posts target, 2 published, focus topics, 2 SEO targets
- 4 weekly tables with realistic mysite content:
  - Week 1: 2 published entries with brief IDs and post IDs
  - Week 2: 1 ready + 1 draft entry with brief IDs
  - Week 3: 2 planned entries with `[da assegnare]`
  - Week 4: 2 planned entries with `[da assegnare]`
- Notes section: signals-feed reference for weeks 3-4, newsletter timing, LinkedIn timing

**Step 2: Verify calendar structure**

Run: `head -15 .content-state/2026-03-editorial.state.md`

Expected: YAML frontmatter with `calendar_id: "CAL-2026-03"` and `status: active`.

**Step 3: No commit** — this file is gitignored (instance data).

---

### Task 4: Update Architecture Doc Status

**Files:**
- Modify: `docs/plans/2026-03-02-content-framework-architecture.md`

**Step 1: Update status and checklist**

- Change `**Stato**: Fase 2 Implementata` to `**Stato**: Fase 3 Implementata`
- Check off Phase 3 acceptance criteria:
  ```markdown
  ### Fase 3: Editorial Calendar

  - [x] `editorial.schema.md` definito con tabelle settimanali
  - [x] `wp-editorial-planner` skill creata con 4 workflow steps
  - [x] Conversione calendar entry → brief automatica
  - [x] Scheduling WP post con status=future funzionante
  - [ ] Sync bidirezionale: WP publish status → calendar update
  ```

Note: "Sync bidirezionale" left unchecked — requires a live WP test with actual scheduled/published posts, same as previous phases' e2e tests.

**Step 2: Commit**

```bash
git add docs/plans/2026-03-02-content-framework-architecture.md
git commit -m "docs: update architecture status — Phase 3 implemented

Editorial calendar schema, wp-editorial-planner skill with 4-step
workflow (PLAN → BRIEF → SCHEDULE → SYNC) in place. Live sync test
pending."
```

---

### Task 5: Update GUIDE.md with Phase 3 Documentation

**Files:**
- Modify: `docs/GUIDE.md`

**Step 1: Read current Content Framework section**

Find the last subsection in the Content Framework section (should be 17.5 from Phase 2).

**Step 2: Add Editorial Calendar subsection**

After the Phase 2 subsection, add:

```markdown
### 17.6 Editorial Calendar (Phase 3)

**Skill**: `wp-editorial-planner`

The editorial planner manages monthly content calendars as `.state.md` files, bridging strategic planning to tactical execution.

**Workflow**: `PLAN → BRIEF → SCHEDULE → SYNC`

| Step | Action | Input | Output |
|------|--------|-------|--------|
| PLAN | Create monthly calendar | site config + signals feed | `{YYYY-MM}-editorial.state.md` |
| BRIEF | Convert entries to briefs | calendar entries | `pipeline-active/BRF-*.brief.md` |
| SCHEDULE | Create WP future posts | ready briefs | WordPress posts with `status: future` |
| SYNC | Update calendar from WP | WordPress post status | Updated calendar entries |

**Calendar structure**:
- One `.content-state/{YYYY-MM}-editorial.state.md` per month
- YAML frontmatter: monthly goals, posts target, focus topics, SEO targets
- Markdown tables: one per week with columns Data, Titolo, Tipo, Status, Brief ID, Post ID, Canali

**Entry lifecycle**: `planned → draft → ready → scheduled → published`

**Cross-phase integration**:
- Phase 2 signals → topic suggestions for `[da assegnare]` entries
- Calendar entries → Phase 1 briefs → WordPress publishing pipeline
```

**Step 3: Commit**

```bash
git add docs/GUIDE.md
git commit -m "docs: add Editorial Calendar (Phase 3) section to GUIDE.md

Documents the 4-step editorial planning workflow, calendar structure,
entry lifecycle, and cross-phase integration with signals and pipeline."
```

---

## Summary

| Task | Deliverable | Type |
|------|-------------|------|
| 1 | `editorial-schema.md` | Schema reference |
| 2 | `wp-editorial-planner/SKILL.md` | Core skill (new) |
| 3 | `2026-03-editorial.state.md` | Test artifact (gitignored) |
| 4 | Architecture doc status update | Documentation |
| 5 | GUIDE.md Editorial Calendar section | Documentation |

**Total new files**: 2 tracked + 1 gitignored instance
**Total modified files**: 2 (architecture doc, GUIDE.md)
**New TypeScript**: 0

**Acceptance Criteria (from architecture doc):**
- [x] `editorial.schema.md` defined with weekly tables → Task 1
- [x] `wp-editorial-planner` skill with 4 workflow steps → Task 2
- [x] Calendar entry → brief automatic conversion → Task 2 (Step 2: BRIEF)
- [x] WP scheduling with status=future → Task 2 (Step 3: SCHEDULE)
- [ ] Bidirectional sync: WP publish status → calendar update → Manual test (post-implementation)
