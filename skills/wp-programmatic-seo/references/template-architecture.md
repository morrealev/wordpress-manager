# Template Architecture

Use this file when designing page templates for headless WordPress programmatic SEO — custom post types as data source, URL structure, ISR/SSG configuration, and bulk content creation.

## Custom Post Types as Data Source

WordPress CPTs are the ideal data backbone for programmatic pages:

```php
// Register a CPT for programmatic content (e.g., locations)
register_post_type('location', [
    'public'       => true,
    'show_in_rest' => true,  // Required for headless access
    'supports'     => ['title', 'editor', 'custom-fields', 'thumbnail'],
    'rewrite'      => ['slug' => 'locations'],
    'has_archive'  => true,
]);
```

**Required CPT fields for programmatic SEO:**
- Title → H1 and `<title>` tag
- Custom fields → template variables (city, service, price, etc.)
- Taxonomy → category/tag for clustering
- Featured image → OG image

## URL Structure Design

| Pattern | Example | Use Case |
|---------|---------|----------|
| `/{service}/{city}` | `/plumbing/miami` | Service-area pages |
| `/{product}/{variant}` | `/shoes/red-size-10` | Product variants |
| `/{category}/{item}` | `/restaurants/joes-pizza` | Directory listings |
| `/{brand}/{model}/{year}` | `/toyota/camry/2024` | Multi-attribute pages |
| `/{topic}/{subtopic}` | `/learn/react-hooks` | Educational content |

**URL rules:**
- Lowercase, hyphenated slugs
- Max 3 levels deep (SEO best practice)
- Include primary keyword in first path segment
- Avoid query parameters for indexable pages

## ISR Configuration (Headless Frontend)

### Next.js (App Router)

```javascript
// app/[service]/[city]/page.js
export async function generateStaticParams() {
  const res = await fetch(`${WP_API}/wp/v2/location?per_page=100`);
  const locations = await res.json();
  return locations.map((loc) => ({
    service: loc.acf.service_slug,
    city: loc.slug,
  }));
}

export const revalidate = 3600; // ISR: revalidate every hour
```

### Nuxt

```javascript
// nuxt.config.ts
export default defineNuxtConfig({
  routeRules: {
    '/services/**': { isr: 3600 },
  },
});
```

### Astro

```javascript
// astro.config.mjs — hybrid mode for ISR-like behavior
export default defineConfig({
  output: 'hybrid',
  adapter: node({ mode: 'standalone' }),
});
```

**Revalidate intervals by content type:**

| Content Type | Interval | Reason |
|-------------|----------|--------|
| Location pages | 3600s (1h) | Rarely change |
| Product pages | 900s (15m) | Price/stock updates |
| Blog/guides | 86400s (24h) | Stable content |
| Comparison pages | 3600s (1h) | Data-driven, periodic |

## Template Variables

A programmatic page template maps CPT fields to HTML:

```
Title:       "{service_name} in {city_name} — {brand}"
Meta desc:   "Professional {service_name} in {city_name}. {unique_selling_point}."
H1:          "{service_name} in {city_name}"
Body:        Template paragraph using {city_population}, {service_details}, {local_info}
Schema:      LocalBusiness JSON-LD with {name}, {address}, {phone}, {geo}
```

**Anti-pattern:** Avoid thin content — each page must have enough unique value to justify indexing. Minimum 300 words of meaningful, varied content per page.

## Bulk Content Creation Workflow

1. **Prepare data:** CSV or JSON with one row per page (city, service, attributes)
2. **Create CPT entries:** Loop via WordPress REST API:

```bash
# Using wp-rest-bridge create_content tool
for each row in data:
  create_content(type="location", title=row.title, content=row.body, meta=row.fields)
```

3. **Assign taxonomies:** Tag each entry with relevant terms for clustering
4. **Generate frontend paths:** Run `generateStaticParams` or equivalent build step
5. **Verify:** Spot-check 5–10 pages for content quality and schema validity

## Decision Checklist

1. Is the data structured and repeatable? → Yes = proceed with CPT
2. Will each page have unique, valuable content? → Yes = proceed; No = consolidate
3. Is the URL pattern SEO-friendly and max 3 levels? → Verify before building
4. Is ISR/SSG configured with appropriate revalidation? → Match to content freshness
5. Are sitemaps generated for all programmatic pages? → See `technical-seo.md`
