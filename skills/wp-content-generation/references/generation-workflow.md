# Generation Workflow

## Full Pipeline: Brief → Publish

### Step 1: Brief Creation

**Goal:** Define what to write and for whom.

**Prompt to user:**
> What topic would you like to write about? Who is your target audience?

**Brief structure:**
| Field | Description | Example |
|-------|-------------|---------|
| Topic | Main subject | "Benefits of cactus water for athletes" |
| Primary keyword | Target search term | "cactus water benefits" |
| Audience | Who reads this | Health-conscious millennials |
| Goal | Content purpose | Drive product page visits |
| Format | Content type | Blog post / Tutorial / Listicle |
| Word count | Target length | 1,200-1,500 words |
| Tone | Writing style | Informative, friendly, evidence-based |

### Step 2: Keyword Research

**If GSC is available:**
1. Run `gsc_query_analytics` for the primary keyword (last 90 days)
2. Identify: current rankings, impressions, CTR
3. Find related queries with high impressions but low CTR (optimization opportunities)
4. Check for keyword cannibalization: `gsc_list_pages` filtered by keyword

**If GSC is not available:**
1. Use the primary keyword as anchor
2. Generate 5-7 semantically related terms
3. Suggest long-tail variations (question-based: "how", "why", "what is")

**Output:** Primary keyword + 5-7 secondary keywords + 2-3 long-tail variations

### Step 3: Outline Creation

**See `outline-patterns.md` for templates per content type.**

**Process:**
1. Select outline pattern based on content format
2. Create H2/H3 hierarchy with 5-8 main sections
3. Assign word count targets per section
4. Place keywords: primary in H1, secondary in H2s, long-tail in body
5. Plan internal links: identify 2-3 existing posts to link to

**Quality check:**
- Does each section deliver standalone value?
- Is there a logical flow from introduction to conclusion?
- Are keywords placed naturally (not forced)?

### Step 4: Draft Writing

**Writing process:**
1. Write introduction: hook → context → promise (what reader will learn)
2. Write each section following the outline
3. Add data points, examples, or quotes where possible
4. Write conclusion: summary → takeaway → CTA
5. Self-review: cut filler, tighten sentences, check flow

**Voice calibration:**
- Analyze 2-3 recent posts from the site (use `wp_list_posts`)
- Match sentence length, vocabulary level, and tone
- Avoid: "delve into", "it's crucial to note", "in today's fast-paced world"
- Prefer: direct statements, active voice, specific numbers

### Step 5: SEO Optimization

**Checklist:**
- [ ] Primary keyword in title (first 60 chars)
- [ ] Primary keyword in first paragraph
- [ ] Primary keyword in 1-2 H2 headings
- [ ] Meta description: 150-160 chars with keyword
- [ ] Internal links: 2-3 links to related posts
- [ ] Image alt text includes keyword variant
- [ ] Short paragraphs (2-4 sentences)
- [ ] Sub-headings every 250-350 words
- [ ] Total word count meets target

**Internal linking strategy:**
1. Fetch recent posts: `wp_list_posts(per_page: 20, orderby: "relevance", search: PRIMARY_KEYWORD)`
2. Select 2-3 most relevant posts
3. Link naturally within content (not forced anchor text)

### Step 6: Structured Data

**Auto-detect schema type from content:**

| Content Pattern | Schema | Tool Call |
|----------------|--------|-----------|
| Contains numbered steps / "how to" | HowTo | `sd_inject(post_id, "HowTo", {...})` |
| Contains Q&A pairs | FAQPage | `sd_inject(post_id, "FAQPage", {...})` |
| Default blog post | Article | `sd_inject(post_id, "Article", {...})` |

**Article schema (default):**
```
sd_inject(post_id, "Article", {
  headline: POST_TITLE,
  image: FEATURED_IMAGE_URL,
  datePublished: POST_DATE,
  author: { "@type": "Person", "name": AUTHOR_NAME },
  description: META_DESCRIPTION
})
```

### Step 7: Publish

**Pre-publish checklist:**
1. Show draft to user for review
2. Confirm title, excerpt, categories, tags
3. Confirm featured image
4. Confirm publish date (immediate or scheduled)

**Publish as draft first:**
```
create_content(type: "post", title: TITLE, content: HTML_CONTENT, status: "draft",
  excerpt: EXCERPT, categories: [CAT_IDS], tags: [TAG_IDS])
```

**After user approval:**
```
update_content(id: POST_ID, status: "publish")
```

## Post-Publish

After publishing, suggest:
1. **Distribution:** Use `wp-content-repurposing` to create social/email variants
2. **Monitoring:** Check GSC in 7-14 days for indexing and initial rankings
3. **Optimization:** Re-optimize in 30 days based on search performance data
