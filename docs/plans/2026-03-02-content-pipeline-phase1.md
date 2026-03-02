# Content Pipeline Engine (Phase 1) — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create the content pipeline that connects Gen* skill output to WordPress publishing via structured MD files and a new orchestration skill.

**Architecture:** File-based pipeline using `.content-state/` directory with YAML-frontmatter MD files as configuration and state. A new `wp-content-pipeline` skill reads brief files and orchestrates existing MCP tools (create_content, assign_terms_to_content, sd_inject, li_create_post, etc.) to publish and distribute. Zero new TypeScript — all orchestration lives in skill prompts and MD schemas.

**Tech Stack:** Markdown + YAML frontmatter, Claude Code skill system, existing MCP tools (148 registered)

**Reference Docs:**
- Architecture: `docs/plans/2026-03-02-content-framework-architecture.md` (Sections 1.1–1.5)
- Strategic context: `docs/plans/2026-03-02-content-framework-strategic-reflections.md`
- Existing skill patterns: `skills/wp-content/SKILL.md`, `skills/wp-social-email/SKILL.md`

---

### Task 1: Create `.content-state/` Directory Structure

**Files:**
- Create: `.content-state/.gitkeep`
- Create: `.content-state/pipeline-active/.gitkeep`
- Create: `.content-state/pipeline-archive/.gitkeep`

**Step 1: Create the directory tree**

```bash
mkdir -p .content-state/pipeline-active .content-state/pipeline-archive
touch .content-state/.gitkeep .content-state/pipeline-active/.gitkeep .content-state/pipeline-archive/.gitkeep
```

**Step 2: Add `.content-state/` to `.gitignore` except structure**

Append to `.gitignore` (create if absent):

```gitignore
# Content Framework state — instance files are local, schemas are tracked
.content-state/*.config.md
.content-state/pipeline-active/*.brief.md
.content-state/pipeline-archive/
.content-state/signals-feed.md
.content-state/*-editorial.state.md
```

This keeps the directory structure tracked (via `.gitkeep`) but ignores instance data (briefs, configs, signals) which are site-specific.

**Step 3: Verify structure**

Run: `find .content-state -type f`

Expected:
```
.content-state/.gitkeep
.content-state/pipeline-active/.gitkeep
.content-state/pipeline-archive/.gitkeep
```

**Step 4: Commit**

```bash
git add .content-state/ .gitignore
git commit -m "feat(content-framework): create .content-state/ directory structure

Foundation for file-based content pipeline. Instance data (briefs,
configs, signals) gitignored — only directory skeleton tracked."
```

---

### Task 2: Create Content Brief Schema Reference

**Files:**
- Create: `skills/wp-content-pipeline/references/content-brief-schema.md`

**Step 1: Create the skill directory**

```bash
mkdir -p skills/wp-content-pipeline/references
```

**Step 2: Write the content brief schema**

Create `skills/wp-content-pipeline/references/content-brief-schema.md` with the complete schema documentation. This file defines the YAML frontmatter structure that every `.brief.md` file must follow.

The schema must include these sections:
- **Frontmatter fields** with types and defaults:
  - `brief_id` (string, required, format: `BRF-YYYY-NNN`)
  - `created` (ISO 8601, auto-generated)
  - `status` (enum: `draft | ready | published | archived`)
  - `source` block: `skill`, `domain`, `session_id`
  - `target` block: `site_id`, `content_type`, `status`, `scheduled_date`, `categories[]`, `tags[]`
  - `content` block: `title`, `excerpt`, `featured_image`, `author`
  - `distribution` block: `channels[]`, `adapt_format`, `schedule_offset_hours`
  - `seo` block: `focus_keyword`, `meta_description`, `schema_type`, `internal_links`
  - `gates` block: `seo_score_min`, `readability_min`, `require_review`
- **Status lifecycle**: `draft → ready → published → archived`
- **Example brief** with realistic values for mysite
- **Validation rules**: which fields are required vs optional, default values

Content body goes after the frontmatter `---` separator as standard Markdown.

**Step 3: Verify file exists and is valid markdown**

Run: `head -5 skills/wp-content-pipeline/references/content-brief-schema.md`

Expected: file exists with `# Content Brief Schema` header.

**Step 4: Commit**

```bash
git add skills/wp-content-pipeline/
git commit -m "feat(content-pipeline): add content brief schema reference

Defines the YAML frontmatter structure for .brief.md files — the
exchange format between Gen* skills and WordPress publishing."
```

---

### Task 3: Create Site Configuration Schema Reference

**Files:**
- Create: `skills/wp-content-pipeline/references/site-config-schema.md`

**Step 1: Write the site config schema**

Create `skills/wp-content-pipeline/references/site-config-schema.md` defining the structure for `{site_id}.config.md` files.

The schema must include:
- **Frontmatter fields**:
  - `site_id` (string, required, matches WP_SITES_CONFIG id)
  - `site_url` (URL string)
  - `last_updated` (ISO date)
  - `brand` block: `tone`, `language`, `style_notes` (multi-line)
  - `defaults` block: `content_type`, `status`, `categories[]`, `author`
  - `channels` block: per-channel config with `enabled`, `profile_id`/`audience_id`, `format`/`segment`
  - `seo` block: `default_schema`, `min_score`, `auto_internal_links`
  - `cadence` block: `posts_per_week`, `preferred_days[]`, `publish_time`
- **Body section**: free-form notes for Claude context
- **Example config** for mysite site
- **Integration notes**: how GenBrand output maps to `brand` block, how WP_SITES_CONFIG maps to `site_id`

**Step 2: Create an example instance file**

Create `.content-state/mysite.config.md` with realistic values for the mysite site. This serves as both documentation and working config.

Note: this file is gitignored (site-specific), but we create it as a template. Copy the example from the schema reference, filling in mysite-specific values.

**Step 3: Verify both files**

Run: `ls -la skills/wp-content-pipeline/references/site-config-schema.md .content-state/mysite.config.md`

Expected: both files exist.

**Step 4: Commit**

```bash
git add skills/wp-content-pipeline/references/site-config-schema.md
git commit -m "feat(content-pipeline): add site configuration schema

Defines {site_id}.config.md structure for brand voice, distribution
channels, SEO defaults, and content cadence per WordPress site."
```

Note: `.content-state/mysite.config.md` is gitignored, so only the schema is committed.

---

### Task 4: Create `wp-content-pipeline` SKILL.md

**Files:**
- Create: `skills/wp-content-pipeline/SKILL.md`

**Step 1: Write the skill definition**

Create `skills/wp-content-pipeline/SKILL.md` following the established pattern from other skills (see `skills/wp-content/SKILL.md` for format).

The skill must include:

**Header (frontmatter)**:
```yaml
---
name: wp-content-pipeline
description: This skill should be used when the user asks to "publish a brief",
  "process content briefs", "publish from GenCorpComm", "run the content pipeline",
  "create a brief", "list pending briefs", or mentions publishing Gen* output
  to WordPress. Orchestrates the flow from structured brief files through
  WordPress publishing and multi-channel distribution.
version: 1.0.0
---
```

**Sections to include**:

1. **Overview** — One paragraph explaining the pipeline concept (brief.md → WP publish → social distribute). Reference the `.content-state/` directory.

2. **When to Use** — Bullet list of trigger scenarios:
   - User has a content brief to publish
   - User ran GenCorpComm and wants to push output to WordPress
   - User asks to check/list pending briefs
   - User wants to create a new brief manually
   - User asks to distribute a published post to social channels

3. **Pipeline Workflow** — The 7-step flow:
   ```
   SCAN → CONFIG → VALIDATE → PUBLISH → DISTRIBUTE → UPDATE → ARCHIVE
   ```
   Each step documented with:
   - What it does
   - Which files/tools it reads
   - Decision points (e.g., if gates not met → stop and report)

4. **Step 1: SCAN** — Read `.content-state/pipeline-active/` for brief files with `status: ready`. List them to user with title, site_id, channels.

5. **Step 2: CONFIG** — Read `.content-state/{site_id}.config.md` for site defaults. Merge brief values with config defaults (brief values override config defaults).

6. **Step 3: VALIDATE** — Check quality gates:
   - If `gates.require_review: true` → stop, present brief to user
   - If SEO score/readability checks requested → note that these are evaluated by Claude based on content quality, not automated scoring tools
   - If validation fails → report to user, keep brief as `ready` for editing

7. **Step 4: PUBLISH** — Create WordPress content using existing MCP tools:
   ```
   create_content:
     content_type: target.content_type
     title: content.title
     content: [body from brief markdown]
     excerpt: content.excerpt
     status: target.status
     slug: [auto-generated from title]

   assign_terms_to_content:
     categories: target.categories
     tags: target.tags

   sd_inject (if seo.schema_type defined):
     schema_type: seo.schema_type
   ```

8. **Step 5: DISTRIBUTE** — If `distribution.channels` is not empty:
   - For each channel, check `site.config.md` channel config for enabled status
   - Use `wp-content-repurposing` skill patterns if `adapt_format: true`
   - Call appropriate MCP tools:
     - LinkedIn: `li_create_post`
     - Twitter: `tw_create_tweet` or `tw_create_thread`
     - Buffer: `buf_create_update`
     - Mailchimp: `mc_create_campaign` → `mc_set_campaign_content` → `mc_send_campaign`
   - Respect `schedule_offset_hours` for timing

9. **Step 6: UPDATE** — Update brief frontmatter:
   - `status: published`
   - Add `published_at`, `post_id`, `post_url` fields
   - Add `distribution_log` with channel results

10. **Step 7: ARCHIVE** — Move brief from `pipeline-active/` to `pipeline-archive/`

11. **Creating a Brief Manually** — Quick procedure:
    - Read site config for defaults
    - Generate `brief_id` as `BRF-YYYY-NNN` (NNN = sequential)
    - Write brief.md to `pipeline-active/` with `status: draft`
    - User fills in content, then sets `status: ready`

12. **Safety Rules**:
    - ALWAYS create WP content as `draft` first, then update to `publish` only after user confirmation (unless brief explicitly says `target.status: publish`)
    - NEVER publish without showing user the brief summary first
    - ALWAYS confirm before sending email campaigns (Mailchimp)
    - LOG all distribution actions in the brief

13. **Reference Files**:
    - `references/content-brief-schema.md`
    - `references/site-config-schema.md`

14. **Related Skills**:
    - `wp-content` — content creation and management
    - `wp-content-optimization` — SEO and readability enhancement
    - `wp-content-repurposing` — multi-format adaptation for distribution
    - `wp-social-email` — distribution channel tools (Mailchimp, Buffer, SendGrid)
    - `wp-structured-data` — Schema.org markup injection

**Step 2: Verify SKILL.md follows plugin conventions**

Run: `head -10 skills/wp-content-pipeline/SKILL.md`

Expected: YAML frontmatter with `name: wp-content-pipeline`.

Compare structure against: `head -10 skills/wp-content/SKILL.md`

Expected: same pattern (frontmatter → Overview → When to Use → Workflow).

**Step 3: Commit**

```bash
git add skills/wp-content-pipeline/SKILL.md
git commit -m "feat(content-pipeline): add wp-content-pipeline skill

Orchestrates brief.md → WP publish → social distribution using
existing MCP tools. 7-step workflow: SCAN → CONFIG → VALIDATE →
PUBLISH → DISTRIBUTE → UPDATE → ARCHIVE."
```

---

### Task 5: Create Example Brief for Testing

**Files:**
- Create: `.content-state/pipeline-active/BRF-2026-001.brief.md`

**Step 1: Write a realistic test brief**

Create `.content-state/pipeline-active/BRF-2026-001.brief.md` with:
- Frontmatter targeting mysite, content_type: post, status: draft
- Source: `manual` (not from Gen* — for testing without Gen* dependency)
- A short (~200 word) article about sparkling water benefits
- Distribution: linkedin only (minimal for testing)
- SEO: focus keyword set, schema_type: Article
- Gates: require_review: true (so pipeline stops for confirmation)

This brief serves as the integration test artifact. The pipeline skill will read it, present it to user, and (on approval) publish to mysite.

**Step 2: Verify brief parses correctly**

Run: `head -30 .content-state/pipeline-active/BRF-2026-001.brief.md`

Expected: valid YAML frontmatter with `brief_id: BRF-2026-001` and `status: draft`.

**Step 3: No commit** — this file is gitignored (instance data). It lives locally for testing.

---

### Task 6: Update Architecture Doc Status

**Files:**
- Modify: `docs/plans/2026-03-02-content-framework-architecture.md`

**Step 1: Update status and checklist**

In the architecture doc:
- Change `**Stato**: Proposta` to `**Stato**: Fase 1 Implementata`
- Check off all Fase 1 acceptance criteria:
  ```
  - [x] `content-brief.schema.md` definito e documentato
  - [x] `site.config.md` schema definito e documentato
  - [x] `wp-content-pipeline` skill creata con workflow completo
  - [ ] Flusso end-to-end testato: brief.md → WP post → distribuzione social
  - [x] Supporto multi-sito (mysite + almeno un altro)
  ```

Note: "Flusso end-to-end testato" left unchecked — that requires a live WP test which is a separate manual validation step.

**Step 2: Commit**

```bash
git add docs/plans/2026-03-02-content-framework-architecture.md
git commit -m "docs: update architecture status — Phase 1 implemented

Content Pipeline skill, schemas, and directory structure in place.
End-to-end live test pending."
```

---

### Task 7: Final Commit and Version Bump

**Files:**
- Modify: `docs/GUIDE.md` (add Content Framework section)

**Step 1: Add Content Framework section to GUIDE.md**

Read current `docs/GUIDE.md` to find the last section number. Add a new top-level section:

```markdown
## 15. Content Framework

The Content Framework connects Gen* ecosystem skills (GenCorpComm, GenMarketing, GenSignal) to WordPress publishing through structured Markdown files.

### 15.1 Architecture

The framework uses three types of MD files as configuration layer:

| Type | Suffix | Purpose | Location |
|------|--------|---------|----------|
| Schema | `.schema.md` | Template definition | `skills/wp-content-pipeline/references/` |
| Config | `.config.md` | Site-specific settings | `.content-state/{site_id}.config.md` |
| Brief | `.brief.md` | Content instance | `.content-state/pipeline-active/` |

### 15.2 Content Pipeline (Phase 1)

**Skill**: `wp-content-pipeline`

The pipeline orchestrates: `SCAN → CONFIG → VALIDATE → PUBLISH → DISTRIBUTE → UPDATE → ARCHIVE`

**Creating a brief**:
1. Generate content (via GenCorpComm or manually)
2. Save as `.content-state/pipeline-active/BRF-YYYY-NNN.brief.md`
3. Set frontmatter: site_id, title, categories, channels, SEO params
4. Set `status: ready` when content is finalized

**Publishing a brief**:
1. Invoke `wp-content-pipeline` skill
2. Pipeline reads all `status: ready` briefs
3. Validates quality gates
4. Creates WP post → distributes to channels → archives brief

**Site configuration**:
- One `.content-state/{site_id}.config.md` per managed site
- Defines brand voice, default categories, active channels, SEO settings
- Brief values override config defaults

### 15.3 Directory Structure

```
.content-state/
├── {site_id}.config.md          # site configuration
├── pipeline-active/             # briefs in progress
│   └── BRF-YYYY-NNN.brief.md
└── pipeline-archive/            # completed briefs
    └── BRF-YYYY-NNN.brief.md
```

### 15.4 Integration with Gen* Skills

| Gen* Skill | Produces | Pipeline Consumes |
|------------|----------|-------------------|
| GenCorpComm | Multi-format content | Body + metadata → brief.md |
| GenMarketing | Content calendar | Topics + dates → brief.md |
| GenBrand | Brand voice | Tone + style → config.md |
| GenSignal | Market signals | Topics → editorial planning (Phase 2) |
```

**Step 2: Commit all remaining changes**

```bash
git add docs/GUIDE.md
git commit -m "docs: add Content Framework section to GUIDE.md

Documents Phase 1 Content Pipeline: architecture, brief schema,
site config, publishing workflow, and Gen* integration points."
```

---

## Summary

| Task | Deliverable | Type |
|------|-------------|------|
| 1 | `.content-state/` directory + `.gitignore` | Infrastructure |
| 2 | `content-brief-schema.md` | Schema reference |
| 3 | `site-config-schema.md` + example config | Schema reference + instance |
| 4 | `wp-content-pipeline/SKILL.md` | Core skill |
| 5 | `BRF-2026-001.brief.md` | Test artifact |
| 6 | Architecture doc status update | Documentation |
| 7 | GUIDE.md Content Framework section | Documentation |

**Total new files**: 6 tracked + 2 gitignored instances
**Total modified files**: 3 (.gitignore, architecture doc, GUIDE.md)
**New TypeScript**: 0
