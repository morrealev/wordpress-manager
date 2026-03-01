---
name: wp-content-optimization
description: This skill should be used when the user asks to "optimize content",
  "improve headlines", "readability analysis", "SEO score", "content scoring",
  "meta description optimization", "content freshness", "content audit",
  "content triage", "bulk content optimization", "headline score",
  "Flesch-Kincaid", "keyword density", or mentions improving existing
  WordPress content quality and performance.
version: 1.0.0
---

# WordPress Content Optimization Skill

## Overview

AI-driven content optimization using Claude's linguistic analysis combined with GSC data (v2.5.0) and WooCommerce attribution data. No external optimization APIs are needed — this skill uses existing WP REST Bridge tools plus Claude's built-in analysis capabilities to perform headline scoring, readability analysis, SEO density checks, meta optimization, content freshness audits, and bulk content triage.

## Philosophy

This is Claude-native. No external optimization APIs like Clearscope, SurferSEO, or MarketMuse are required. Claude itself performs headline analysis, readability scoring, SEO density checks, and content classification by leveraging its linguistic capabilities directly on content fetched through the WP REST Bridge.

## When to Use

- User wants to improve existing content quality
- User needs headline/title optimization with scoring
- User asks about readability (Flesch-Kincaid, sentence length)
- User wants SEO content scoring (keyword density, H-tag coverage)
- User needs meta description optimization based on CTR data
- User wants content freshness audit (find stale content)
- User needs bulk content triage (quick wins vs rewrite vs archive)

## Decision Tree

1. **What type of optimization?**
   - "optimize headline" / "title score" / "headline analysis" → Headline Analysis (Section 1)
   - "readability" / "Flesch-Kincaid" / "sentence length" → Readability Analysis (Section 2)
   - "SEO score" / "keyword density" / "content scoring" → SEO Content Scoring (Section 3)
   - "meta description" / "title tag" / "CTR optimization" → Meta Description Optimization (Section 4)
   - "content freshness" / "stale content" / "outdated posts" → Content Freshness Audit (Section 5)
   - "content triage" / "bulk optimize" / "content audit" → Bulk Content Triage (Section 6 — combines all above)

2. **Run detection first:**
   ```bash
   node skills/wp-content-optimization/scripts/content_optimization_inspect.mjs [--cwd=/path/to/project]
   ```
   This identifies available content, GSC integration status, and WooCommerce data availability.

## Procedures Overview

| # | Procedure | Input | Output |
|---|-----------|-------|--------|
| 1 | Headline Analysis | Title + target keyword | Score 1-10, 3 optimized alternatives |
| 2 | Readability Analysis | Body content | Flesch-Kincaid score, long sentences, suggestions |
| 3 | SEO Content Scoring | Body + keyword + GSC data | Keyword density, H2/H3 coverage, internal linking gaps |
| 4 | Meta Description Optimization | Current meta + GSC CTR data | Optimized meta for CTR, A/B variant |
| 5 | Content Freshness Audit | Content list + publish date | Stale content identified, update priorities |
| 6 | Bulk Content Triage | N contents + GSC data | Classified: quick wins, needs rewrite, archive |

## Bulk Content Triage Classification

| Category | Criteria | Action |
|----------|----------|--------|
| Quick Wins | High traffic + low CTR, weak headline | Optimize title/meta |
| Needs Rewrite | >12 months, low readability, keyword off-target | Rewrite content |
| Performing | High traffic + high CTR | Maintain, refresh date |
| Archive | Zero traffic >6 months, no keywords | 301 redirect or noindex |

## Sections

### Section 1: Headline Analysis
See `references/headline-optimization.md`
- Headline scoring criteria (1-10 scale based on keyword placement, power words, length, clarity)
- Power word categories (emotional, urgency, curiosity, value)
- Headline formulas (How-to, List, Question, Comparison)
- Target keyword placement in headlines
- A/B title generation workflow
- Example: fetch via `list_content` → Claude analyzes → generate alternatives → `update_content`

### Section 2: Readability Analysis
See `references/readability-analysis.md`
- Flesch-Kincaid scoring (target: 60-70 for general audience)
- Sentence length analysis (target: <20 words average)
- Passive voice detection and reduction
- Paragraph length guidelines
- Jargon and complexity detection
- Workflow: fetch content → analyze text → suggest improvements → update

### Section 3: SEO Content Scoring
See `references/seo-content-scoring.md`
- Keyword density check (target: 1-2% primary keyword)
- H2/H3 hierarchy coverage (are subheadings using secondary keywords?)
- Internal linking analysis (minimum 2-3 internal links per post)
- External linking (1-2 authoritative sources)
- Image alt text coverage
- Combining with `gsc_search_analytics` for keyword data

### Section 4: Meta Description Optimization
See `references/meta-optimization.md`
- Title tag best practices (under 60 chars, keyword first)
- Meta description guidelines (under 160 chars, compelling CTA, keyword inclusion)
- Using GSC CTR data to identify low-CTR pages for optimization
- A/B variant generation for testing
- Rich snippet optimization hints

### Section 5: Content Freshness Audit
See `references/content-freshness.md`
- Content decay patterns (traffic drop over time)
- Freshness signals (published date, modified date, data accuracy)
- Refresh strategies: date update, data refresh, section expansion, republish
- Evergreen vs temporal content classification
- Workflow: `list_content` by date → analyze age → check GSC traffic trends → prioritize

### Section 6: Bulk Content Triage
Combines all sections above into a single audit workflow:
1. Fetch all published content via `list_content`
2. Pull GSC performance data via `gsc_page_performance` and `gsc_top_queries`
3. Run headline analysis (Section 1) on each title
4. Run readability analysis (Section 2) on each body
5. Run SEO content scoring (Section 3) on each post
6. Cross-reference with GSC CTR data for meta optimization (Section 4)
7. Check publish dates for freshness audit (Section 5)
8. Classify each content piece into the triage categories above
9. Generate prioritized action list

## Reference Files

| File | Content |
|------|---------|
| `references/headline-optimization.md` | Headline formulas, power words, scoring criteria |
| `references/readability-analysis.md` | Flesch-Kincaid, sentence length, passive voice, jargon |
| `references/seo-content-scoring.md` | Keyword density, H-tag hierarchy, internal link analysis |
| `references/meta-optimization.md` | Title tag + meta description best practices, CTR optimization |
| `references/content-freshness.md` | Content decay, refresh strategies, evergreen vs temporal |

## MCP Tools Used

These are existing tools used by the optimization procedures (no new tools introduced):

### WP REST Bridge

| Tool | Usage |
|------|-------|
| `list_content` | Fetch published content for analysis |
| `get_content` | Get full content body for individual post analysis |
| `update_content` | Apply optimized titles, meta descriptions, content updates |

### Google Search Console (if available)

| Tool | Usage |
|------|-------|
| `gsc_page_performance` | Page-level traffic data for triage classification |
| `gsc_top_queries` | Top queries for keyword density validation |
| `gsc_search_analytics` | Detailed search metrics for CTR-based meta optimization |

### WooCommerce (if available)

| Tool | Usage |
|------|-------|
| `wc_get_orders` | Attribution data linking content to conversions |
| `wc_list_products` | Product pages for content-commerce optimization |

## Recommended Agent

Use the **`wp-content-strategist`** agent for content optimization workflows that combine Claude's linguistic analysis with search performance data and WordPress content management.

## Related Skills

- **`wp-content`** — create and manage WordPress content
- **`wp-search-console`** — search performance data for optimization decisions
- **`wp-content-attribution`** — track content sources and attribute traffic
- **`wp-programmatic-seo`** — generate SEO-optimized content at scale
- **`wp-social-email`** — distribute optimized content across channels
- Per prioritizzare ottimizzazione con dati CWV, combina `wp-analytics` + `wp-content-optimization`
