# Transform Templates

Ready-to-use templates for converting WordPress content into platform-specific formats.

## Template 1: Blog → Tweet (Single)

**Format rules:**
- Max 280 characters (link counts as ~23 chars)
- Structure: Hook + key takeaway + link + hashtags
- Tone: Casual, punchy, curiosity-driven

**Template:**
```
{hook_sentence} {key_takeaway}

{post_url}

{hashtags}
```

**Character budget:**
| Element | Max Chars |
|---------|-----------|
| Hook + takeaway | ~220 |
| URL | ~23 |
| Hashtags (2-3) | ~35 |

**Example input:**
```
Title: "5 Benefits of Sparkling Water for Summer Hydration"
Excerpt: "Sparkling water from Mediterranean prickly pear is packed with electrolytes,
antioxidants, and has zero calories. Here's why it's the perfect summer drink."
Tags: ["sparkling water", "hydration", "zero calorie"]
```

**Example output:**
```
Zero calories, packed with electrolytes — sparkling water is the summer drink
you didn't know you needed 🌵

https://acmebrand.example.com/sparkling-water-benefits

#sparklingwater #hydration #zerocalorie
```

**Hashtag generation logic:**
1. Take post tags, lowercase, remove spaces → `#sparklingwater`
2. Add 1-2 category-based hashtags → `#healthydrinks`
3. Cap at 3 hashtags for Twitter (engagement drops with more)

---

## Template 2: Blog → Twitter Thread

**Format rules:**
- Tweet 1: Hook with promise ("Here's what we learned about X" or "N things about X")
- Middle tweets: One key point per tweet, numbered
- Last tweet: CTA with link
- Each tweet max 280 chars
- Split by H2 sections or key points

**Template:**
```
Tweet 1 (hook):
{numbered_promise_or_question}

A thread 🧵👇

Tweet 2-N (key points):
{number}/ {section_heading}

{key_point_summary}

Tweet N+1 (CTA):
If you found this useful, check out the full article:

{post_url}

{hashtags}
```

**Splitting rules:**
- If post has H2 headings: 1 tweet per H2 (summarize section in 250 chars)
- If no H2s: Extract sentences with numbers/stats/claims, 1 per tweet
- Max thread length: 10 tweets (5-7 optimal for engagement)
- Each middle tweet should stand alone (valuable without reading the thread)

**Example input:**
```
Title: "5 Benefits of Sparkling Water for Summer Hydration"
H2s: ["Rich in Electrolytes", "Zero Calories", "Antioxidant Power",
      "Sustainable Sourcing", "Naturally Refreshing"]
```

**Example output:**
```
Tweet 1:
5 reasons sparkling water is the smartest hydration choice this summer

A thread 🧵👇

Tweet 2:
1/ Rich in Electrolytes

Prickly pear premium naturally contains potassium, magnesium, and calcium —
the same electrolytes you'd find in sports drinks, without the sugar.

Tweet 3:
2/ Zero Calories

Unlike coconut water (45 cal) or fruit juice (110+ cal), sparkling water
delivers hydration at exactly 0 calories per serving.

...

Tweet 6:
Found this useful? Read the full breakdown:

https://acmebrand.example.com/sparkling-water-benefits

#sparklingwater #hydration #zerocalorie
```

---

## Template 3: Blog → LinkedIn Post

**Format rules:**
- Max 3,000 characters (optimal: 1,300-1,700)
- Structure: Hook line → story/insight → key takeaway → CTA → hashtags
- Tone: Professional, thought-leadership, data-driven
- Line breaks between paragraphs for readability
- Link in post body (not first comment for simplicity)

**Template:**
```
{hook_line}

{context_or_story}

{key_insight_with_data}

{takeaway_or_opinion}

{cta_with_link}

{hashtags}
```

**Example input:**
```
Title: "How We Reduced Sugar Content to Zero Without Losing Taste"
Excerpt: "Our R&D team spent 18 months developing a proprietary process
that uses Mediterranean prickly pear as a natural sweetness base..."
Tags: ["food technology", "zero sugar", "innovation"]
```

**Example output:**
```
We spent 18 months on a single question: can a drink taste sweet with
literally zero sugar?

The answer surprised even our food scientists.

Mediterranean fruit plant has a naturally sweet flavor profile.
By extracting and concentrating its essence, we created a beverage base
that delivers sweetness perception without any added sugars or
artificial sweeteners.

The result: a drink that scored 8.2/10 in blind taste tests against
traditional sweetened beverages.

Key insight: consumers don't want "less sugar." They want full flavor
with zero compromise. That's what drove our entire product philosophy.

Full story on our process → https://acmebrand.example.com/zero-sugar-innovation

#FoodTechnology #ZeroSugar #BeverageInnovation #ProductDevelopment
```

**Hashtag generation logic:**
1. Take post tags → professional case: `#FoodTechnology`
2. Add industry hashtags: `#Innovation`, `#ProductDevelopment`
3. Cap at 3-5 hashtags (LinkedIn penalizes excessive hashtags)
4. Use PascalCase for multi-word hashtags

---

## Template 4: Blog → LinkedIn Article

**Format rules:**
- Full long-form content adaptation (up to 125,000 chars)
- Preserve HTML structure: H2 → article sections, lists → bullet points
- Add professional introduction paragraph (not in original post)
- Add author bio and CTA at the end
- Strip WordPress-specific shortcodes and embeds
- Requires user confirmation (safety hook active on `li_create_article`)

**Template:**
```
Title: {post_title}

{professional_intro_paragraph}

{adapted_content_with_html}

---

{author_bio_cta}
```

**HTML adaptation rules:**
- Keep: `<h2>`, `<h3>`, `<p>`, `<ul>`, `<ol>`, `<li>`, `<strong>`, `<em>`, `<blockquote>`
- Strip: `<script>`, `<style>`, `<iframe>`, WordPress shortcodes `[shortcode]`
- Convert: `<img>` with featured image only (LinkedIn renders inline images in articles)
- Remove: WordPress block comments `<!-- wp:paragraph -->`

**When to use article vs feed post:**
| Criteria | Feed Post | Article |
|----------|-----------|---------|
| Word count | < 500 words | > 500 words |
| Content type | Quick insight, update | Tutorial, case study, analysis |
| Engagement goal | Likes, comments | Thought leadership, saves |
| Link included | Yes (drive traffic) | Optional (content is self-contained) |

---

## Template 5: Blog → Email Snippet

**Format rules:**
- Structure: Subject line + preview text + snippet body + CTA button
- Snippet length: 150-200 words (enough to entice, not enough to satisfy)
- CTA: "Read the full article" or "Continue reading"
- For use with Mailchimp (`mc_set_campaign_content`) or SendGrid (`sg_send_email`)

**Template:**
```
Subject: {compelling_subject_line}
Preview: {first_line_preview_text}

---

{post_title}

{excerpt_or_first_paragraph}

{one_key_statistic_or_insight}

[Read the full article →]({post_url})
```

**Subject line formulas:**
1. **Number + benefit**: "5 ways sparkling water improves your hydration"
2. **Question**: "Is sparkling water the next coconut water?"
3. **How-to**: "How we made zero-calorie taste amazing"
4. **Curiosity gap**: "The Mediterranean secret behind our water"

**Example input:**
```
Title: "5 Benefits of Sparkling Water for Summer Hydration"
Excerpt: "Sparkling water from Mediterranean prickly pear is packed with electrolytes..."
URL: "https://acmebrand.example.com/sparkling-water-benefits"
```

**Example output:**
```
Subject: 5 reasons sparkling water beats coconut water this summer
Preview: Zero calories, natural electrolytes, and a taste you won't believe

---

5 Benefits of Sparkling Water for Summer Hydration

Sparkling water from Mediterranean prickly pear is packed with electrolytes,
antioxidants, and has zero calories. It's everything you want from a
hydration drink — without the sugar.

Key finding: In our tests, sparkling water delivered 40% more potassium
per serving than leading coconut water brands.

[Read the full article →](https://acmebrand.example.com/sparkling-water-benefits)
```

---

## Template Selection Guide

| Source Content | Short (< 500 words) | Long (≥ 500 words) |
|---------------|---------------------|--------------------|
| Blog post | Tweet + LinkedIn post + email snippet | Thread + LinkedIn article + email snippet |
| Product page | Tweet + LinkedIn post | Tweet + LinkedIn post + email snippet |
| Case study | LinkedIn post + email snippet | Thread + LinkedIn article + email snippet |
| News/update | Tweet | Tweet + LinkedIn post |

## Multi-Channel Workflow

For full pipeline execution (1 post → all channels):

1. Fetch post with `wp_get_post`
2. Extract elements (title, excerpt, headings, key points, tags, image)
3. Apply templates in order: Tweet → Thread (if applicable) → LinkedIn → Email
4. Preview all outputs for user review
5. Dispatch via: `tw_create_tweet` → `tw_create_thread` → `li_create_post` → `mc_set_campaign_content`
6. Report: channels published, content IDs, analytics check schedule
