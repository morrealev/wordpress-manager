# Content Freshness Audit

## Overview

Content freshness measures how current and accurate published content remains over time. Search engines factor freshness into rankings, and stale content can erode traffic and authority. Claude performs content freshness audits by analyzing publish dates, modification history, traffic trends from GSC, and content accuracy — then classifies content into refresh priorities. This workflow uses `list_content`, `get_content`, and GSC tools.

## Content Decay Patterns

### What Is Content Decay
Content decay occurs when a page gradually loses organic traffic over time due to:
- Newer, more comprehensive competitor content
- Outdated statistics, data, or references
- Changed search intent for target keywords
- Algorithm updates favoring fresher content
- Broken links or outdated external references

### Decay Timeline

| Content Age | Risk Level | Typical Action |
|-------------|-----------|----------------|
| 0-6 months | Low | Monitor, no action needed |
| 6-12 months | Medium | Review for accuracy, consider minor updates |
| 12-18 months | High | Data refresh, section updates required |
| 18-24 months | Very High | Major refresh or rewrite |
| 24+ months | Critical | Full rewrite, republish, or archive |

### Decay Signals
Indicators that content is decaying:
1. **Traffic decline** — steady month-over-month drop in organic traffic (via GSC)
2. **Position drops** — average position worsening for target keywords
3. **Impression decline** — fewer impressions means less search visibility
4. **Bounce rate increase** — users leaving quickly (content not meeting expectations)
5. **Outdated references** — statistics from 2+ years ago, dead links

## Freshness Signals

### What Search Engines Evaluate

| Signal | Description | WordPress Field |
|--------|-------------|-----------------|
| Published date | Original publication date | `date` |
| Modified date | Last content modification | `modified` |
| Content changes | Actual meaningful edits (not cosmetic) | Content diff |
| Data currency | Statistics and facts are current | Manual check |
| Link freshness | External links still active and current | Automated check |

### Meaningful vs Cosmetic Updates
```
Meaningful updates (search engines recognize):
- Adding new sections or paragraphs
- Updating statistics and data points
- Adding new examples or case studies
- Expanding topic coverage
- Updating recommendations based on new information

Cosmetic updates (do NOT count as fresh):
- Changing the date without content changes
- Fixing typos or minor formatting
- Rearranging existing content
- Adding images without new text
- Changing the author
```

## Refresh Strategies

### Strategy 1: Date and Data Refresh
**When to use:** Content is fundamentally sound but contains outdated numbers or references.
```
Effort: Low (30 min - 1 hour)
Impact: Medium
Actions:
- Update statistics with current data
- Replace outdated year references
- Verify all external links still work
- Update the modified date
```

### Strategy 2: Section Expansion
**When to use:** Content covers the topic but competitors have more depth.
```
Effort: Medium (1-3 hours)
Impact: High
Actions:
- Add 1-3 new sections addressing gaps
- Add FAQ section based on current search queries
- Include updated examples or case studies
- Add internal links to newer related content
```

### Strategy 3: Full Rewrite
**When to use:** Content is outdated, poorly structured, or fundamentally off-target.
```
Effort: High (3-6 hours)
Impact: Very High
Actions:
- Rewrite from scratch with current keyword research
- Maintain the same URL (preserve any existing backlinks)
- Update all meta elements (title, description)
- Republish with current date
- Submit to GSC for re-indexing
```

### Strategy 4: Republish
**When to use:** Content is significantly updated and should be treated as new.
```
Effort: Medium (after rewrite)
Impact: High
Actions:
- Change publish date to current date
- Share on social channels as new content
- Update internal links pointing to this page
- Submit URL to GSC for re-crawling
```

### Strategy 5: Archive / Redirect
**When to use:** Content has no traffic, no keyword value, and no update potential.
```
Effort: Low
Impact: Positive (reduces index bloat)
Actions:
- Set up 301 redirect to the most relevant active page
- Or add noindex meta tag
- Remove from XML sitemap
- Remove internal links pointing to this page
```

## Evergreen vs Temporal Content

### Classification

| Type | Characteristics | Freshness Need | Examples |
|------|----------------|----------------|----------|
| Evergreen | Topic stays relevant, answers don't change | Low (annual review) | "How to Install WordPress", "What Is SEO" |
| Semi-Evergreen | Core topic stable, details change | Medium (6-12 months) | "Best WordPress Plugins 2026", "WordPress Security Guide" |
| Temporal | Time-bound, loses relevance quickly | High (monthly or event-based) | "WordPress 6.5 New Features", "Black Friday Deals 2026" |
| News | Immediate relevance, short lifespan | Not refreshable | "WordPress Acquires Company X" |

### Strategy by Content Type

| Type | Refresh Strategy | Frequency |
|------|-----------------|-----------|
| Evergreen | Minor data updates, link checks | Every 12 months |
| Semi-Evergreen | Section expansion, data refresh | Every 6-12 months |
| Temporal | Full rewrite for new period or archive | When period expires |
| News | Archive (301 to evergreen resource) | When news cycle ends |

## Content Freshness Audit Workflow

### Step 1: Inventory All Content
```
Use list_content to fetch all published posts and pages.
Collect: post ID, title, URL, publish date, modified date, category.
Sort by publish date (oldest first).
```

### Step 2: Calculate Content Age
```
For each content piece:
- Age = current date - publish date
- Days since last update = current date - modified date
- Flag: age > 12 months AND no modification in 6+ months
```

### Step 3: Pull Traffic Trends (GSC)
```
Use gsc_page_performance for each page (or top pages by age).
Compare last 3 months vs previous 3 months:
- Traffic trend: growing, stable, or declining
- Position trend: improving, stable, or worsening
- CTR trend: improving, stable, or declining
```

### Step 4: Classify Each Content Piece
```
For each piece of content, assign a freshness category:

| Category | Criteria |
|----------|---------|
| Fresh | <6 months old OR recently updated with growing traffic |
| Aging | 6-12 months, stable traffic, no recent updates |
| Stale | 12-18 months, declining traffic, no updates |
| Decayed | 18+ months, significant traffic loss |
| Dead | 24+ months, near-zero traffic, no keyword rankings |
```

### Step 5: Assign Refresh Priority
```
Priority 1 (Urgent): Stale content with high historical traffic → quick refresh
Priority 2 (High):   Aging content in important categories → preventive refresh
Priority 3 (Medium): Decayed content with some keyword potential → rewrite
Priority 4 (Low):    Dead content with no recovery potential → archive/redirect
```

### Step 6: Generate Audit Report
```
Content Freshness Audit Report
══════════════════════════════
Total Content Pieces: 85
Fresh (0-6 months):    12 (14%)
Aging (6-12 months):   23 (27%)
Stale (12-18 months):  28 (33%)
Decayed (18-24 months): 15 (18%)
Dead (24+ months):       7 (8%)

Priority Actions:
┌─────────┬────────────────────────────────────┬───────────┬──────────────┐
│ Priority│ Content                            │ Age       │ Action       │
├─────────┼────────────────────────────────────┼───────────┼──────────────┤
│ 1       │ "WordPress Speed Guide"            │ 14 months │ Data refresh │
│ 1       │ "Best WooCommerce Plugins"         │ 16 months │ Rewrite      │
│ 2       │ "How to Install WordPress"         │ 10 months │ Review       │
│ 4       │ "WordPress 5.9 Features"           │ 26 months │ Archive      │
└─────────┴────────────────────────────────────┴───────────┴──────────────┘
```

### Step 7: Execute Refresh Plan
For each priority item, apply the appropriate refresh strategy:
```
Use get_content to fetch the full content.
Apply the selected refresh strategy (data refresh, expansion, rewrite).
Use update_content to publish the updated version.
Submit refreshed URLs to GSC for re-crawling if significantly changed.
```

## Best Practices

- Run freshness audits quarterly (every 3 months) for sites with 50+ posts
- Prioritize high-traffic decaying content over zero-traffic content
- Always refresh meaningfully — date-only changes do not fool search engines
- Track content age as a standard metric alongside traffic and rankings
- Set calendar reminders for semi-evergreen content refresh cycles
- When refreshing, also update internal links from other posts pointing to the refreshed content
- Keep a content calendar that includes refresh dates alongside new content publication
- Consider combining freshness audits with the Bulk Content Triage procedure (SKILL.md Section 6) for comprehensive content management
