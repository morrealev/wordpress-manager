---
name: wp-structured-data
description: This skill should be used when the user asks about "structured data",
  "Schema.org", "JSON-LD", "rich snippets", "schema markup", "dati strutturati",
  "rich results", "Google rich cards", "schema validation", "breadcrumb schema",
  "FAQ schema", "product schema", "article schema", or mentions adding/validating
  Schema.org markup on WordPress content.
version: 1.0.0
---

# WordPress Structured Data Skill

## Overview

Structured data (Schema.org markup in JSON-LD format) helps search engines understand page content and enables rich results (FAQ accordions, product stars, recipe cards, event listings, etc.). This skill manages the full lifecycle: validate existing markup, inject new schemas, and audit site-wide coverage.

## When to Use

- User wants to add structured data to posts or pages
- User asks about rich snippets or Schema.org
- User needs to validate existing JSON-LD markup
- User wants to audit structured data coverage across the site
- User mentions FAQ schema, product schema, article schema, etc.

## Decision Tree

1. **What operation?**
   - "validate" / "check" / "test" / "audit" → Validation (Section 1)
   - "add" / "inject" / "create" / "set up" → Injection (Section 2)
   - "list" / "audit" / "scan" / "coverage" → Site Audit (Section 3)
   - "types" / "which schema" / "what schema" → Schema Types Reference (Section 4)

2. **Run detection first:**
   ```bash
   node skills/wp-structured-data/scripts/schema_inspect.mjs [--cwd=/path/to/project]
   ```
   This checks for existing schema plugins (Yoast, Rank Math, Schema Pro) and JSON-LD presence.

## Sections

### Section 1: Validation
See `references/validation-guide.md`
- Validate live URLs: `sd_validate` with `url` parameter
- Validate raw markup: `sd_validate` with `markup` parameter
- Interpret results: check @context, @type, required properties
- Common issues: missing @context, invalid JSON, wrong @type

### Section 2: Injection
See `references/injection-patterns.md`
- Article schema for blog posts
- Product schema for WooCommerce
- FAQ schema for Q&A content
- HowTo schema for tutorials
- Use `sd_inject` with post_id, schema_type, schema_data

### Section 3: Site Audit
- List all schema types: `sd_list_schemas`
- Filter by type: `sd_list_schemas` with `schema_type`
- Identify posts without structured data
- Coverage report: total posts vs posts with schema

### Section 4: Schema Types
See `references/schema-types.md`
- Supported types and their required/recommended properties
- Mapping WordPress content types to Schema.org types
- Rich result eligibility per type

## MCP Tools

| Tool | Description |
|------|-------------|
| `sd_validate` | Validate JSON-LD from URL or raw markup |
| `sd_inject` | Inject/update JSON-LD in post meta |
| `sd_list_schemas` | List Schema.org types across the site |

## Reference Files

| File | Content |
|------|---------|
| `references/schema-types.md` | Supported Schema.org types with required properties |
| `references/validation-guide.md` | Validation workflow, common issues, fixes |
| `references/injection-patterns.md` | Injection patterns per content type |

## Recommended Agent

**`wp-content-strategist`** — coordinates structured data with content creation and SEO optimization.

## Related Skills

- **`wp-content`** — content lifecycle management (source for schema injection)
- **`wp-content-optimization`** — SEO scoring and meta optimization
- **`wp-search-console`** — track rich result impressions in Google Search Console
- **`wp-woocommerce`** — product structured data for e-commerce
- **`wp-programmatic-seo`** — bulk schema injection for template pages
