---
name: wp-content-pipeline
description: This skill should be used when the user asks to "publish a brief",
  "process content briefs", "publish from GenCorpComm", "run the content pipeline",
  "create a brief", "list pending briefs", or mentions publishing Gen* output
  to WordPress. Orchestrates the flow from structured brief files through
  WordPress publishing and multi-channel distribution.
version: 1.0.0
---

# WordPress Content Pipeline Skill

## Overview

The content pipeline orchestrates a structured workflow from content brief files (`.brief.md`) through WordPress publishing and multi-channel distribution. Briefs are authored by Gen* skills (GenCorpComm, GenMarketing, GenSignal, GenBrand) or created manually, then placed in `.content-state/pipeline-active/` for processing. The pipeline reads each brief's frontmatter, merges it with site configuration defaults, validates quality gates, publishes to WordPress via MCP tools, distributes to social and email channels, and archives the completed brief. All state is tracked in the `.content-state/` directory.

## When to Use

- User has a content brief to publish to WordPress
- User ran GenCorpComm (or another Gen* skill) and wants to push output to WordPress
- User asks to check, list, or review pending briefs
- User wants to create a new brief manually
- User asks to distribute a published post to social channels
- User mentions "content pipeline", "brief pipeline", or "publish from brief"

## Pipeline Workflow

```
SCAN → CONFIG → VALIDATE → PUBLISH → DISTRIBUTE → UPDATE → ARCHIVE
```

Each step reads specific files, calls specific tools, and has defined decision points. If any step fails or requires user input, the pipeline stops and reports status -- it never silently skips steps.

---

## Step 1: SCAN

**What it does:** Discovers brief files that are ready for processing.

**Files read:**
- `.content-state/pipeline-active/*.brief.md` -- all brief files in the active directory

**Procedure:**
1. List all `.brief.md` files in `.content-state/pipeline-active/`
2. Read the YAML frontmatter of each file
3. Filter for briefs with `status: ready`
4. Present the list to the user with key details for each brief:
   - `brief_id`
   - `content.title`
   - `target.site_id`
   - `target.content_type`
   - `distribution.channels`
   - `created` date

**Decision points:**
- If no `.brief.md` files exist in `pipeline-active/` → report "No briefs found" and stop
- If files exist but none have `status: ready` → list all briefs with their current status (`draft`, `published`, etc.) and stop
- If multiple briefs are `ready` → list all and ask user which to process (or process all sequentially if user confirms)

**Output format:**
```
Pipeline Scan Results:
  1. BRF-2026-014 — "Acqua di Cactus: La Rivoluzione" → opencactus (post) [linkedin, twitter]
  2. BRF-2026-015 — "Summer Campaign Launch" → opencactus (page) [mailchimp]

Which brief to process? (enter number, or "all")
```

---

## Step 2: CONFIG

**What it does:** Loads site configuration and merges it with brief values.

**Files read:**
- `.content-state/{site_id}.config.md` -- site configuration for the brief's target site

**Procedure:**
1. Read `target.site_id` from the selected brief (e.g., `opencactus`)
2. Load `.content-state/{site_id}.config.md` (e.g., `.content-state/opencactus.config.md`)
3. Parse the YAML frontmatter for site defaults, brand context, channel config, and SEO settings
4. Apply the override hierarchy -- brief values take precedence over site config defaults:

```
Brief value > Site config default > System default
```

**Specific merge rules:**
| Field | Brief source | Config fallback |
|-------|-------------|-----------------|
| `content_type` | `brief.target.content_type` | `config.defaults.content_type` |
| `status` | `brief.target.status` | `config.defaults.status` |
| `categories` | `brief.target.categories` | `config.defaults.categories` |
| `author` | `brief.content.author` | `config.defaults.author` |
| `schema_type` | `brief.seo.schema_type` | `config.seo.default_schema` |
| `seo_score_min` | `brief.gates.seo_score_min` | `config.seo.min_score` |

5. Read the config body section (Markdown after frontmatter) for brand context -- this informs content adaptation in the DISTRIBUTE step

**Decision points:**
- If config file does not exist for the `site_id` → stop and report: "No site config found for '{site_id}'. Create `.content-state/{site_id}.config.md` first. See `references/site-config-schema.md` for the format."
- If config is missing required fields (`site_id`, `site_url`, `brand.tone`, `brand.language`) → stop and report which fields are missing

---

## Step 3: VALIDATE

**What it does:** Checks quality gates before publishing.

**Procedure:**
1. Verify all required brief fields are present:
   - `brief_id`, `status`, `source.skill`, `target.site_id`, `target.content_type`, `content.title`
2. Verify the Markdown body (after frontmatter) is non-empty
3. Check quality gates from the merged configuration:

**Gate: `require_review`**
- If `gates.require_review: true` → present the full brief summary to the user and wait for explicit approval before proceeding
- Display: title, excerpt, target site, content type, categories, tags, distribution channels, and a preview of the first 500 characters of the body
- User must confirm with "approve" or "yes" to continue

**Gate: SEO and Readability**
- If `gates.seo_score_min` or `gates.readability_min` are set → evaluate the content quality based on:
  - Keyword usage and placement (title, first paragraph, headings, body density)
  - Meta description length and keyword inclusion
  - Heading structure (single H1, logical H2/H3 hierarchy)
  - Internal link presence (from `seo.internal_links`)
  - Content length and paragraph structure for readability
- These are evaluated by Claude based on content quality analysis, not automated scoring tools
- Report an estimated score with reasoning

4. Validate distribution channels against site config:
   - For each channel in `brief.distribution.channels`, check that `config.channels.{channel}.enabled: true`
   - If a brief requests a disabled channel → warn user and remove that channel from the processing list

**Decision points:**
- If required fields are missing → stop, report which fields are missing, keep brief as `status: ready`
- If body is empty → stop, report "Brief body is empty -- add content before publishing"
- If `require_review: true` and user does not approve → stop, keep brief as `status: ready`
- If SEO/readability gates fail → report scores and reasoning, ask user whether to proceed anyway or edit first
- If all gates pass → proceed to PUBLISH

---

## Step 4: PUBLISH

**What it does:** Creates the content on WordPress using MCP tools.

**MCP tools used:**
- `create_content` -- create the WordPress post/page
- `assign_terms_to_content` -- set categories and tags
- `sd_inject` -- inject Schema.org structured data (if applicable)
- `switch_site` -- switch to the target site (if multi-site)

**Procedure:**

1. **Switch site** (if needed):
   ```
   switch_site:
     site_id: {target.site_id}
   ```

2. **Create content as draft first** (safety rule -- always draft first):
   ```
   create_content:
     content_type: {target.content_type}   # e.g., "post"
     title: {content.title}
     content: {body from brief markdown}
     excerpt: {content.excerpt}
     status: "draft"                        # always draft initially
     slug: {auto-generated from title}
   ```
   Record the returned `post_id` and `post_url`.

3. **Assign taxonomy terms**:
   ```
   assign_terms_to_content:
     content_type: {target.content_type}
     id: {post_id}
     categories: {target.categories}        # e.g., ["sustainability", "innovation"]
     tags: {target.tags}                    # e.g., ["cactus-water", "zero-calorie"]
   ```

4. **Inject structured data** (if `seo.schema_type` is defined):
   ```
   sd_inject:
     post_id: {post_id}
     schema_type: {seo.schema_type}         # e.g., "Article"
   ```

5. **Present draft to user for final confirmation**:
   - Show: title, post URL (draft), categories, tags, schema type
   - Ask: "Content created as draft. Publish now?"

6. **Update to target status** (after user confirms, or if `target.status` is explicitly `publish` in the brief):
   ```
   update_content:
     content_type: {target.content_type}
     id: {post_id}
     status: {target.status}                # "publish", "future", etc.
     scheduled_date: {target.scheduled_date} # only if status is "future"
   ```

**Decision points:**
- If `create_content` fails → stop, report the error, keep brief as `status: ready`
- If user declines to publish after draft → keep as draft on WordPress, keep brief as `status: ready`, report draft URL
- If `target.status` is explicitly `publish` in the brief → still create as draft first, then update to publish after showing user the draft URL (unless the brief also has `gates.require_review: false`, in which case proceed automatically)

---

## Step 5: DISTRIBUTE

**What it does:** Distributes the published content to external channels.

**Prerequisite:** Step 4 must have completed successfully with the content in `publish` status on WordPress.

**Procedure:**

1. Check if `distribution.channels` is non-empty. If empty, skip to Step 6.

2. For each channel in `distribution.channels`:

   a. **Verify channel is enabled** in site config (`config.channels.{channel}.enabled: true`). Skip disabled channels with a warning.

   b. **Adapt content** if `distribution.adapt_format: true`:
      - Use the `wp-content-repurposing` skill patterns to transform the content for the target channel
      - Read `config.channels.{channel}.format` for the adaptation style
      - Read `config.brand` block for tone and language guidance

   c. **Respect scheduling**: if `distribution.schedule_offset_hours > 0`, note the delayed publish time for each channel post.

3. **Channel-specific MCP tool calls:**

   **LinkedIn** (`config.channels.linkedin`):
   ```
   li_create_post:
     profile_id: {config.channels.linkedin.profile_id}
     content: {adapted content for LinkedIn}
     post_url: {published WordPress URL}
   ```

   **Twitter** (`config.channels.twitter`):
   - For short content or `format: concise`:
     ```
     tw_create_tweet:
       content: {adapted content for Twitter}
       url: {published WordPress URL}
     ```
   - For long content or `format: thread`:
     ```
     tw_create_thread:
       tweets: [{thread segments adapted from content}]
       url: {published WordPress URL}
     ```

   **Buffer** (`config.channels.buffer`):
   ```
   buf_create_update:
     profile_id: {config.channels.buffer.profile_id}
     content: {adapted content}
     url: {published WordPress URL}
     scheduled_at: {publish_time + schedule_offset_hours}
   ```

   **Mailchimp** (`config.channels.mailchimp`):
   ```
   mc_create_campaign:
     audience_id: {config.channels.mailchimp.audience_id}
     subject: {content.title}
     from_name: {from site brand}

   mc_set_campaign_content:
     campaign_id: {returned campaign_id}
     html: {email-formatted content from brief}

   # STOP — require explicit user confirmation before sending
   mc_send_campaign:
     campaign_id: {campaign_id}
   ```

4. Record the result of each channel distribution (success/failure, post ID or URL, timestamp).

**Decision points:**
- If a channel tool call fails → log the failure, continue with remaining channels, report all failures at the end
- If Mailchimp is in the channel list → ALWAYS stop and confirm with user before calling `mc_send_campaign`
- If `schedule_offset_hours > 0` → use scheduling parameters in tool calls rather than immediate posting

---

## Step 6: UPDATE

**What it does:** Updates the brief file with publishing results.

**Procedure:**

1. Update the brief's YAML frontmatter with:
   ```yaml
   status: published
   published_at: {ISO 8601 timestamp of publication}
   post_id: {WordPress post ID}
   post_url: {published WordPress URL}
   distribution_log:
     - channel: linkedin
       status: success
       url: "https://linkedin.com/feed/update/..."
       timestamp: "2026-03-02T12:00:00Z"
     - channel: twitter
       status: success
       tweet_id: "1234567890"
       timestamp: "2026-03-02T12:00:00Z"
     - channel: mailchimp
       status: sent
       campaign_id: "mc_camp_abc123"
       timestamp: "2026-03-02T14:00:00Z"
   ```

2. Write the updated frontmatter back to the brief file in `pipeline-active/` (before archiving).

**Decision points:**
- If some distribution channels failed → still mark brief as `published` (the WordPress publish succeeded), but log failures in `distribution_log` with `status: failed` and error details
- If WordPress publish itself failed → do not update status, leave as `ready`

---

## Step 7: ARCHIVE

**What it does:** Moves the completed brief from active to archive.

**Procedure:**

1. Move the brief file from `.content-state/pipeline-active/` to `.content-state/pipeline-archive/`:
   ```
   .content-state/pipeline-active/BRF-2026-014.brief.md
     → .content-state/pipeline-archive/BRF-2026-014.brief.md
   ```

2. Report the final summary to the user:
   ```
   Pipeline Complete:
     Brief: BRF-2026-014
     Title: "Acqua di Cactus: La Rivoluzione Zero-Calorie dalla Sicilia"
     WordPress: https://opencactus.com/acqua-di-cactus-rivoluzione/ (published)
     Distribution:
       - LinkedIn: posted ✓
       - Twitter: posted ✓
       - Mailchimp: sent ✓
     Archived: .content-state/pipeline-archive/BRF-2026-014.brief.md
   ```

**Decision points:**
- If user wants to keep the brief in `pipeline-active/` for further editing → skip archive, report that brief remains active
- If brief was only partially processed (e.g., published but distribution pending) → keep in `pipeline-active/` until distribution is complete

---

## Creating a Brief Manually

When the user wants to create a brief from scratch (not from a Gen* skill):

**Procedure:**

1. **Read site config** for defaults:
   - Load `.content-state/{site_id}.config.md`
   - Extract `defaults` block and `brand` block

2. **Generate `brief_id`**:
   - Format: `BRF-YYYY-NNN` where `YYYY` is the current year and `NNN` is zero-padded sequential
   - Scan existing briefs in both `pipeline-active/` and `pipeline-archive/` to determine the next sequential number
   - Example: if `BRF-2026-014` is the highest existing ID, the next brief is `BRF-2026-015`

3. **Write brief file** to `pipeline-active/`:
   ```
   .content-state/pipeline-active/BRF-2026-015.brief.md
   ```
   With frontmatter populated from site defaults:
   ```yaml
   ---
   brief_id: BRF-2026-015
   created: {current ISO 8601 timestamp}
   status: draft

   source:
     skill: manual
     domain: general

   target:
     site_id: {user-specified site}
     content_type: {config.defaults.content_type}
     status: {config.defaults.status}
     categories: {config.defaults.categories}
     tags: []

   content:
     title: "{user-provided title}"
     excerpt: ""
     author: {config.defaults.author}

   distribution:
     channels: []
     adapt_format: true
     schedule_offset_hours: 0

   seo:
     focus_keyword: ""
     schema_type: {config.seo.default_schema}

   gates:
     seo_score_min: {config.seo.min_score}
     readability_min: 60
     require_review: true
   ---

   # {Title}

   {User fills in content here}
   ```

4. **Inform user**:
   - Brief created at `pipeline-active/BRF-2026-015.brief.md` with `status: draft`
   - User should fill in the content body and any missing fields
   - When ready, set `status: ready` to enable pipeline processing

---

## Safety Rules

- **ALWAYS** create WordPress content as `draft` first, then update to the target status only after user confirmation -- unless the brief explicitly sets `target.status: publish` AND `gates.require_review: false`
- **NEVER** publish content without showing the user the brief summary first
- **ALWAYS** confirm with the user before sending Mailchimp email campaigns (`mc_send_campaign`)
- **ALWAYS** log all distribution actions in the brief's `distribution_log` field
- **NEVER** activate a distribution channel that is `enabled: false` in the site config, even if the brief requests it
- **NEVER** modify the brief body content during publishing -- the pipeline publishes what is in the brief, it does not rewrite
- **ALWAYS** preserve the original brief file (with updated frontmatter) in the archive for audit trail
- **CHECK** for existing WordPress content with the same slug before creating, to avoid duplicates

---

## Reference Files

- **`references/content-brief-schema.md`** -- complete schema for `.brief.md` files including all frontmatter fields, status lifecycle, and validation rules
- **`references/site-config-schema.md`** -- complete schema for `.config.md` files including brand, defaults, channels, SEO, and cadence configuration

---

## Related Skills

- **`wp-content`** -- content creation and management (creating posts, pages, taxonomy management)
- **`wp-content-optimization`** -- SEO and readability enhancement (optimizing content before publishing)
- **`wp-content-repurposing`** -- multi-format adaptation for distribution (transforming content for social/email channels)
- **`wp-social-email`** -- distribution channel tools (Mailchimp, Buffer, SendGrid MCP tool reference)
- **`wp-structured-data`** -- Schema.org markup injection (structured data for rich search results)
