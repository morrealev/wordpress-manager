# Content Brief Schema

Schema reference for `.brief.md` files -- the exchange format between Gen\* skills and the `wp-content-pipeline` publishing skill.

Brief files live in `.content-state/pipeline-active/` while being processed, then move to `.content-state/pipeline-archive/` after publishing or archival.

---

## File Format

Each `.brief.md` file consists of:

1. **YAML frontmatter** between `---` delimiters (structured metadata)
2. **Markdown body** after the closing `---` (the actual content to publish)

```
---
brief_id: BRF-2026-001
status: draft
# ... other fields ...
---

# Article Title

Body content in standard Markdown...
```

---

## Frontmatter Fields

### `brief_id`

| Property | Value |
|----------|-------|
| Type | `string` |
| Required | **Yes** |
| Format | `BRF-YYYY-NNN` |
| Example | `BRF-2026-014` |

Unique identifier for the brief. `YYYY` is the four-digit year, `NNN` is a zero-padded sequential number within that year. The pipeline auto-generates this when creating briefs; manual briefs must follow the same format.

### `created`

| Property | Value |
|----------|-------|
| Type | `string` (ISO 8601) |
| Required | **No** (auto-generated) |
| Default | Current timestamp at brief creation |
| Example | `2026-03-02T10:30:00Z` |

Timestamp of brief creation. Auto-populated by the pipeline.

### `status`

| Property | Value |
|----------|-------|
| Type | `enum` |
| Required | **Yes** |
| Values | `draft` \| `ready` \| `published` \| `archived` |
| Default | `draft` |

Current lifecycle status. See [Status Lifecycle](#status-lifecycle) for transitions.

---

### `source` block

Tracks the origin of the content brief.

```yaml
source:
  skill: gencorpcomm
  domain: corporate-communications
  session_id: sess_abc123
```

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `skill` | `string` | **Yes** | -- | Gen\* skill that produced the brief. Values: `gencorpcomm`, `genmarketing`, `gensignal`, `genbrand`, `manual`. For manually created briefs, set to `manual` |
| `domain` | `string` | No | `general` | Content domain or department. Free-form but recommended values: `corporate-communications`, `marketing`, `product`, `engineering`, `support` |
| `session_id` | `string` | No | `null` | Claude Code session ID that generated the brief, for traceability |

---

### `target` block

Defines the WordPress destination and publishing parameters.

```yaml
target:
  site_id: mysite
  content_type: post
  status: draft
  scheduled_date: 2026-03-15T09:00:00Z
  categories:
    - sustainability
    - innovation
  tags:
    - premium-water
    - zero-calorie
    - sicily
```

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `site_id` | `string` | **Yes** | -- | WordPress site identifier from `WP_SITES_CONFIG` environment variable JSON array |
| `content_type` | `string` | **Yes** | `post` | WordPress content type: `post`, `page`, or any registered custom post type (e.g., `product`, `recipe`) |
| `status` | `string` | No | `draft` | WordPress post status on publish: `draft`, `pending`, `publish`, `future`, `private` |
| `scheduled_date` | `string` (ISO 8601) | No | `null` | Schedule publication for a future date. Required when `status: future`. Ignored for other statuses |
| `categories` | `string[]` | No | `[]` | WordPress category slugs. Created automatically if they do not exist on the target site |
| `tags` | `string[]` | No | `[]` | WordPress tag slugs. Created automatically if they do not exist on the target site |

---

### `content` block

Core content metadata for the WordPress post.

```yaml
content:
  title: "Acqua Premium: La Rivoluzione Zero-Calorie dal Mediterraneo"
  excerpt: "Scopri come il frutto mediterraneo regionale diventa la bevanda del futuro."
  featured_image: /assets/images/premium-field-sicily.jpg
  author: editorial-team
```

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `title` | `string` | **Yes** | -- | Post title. Supports standard characters and Unicode |
| `excerpt` | `string` | No | Auto-generated from first 160 chars of body | Custom excerpt / meta description fallback |
| `featured_image` | `string` | No | `null` | Path or URL to the featured image. Relative paths resolve against site media library |
| `author` | `string` | No | Site default author | WordPress username or slug for post attribution |

---

### `distribution` block

Controls cross-channel distribution after WordPress publishing.

```yaml
distribution:
  channels:
    - linkedin
    - twitter
    - mailchimp
  adapt_format: true
  schedule_offset_hours: 2
```

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `channels` | `string[]` | No | `[]` | External distribution channels. Supported: `linkedin`, `twitter`, `buffer`, `mailchimp` |
| `adapt_format` | `boolean` | No | `true` | Adapt content format for each channel (e.g., shorten for Twitter, professional tone for LinkedIn) |
| `schedule_offset_hours` | `integer` | No | `0` | Hours to delay distribution after WordPress publication. `0` = immediate |

---

### `seo` block

Search engine optimization parameters. Used by the pipeline to validate content before publishing.

```yaml
seo:
  focus_keyword: acqua premium zero calorie
  meta_description: "L'acqua premium regionale: zero calorie, ricca di antiossidanti. Scopri la bevanda naturale che sta conquistando l'Europa."
  schema_type: Article
  internal_links:
    - /blog/benefici-fico-india
    - /prodotti/light-blend
```

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `focus_keyword` | `string` | No | `null` | Primary SEO keyword / keyphrase for the content |
| `meta_description` | `string` | No | Value of `content.excerpt` | Custom meta description (max 160 chars recommended) |
| `schema_type` | `string` | No | `Article` | JSON-LD schema type: `Article`, `BlogPosting`, `HowTo`, `FAQPage`, `Product`, `Recipe`, `NewsArticle` |
| `internal_links` | `string[]` | No | `[]` | Paths to internal pages that should be linked within the content body |

**Note:** the architecture draft defines `internal_links` as `auto | manual | none`. This schema uses explicit path lists instead — automatic link discovery is configured at the site level via `seo.auto_internal_links` in `{site_id}.config.md`.

---

### `gates` block

Quality gates that must pass before the brief transitions from `draft` to `ready`.

```yaml
gates:
  seo_score_min: 70
  readability_min: 60
  require_review: true
```

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `seo_score_min` | `integer` (0-100) | No | `70` | Minimum SEO score (Yoast/RankMath scale). Brief cannot move to `ready` below this threshold |
| `readability_min` | `integer` (0-100) | No | `60` | Minimum readability score (Flesch-based). Brief cannot move to `ready` below this threshold |
| `require_review` | `boolean` | No | `false` | If `true`, a human must explicitly approve the brief before it transitions to `ready` |

---

## Status Lifecycle

Briefs progress through a linear lifecycle with defined transitions:

```
draft --> ready --> published --> archived
  |                                  ^
  +---------- (skip) ---------------+
```

| Transition | Trigger | Conditions |
|------------|---------|------------|
| `draft` -> `ready` | Automated or manual | All `gates` pass; content body is non-empty; required frontmatter fields are present |
| `ready` -> `published` | Pipeline publish action | Target site is reachable; WordPress API responds; content created successfully |
| `published` -> `archived` | Manual or time-based | Content is live; distribution completed; brief moved to `pipeline-archive/` |
| `draft` -> `archived` | Manual | Brief abandoned or superseded; moved directly to archive |

**Notes:**
- Only `draft` briefs can be edited. Once `ready`, the brief is frozen.
- The `published` status is set automatically by the pipeline after successful WordPress API call.
- Archived briefs retain their frontmatter for audit trail and analytics.

---

## Validation Rules

### Required Fields

These fields **must** be present for a brief to be valid:

| Field | Reason |
|-------|--------|
| `brief_id` | Unique identification and tracking |
| `status` | Lifecycle management |
| `source.skill` | Content provenance and traceability |
| `target.site_id` | WordPress destination routing |
| `target.content_type` | WordPress API endpoint selection |
| `content.title` | WordPress post title (cannot be empty) |

### Optional Fields with Defaults

| Field | Default Value |
|-------|---------------|
| `created` | Auto-generated ISO 8601 timestamp |
| `source.domain` | `general` |
| `source.session_id` | `null` |
| `target.status` | `draft` |
| `target.scheduled_date` | `null` |
| `target.categories` | `[]` |
| `target.tags` | `[]` |
| `content.excerpt` | First 160 chars of body |
| `content.featured_image` | `null` |
| `content.author` | Site default author |
| `distribution.channels` | `[]` |
| `distribution.adapt_format` | `true` |
| `distribution.schedule_offset_hours` | `0` |
| `seo.focus_keyword` | `null` |
| `seo.meta_description` | Value of `content.excerpt` |
| `seo.schema_type` | `Article` |
| `seo.internal_links` | `[]` |
| `gates.seo_score_min` | `70` |
| `gates.readability_min` | `60` |
| `gates.require_review` | `false` |

### Content Body

- Must be valid Markdown
- Must be non-empty for transition from `draft` to `ready`
- Supports standard Markdown features: headings, lists, links, images, code blocks, tables
- Internal links from `seo.internal_links` should appear naturally within the body

---

## Example Brief

A complete `.brief.md` for the mysite site:

```markdown
---
brief_id: BRF-2026-014
created: 2026-03-02T10:30:00Z
status: draft

source:
  skill: gencorpcomm
  domain: corporate-communications
  session_id: sess_7f3a9b2c

target:
  site_id: mysite
  content_type: post
  status: draft
  scheduled_date: 2026-03-15T09:00:00Z
  categories:
    - sustainability
    - innovation
  tags:
    - premium-water
    - zero-calorie
    - sicily
    - sustainability

content:
  title: "Acqua Premium: La Rivoluzione Zero-Calorie dal Mediterraneo"
  excerpt: "Scopri come il frutto mediterraneo regionale diventa la bevanda del futuro: zero calorie, ricca di antiossidanti e 100% sostenibile."
  featured_image: /wp-content/uploads/2026/03/premium-field-sicily.jpg
  author: editorial-team

distribution:
  channels:
    - linkedin
    - twitter
  adapt_format: true
  schedule_offset_hours: 2

seo:
  focus_keyword: acqua premium zero calorie
  meta_description: "L'acqua premium regionale: zero calorie, ricca di antiossidanti. Scopri la bevanda naturale che sta conquistando l'Europa."
  schema_type: Article
  internal_links:
    - /blog/benefici-fico-india
    - /prodotti/light-blend
    - /chi-siamo/sostenibilita

gates:
  seo_score_min: 75
  readability_min: 65
  require_review: true
---

# Acqua Premium: La Rivoluzione Zero-Calorie dal Mediterraneo

Nel cuore del Mediterraneo, tra le terre arse dal sole dell'entroterra, cresce una pianta che sta cambiando il panorama delle bevande salutari: il **frutto mediterraneo** (*Mediterranean fruit*).

## Una Tradizione Millenaria, Una Visione Moderna

Il frutto mediterraneo regionale non è solo un simbolo del paesaggio mediterraneo. Per secoli, le comunità locali hanno sfruttato le sue proprietà idratanti naturali. Oggi, grazie a un processo di estrazione innovativo, quell'acqua diventa una [bevanda zero-calorie](/prodotti/light-blend) che conserva tutti i benefici dell'originale.

## Perché l'Acqua Premium?

I vantaggi rispetto alle alternative convenzionali sono significativi:

- **Zero calorie** senza dolcificanti artificiali
- **Antiossidanti naturali** (betalaine e polifenoli)
- **Elettroliti bilanciati** per un'idratazione superiore
- **Impronta idrica minima**: la pianta richiede l'85% di acqua in meno rispetto alle colture tradizionali

## Sostenibilità al Centro

La nostra filiera è progettata per la [sostenibilità integrale](/chi-siamo/sostenibilita). Le piante crescono su terreni marginali, non competono con le colture alimentari e contribuiscono alla rigenerazione del suolo.

Ogni bottiglia di AcmeBrand rappresenta una scelta consapevole: per la salute, per il territorio, per il futuro.

## Scopri di Più

Leggi i [benefici scientifici del frutto mediterraneo](/blog/benefici-fico-india) o prova la nostra gamma di prodotti, dal delicato **Light Blend** al ricco **Bold Blend**.
```

---

## File Naming Convention

Brief files follow this naming pattern:

```
{brief_id}.brief.md
```

Examples:
- `BRF-2026-001.brief.md`
- `BRF-2026-014.brief.md`

Files are stored in:
- **Active**: `.content-state/pipeline-active/` (being processed)
- **Archived**: `.content-state/pipeline-archive/` (completed or abandoned)
