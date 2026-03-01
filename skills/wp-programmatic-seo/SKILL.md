---
name: wp-programmatic-seo
description: |
  This skill should be used when the user asks to "generate template pages",
  "create city pages", "programmatic SEO", "scalable landing pages", "dynamic pages
  from data", "product variant pages", "location-based SEO", "ISR pages at scale",
  "bulk page generation", or mentions creating large numbers of pages from templates
  or data sources using WordPress as content backend.
version: 1.0.0
---

## Overview

Programmatic SEO is the systematic generation of large-scale, search-optimized pages from structured data. WordPress serves as the canonical content source (via custom post types, taxonomies, and REST API), while a headless frontend (Next.js, Nuxt, Astro) renders the pages using ISR/SSG for performance and crawlability.

This skill orchestrates existing MCP tools — content CRUD, multisite management, headless architecture — into scalable page generation workflows. No new tools are required.

## When to Use

- User wants to generate 100s–1000s of pages from templates and structured data
- City/location pages (e.g., "plumber in {city}" for 200 cities)
- Product variant pages (size/color/model combinations)
- Comparison pages (product A vs product B)
- Directory listings from external data (CSV, API)
- Any `/{entity}/{location}/{variant}` URL pattern at scale

## Programmatic SEO vs Manual Content

| Aspect | Programmatic SEO | Manual Content |
|--------|-----------------|----------------|
| Scale | 100s–1000s of pages | 1–50 pages |
| Consistency | Template-enforced uniformity | Variable quality |
| Maintenance | Update template → all pages update | Edit each page individually |
| SEO value | Long-tail keyword coverage | High per-page authority |
| Setup cost | Higher initial (template + data) | Lower initial, higher ongoing |
| Content depth | Data-driven, structured | Human-crafted, nuanced |

## Prerequisites / Detection

```bash
node skills/wp-programmatic-seo/scripts/programmatic_seo_inspect.mjs --cwd=/path/to/wordpress
```

The script checks headless frontend presence, SEO plugins, content volume, custom post types, and WPGraphQL availability.

## Programmatic SEO Operations Decision Tree

1. **What type of programmatic content?**

   - "template pages" / "page templates" / "dynamic templates"
     → **Template Architecture** — Read: `references/template-architecture.md`

   - "city pages" / "location pages" / "LocalBusiness" / "service area pages"
     → **Location-Based SEO** — Read: `references/location-seo.md`

   - "product variants" / "filtered pages" / "comparison pages" / "category landing"
     → **Product Programmatic SEO** — Read: `references/product-seo.md`

   - "data-driven" / "API pages" / "custom endpoint" / "CSV import" / "external data"
     → **Data-Driven Content** — Read: `references/data-sources.md`

   - "sitemap" / "indexing" / "crawl budget" / "canonical" / "Core Web Vitals"
     → **Technical SEO** — Read: `references/technical-seo.md`

2. **Common workflow (all types):**
   1. Assess data source — what structured data exists? (products, locations, categories)
   2. Design URL pattern — `/{service}/{city}` or `/{product}/{variant}`
   3. Create CPT or taxonomy in WordPress if needed (via `create_content` MCP tool)
   4. Build page template with dynamic fields (title, meta, H1, body)
   5. Generate content in bulk using REST API (loop with `create_content`)
   6. Configure headless frontend ISR/SSG (reference: template-architecture)
   7. Generate and submit XML sitemap (reference: technical-seo)

## Recommended Agent

`wp-content-strategist` — handles content strategy, template design, and bulk generation workflows.

## Additional Resources

### Reference Files

| File | Description |
|------|-------------|
| **`references/template-architecture.md`** | Page template patterns, URL design, ISR/SSG config, bulk creation |
| **`references/location-seo.md`** | City/location pages, LocalBusiness schema, geo-targeting |
| **`references/product-seo.md`** | Product variants, comparison pages, Product schema |
| **`references/data-sources.md`** | REST API, WPGraphQL, external data, content quality gates |
| **`references/technical-seo.md`** | Sitemaps, crawl budget, canonicals, internal linking, CWV |

### Related Skills

- `wp-headless` — headless architecture, ISR/SSG, webhooks
- `wp-multisite` — multisite network for segmented content at scale
- `wp-woocommerce` — product data as SEO content source
- `wp-rest-api` — REST API endpoints for content CRUD
- `wp-content` — content management fundamentals
- `wp-content-repurposing` — transform existing content into new formats
- `wp-search-console` — monitor performance of generated pages via GSC keyword tracking and indexing status
