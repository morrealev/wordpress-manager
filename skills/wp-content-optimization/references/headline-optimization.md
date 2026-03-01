# Headline Optimization

## Overview

Headlines are the single most impactful element for both search CTR and on-page engagement. Claude performs headline analysis by evaluating keyword placement, emotional impact, clarity, length, and formula adherence — then generates scored alternatives. No external headline analyzer APIs are needed.

## Headline Scoring Criteria (1-10 Scale)

| Score | Criteria | Weight |
|-------|----------|--------|
| 0-2 | Keyword presence (primary keyword in title) | 20% |
| 0-2 | Power word usage (emotional/urgency/curiosity) | 20% |
| 0-2 | Length optimization (50-60 chars for SEO, 6-12 words) | 20% |
| 0-2 | Clarity and specificity (reader knows what to expect) | 20% |
| 0-2 | Formula adherence (matches proven headline pattern) | 20% |

### Score Interpretation

| Score | Rating | Action |
|-------|--------|--------|
| 9-10 | Excellent | No changes needed |
| 7-8 | Good | Minor tweaks for improvement |
| 5-6 | Average | Rewrite recommended |
| 3-4 | Below Average | Rewrite required |
| 1-2 | Poor | Complete headline overhaul |

## Power Word Categories

### Emotional Words
- Trust: proven, guaranteed, authentic, certified, trusted
- Fear: warning, dangerous, mistake, avoid, never
- Joy: amazing, incredible, brilliant, stunning, remarkable
- Surprise: secret, shocking, unexpected, little-known, hidden

### Urgency Words
- Time: now, today, immediately, hurry, limited, deadline
- Scarcity: exclusive, rare, only, last chance, while supplies last
- Action: act, rush, grab, claim, don't miss

### Curiosity Words
- Mystery: secret, hidden, little-known, underground, insider
- Question: why, how, what if, did you know, ever wonder
- Incomplete: the real reason, what nobody tells you, the truth about

### Value Words
- Benefit: free, save, boost, increase, maximize, transform
- Ease: simple, easy, quick, effortless, step-by-step, beginner
- Authority: ultimate, complete, definitive, comprehensive, expert

## Headline Formulas

### How-To Formula
```
How to [Achieve Desired Result] [Without Undesired Outcome]
```
Examples:
- "How to Optimize WordPress Speed Without Plugins"
- "How to Write SEO Headlines That Actually Get Clicks"

### List Formula
```
[Number] [Adjective] [Keyword] [Promise/Benefit]
```
Examples:
- "7 Proven Ways to Improve Your WordPress Page Speed"
- "15 Essential WordPress Plugins for Small Business"

### Question Formula
```
[Question Word] [Keyword] [Intriguing Element]?
```
Examples:
- "Why Is Your WordPress Site So Slow? (And How to Fix It)"
- "What Makes the Best WordPress Themes Actually Convert?"

### Comparison Formula
```
[Option A] vs [Option B]: [Decisive Factor]
```
Examples:
- "Yoast vs Rank Math: Which SEO Plugin Actually Performs Better?"
- "WooCommerce vs Shopify: The Complete 2026 Comparison"

### Result Formula
```
[Action] That [Specific Result] in [Timeframe]
```
Examples:
- "WordPress Caching Setup That Cuts Load Time by 60% in 10 Minutes"
- "SEO Fixes That Doubled Our Organic Traffic in 30 Days"

## Keyword Placement Rules

1. **Front-load the keyword** — primary keyword in the first 3-4 words
2. **Natural phrasing** — keyword must read naturally, not forced
3. **Exact match first** — try exact keyword match; partial match as fallback
4. **Avoid keyword stuffing** — keyword appears once in the headline
5. **Brand at the end** — if including brand name, use pipe separator at end

### Examples
```
Good: "WordPress Speed Optimization: 10 Proven Techniques"
       ^ keyword at front

Bad:  "10 Proven Techniques for Making Your WordPress Website Speed Faster"
       ^ keyword buried, awkward phrasing
```

## A/B Title Generation Workflow

### Step 1: Fetch Current Title
```
Use list_content to get the current post title and slug.
```

### Step 2: Analyze Current Title
Claude evaluates the title against the scoring criteria above and assigns a score.

### Step 3: Generate 3 Alternatives
Claude generates three headline variants using different formulas:
- Variant A: Same formula, optimized (improve power words, keyword placement)
- Variant B: Different formula (e.g., if original is How-To, try List)
- Variant C: Curiosity-driven variant (question or result formula)

### Step 4: Score All Variants
Each variant receives a 1-10 score with per-criteria breakdown.

### Step 5: Apply Best Option
```
Use update_content to set the winning title.
Track the change for future CTR comparison via GSC data.
```

## Example Workflow

### Input
```
Current title: "Tips for WordPress"
Target keyword: "WordPress performance optimization"
```

### Analysis
```
Score: 2/10
- Keyword presence: 0/2 (target keyword missing)
- Power words: 0/2 (none)
- Length: 0/2 (too short — 3 words)
- Clarity: 1/2 (vague, no specificity)
- Formula: 1/2 (implied list, but no number)
```

### Generated Alternatives
```
Variant A (List):     "9 WordPress Performance Optimization Tips That Actually Work" → 8/10
Variant B (How-To):   "How to Master WordPress Performance Optimization in 2026" → 7/10
Variant C (Result):   "WordPress Performance Optimization: Cut Load Time by 50%" → 9/10
```

### Recommendation
Apply Variant C — highest score, strong keyword placement, specific result promise, power word ("cut"), appropriate length (56 chars).

## Best Practices

- Always preserve the primary keyword when rewriting headlines
- Test one title change at a time to measure impact via GSC CTR data
- Wait 2-4 weeks after title change before evaluating CTR impact
- Keep headline under 60 characters for full display in search results
- Use numbers when possible (odd numbers perform slightly better)
- Front-load the most important information
- Avoid clickbait — headline must accurately represent content
- Consider the search intent behind the target keyword when choosing formula
