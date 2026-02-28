# Technical SEO for Programmatic Pages

Use this file when managing sitemaps, crawl budget, canonicals, internal linking, and Core Web Vitals for large-scale programmatic page generation.

## XML Sitemap Generation

### Yoast SEO Integration

Yoast auto-generates sitemaps for all public post types:
- Main sitemap index: `/sitemap_index.xml`
- Post type sitemaps: `/post_type-sitemap.xml` (paginated at 1000 URLs per file)

**Configure for programmatic CPTs:**
```php
// Ensure CPT appears in Yoast sitemap
register_post_type('location', [
    'public'       => true,
    'show_in_rest' => true,
    // Yoast auto-includes public CPTs in sitemap
]);
```

### Rank Math Integration

Rank Math uses similar auto-generation. Configure via:
- Settings → Sitemap → enable the CPT
- Pagination: 200 URLs per sitemap file (configurable)

### Dynamic Sitemap Index for 1000s+ Pages

For very large sites, create a custom sitemap index:

```php
// Custom sitemap for programmatic pages (mu-plugin)
add_filter('wp_sitemaps_post_types', function ($post_types) {
    $post_types['location'] = get_post_type_object('location');
    return $post_types;
});

// Custom max URLs per sitemap page
add_filter('wp_sitemaps_max_urls', function () {
    return 2000; // Default is 2000, reduce if pages are slow to crawl
});
```

**Sitemap submission:**
1. Submit sitemap index URL in Google Search Console
2. Reference sitemap in `robots.txt`: `Sitemap: https://example.com/sitemap_index.xml`
3. Monitor "Sitemaps" report in GSC for errors

## Crawl Budget Optimization

Crawl budget = how many pages Googlebot will crawl per session. Critical for 1000s+ pages.

### Pages to Index (doindex)

- Programmatic pages with unique, valuable content (300+ words)
- Category landing pages with editorial content
- Comparison pages with meaningful differentiation

### Pages to Noindex

| Page Type | Action | Reason |
|-----------|--------|--------|
| Thin variant pages (< 300 words) | `noindex, follow` | Low content value |
| Paginated archives (page 2+) | `noindex, follow` | Duplicate of page 1 |
| Faceted navigation results | `noindex` or block via `robots.txt` | Parameter-based duplicates |
| Internal search results | `noindex` | Dynamic, low SEO value |
| Tag pages with < 3 posts | `noindex, follow` | Thin taxonomy pages |

### Implementation

```html
<!-- Noindex via meta tag (headless frontend) -->
<meta name="robots" content="noindex, follow" />

<!-- Or via X-Robots-Tag HTTP header -->
X-Robots-Tag: noindex, follow
```

## Canonical URL Management

### Headless Architecture Canonicals

In headless setups, the canonical must point to the frontend URL, not the WordPress admin URL:

```html
<!-- Frontend page canonical -->
<link rel="canonical" href="https://www.example.com/services/miami" />

<!-- NOT the WordPress REST source -->
<!-- Wrong: https://wp.example.com/wp-json/wp/v2/location/123 -->
```

**Configuration in headless frontend:**
```javascript
// Next.js metadata
export function generateMetadata({ params }) {
  return {
    alternates: {
      canonical: `https://www.example.com/${params.service}/${params.city}`,
    },
  };
}
```

### Canonical Rules for Programmatic Pages

| Scenario | Canonical Target |
|----------|-----------------|
| Standard programmatic page | Self-canonical |
| Variant with identical content to parent | Parent product page |
| Paginated series | Page 1 of the series |
| HTTP vs HTTPS | HTTPS version |
| www vs non-www | Preferred domain version |
| Trailing slash vs no trailing slash | Consistent chosen format |

## robots.txt Configuration

```
# robots.txt for headless WordPress
User-agent: *
Allow: /

# Block WordPress admin (if exposed)
Disallow: /wp-admin/
Allow: /wp-admin/admin-ajax.php

# Block faceted navigation / filter parameters
Disallow: /*?filter=
Disallow: /*?sort=
Disallow: /*?page=

# Sitemap reference
Sitemap: https://www.example.com/sitemap_index.xml
```

## Internal Linking Strategy

Programmatic pages need structured internal linking for crawlability and authority flow:

### Hub-and-Spoke Model

```
Category hub page (e.g., /plumbing/)
  ├── /plumbing/miami
  ├── /plumbing/orlando
  ├── /plumbing/tampa
  └── /plumbing/jacksonville
```

**Implementation:**
- Hub page links to all spoke pages (or top N by relevance)
- Each spoke page links back to hub + 3–5 related spokes
- Breadcrumbs: Home → Service → City

### Cross-Linking Between Clusters

```
/plumbing/miami ←→ /electrical/miami    (same city, different service)
/plumbing/miami ←→ /plumbing/fort-lauderdale  (same service, nearby city)
```

**Automated linking (template-based):**
```html
<!-- Related services in {city} -->
<h2>Other Services in {city}</h2>
<ul>
  {for service in other_services}
    <li><a href="/{service.slug}/{city.slug}">{service.name} in {city.name}</a></li>
  {/for}
</ul>
```

## Core Web Vitals for Template Pages

| Metric | Target | Programmatic Page Risk |
|--------|--------|----------------------|
| LCP | < 2.5s | Large hero images from WP media library |
| INP | < 200ms | Heavy JS for dynamic content |
| CLS | < 0.1 | Late-loading images without dimensions |

**Optimizations:**
1. **LCP:** Preload hero image, use `next/image` or equivalent with width/height
2. **INP:** Minimize client-side JS; SSG/ISR means most content is pre-rendered
3. **CLS:** Set explicit `width` and `height` on all images; use CSS `aspect-ratio`
4. **Font loading:** `font-display: swap` for web fonts
5. **Third-party scripts:** Defer analytics/tracking below the fold

## Decision Checklist

1. Is the sitemap index submitted and error-free in GSC? → Monitor weekly
2. Are thin pages noindexed to preserve crawl budget? → Audit monthly
3. Do all programmatic pages have correct self-canonicals? → Verify in bulk
4. Is robots.txt blocking faceted navigation and parameters? → Test with robots.txt tester
5. Does every page link to its hub and 3–5 related pages? → Template includes these links
6. Are Core Web Vitals passing for template pages? → Test with PageSpeed Insights on sample
