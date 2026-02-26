# On-Page SEO Optimization Patterns for WordPress

## Title Tag Optimization

### Formula
```
[Primary Keyword] — [Benefit/Hook] | [Brand Name]
```

### Rules
- Maximum 60 characters (Google truncates at ~60)
- Primary keyword at the beginning
- Brand name at the end (optional, adds trust)
- Each page title must be unique across the site
- Avoid keyword stuffing

### Examples
- Good: "Cactus Water Benefits — Zero Calorie Hydration | DolceZero"
- Bad: "Cactus Water Benefits | Best Cactus Water | Buy Cactus Water"

## Meta Description (Excerpt)

### Formula
```
[Action verb] [what the user gets]. [Key detail]. [CTA].
```

### Rules
- 120-160 characters (Google truncates at ~160)
- Include primary keyword naturally
- Include a call to action
- Make it compelling (this is your "ad copy" in search results)
- Each page must have a unique meta description

### Examples
- Good: "Discover the natural benefits of Sicilian cactus water. Zero calories, rich in antioxidants. Try DolceZero today."
- Bad: "Welcome to our website. We sell cactus water products. Click here."

## URL Slug Optimization

### Rules
- Use lowercase, hyphens between words
- Include primary keyword
- Remove stop words (a, the, in, of, for, etc.)
- Keep under 75 characters
- Never change an existing indexed slug (use 301 redirect)

### Examples
- Good: `/cactus-water-benefits`
- Bad: `/the-amazing-benefits-of-drinking-cactus-water-for-your-health-2026`

## Heading Hierarchy

### Structure
```
H1: Page title (1 per page, contains primary keyword)
  H2: Major sections (2-6 per page, secondary keywords)
    H3: Sub-sections (as needed, long-tail keywords)
      H4: Detail level (rarely needed)
```

### Rules
- Only one H1 per page
- Never skip heading levels (H1 → H3 without H2)
- Headings should outline the content (scannable)
- Include keywords naturally (don't force)

## Internal Linking Strategy

### Pillar-Cluster Model
```
Pillar Page (broad topic, 2000+ words)
├── Cluster Post 1 (specific subtopic)
├── Cluster Post 2 (specific subtopic)
├── Cluster Post 3 (specific subtopic)
└── Cluster Post 4 (specific subtopic)

All cluster posts link to pillar page
Pillar page links to all cluster posts
Cluster posts link to each other where relevant
```

### Link Placement Rules
- 2-3 internal links per 1000 words minimum
- Anchor text should be descriptive (not "click here")
- Link to relevant, high-value pages
- Link to newer content from older content (update older posts)
- Place important links above the fold

## Image SEO

### File Naming
```
Good: cactus-water-bottle-dolcezero.webp
Bad: IMG_20260226_123456.jpg
```

### Alt Text
```
Good: "DolceZero cactus water bottle in three sweetness levels"
Bad: "image" or "" (empty)
```

### Optimization
- Format: WebP preferred (40-60% smaller than JPEG)
- Max width: 1200px for full-width, 800px for in-content
- Max file size: 200KB for hero, 100KB for in-content
- Always include width and height attributes (prevents CLS)

## Structured Data for WordPress

### Article Schema (blog posts)
```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Title",
  "author": { "@type": "Person", "name": "Author" },
  "datePublished": "2026-02-26",
  "image": "featured-image-url"
}
```

### Product Schema (product pages)
```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Product Name",
  "description": "Product description",
  "offers": {
    "@type": "Offer",
    "price": "9.99",
    "priceCurrency": "EUR"
  }
}
```

### FAQ Schema (FAQ sections)
```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [{
    "@type": "Question",
    "name": "Question text?",
    "acceptedAnswer": {
      "@type": "Answer",
      "text": "Answer text."
    }
  }]
}
```

Most SEO plugins (Yoast, Rank Math) generate structured data automatically. Verify with Google Rich Results Test.

## Content Freshness

### Update Strategy
- Review and update top-performing posts every 6 months
- Update statistics and data references annually
- Add new sections to pillar content as topics evolve
- Re-optimize meta descriptions for underperforming pages
- Update internal links when publishing new related content

### Signals to Search Engines
- Modified date in schema (automatic in WordPress)
- Meaningful content changes (not just date changes)
- New sections, updated data, additional depth
