# Product Programmatic SEO

Use this file when generating product variant pages, comparison pages, or category landing pages at scale using WooCommerce product data as the SEO content source.

## Product Variant Pages

Generate pages for every meaningful combination of product attributes:

| Attribute Combination | URL Pattern | Example |
|----------------------|-------------|---------|
| Product + Size | `/{product}/{size}` | `/running-shoes/size-10` |
| Product + Color | `/{product}/{color}` | `/t-shirt/navy-blue` |
| Product + Size + Color | `/{product}/{size}-{color}` | `/dress/medium-red` |
| Brand + Category | `/{brand}/{category}` | `/nike/running-shoes` |
| Product + Material | `/{product}/{material}` | `/jacket/leather` |

**When to create variant pages (vs single page with selector):**
- Each variant has unique search volume (e.g., "red Nike Air Max")
- Variants differ significantly in content/images
- Variants target different buyer intents

**When NOT to create variant pages:**
- Variants are trivial (only size differs, no unique content)
- Low search volume for specific combinations
- Risk of thin content / doorway pages

## WooCommerce Product Data as SEO Source

Pull product attributes via WooCommerce REST API:

```bash
# List products with attributes — use wc_list_products MCP tool
wc_list_products(per_page=100, status="publish")

# Get product variations
wc_list_product_variations(product_id=123)
```

**Useful WooCommerce fields for programmatic pages:**
- `name`, `description`, `short_description` → page content
- `attributes` → variant dimensions (color, size, material)
- `categories`, `tags` → taxonomy clustering
- `regular_price`, `sale_price` → pricing content
- `average_rating`, `rating_count` → social proof
- `images` → product visuals
- `stock_status` → availability signals

## Comparison Pages

Generate "Product A vs Product B" pages from product pairs:

**Template structure:**
```
Title: "{Product A} vs {Product B} — Which Is Better?"
H1:    "{Product A} vs {Product B}"

Comparison table:
| Feature       | Product A     | Product B     |
|---------------|---------------|---------------|
| Price         | {price_a}     | {price_b}     |
| Rating        | {rating_a}/5  | {rating_b}/5  |
| {attribute_1} | {value_a}     | {value_b}     |

Summary: "Choose {Product A} if... Choose {Product B} if..."
```

**Scale calculation:** N products → N×(N-1)/2 comparison pages. 50 products = 1,225 pages.

**Quality gate:** Only generate comparisons where products share a category and have meaningful differences.

## Category/Tag Landing Pages

Programmatic category pages aggregate products with editorial content:

```
Title: "Best {Category} in {Year} — Top {count} Picks"
H1:    "Best {Category}"

Content:
- Category introduction (100–150 words)
- Top products grid (from WooCommerce query)
- Buying guide section (200–300 words, template with dynamic fields)
- FAQ (3–5 questions from keyword research)
```

**Implementation:**
1. Query WooCommerce categories via `wc_list_products(category=ID)`
2. Sort by `average_rating` or `total_sales` for "top picks"
3. Generate buying guide from category attributes

## Product Schema Markup

```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "{product_name}",
  "description": "{product_description}",
  "image": "{image_url}",
  "brand": {
    "@type": "Brand",
    "name": "{brand_name}"
  },
  "sku": "{sku}",
  "offers": {
    "@type": "Offer",
    "url": "{page_url}",
    "priceCurrency": "{currency}",
    "price": "{price}",
    "availability": "https://schema.org/{InStock|OutOfStock}",
    "seller": {
      "@type": "Organization",
      "name": "{store_name}"
    }
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "{avg_rating}",
    "reviewCount": "{review_count}"
  }
}
```

## Canonical URL Strategy

Prevent duplicate content across variant and comparison pages:

| Scenario | Canonical Rule |
|----------|---------------|
| Color variants with same content | Canonical → parent product page |
| Size variants with unique content | Self-canonical (each variant is canonical) |
| Comparison A vs B and B vs A | Canonical → alphabetically first (A vs B) |
| Category + filtered view | Canonical → unfiltered category page |
| Paginated category pages | `rel="next"` / `rel="prev"` + canonical to page 1 |

**Implementation in headless frontend:**
```html
<link rel="canonical" href="{computed_canonical_url}" />
```

## Decision Checklist

1. Do product variants have unique search volume? → Yes = variant pages; No = single page
2. Is comparison data meaningful (shared category, different attributes)? → Yes = comparison pages
3. Does each generated page have 300+ words of unique content? → Verify template output
4. Are canonical URLs set correctly to avoid duplicate indexing? → Test with Google URL Inspection
5. Is Product schema valid? → Test with Rich Results Test
