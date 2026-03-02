# Site Configuration Schema

Schema reference for `.config.md` files -- per-site configuration that the `wp-content-pipeline` skill reads when processing briefs.

Config files live in `.content-state/` with the naming pattern `{site_id}.config.md`. They are gitignored because they contain site-specific values (profile IDs, audience IDs) that vary per environment.

---

## File Format

Each `.config.md` file consists of:

1. **YAML frontmatter** between `---` delimiters (structured configuration)
2. **Markdown body** after the closing `---` (free-form notes for Claude context)

```
---
site_id: mysite
site_url: https://mysite.example.com
last_updated: 2026-03-02
# ... other fields ...
---

## Notes

Free-form context that Claude uses when generating or adapting content for this site...
```

---

## Frontmatter Fields

### `site_id`

| Property | Value |
|----------|-------|
| Type | `string` |
| Required | **Yes** |
| Format | Lowercase alphanumeric with hyphens |
| Example | `mysite` |

Unique identifier for the site. **Must match** the `id` field in the `WP_SITES_CONFIG` environment variable JSON array. This is how the pipeline resolves WordPress credentials (URL, username, app password) for API calls.

### `site_url`

| Property | Value |
|----------|-------|
| Type | `string` (URL) |
| Required | **Yes** |
| Format | `https://example.com` (no trailing slash) |
| Example | `https://mysite.example.com` |

The public-facing URL of the WordPress site. Used for constructing internal links and verifying published content. Should match the `url` field in `WP_SITES_CONFIG`.

### `last_updated`

| Property | Value |
|----------|-------|
| Type | `string` (ISO 8601 date) |
| Required | No |
| Default | Date of file creation |
| Example | `2026-03-02` |

Date when this config was last reviewed or modified. Helps track staleness -- configs older than 90 days should be reviewed for accuracy.

---

### `brand` block

Defines the brand voice and editorial identity for the site. These values provide Claude with the context needed to generate on-brand content.

When `GenBrand` produces brand analysis output, those results map directly into this block. See [Integration Notes](#integration-notes) for the mapping.

```yaml
brand:
  tone: professional, accessible, sustainability-focused
  language: it
  style_notes: |
    Voice: warm but authoritative. Avoid corporate jargon.
    Always emphasize the Mediterranean heritage and natural ingredients.
    Use "noi" (we) when referring to the company.
    Sustainability is a core value, not a marketing angle.
```

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `tone` | `string` | **Yes** | -- | Comma-separated tone descriptors. Used by Claude to calibrate writing style. Examples: `professional, warm`, `casual, witty`, `technical, precise` |
| `language` | `string` | **Yes** | -- | ISO 639-1 language code for the site's primary content language. Affects content generation, SEO, and readability scoring |
| `style_notes` | `string` (multi-line) | No | `null` | Free-form editorial guidelines in YAML literal block scalar (`|`) format. Can include voice rules, banned words, preferred terminology, formatting conventions. No length limit |

---

### `defaults` block

Default values applied to briefs when the brief does not specify them explicitly. Brief-level values always override these defaults.

```yaml
defaults:
  content_type: post
  status: draft
  categories:
    - blog
  author: editorial-team
```

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `content_type` | `string` | No | `post` | Default WordPress content type: `post`, `page`, or any registered custom post type |
| `status` | `string` | No | `draft` | Default WordPress post status: `draft`, `pending`, `publish`, `future`, `private` |
| `categories` | `string[]` | No | `[]` | Default category slugs applied when a brief omits categories |
| `author` | `string` | No | `null` | Default WordPress username or slug for post attribution. If `null`, uses the authenticated user from `WP_SITES_CONFIG` |

---

### `channels` block

Configures external distribution channels for the site. Each sub-key is a channel name with its own configuration. The pipeline reads this block to determine which channels are available and their credentials.

```yaml
channels:
  linkedin:
    enabled: true
    profile_id: "urn:li:person:AbCdEf123"
    format: professional
  twitter:
    enabled: true
    format: concise
  buffer:
    enabled: false
    profile_id: "buf_profile_abc123"
    format: casual
  mailchimp:
    enabled: true
    audience_id: "mc_aud_xyz789"
    segment: newsletter-subscribers
```

#### Channel: `linkedin`

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `enabled` | `boolean` | **Yes** | -- | Whether LinkedIn distribution is active for this site |
| `profile_id` | `string` | Yes (if enabled) | -- | LinkedIn profile URN. Required by `li_create_post` MCP tool. Format: `urn:li:person:XXXXX` or `urn:li:organization:XXXXX` |
| `format` | `string` | No | `professional` | Content adaptation style: `professional`, `thought-leadership`, `casual` |

#### Channel: `twitter`

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `enabled` | `boolean` | **Yes** | -- | Whether Twitter/X distribution is active for this site |
| `format` | `string` | No | `concise` | Content adaptation style: `concise`, `thread`, `conversational` |

**Note:** Twitter tools (`tw_create_tweet`, `tw_create_thread`) authenticate via the MCP server configuration, so no `profile_id` is needed here.

#### Channel: `buffer`

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `enabled` | `boolean` | **Yes** | -- | Whether Buffer distribution is active for this site |
| `profile_id` | `string` | Yes (if enabled) | -- | Buffer profile ID. Required by `buf_create_update` MCP tool |
| `format` | `string` | No | `casual` | Content adaptation style: `professional`, `casual`, `promotional` |

#### Channel: `mailchimp`

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `enabled` | `boolean` | **Yes** | -- | Whether Mailchimp distribution is active for this site |
| `audience_id` | `string` | Yes (if enabled) | -- | Mailchimp audience/list ID. Required by `mc_create_campaign` MCP tool |
| `segment` | `string` | No | `null` | Mailchimp segment or tag to target within the audience. If `null`, sends to the full audience |

---

### `seo` block

Site-level SEO defaults. These apply when a brief does not specify its own SEO parameters. Brief-level `seo` values always override these.

```yaml
seo:
  default_schema: Article
  min_score: 70
  auto_internal_links: true
```

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `default_schema` | `string` | No | `Article` | Default JSON-LD schema type for content: `Article`, `BlogPosting`, `HowTo`, `FAQPage`, `Product`, `Recipe`, `NewsArticle` |
| `min_score` | `integer` (0-100) | No | `70` | Default value for `brief.gates.seo_score_min` when the brief omits that field. Does not enforce a gate directly -- the gate is enforced at the brief level |
| `auto_internal_links` | `boolean` | No | `true` | Automatically discover and suggest internal links based on existing site content. When `true`, the pipeline scans the site's published posts to find relevant linking opportunities |

---

### `cadence` block

Editorial calendar configuration. Used by Phase 3 planning features. In Phase 1, the pipeline reads `publish_time` as default when `target.scheduled_date` is set without an explicit time.

```yaml
cadence:
  posts_per_week: 3
  preferred_days:
    - monday
    - wednesday
    - friday
  publish_time: "09:00"
```

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `posts_per_week` | `integer` | No | `2` | Target number of posts per week. Informs editorial planning and capacity alerts |
| `preferred_days` | `string[]` | No | `["monday", "thursday"]` | Preferred days of the week for publishing. Lowercase English day names |
| `publish_time` | `string` | No | `"09:00"` | Default publish time in `HH:MM` format (24-hour, site's local timezone). Applied when scheduling future posts without an explicit time |

---

## Body Section

The body section (after the closing `---`) is free-form Markdown that provides Claude with additional context about the site. This content is read by Claude when generating or adapting content but is not parsed as structured data.

Recommended content for the body section:

- **Brand story** -- brief narrative that Claude can reference for tone consistency
- **Product line** -- key products/services and how to reference them
- **Competitor notes** -- what to avoid saying, differentiation points
- **Seasonal considerations** -- recurring themes, campaigns, events
- **Terminology** -- preferred terms, abbreviations, translations

---

## Validation Rules

### Required Fields

These fields **must** be present for a config file to be valid:

| Field | Reason |
|-------|--------|
| `site_id` | Links config to `WP_SITES_CONFIG` credentials |
| `site_url` | Required for link construction and verification |
| `brand.tone` | Minimum brand voice definition |
| `brand.language` | Content language for generation and SEO |

### Channel Validation

For each channel where `enabled: true`:

| Channel | Required Field | MCP Tool |
|---------|---------------|----------|
| `linkedin` | `profile_id` | `li_create_post` |
| `buffer` | `profile_id` | `buf_create_update` |
| `mailchimp` | `audience_id` | `mc_create_campaign` |
| `twitter` | *(none)* | `tw_create_tweet`, `tw_create_thread` |

### Override Hierarchy

Brief-level values always take precedence over site config defaults:

```
Brief value > Site config default > System default
```

Specific overrides:
- `brief.target.content_type` > `config.defaults.content_type`
- `brief.target.status` > `config.defaults.status`
- `brief.target.categories` > `config.defaults.categories`
- `brief.content.author` > `config.defaults.author`
- `brief.seo.schema_type` > `config.seo.default_schema`
- `brief.gates.seo_score_min` > `config.seo.min_score`
- `brief.distribution.channels` -- selects which enabled channels to use; cannot activate a channel the config has `enabled: false`

---

## Integration Notes

### GenBrand Output Mapping

The `GenBrand` skill produces brand analysis that maps to the `brand` block:

| GenBrand Output | Config Field | Notes |
|-----------------|-------------|-------|
| Voice/tone descriptors | `brand.tone` | Comma-separated list of tone attributes |
| Primary language | `brand.language` | ISO 639-1 code |
| Editorial guidelines | `brand.style_notes` | Multi-line YAML block scalar. Include voice rules, banned words, preferred terminology |
| Brand narrative | Body section | Free-form context for Claude |

After running `GenBrand`, update the config file with the output. The `brand` block captures the structured attributes; the body section captures the narrative context.

### WP_SITES_CONFIG Mapping

The `WP_SITES_CONFIG` environment variable is a JSON array of site credentials:

```json
[
  {
    "id": "mysite",
    "url": "https://mysite.example.com",
    "username": "api-user",
    "app_password": "xxxx xxxx xxxx xxxx"
  }
]
```

The mapping between `WP_SITES_CONFIG` and the config file:

| WP_SITES_CONFIG Field | Config Field | Relationship |
|----------------------|-------------|--------------|
| `id` | `site_id` | **Must match exactly** -- this is the join key |
| `url` | `site_url` | Should match; config value used for public-facing links |
| `username` | `defaults.author` | Can differ; config author is for attribution, WP_SITES_CONFIG username is for API authentication |
| `app_password` | *(none)* | Credentials are never stored in config files |

**Important:** The config file never contains authentication credentials. All sensitive values remain in the `WP_SITES_CONFIG` environment variable.

### Brief Cross-Reference

When the pipeline processes a brief, it resolves the site config via `brief.target.site_id`:

1. Read `brief.target.site_id` (e.g., `mysite`)
2. Load `.content-state/mysite.config.md`
3. Apply config defaults for any fields the brief omits
4. Use `brand` block for content adaptation/generation
5. Use `channels` block for distribution routing

---

## Example Config

A complete `.config.md` for the mysite site:

```markdown
---
site_id: mysite
site_url: https://mysite.example.com
last_updated: 2026-03-02

brand:
  tone: professional, accessible, sustainability-focused
  language: it
  style_notes: |
    Voice: warm but authoritative. Avoid corporate jargon.
    Always emphasize the Mediterranean heritage and natural ingredients.
    Use "noi" (we) when referring to the company.
    Sustainability is a core value, not a marketing angle -- weave it naturally.
    Product names are always capitalized: Light Blend, Dolce, Bold Blend.
    Refer to the product using its brand name, not generic terms in marketing content.
    Scientific claims must cite specific compounds (betalaine, polifenoli).

defaults:
  content_type: post
  status: draft
  categories:
    - blog
  author: editorial-team

channels:
  linkedin:
    enabled: true
    profile_id: "urn:li:organization:mysite"
    format: professional
  twitter:
    enabled: true
    format: concise
  buffer:
    enabled: false
    profile_id: ""
    format: casual
  mailchimp:
    enabled: true
    audience_id: "mc_aud_mysite_main"
    segment: newsletter-subscribers

seo:
  default_schema: Article
  min_score: 75
  auto_internal_links: true

cadence:
  posts_per_week: 3
  preferred_days:
    - monday
    - wednesday
    - friday
  publish_time: "09:00"
---

## Brand Context

MySite is the digital home of AcmeBrand, an Italian zero-calorie beverage brand based on premium sparkling water (acqua premium). The brand sits at the intersection of traditional Mediterranean agriculture and modern wellness.

### Product Line

- **Light Blend** -- Light sweetness, subtle premium flavor. Entry-level product.
- **Dolce** -- Medium sweetness, balanced flavor profile. The core product.
- **Bold Blend** -- Full sweetness, rich premium flavor. For those who prefer bolder taste.

All variants are zero-calorie, naturally flavored, with no artificial sweeteners.

### Key Differentiators

- Only sparkling water brand with full regional supply chain
- Zero calorie without artificial sweeteners (uses natural premium compounds)
- 85% lower water footprint than conventional beverages
- Rich in betalains and polyphenols (natural antioxidants)

### Content Themes

- Sustainability and environmental responsibility
- Mediterranean heritage and terroir
- Health and wellness (zero-calorie, natural ingredients)
- Innovation in food technology
- Community and local farmers

### Competitor Positioning

Avoid direct competitor mentions. Focus on AcmeBrand's unique attributes rather than comparison. Never claim "best" or "only" without substantiation.
```

---

## File Naming Convention

Config files follow this naming pattern:

```
{site_id}.config.md
```

Examples:
- `mysite.config.md`
- `my-blog.config.md`
- `corporate-site.config.md`

Files are stored in `.content-state/` and are gitignored (site-specific configuration).
