# SEO Content Scoring

## Overview

SEO content scoring evaluates how well a piece of WordPress content is optimized for search engines. Claude performs keyword density analysis, heading hierarchy assessment, internal and external linking checks, image alt text coverage, and content structure evaluation. When GSC data is available, Claude cross-references actual search queries to validate keyword targeting.

## Keyword Density Analysis

### Target Ranges

| Keyword Type | Target Density | Minimum | Maximum |
|-------------|---------------|---------|---------|
| Primary keyword | 1-2% | 0.5% | 3% |
| Secondary keywords | 0.5-1% each | 0.3% | 1.5% |
| LSI/related terms | Natural occurrence | — | — |

### Density Calculation
```
Keyword Density = (Number of keyword occurrences / Total word count) × 100
```

### Placement Rules
1. **Title (H1)** — primary keyword must appear (preferably front-loaded)
2. **First paragraph** — primary keyword within first 100 words
3. **Subheadings** — primary or secondary keyword in at least 1 H2
4. **Body distribution** — keyword spread throughout, not clustered
5. **Last paragraph** — primary keyword in conclusion
6. **URL slug** — primary keyword in the URL

### Keyword Stuffing Detection
Flag when:
- Primary keyword density exceeds 3%
- Same keyword appears in consecutive sentences
- Keyword is forced into unnatural phrasing
- Multiple exact-match keyword repetitions in one paragraph

### Example Analysis
```
Post: "WordPress Speed Optimization Guide" (1500 words)
Primary keyword: "wordpress speed optimization"

Occurrences: 18 times
Density: 18/1500 × 100 = 1.2% ✓ Within target

Distribution:
- Title: ✓ Present
- First paragraph: ✓ Present (word 12)
- H2 headings: ✓ 1 of 4 H2s contains keyword
- Last paragraph: ✓ Present
- URL: ✓ /wordpress-speed-optimization-guide
```

## H2/H3 Hierarchy Coverage

### Structure Requirements

| Element | Requirement | Check |
|---------|------------|-------|
| H1 | Exactly 1 per page, contains primary keyword | Required |
| H2 | 2-6 per post, secondary keywords in 50%+ | Required |
| H3 | As needed under H2, long-tail keywords | Recommended |
| H4+ | Rare, deep detail only | Optional |
| Skip levels | Never (H1 → H3 without H2) | Flag as error |

### Heading Optimization Checklist
- [ ] One H1 only, matching the post title
- [ ] H2s outline the main sections (scannable table of contents)
- [ ] At least one H2 contains the primary keyword
- [ ] H3s provide detail under their parent H2
- [ ] No heading level is skipped
- [ ] Headings are descriptive (not generic like "More Info")
- [ ] Secondary keywords distributed across H2/H3 headings

### Example Heading Audit
```
H1: WordPress Speed Optimization: Complete Guide          ✓ Primary keyword
  H2: Why WordPress Speed Matters                         ✓ Descriptive
    H3: Impact on SEO Rankings                            ✓ Secondary keyword
    H3: Impact on User Experience                         ✓ Related term
  H2: How to Measure WordPress Speed                      ✓ Secondary keyword
  H2: 10 WordPress Speed Optimization Techniques          ✓ Primary keyword
    H3: Enable Caching                                    ✓ Specific
    H3: Optimize Images                                   ✓ Specific
    H3: Minimize CSS and JavaScript                       ✓ Specific
  H2: Conclusion                                          ⚠ Generic, add keyword
```

## Internal Linking Analysis

### Minimum Standards

| Content Length | Internal Links | Rationale |
|---------------|---------------|-----------|
| < 500 words | 1-2 links | Short content, few linking opportunities |
| 500-1000 words | 2-3 links | Standard blog post |
| 1000-2000 words | 3-5 links | In-depth article |
| 2000+ words | 5-8 links | Pillar content, extensive topic |

### What to Check
1. **Link count** — meets minimum for content length
2. **Anchor text** — descriptive, keyword-rich (not "click here")
3. **Link relevance** — linked pages are topically related
4. **Link distribution** — links spread throughout content, not clustered
5. **Orphan detection** — identify posts with zero inbound internal links
6. **Reciprocal links** — pillar pages link to cluster posts and vice versa

### Link Opportunity Detection
Claude identifies linking opportunities by:
- Finding mentions of topics that have dedicated pages on the site
- Detecting keyword phrases that match other post titles
- Identifying related content that could provide context
- Suggesting links to pillar pages from cluster content

## External Linking

### Guidelines

| Metric | Target |
|--------|--------|
| External links per post | 1-2 minimum |
| Link targets | Authoritative, relevant sources (.gov, .edu, industry leaders) |
| Link freshness | Source content should be current (not outdated) |
| Nofollow | Use for sponsored or untrusted links |
| Open in new tab | Yes for external links (target="_blank") |

### What to Avoid
- Linking to direct competitors' commercial pages
- Linking to low-authority or spammy sites
- Excessive external links (>5 per 1000 words)
- Broken external links (check periodically)

## Image Alt Text Coverage

### Requirements
| Check | Standard |
|-------|----------|
| All images have alt text | 100% coverage required |
| Alt text includes keyword | At least 1 image per post |
| Alt text is descriptive | Describes the image content |
| Alt text length | 5-15 words |
| Decorative images | Empty alt="" (not missing alt) |

### Example
```
Good: alt="WordPress performance optimization dashboard showing page load times"
Bad:  alt="image1" or alt="" (on informational image) or alt missing
```

## Combining with GSC Data

When Google Search Console is available, enrich the SEO scoring with real search data:

### Step 1: Fetch Search Queries for the Page
```
Use gsc_search_analytics with the page URL to get actual queries driving traffic.
```

### Step 2: Compare Target vs Actual Keywords
```
Target keyword: "wordpress speed optimization"
Actual top queries from GSC:
  1. "wordpress speed" (pos 8, 500 impressions)
  2. "wordpress performance" (pos 12, 300 impressions)
  3. "how to speed up wordpress" (pos 15, 200 impressions)

Analysis: Content ranks for related terms but not the exact target.
Action: Strengthen primary keyword presence, add "how to speed up wordpress" as H2.
```

### Step 3: Identify Keyword Gaps
- Queries with high impressions but low CTR → meta description issue
- Queries with high position (>10) → content depth issue
- Queries the page ranks for that are not in the content → add sections

## SEO Content Score Card

### Scoring Template
```
SEO Content Score for: "Post Title"
═════════════════════════════════════
Keyword Density:      1.2%    ✓ (target: 1-2%)
Keyword in H1:        Yes     ✓
Keyword in First 100: Yes     ✓
Keyword in URL:       Yes     ✓

H2 Count:             4       ✓ (target: 2-6)
H2 with Keywords:     2/4     ✓ (target: 50%+)
H3 Count:             6       ✓
Heading Hierarchy:    Valid   ✓ (no skipped levels)

Internal Links:       2       ⚠ (target: 3-5 for 1200 words)
External Links:       1       ✓ (target: 1-2)
Anchor Text Quality:  Good    ✓

Image Alt Coverage:   3/4     ⚠ (1 image missing alt text)
Keyword in Alt:       1/4     ✓

Overall Score:        7.5/10
Priority Fixes:
1. Add 1-2 more internal links to related content
2. Add alt text to image in section 3
```

## Step-by-Step Workflow

### Step 1: Fetch Content
```
Use get_content to retrieve the full post HTML.
Parse headings, links, images, and body text.
```

### Step 2: Identify Target Keyword
Either provided by user or extracted from:
- Post title analysis
- GSC top query for the URL
- Content theme analysis

### Step 3: Run All Checks
Claude analyzes in sequence:
1. Keyword density and placement
2. Heading hierarchy and keyword coverage
3. Internal and external link audit
4. Image alt text coverage
5. GSC data cross-reference (if available)

### Step 4: Generate Score Card
Produce the formatted score card with pass/fail for each criterion.

### Step 5: Prioritize Fixes
Rank issues by impact:
1. Missing keyword in title/H1 (highest impact)
2. Keyword density out of range
3. No internal links
4. Missing alt text
5. Heading hierarchy issues
6. External link additions

## Best Practices

- Run SEO scoring before publishing (pre-publish checklist)
- Re-score after content updates to ensure changes did not break optimization
- Use GSC data to validate keyword targeting against real search behavior
- Do not sacrifice readability for SEO score — readability comes first
- Update scoring analysis quarterly as search patterns evolve
- Track score changes over time to measure optimization impact
