# Readability Analysis

## Overview

Readability analysis measures how easy content is to read and understand. Claude performs Flesch-Kincaid scoring, sentence length analysis, passive voice detection, paragraph assessment, and jargon identification directly on WordPress content — no external readability tools required. The goal is web-optimized content that matches the target audience's reading level.

## Flesch-Kincaid Scoring

### Formula
```
Flesch Reading Ease = 206.835 - (1.015 × ASL) - (84.6 × ASW)

Where:
  ASL = Average Sentence Length (words per sentence)
  ASW = Average Syllables per Word
```

### Score Interpretation

| Score | Grade Level | Audience | Action |
|-------|-------------|----------|--------|
| 90-100 | 5th grade | Very easy, children | Too simple for most web content |
| 80-89 | 6th grade | Easy, conversational | Good for broad consumer content |
| 70-79 | 7th grade | Fairly easy | Good for general web content |
| 60-69 | 8th-9th grade | Standard | **Target for most WordPress content** |
| 50-59 | 10th-12th grade | Fairly difficult | Acceptable for professional audience |
| 30-49 | College | Difficult | Only for specialized/technical content |
| 0-29 | Graduate | Very difficult | Rewrite for web consumption |

### Target Scores by Content Type

| Content Type | Target Score | Rationale |
|--------------|-------------|-----------|
| Blog posts | 60-70 | General audience, scannable |
| Product descriptions | 65-75 | Clear, benefit-focused |
| Technical documentation | 45-60 | Professional audience |
| Landing pages | 70-80 | Must be instantly clear |
| Email newsletters | 65-75 | Quick reading format |

## Sentence Length Analysis

### Guidelines

| Metric | Target | Flag Threshold |
|--------|--------|----------------|
| Average sentence length | 15-20 words | >20 words average |
| Maximum sentence length | 35 words | >40 words |
| Short sentence ratio | 20-30% under 10 words | <10% short sentences |
| Variety | Mix of short, medium, long | All same length |

### Sentence Length Distribution
Ideal content alternates between sentence lengths for rhythm:
```
Short sentence (5-10 words).     ← Punchy, creates emphasis
Medium sentence (11-20 words).   ← Core information delivery
Long sentence (21-30 words).     ← Complex ideas, supporting detail
Short sentence (5-10 words).     ← Reset reader attention
```

### Fixing Long Sentences
Strategies for breaking up long sentences:
1. **Split at conjunctions** — break at "and", "but", "while", "although"
2. **Remove relative clauses** — move "which" and "that" clauses to new sentences
3. **Use bullet lists** — convert compound sentences into scannable lists
4. **Front-load the point** — put the main idea first, details after

### Example
```
Before (38 words):
"WordPress is a content management system that allows users to create websites
and blogs with themes and plugins, which can be customized to match any brand
identity and extended with additional functionality."

After (two sentences, 15 + 16 words):
"WordPress is a content management system for creating websites and blogs.
Themes and plugins let you customize the design and extend functionality."
```

## Passive Voice Detection

### What to Flag
Passive voice constructions where the subject receives the action:
```
Passive: "The plugin was installed by the user."
Active:  "The user installed the plugin."
```

### Target
- Maximum 10% of sentences in passive voice
- 5% or less is ideal for web content

### Common Passive Patterns
| Passive Pattern | Active Rewrite |
|----------------|----------------|
| "was created by" | "[subject] created" |
| "is recommended" | "we recommend" |
| "can be configured" | "you can configure" |
| "has been updated" | "we updated" / "[subject] updated" |
| "should be installed" | "install" (imperative) |

### When Passive Is Acceptable
- Scientific or technical writing where the actor is irrelevant
- When the object is more important than the subject
- Policy or legal statements

## Paragraph Length Guidelines

| Metric | Target | Flag |
|--------|--------|------|
| Sentences per paragraph | 2-4 | >5 sentences |
| Words per paragraph | 40-80 | >100 words |
| One-sentence paragraphs | Occasional for emphasis | >3 consecutive |
| Wall of text | Never | Any paragraph >150 words |

### Web-Specific Rules
- Break up paragraphs more aggressively than print
- Use subheadings every 200-300 words
- Include visual breaks (images, lists, blockquotes) every 300-400 words
- One idea per paragraph

## Jargon and Complexity Detection

### Flag These Patterns
1. **Industry jargon** — terms unknown to general audience (e.g., "canonical URL", "transclusion")
2. **Acronyms without definition** — first use must define the acronym
3. **Multi-syllable alternatives** — when simpler words exist
4. **Nominalization** — turning verbs into nouns ("optimization" instead of "optimize")
5. **Double negatives** — "not uncommon" instead of "common"

### Simplification Table

| Complex | Simple |
|---------|--------|
| utilize | use |
| implement | add / set up |
| functionality | feature |
| methodology | method |
| in order to | to |
| at this point in time | now |
| a large number of | many |
| in the event that | if |
| prior to | before |
| subsequent to | after |

## Step-by-Step Workflow

### Step 1: Fetch Content
```
Use get_content with the post ID to retrieve full body content.
Strip HTML tags for text-only analysis.
```

### Step 2: Compute Metrics
Claude analyzes the plain text and computes:
- Total word count
- Total sentence count
- Average sentence length (words/sentences)
- Estimated Flesch-Kincaid score
- Passive voice percentage
- Average paragraph length
- Jargon terms identified

### Step 3: Generate Report
```
Readability Report for: "Post Title"
═══════════════════════════════════
Flesch-Kincaid Score: 58 (target: 60-70) ⚠ Below target
Average Sentence Length: 22 words (target: <20) ⚠ Too long
Passive Voice: 15% (target: <10%) ⚠ Too high
Avg Paragraph Length: 95 words (target: <80) ⚠ Long paragraphs
Jargon Terms Found: 3 (canonical, transclusion, REST endpoint)

Top Issues:
1. 5 sentences over 35 words — break into shorter sentences
2. 3 paragraphs over 100 words — split with subheadings
3. "canonical URL" used without definition — add brief explanation
```

### Step 4: Suggest Improvements
Claude generates specific rewrite suggestions:
- Rewrites for the 3 longest sentences
- Paragraph split points with suggested subheadings
- Passive-to-active voice conversions
- Jargon simplifications or definitions to add

### Step 5: Apply Changes (Optional)
```
Use update_content to apply approved changes.
Preserve all HTML structure, links, and media.
Only modify text content for readability improvements.
```

## Best Practices

- Always analyze the full post body, not just excerpts
- Consider the target audience when evaluating scores (technical docs have lower target)
- Preserve the author's voice — readability improvements should not flatten style
- Do not oversimplify to the point of losing nuance or accuracy
- Run readability analysis after SEO optimization to ensure keyword insertion did not harm readability
- Check readability on both desktop and mobile (shorter paragraphs matter more on mobile)
- Use transition words (however, therefore, for example) to maintain flow after sentence splitting
