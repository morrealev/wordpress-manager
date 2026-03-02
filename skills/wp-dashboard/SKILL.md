---
name: wp-dashboard
description: This skill should be used when the user asks to "show dashboard",
  "show editorial status", "open kanban", "visualize content state",
  "show content overview", "mostra dashboard", "apri kanban", "stato editoriale",
  "dove siamo con i post", or wants a visual overview of the editorial pipeline.
  Generates a self-contained HTML Kanban board from .content-state/ files
  and opens it in the browser.
version: 1.0.0
---

# WordPress Dashboard Skill

## Overview

Generates a self-contained HTML Kanban dashboard from `.content-state/` files and opens it in the default browser. The dashboard provides a visual overview of the editorial pipeline — all content entries grouped by lifecycle status (planned, draft, ready, scheduled, published) — plus aggregate metrics and active signals.

The HTML file has zero external dependencies. It reads the same `.content-state/` files used by `wp-content-pipeline` and `wp-editorial-planner`, computes aggregate metrics, and renders a static report.

## When to Use

- User wants to see the overall editorial status before starting work
- User asks "dove siamo con i post?" or "show me the editorial status"
- User wants to share a visual overview with stakeholders
- Before a planning session (to identify gaps in the calendar)
- After a publishing session (to confirm progress)
- When investigating why content is stuck in a particular status

## Workflow

### Step 1: Determine Target Site

- If the user specifies a site → use it
- If only one `.config.md` exists in `.content-state/` → use that site automatically
- If multiple sites exist → ask the user which site to visualize

### Step 2: Determine Target Month

- Default: the most recent editorial calendar found in `.content-state/`
- If the user specifies a month → use `--month=YYYY-MM`

### Step 3: Generate Dashboard

Run the renderer script:

```bash
node scripts/dashboard-renderer.mjs --site={siteId}
```

Optional flags:
- `--month=YYYY-MM` — specific month
- `--output=/path/to/file.html` — custom output path
- `--no-open` — generate HTML without opening browser

The script will:
1. SCAN `.content-state/` files (config, calendar, briefs, signals)
2. AGGREGATE metrics (progress, pipeline counts, fill rate, next deadline)
3. RENDER self-contained HTML Kanban
4. Write to `.content-state/.dashboard-{site}-{month}.html`
5. Open in default browser

### Step 4: Report to User

After generation, report:
- File path and size
- Key metrics: posts published/target, pipeline status, signals count
- Suggest next actions based on what the dashboard reveals

## Reading the Dashboard

### Kanban Columns

| Column | Meaning | Next Action |
|--------|---------|-------------|
| **Planned** | Calendar slot exists, no brief yet. Grey cards may have no title. | Assign topics, create briefs → `wp-editorial-planner` BRIEF step |
| **Draft** | Brief created, content being written. | Fill brief content, then set `status: ready` |
| **Ready** | Content validated, waiting for scheduling. | Schedule to WordPress → `wp-editorial-planner` SCHEDULE step |
| **Scheduled** | WordPress future post created, waiting for publish date. | Wait, or run SYNC to check status |
| **Published** | Live on WordPress. Green border, shows WP post ID. | Distribute to channels → `wp-content-pipeline` DISTRIBUTE step |

### Card Elements

- **Date**: target publish date from the editorial calendar
- **Title**: content title (or `[da assegnare]` for unassigned slots)
- **Brief ID**: `BRF-YYYY-NNN` identifier linking to the brief file
- **WP #ID**: WordPress post ID (only for scheduled/published)
- **Channel badges**: colored pills showing distribution channels (in=LinkedIn, tw=Twitter, nl=Newsletter, bf=Buffer)

### Progress Bar

Shows `published / target` ratio. The target comes from the calendar's `goals.posts_target`.

### Signals Strip

Shows anomalies from `signals-feed.md` with delta percentage, entity, and suggested action. Only appears if signals data exists.

## Next Actions by Observation

| What You See | What To Do | Skill |
|-------------|------------|-------|
| Empty "Planned" slots | Assign topics from signals or strategy | `wp-editorial-planner` PLAN |
| Planned entries without briefs | Convert to briefs | `wp-editorial-planner` BRIEF |
| Many entries stuck in "Draft" | Fill content in brief files | Manual editing |
| "Ready" entries waiting | Schedule to WordPress | `wp-editorial-planner` SCHEDULE |
| "Scheduled" not moving to "Published" | Run sync check | `wp-editorial-planner` SYNC |
| High-delta signals | Investigate and create content | `wp-analytics`, `wp-search-console` |
| Low fill rate (<50%) | Plan more content | `wp-editorial-planner` PLAN |

## Safety Rules

- This skill is **read-only**: it reads `.content-state/` files but never modifies them
- The generated HTML is an ephemeral artifact — regenerate anytime for fresh data
- Dashboard files are gitignored (`.content-state/.dashboard-*.html`)
- No external network calls are made during generation

## Related Skills

- **`wp-editorial-planner`** — manages the editorial calendar that feeds the dashboard
- **`wp-content-pipeline`** — processes briefs shown in the Kanban cards
- **`wp-analytics`** — generates the signals feed shown in the signals strip
- **`wp-search-console`** — contributes search data to the signals feed
