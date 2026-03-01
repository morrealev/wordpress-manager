---
name: wp-content-generation
description: This skill should be used when the user asks to "generate content",
  "write a blog post", "create an article", "AI content", "content brief", "draft
  a post", "genera contenuto", "scrivi post", "crea articolo", "genera bozza",
  "content pipeline", "create content from brief", or mentions AI-assisted content
  creation for WordPress.
version: 1.0.0
---

# WordPress Content Generation Skill

## Overview

AI-driven content generation pipeline for WordPress. This skill guides Claude through a structured 7-step process: from content brief to published, SEO-optimized post with structured data. It uses existing MCP tools — no new tools are introduced.

## When to Use

- User wants to create new blog posts or articles with AI assistance
- User has a content brief or topic and wants a full draft
- User asks for SEO-optimized content creation
- User wants to generate content with structured data included
- User mentions content pipeline, content brief, or AI writing

## Content Generation vs Content Repurposing

| Need | Skill |
|------|-------|
| Create new original content from scratch | `wp-content-generation` (this skill) |
| Transform existing content for new channels | `wp-content-repurposing` |
| Edit/update existing posts | `wp-content` |
| Bulk page generation from templates | `wp-programmatic-seo` |

## Decision Tree

1. **What does the user need?**
   - "write a post" / "create article" / "generate content" → Full Pipeline (Section 1)
   - "content brief" / "what to write about" → Brief Creation (Section 2)
   - "outline" / "structure" / "plan the article" → Outline Patterns (Section 3)
   - "optimize" / "SEO" / "improve draft" → Integrate with `wp-content-optimization`

2. **Run detection first:**
   ```bash
   node skills/wp-content-generation/scripts/content_gen_inspect.mjs [--cwd=/path/to/project]
   ```
   This checks for REST API access, GSC availability, and existing content volume.

## The 7-Step Pipeline

### Step 1: Brief
Define the content brief with target audience, goal, and constraints.
See `references/brief-templates.md`

**Input from user:**
- Topic or keyword
- Target audience
- Content goal (inform, convert, engage)
- Word count target (optional)

### Step 2: Keyword Research
Use GSC data (if available) to identify keyword opportunities.

**Tools used:**
- `gsc_query_analytics` — find related queries with impressions and CTR
- `gsc_list_pages` — check existing content for the keyword to avoid cannibalization

**Fallback:** If GSC not configured, use the topic as primary keyword and suggest 3-5 related terms based on semantic analysis.

### Step 3: Outline
Create a structured outline with H2/H3 hierarchy.
See `references/outline-patterns.md`

**Output:** Markdown outline with headings, key points per section, target word count per section.

### Step 4: Draft
Generate the full draft following the outline.

**Writing guidelines:**
- Match the site's existing voice and tone (analyze recent posts)
- Include data, examples, and actionable takeaways
- Write naturally — avoid AI-typical phrases ("delve into", "it's important to note")
- Target the specified word count (default: 1,200-1,500 words)

### Step 5: SEO Optimize
Apply on-page SEO using `wp-content-optimization` patterns.

**Checks:**
- Primary keyword in title, first paragraph, and 1-2 H2s
- Meta description (150-160 chars) with keyword
- Internal linking to 2-3 related posts (find via `wp_list_posts`)
- Image alt text with keyword
- Readability: short paragraphs, sub-headings every 300 words

### Step 6: Structured Data
Add appropriate Schema.org markup using `sd_inject`.

**Auto-detection:**
- Contains FAQ section → FAQPage schema
- Is a how-to/tutorial → HowTo schema
- Default → Article schema

### Step 7: Publish
Create the post via WordPress REST API.

**Tools used:**
- `create_content` — create the post (status: draft by default)
- `sd_inject` — add structured data
- User confirms before changing status to `publish`

## Reference Files

| File | Content |
|------|---------|
| `references/generation-workflow.md` | Detailed 7-step pipeline with prompts and checkpoints |
| `references/brief-templates.md` | Brief templates for different content types |
| `references/outline-patterns.md` | Outline structures for articles, tutorials, listicles |

## Recommended Agent

**`wp-content-strategist`** — coordinates the full pipeline, selects keywords, creates outlines, and manages the publish workflow.

## Related Skills

- **`wp-content`** — content lifecycle management and editing
- **`wp-content-optimization`** — SEO scoring, readability analysis, meta optimization
- **`wp-search-console`** — keyword data for Step 2 (keyword research)
- **`wp-structured-data`** — schema injection for Step 6
- **`wp-content-repurposing`** — distribute published content to social/email channels
