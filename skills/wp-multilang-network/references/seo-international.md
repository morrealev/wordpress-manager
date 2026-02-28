# International SEO

Use this file when optimizing a multi-language WordPress Multisite network for international search — Google Search Console per language, language-specific sitemaps, schema localization, and performance per region.

## International SEO Fundamentals

| Principle | Description |
|-----------|-------------|
| One page per language | Each language has its own URL (no dynamic translation) |
| Unique content | Translations should be human-quality, not raw machine output |
| Hreflang everywhere | Every page declares all its language alternates |
| Language-specific sitemaps | One XML sitemap per sub-site/language |
| GSC per property | Separate Search Console properties for monitoring |

## Google Search Console Setup

### Per-Language Properties

For a multisite with subdirectories:

```
Property 1: https://example.com/       (English — main)
Property 2: https://example.com/it/     (Italian)
Property 3: https://example.com/de/     (German)
Property 4: https://example.com/fr/     (French)
```

For subdomains:

```
Property 1: https://example.com          (English)
Property 2: https://it.example.com       (Italian)
Property 3: https://de.example.com       (German)
```

### International Targeting

1. Open each language property in GSC
2. Go to Legacy tools → International Targeting
3. Set target country (optional — only if site targets a specific country, not just a language)
4. Monitor hreflang errors in the same section

### Per-Language Monitoring

For each language property, monitor:
- **Coverage:** Indexed pages count (should match published pages on that sub-site)
- **Performance:** Clicks, impressions, CTR, position — filter by country
- **Sitemaps:** Verify language-specific sitemap is submitted and processed

## Language-Specific XML Sitemaps

Each WordPress sub-site in the multisite network generates its own sitemap:

```
https://example.com/sitemap_index.xml          (English)
https://example.com/it/sitemap_index.xml       (Italian)
https://example.com/de/sitemap_index.xml       (German)
```

### Sitemap Index at Network Level

Create a network-level sitemap index that references all sub-site sitemaps:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://example.com/sitemap_index.xml</loc>
    <lastmod>2025-01-15</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://example.com/it/sitemap_index.xml</loc>
    <lastmod>2025-01-14</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://example.com/de/sitemap_index.xml</loc>
    <lastmod>2025-01-13</lastmod>
  </sitemap>
</sitemapindex>
```

### Hreflang in Sitemaps

For maximum hreflang coverage, include language alternates in each sitemap:

```xml
<url>
  <loc>https://example.com/products/</loc>
  <xhtml:link rel="alternate" hreflang="en" href="https://example.com/products/" />
  <xhtml:link rel="alternate" hreflang="it" href="https://example.com/it/prodotti/" />
  <xhtml:link rel="alternate" hreflang="de" href="https://example.com/de/produkte/" />
  <xhtml:link rel="alternate" hreflang="x-default" href="https://example.com/products/" />
</url>
```

**Note:** If using the hreflang mu-plugin in `<head>`, you can skip sitemap hreflang. Using both is not harmful but adds maintenance.

## Structured Data Localization

### Schema.org `inLanguage` Property

Add language to all structured data:

```json
{
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "Benefici dell'Acqua di Cactus",
  "inLanguage": "it",
  "url": "https://example.com/it/benefici-acqua-cactus/",
  "isPartOf": {
    "@type": "WebSite",
    "name": "DolceZero Italia",
    "url": "https://example.com/it/",
    "inLanguage": "it"
  }
}
```

### Localized Organization Schema

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "DolceZero",
  "url": "https://example.com/",
  "alternateName": ["DolceZero Italia", "DolceZero Deutschland"],
  "contactPoint": [
    {
      "@type": "ContactPoint",
      "telephone": "+39-xxx-xxx-xxxx",
      "contactType": "customer service",
      "areaServed": "IT",
      "availableLanguage": "Italian"
    },
    {
      "@type": "ContactPoint",
      "telephone": "+49-xxx-xxx-xxxx",
      "contactType": "customer service",
      "areaServed": "DE",
      "availableLanguage": "German"
    }
  ]
}
```

## Canonical URLs in Multi-Language Context

| Scenario | Canonical Rule |
|----------|---------------|
| English product page | Self-canonical: `https://example.com/products/cactus-water/` |
| Italian product page | Self-canonical: `https://example.com/it/prodotti/acqua-cactus/` |
| English = Italian (untranslated) | **Do NOT canonical Italian → English** — either translate or noindex |
| URL with `?lang=` parameter | Canonical → clean URL without parameter |

**Critical rule:** Never use canonical across languages. Each language URL is canonical for its language. Use hreflang to declare relationships.

## Avoiding Duplicate Content

| Issue | Solution |
|-------|----------|
| Untranslated pages showing English on Italian site | Set as `noindex` until translated, or serve 404 |
| Machine-translated thin content | Block from indexing; translate properly or remove |
| Same content on main site and language site | Ensure distinct translations; use hreflang for signals |
| Language switcher creating `?lang=` URLs | Canonical to clean URL; use path-based routing |

## Performance: CDN per Region

### CloudFlare Configuration

```
CDN cache by language:
- English:  Edge servers worldwide (default)
- Italian:  Prioritize EU-South edge locations
- German:   Prioritize EU-Central edge locations
- Japanese: Prioritize Asia-Pacific edge locations
```

### Image Localization

- Product images: shared across languages (CDN serves nearest edge)
- Marketing banners: may differ per language (upload per sub-site)
- OG images: localized per language (localized text overlays)

## Measuring International SEO

### Metrics per Language

| Metric | Source | Frequency |
|--------|--------|-----------|
| Organic traffic by language | GA4 (filter by page path prefix) | Weekly |
| Rankings by country | GSC Performance → Country filter | Weekly |
| Indexed pages per language | GSC Coverage per property | Monthly |
| Hreflang errors | GSC International Targeting | Monthly |
| Conversion rate by language | WooCommerce + GA4 | Monthly |

### Success Indicators

- Indexed pages per language ≈ published pages per sub-site
- Zero hreflang errors in GSC
- Organic traffic growing in target language markets
- Conversion rate per language within 20% of primary language

## Decision Checklist

1. Is GSC set up per language property? → Create and verify each
2. Are language-specific sitemaps submitted? → One per sub-site
3. Is `inLanguage` set in structured data? → Add to schema on each sub-site
4. Are canonicals self-referencing per language (never cross-language)? → Audit sample pages
5. Are untranslated pages noindexed? → Never show English content as Italian page
6. Is CDN configured for international edge delivery? → Check CDN dashboard
7. Are international SEO metrics tracked per language? → Set up monthly report
