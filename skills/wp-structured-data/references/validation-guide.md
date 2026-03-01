# Validation Guide

## Validation Workflow

### Step 1: Check Existing Markup

Use `sd_validate` with `url` to scan a live page:

```
sd_validate(url: "https://example.com/blog-post")
```

**Result interpretation:**
- `valid: true` — JSON-LD is well-formed with @context and @type
- `valid: false` — issues found (listed in `issues` array)
- `schemas_found: N` — number of JSON-LD blocks on the page

### Step 2: Validate Before Injection

Before using `sd_inject`, validate markup inline:

```
sd_validate(markup: '{"@context":"https://schema.org","@type":"Article","headline":"Test"}')
```

### Step 3: Post-Injection Verification

After `sd_inject`, verify by fetching the page and validating:

```
sd_validate(url: "https://example.com/blog-post")
```

## Common Issues and Fixes

### Missing @context

**Issue:** `Missing or invalid @context (should include schema.org)`
**Fix:** `sd_inject` automatically adds `@context: "https://schema.org"` — this issue only appears on existing markup from other sources.

### Missing @type

**Issue:** `Missing @type`
**Fix:** Every schema must have a @type. When using `sd_inject`, the `schema_type` parameter sets this automatically.

### Invalid JSON

**Issue:** `Invalid JSON-LD on page`
**Cause:** Malformed JSON in the `<script type="application/ld+json">` block.
**Fix:** Check for trailing commas, unescaped quotes, or broken HTML in the JSON-LD block.

### Multiple Schemas Conflict

**Issue:** SEO plugin (Yoast/Rank Math) adds its own schema, plus custom schema via `sd_inject`
**Fix:** Check with `sd_validate` first. If plugin already covers the type, don't duplicate. Use `sd_inject` for types the plugin doesn't handle (e.g., FAQ, HowTo).

### Required Properties Missing

Google requires specific properties per type. See `schema-types.md` for the full list. Common missing properties:

| Type | Often Missing | Impact |
|------|--------------|--------|
| Article | `image` | No rich result without image |
| Product | `offers` | No price shown in search |
| FAQ | `acceptedAnswer` | Invalid FAQ schema |
| Event | `startDate` | Invalid event schema |

## Google Rich Results Eligibility

Not all Schema.org types generate rich results. Eligible types:

| Type | Rich Result |
|------|-------------|
| Article | Article card with image, date |
| Product | Price, availability, rating stars |
| FAQPage | Expandable FAQ accordion |
| HowTo | Step-by-step instructions |
| Event | Event card with date, location |
| LocalBusiness | Knowledge panel |
| BreadcrumbList | Breadcrumb trail |
| Recipe | Recipe card with image, time, calories |
| VideoObject | Video thumbnail in search |

## External Validation

For definitive testing beyond `sd_validate`:
- **Google Rich Results Test**: https://search.google.com/test/rich-results
- **Schema.org Validator**: https://validator.schema.org/
- **Google Search Console**: Rich results report (requires GSC access via `gsc_*` tools)
