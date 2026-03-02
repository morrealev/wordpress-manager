# Editorial Calendar Schema

Schema reference for `{YYYY-MM}-editorial.state.md` files -- the monthly editorial calendar format used by the `wp-editorial-planner` skill to plan, track, and synchronize content across the publishing lifecycle.

Each editorial calendar is a Markdown file with YAML frontmatter containing monthly goals and metadata, followed by weekly Markdown tables for content planning. Each table row represents a content entry that progresses through a five-stage status lifecycle and bridges to Phase 1 briefs (`.brief.md` files in the content pipeline) and Phase 2 signals (from the signals intelligence feed).

---

## File Format

Each `{YYYY-MM}-editorial.state.md` file consists of:

1. **YAML frontmatter** between `---` delimiters (monthly goals, metadata, SEO targets)
2. **Markdown body** with weekly table sections, one per week of the month

```
---
calendar_id: "CAL-2026-03"
site_id: mysite
# ... other fields ...
---

# Piano Editoriale — Marzo 2026

## Settimana 1 (1-7 Mar)

| Data | Titolo | Tipo | Status | Brief ID | Post ID | Canali |
|------|--------|------|--------|----------|---------|--------|
| Mar 4 | Article title here | post | planned | — | — | — |
```

---

## Frontmatter Fields

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `calendar_id` | `string` | **Yes** | -- | Unique calendar identifier. Format: `CAL-YYYY-MM` |
| `site_id` | `string` | **Yes** | -- | WordPress site identifier. Must match an existing `.content-state/{site_id}.config.md` |
| `period` | `string` | **Yes** | -- | Date range the calendar covers. Format: `YYYY-MM-DD..YYYY-MM-DD` (month boundaries) |
| `created` | `string` (ISO 8601) | **Yes** | -- | Date the calendar was first created |
| `last_updated` | `string` (ISO 8601) | **Yes** | -- | Auto-updated on each modification |
| `status` | `enum` | No | `active` | Calendar status: `active` \| `archived` |
| `goals.posts_target` | `integer` | **Yes** | -- | Total posts planned for the month |
| `goals.posts_published` | `integer` | No | `0` | Counter updated by SYNC step |
| `goals.focus_topics` | `string[]` | No | `[]` | Topic clusters to prioritize this month |
| `goals.seo_targets` | `object[]` | No | `[]` | Each object: `{keyword, target_position}` |

### `goals.seo_targets` object fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `keyword` | `string` | **Yes** | Target keyword or keyphrase |
| `target_position` | `string` | **Yes** | SERP target: `top-3`, `top-5`, `top-10`, `top-20` |

---

## Weekly Table Structure

The body contains one `## Settimana N (date range)` section per week of the month. Each section contains a single Markdown table with 7 columns:

| Column | Type | Description |
|--------|------|-------------|
| Data | `date` | Planned publication date. Format: `Mon DD` (e.g., `Mar 4`) |
| Titolo | `string` | Content title, or `[da assegnare]` if not yet defined |
| Tipo | `enum` | WordPress content type: `post` \| `page` \| `custom_type` |
| Status | `enum` | Entry lifecycle status: `planned` \| `draft` \| `ready` \| `scheduled` \| `published` |
| Brief ID | `string` | Reference to `.brief.md` file. Format: `BRF-YYYY-NNN`, or `—` if not yet created |
| Post ID | `integer` | WordPress post ID after creation, or `—` if not yet created |
| Canali | `string` | Comma-separated distribution channels (e.g., `linkedin, newsletter`), or `—` |

**Notes:**
- Each week section covers 7 calendar days
- The final week of the month may extend beyond 7 days to cover the remaining days (e.g., `Settimana 4 (22-31 Mar)`)
- Table headers must be repeated in every weekly section
- The `—` character (em dash, U+2014) is used as the null/empty marker

---

## Entry Status Lifecycle

Calendar entries progress through a linear five-stage lifecycle:

```
planned → draft → ready → scheduled → published
```

| Status | Description | Calendar state | Brief state |
|--------|-------------|----------------|-------------|
| `planned` | Slot reserved in the calendar. Title may be `[da assegnare]` | Entry exists in weekly table | No brief file yet |
| `draft` | Title assigned, brief created | Title is final | Brief in `pipeline-active/` with `status: draft` |
| `ready` | Brief content finalized, quality gates passed | No change | Brief in `pipeline-active/` with `status: ready` |
| `scheduled` | WordPress post created with future publication date | Post ID populated | Brief `target.status: future` |
| `published` | WordPress post is live, confirmed by SYNC step | Post ID present, status updated | Brief moves to `pipeline-archive/` |

**Transition rules:**
- `planned` -> `draft`: Requires a final title and Brief ID assignment
- `draft` -> `ready`: Requires brief quality gates to pass (see `gates` block in content-brief-schema)
- `ready` -> `scheduled`: Requires successful WordPress API call creating a post with `status: future`
- `scheduled` -> `published`: Confirmed by the SYNC step when WordPress reports `post_status: publish`

---

## Integration with Phase 1 (Content Pipeline)

The editorial calendar bridges directly to the content pipeline's brief system:

- Each calendar entry with a Brief ID references a file at `.content-state/pipeline-active/BRF-YYYY-NNN.brief.md`
- When the BRIEF step creates a new brief, it uses the site config defaults from `.content-state/{site_id}.config.md`
- The brief's `target.scheduled_date` is set from the calendar entry's **Data** column
- The brief's `distribution.channels` is set from the calendar entry's **Canali** column
- When `wp-content-pipeline` archives a brief (`status: published`), the SYNC step updates the calendar entry accordingly

### Data flow: Calendar -> Brief

| Calendar column | Brief field | Notes |
|-----------------|-------------|-------|
| Data | `target.scheduled_date` | Converted to ISO 8601 with site default publish time |
| Titolo | `content.title` | Exact match |
| Tipo | `target.content_type` | Direct mapping |
| Canali | `distribution.channels` | Comma-separated string parsed to array |
| (site_id from frontmatter) | `target.site_id` | Inherited from calendar |

---

## Integration with Phase 2 (Signals Intelligence)

The editorial calendar consumes signals intelligence data to inform content planning:

- The PLAN step can read `.content-state/signals-feed.md` to suggest topics for `[da assegnare]` entries
- Anomalies from the signals feed with action containing "content cluster opportunity" are prime candidates for planned entries
- The `goals.focus_topics` field can be informed by high-scoring signal patterns

### Signal-to-calendar workflow

1. SCAN step generates `.content-state/signals-feed.md` with scored anomalies
2. PLAN step reads the signals feed and identifies actionable opportunities
3. Opportunities map to `[da assegnare]` slots in the current or next month's calendar
4. When a topic is assigned, the entry title is updated and a `[da assegnare — topic da signals]` annotation may be used as an intermediate step

---

## Notes Section

The body may end with a `# Note` section containing free-form editorial notes.

Common uses:
- **Newsletter aggregation rules**: How posts are grouped for newsletter distribution (e.g., biweekly digest)
- **Distribution timing preferences**: When posts should be distributed on specific channels (e.g., LinkedIn at 09:00)
- **Topic dependencies on signals data**: Which `[da assegnare]` slots depend on future signals analysis
- **Cross-calendar references**: Links to related months or seasonal content plans
- **Team coordination notes**: Reviewer assignments, approval deadlines

---

## File Naming Convention

Editorial calendar files follow this naming pattern:

```
{YYYY-MM}-editorial.state.md
```

Examples:
- `2026-03-editorial.state.md`
- `2026-04-editorial.state.md`

Files are stored in:
- **Location**: `.content-state/` directory at the project root
- **One file per month per site**: The `site_id` is stored in the frontmatter, not the filename
- **Previous months**: Calendars for past months remain in `.content-state/` with `status: archived`
- **Gitignored**: Calendar files are site-specific instance data and should be listed in `.gitignore`

---

## Example Calendar

A complete `2026-03-editorial.state.md` for the mysite site:

```markdown
---
calendar_id: "CAL-2026-03"
site_id: mysite
period: "2026-03-01..2026-03-31"
created: "2026-02-28"
last_updated: "2026-03-02"
status: active

goals:
  posts_target: 8
  posts_published: 2
  focus_topics: [premium-water, sustainability, wellness]
  seo_targets:
    - keyword: "acqua premium"
      target_position: top-5
    - keyword: "bevanda zero calorie naturale"
      target_position: top-10
---

# Piano Editoriale — Marzo 2026

## Settimana 1 (1-7 Mar)

| Data | Titolo | Tipo | Status | Brief ID | Post ID | Canali |
|------|--------|------|--------|----------|---------|--------|
| Mar 4 | Acqua premium: 5 benefici scientifici | post | published | BRF-2026-001 | 1234 | linkedin, newsletter |
| Mar 6 | Come il frutto mediterraneo diventa bevanda | post | published | BRF-2026-002 | 1235 | linkedin, twitter |

## Settimana 2 (8-14 Mar)

| Data | Titolo | Tipo | Status | Brief ID | Post ID | Canali |
|------|--------|------|--------|----------|---------|--------|
| Mar 11 | Zero calorie, tutto gusto: la scienza | post | ready | BRF-2026-003 | — | linkedin, newsletter |
| Mar 13 | Mediterraneo e sostenibilità: la filiera | post | draft | BRF-2026-004 | — | linkedin |

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

---

## Validation Rules

The following rules are enforced when reading and writing editorial calendar files:

### Format validations

| Rule | Description |
|------|-------------|
| `calendar_id` format | Must follow `CAL-YYYY-MM` pattern (e.g., `CAL-2026-03`) |
| `site_id` existence | Must match an existing `.content-state/{site_id}.config.md` file |
| `period` span | Must span exactly one calendar month (`YYYY-MM-DD..YYYY-MM-DD`) |
| Table columns | Each weekly table must have all 7 columns: Data, Titolo, Tipo, Status, Brief ID, Post ID, Canali |

### Field validations

| Rule | Description |
|------|-------------|
| `Status` values | Must be one of: `planned`, `draft`, `ready`, `scheduled`, `published` |
| `Brief ID` format | Must follow `BRF-YYYY-NNN` pattern when present (not `—`) |
| `Post ID` type | Must be a positive integer when present (not `—`) |

### Consistency validations

| Rule | Description |
|------|-------------|
| Published count | `goals.posts_published` must not exceed `goals.posts_target` |
| Scheduled requires Post ID | Entries with `status: scheduled` must have a Post ID (not `—`) |
| Published requires Post ID | Entries with `status: published` must have a Post ID (not `—`) |
| Draft requires Brief ID | Entries with `status: draft` or higher must have a Brief ID (not `—`) |
| Planned allows empty | Entries with `status: planned` may have `—` for Brief ID, Post ID, and Canali |
