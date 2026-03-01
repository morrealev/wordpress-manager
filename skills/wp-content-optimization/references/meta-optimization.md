# Meta Description and Title Tag Optimization

## Overview

Title tags and meta descriptions are the first impression users see in search results. Optimizing these elements directly impacts click-through rate (CTR). Claude generates optimized meta elements by combining best practices with GSC CTR data, then produces A/B variants for testing. This process uses existing WP REST Bridge and GSC tools — no additional APIs needed.

## Title Tag Best Practices

### Rules

| Rule | Standard |
|------|----------|
| Maximum length | 60 characters (Google truncates at ~60) |
| Keyword placement | Primary keyword in the first 3-4 words |
| Uniqueness | Every page must have a unique title |
| Brand inclusion | Optional, at end with pipe separator |
| Keyword repetition | Keyword appears once only |
| Readability | Must make sense as a standalone phrase |

### Title Tag Formula
```
[Primary Keyword] — [Benefit or Differentiator] | [Brand]
```

### Character Count Optimization
```
Ideal:   50-60 characters (full display in all search results)
OK:      40-50 characters (may look short but fully visible)
Warning: 60-65 characters (partial truncation on some devices)
Error:   65+ characters (truncated, meaning lost)
Too Short: <30 characters (underutilizing title space)
```

### Examples
```
Good (55 chars): "WordPress Speed Optimization — 10 Proven Techniques | Brand"
Good (48 chars): "How to Speed Up WordPress in 2026 | Brand"
Bad (72 chars):  "The Complete and Ultimate Guide to WordPress Speed Optimization Tips 2026"
Bad (18 chars):  "Speed Tips"
```

## Meta Description Guidelines

### Rules

| Rule | Standard |
|------|----------|
| Maximum length | 155-160 characters |
| Minimum length | 120 characters (shorter looks incomplete) |
| Keyword inclusion | Primary keyword once, naturally |
| Call to action | Include an action verb (learn, discover, get, try) |
| Uniqueness | Every page must have a unique description |
| Emotional trigger | Include benefit or pain point |
| Specificity | Use numbers, data, or specific outcomes |

### Meta Description Formula
```
[Action verb] [what the reader gets/learns]. [Specific detail or data point]. [CTA].
```

### Examples
```
Good (152 chars):
"Learn 10 proven WordPress speed optimization techniques that cut load time
by 50%. Step-by-step guide with benchmarks. Start optimizing today."

Bad (89 chars):
"This article is about WordPress speed optimization. Read more on our website."

Bad (185 chars):
"In this comprehensive and detailed guide we will cover everything you need to
know about optimizing your WordPress website for speed including caching and
image optimization techniques."
```

## Using GSC CTR Data for Optimization

### Identifying Low-CTR Pages

#### Step 1: Pull Page Performance Data
```
Use gsc_page_performance to get CTR data for all pages.
Sort by impressions (descending) to focus on high-visibility pages first.
```

#### Step 2: CTR Benchmarks by Position

| Average Position | Expected CTR | Below Average |
|-----------------|-------------|---------------|
| 1 | 25-35% | <20% |
| 2 | 12-18% | <10% |
| 3 | 8-12% | <6% |
| 4-5 | 5-8% | <4% |
| 6-10 | 2-5% | <2% |

#### Step 3: Flag Optimization Candidates
Pages with high impressions but below-average CTR are prime candidates:
```
Example:
Page: /wordpress-speed-guide
Position: 3
Impressions: 5,000/month
CTR: 4.2% (expected 8-12% for position 3)
→ META OPTIMIZATION NEEDED — potential to double clicks
```

#### Step 4: Analyze Current Meta
```
Use get_content to fetch the current title tag and meta description.
Evaluate against the rules above.
Identify specific issues (too long, missing keyword, no CTA, etc.).
```

### CTR Impact Estimation
```
Current: Position 3, 5000 impressions, 4.2% CTR = 210 clicks/month
After optimization to 8% CTR: 5000 × 0.08 = 400 clicks/month
Potential gain: +190 clicks/month (+90% improvement)
```

## A/B Variant Generation

### Process

#### Step 1: Generate Two Variants
Claude generates two meta description variants using different approaches:

**Variant A: Benefit-focused**
```
"Cut your WordPress load time by 50% with these 10 proven optimization
techniques. Includes caching, image compression, and CDN setup. Free guide."
```

**Variant B: Problem-focused**
```
"Slow WordPress site losing visitors? Fix it with 10 tested speed
techniques. Average improvement: 50% faster. Step-by-step instructions."
```

#### Step 2: Score Both Variants

| Criteria | Variant A | Variant B |
|----------|-----------|-----------|
| Keyword presence | Yes (1st sentence) | Yes (1st sentence) |
| Length | 148 chars ✓ | 142 chars ✓ |
| CTA | "Free guide" | "Step-by-step" |
| Emotional trigger | Benefit (cut load time) | Pain (losing visitors) |
| Specificity | 50%, 10 techniques | 50% faster |
| Readability | Clear | Clear |

#### Step 3: Apply and Monitor
```
Apply the highest-scoring variant via update_content.
Set a review date 2-4 weeks out.
Compare CTR data in GSC after the review period.
```

### Title Tag A/B Variants
Same process for title tags:
```
Original: "WordPress Speed Guide"
Variant A: "WordPress Speed Optimization — 10 Techniques That Work"
Variant B: "How to Speed Up WordPress by 50% (2026 Guide)"
```

## Rich Snippet Optimization

### Content-Type Specific Guidance

| Content Type | Rich Snippet Opportunity | Meta Optimization |
|-------------|------------------------|-------------------|
| How-to articles | HowTo schema | Include "how to" in title, steps count in meta |
| FAQ pages | FAQPage schema | Include question in title, "answers" in meta |
| Product pages | Product schema (rating, price) | Include price/rating in meta |
| Review posts | Review schema (star rating) | Include rating in title/meta |
| List posts | ItemList schema | Include count in title ("10 Best...") |

### Meta for Featured Snippets
To optimize for position zero:
- Structure content to answer specific questions
- Use the question as an H2 heading
- Provide a concise answer in the first paragraph (40-60 words)
- Follow with detailed explanation
- Include a summary table or list

## Step-by-Step Workflow

### Step 1: Identify Optimization Targets
```
Use gsc_page_performance to find pages with:
- High impressions (>500/month)
- Below-average CTR for their position
- Sort by potential impact (impressions × CTR gap)
```

### Step 2: Fetch Current Meta Elements
```
Use get_content for each target page.
Extract: title tag, meta description, H1, URL slug.
```

### Step 3: Analyze and Score Current Meta
Claude evaluates each element against rules above:
- Title: length, keyword position, clarity, brand
- Description: length, keyword, CTA, emotional trigger, specificity

### Step 4: Generate Optimized Variants
For each page, Claude produces:
- 2 title tag variants
- 2 meta description variants
- Score comparison with current version
- Estimated CTR impact

### Step 5: Apply Changes
```
Use update_content to apply the winning variants.
Document changes for tracking:
- Page URL
- Previous title/meta
- New title/meta
- Date changed
- Baseline CTR from GSC
```

### Step 6: Monitor Results
After 2-4 weeks:
```
Use gsc_page_performance to pull updated CTR data.
Compare against baseline.
Iterate if CTR did not improve.
```

## Best Practices

- Prioritize high-impression pages first (biggest impact from small CTR gains)
- Never duplicate meta descriptions across pages
- Avoid meta descriptions that do not match page content (causes bounce)
- Include the year in title tags for time-sensitive content (guides, reviews)
- Use active voice and power verbs in meta descriptions
- Test one change at a time to isolate impact
- Review and refresh meta descriptions quarterly
- Consider search intent when crafting meta — informational vs transactional queries need different approaches
- Do not force keywords into meta descriptions unnaturally — readability trumps keyword presence
