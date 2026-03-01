---
name: wp-content
description: This skill should be used when the user asks to "create a blog post",
  "write content", "manage pages", "update content", "content strategy", "editorial
  calendar", "bulk publish", "manage categories", or mentions WordPress content operations.
  Provides SEO-aware content workflows and editorial best practices.
version: 1.0.0
---

# WordPress Content Management Skill

## Overview

Guides content creation, optimization, and management workflows for WordPress sites. Ensures all content follows SEO best practices and editorial standards.

## When to Use

- User wants to create or update blog posts, pages, or custom content
- User needs help organizing content with categories and tags
- User asks about content strategy or editorial workflows
- User wants to optimize existing content for SEO
- User needs to perform bulk content operations

## Content Lifecycle

```
IDEATION → DRAFT → REVIEW → OPTIMIZE → PUBLISH → MONITOR
```

### 1. Ideation
- Understand topic, target audience, and keywords
- Check existing content to avoid duplication (`list_content` with search)
- Plan content structure and format

### 2. Draft
- Create content via `create_content` with `status: "draft"`
- Follow content templates in `references/content-templates.md`
- Apply heading hierarchy (single H1, logical H2/H3)

### 3. Review
- Present draft URL to user for review
- Check word count, readability, keyword usage
- Verify all links work

### 4. Optimize
- Apply SEO checklist from `references/seo-optimization.md`
- Set meta description (excerpt)
- Assign categories and tags via `assign_terms_to_content`
- Add featured image

### 5. Publish
- Only publish after user approval
- Use `update_content` to change status from `draft` to `publish`
- Verify published URL is accessible

### 6. Monitor
- Check content appears in site navigation/archives
- Verify search engine indexing (after 24-48 hours)

## Content Operations Reference

### Creating Content
```
Tool: create_content
Required: content_type, title, content
Recommended: excerpt, slug, status (always "draft" initially), categories, tags
```

### Updating Content
```
Tool: update_content
Required: content_type, id
Safety: Always fetch current content first with get_content
```

### Finding Content
```
Tool: find_content_by_url — for URL-based lookup
Tool: get_content_by_slug — for slug-based lookup
Tool: list_content — for filtered searches
```

### Taxonomy Management
```
Tool: discover_taxonomies — list available taxonomies
Tool: create_term — create new category/tag
Tool: assign_terms_to_content — assign terms to content
```

## Safety Rules

- ALWAYS create content as "draft" first — never publish directly
- ALWAYS show the user a preview before publishing
- NEVER delete content without explicit confirmation
- NEVER overwrite existing content without showing changes
- PRESERVE existing SEO-optimized slugs when updating
- CHECK for duplicate slugs before creating new content

## Additional Resources

### Reference Files
- **`references/content-templates.md`** - Templates for different content types
- **`references/seo-optimization.md`** - On-page SEO patterns for WordPress

### Related Skills
- **`wp-content-repurposing`** — transform existing content for social media, email, and multi-channel distribution
- **`wp-content-attribution`** — measure which content drives WooCommerce sales (UTM tracking, attribution models, ROI)
- **wp-social-email** — distribute content to social media and email after creation
- **wp-content-optimization** — optimize existing content: headlines, readability, SEO scoring, meta descriptions, freshness audit
