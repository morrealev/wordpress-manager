# Injection Patterns

## Pattern 1: Article Schema for Blog Posts

**When:** Any blog post. Most impactful schema type for content sites.

**Steps:**
1. Fetch post: `wp_get_post(id: POST_ID)`
2. Extract: title, date, modified date, author, featured image, excerpt
3. Build schema data
4. Inject: `sd_inject(post_id, "Article", schema_data)`

**Schema data template:**
```json
{
  "headline": "{post.title.rendered}",
  "image": "{featured_image_url}",
  "datePublished": "{post.date}",
  "dateModified": "{post.modified}",
  "author": {
    "@type": "Person",
    "name": "{author.name}"
  },
  "publisher": {
    "@type": "Organization",
    "name": "{site_name}",
    "logo": {
      "@type": "ImageObject",
      "url": "{site_logo_url}"
    }
  },
  "description": "{post.excerpt.rendered (stripped HTML)}"
}
```

**Note:** If Yoast or Rank Math is active, they already add Article schema. Check with `sd_validate` first.

## Pattern 2: Product Schema for WooCommerce

**When:** WooCommerce product pages.

**Steps:**
1. Fetch product: `wc_get_product(id: PRODUCT_ID)`
2. Extract: name, price, stock status, images, description
3. Build schema with offers
4. Inject: `sd_inject(post_id, "Product", schema_data)`

**Schema data template:**
```json
{
  "name": "{product.name}",
  "image": "{product.images[0].src}",
  "description": "{product.short_description}",
  "sku": "{product.sku}",
  "brand": {
    "@type": "Brand",
    "name": "{brand_name}"
  },
  "offers": {
    "@type": "Offer",
    "price": "{product.price}",
    "priceCurrency": "EUR",
    "availability": "https://schema.org/{InStock|OutOfStock}",
    "url": "{product.permalink}"
  }
}
```

## Pattern 3: FAQ Schema from Content

**When:** Posts containing Q&A sections (H3 questions with paragraph answers).

**Steps:**
1. Fetch post: `wp_get_post(id: POST_ID)`
2. Parse content HTML: extract Q&A pairs from H3 + following paragraphs
3. Build FAQPage schema
4. Inject: `sd_inject(post_id, "FAQPage", schema_data)`

**Schema data template:**
```json
{
  "mainEntity": [
    {
      "@type": "Question",
      "name": "{question_text}",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "{answer_text}"
      }
    }
  ]
}
```

**Extraction heuristic:**
- H3 ending with `?` → Question
- Following `<p>` blocks until next H3 → Answer
- Minimum 3 Q&A pairs for meaningful FAQ schema

## Pattern 4: HowTo Schema from Tutorials

**When:** Tutorial or step-by-step posts.

**Steps:**
1. Fetch post: `wp_get_post(id: POST_ID)`
2. Parse content: extract steps from H2 sections or ordered lists
3. Build HowTo schema
4. Inject: `sd_inject(post_id, "HowTo", schema_data)`

**Schema data template:**
```json
{
  "name": "{post.title.rendered}",
  "step": [
    {
      "@type": "HowToStep",
      "name": "{step_heading}",
      "text": "{step_description}"
    }
  ],
  "totalTime": "PT{minutes}M"
}
```

**Extraction heuristic:**
- H2 headings starting with "Step" or numbered → HowToStep
- Ordered list items (`<ol><li>`) → HowToStep
- Time references in content → totalTime

## Pattern 5: Bulk Injection

**When:** Adding schema to multiple existing posts at once.

**Steps:**
1. List posts: `wp_list_posts(per_page: 50)`
2. Check existing schemas: `sd_list_schemas()`
3. Identify posts without schema
4. For each post without schema:
   a. Determine best schema type from content
   b. Extract relevant data
   c. `sd_inject(post_id, schema_type, schema_data)`
5. Verify: `sd_list_schemas()` to confirm coverage

**Type determination heuristic:**
| Content Pattern | Schema Type |
|----------------|-------------|
| Contains Q&A pairs (H3 + ?) | FAQPage |
| Contains step-by-step (H2 "Step N" or `<ol>`) | HowTo |
| Is WooCommerce product | Product |
| Has event date/time | Event |
| Default for blog posts | Article |

## Conflict Resolution

When SEO plugins already add schema:

1. **Check first:** `sd_validate(url: PAGE_URL)` to see existing schemas
2. **Don't duplicate:** If Article schema already exists from Yoast, don't add another
3. **Supplement:** Add types the plugin doesn't handle (FAQ, HowTo)
4. **Override:** To replace plugin schema, disable plugin's schema output for that post type and use `sd_inject` instead
