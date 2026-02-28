# Hreflang Configuration

Use this file when implementing hreflang tags across a WordPress Multisite network — tag format, mu-plugin auto-generation, validation tools, and common mistakes.

## Hreflang Tag Format

Hreflang tells search engines which language/region a page targets and where alternate versions exist:

```html
<!-- On the English page -->
<link rel="alternate" hreflang="en" href="https://example.com/about/" />
<link rel="alternate" hreflang="it" href="https://example.com/it/chi-siamo/" />
<link rel="alternate" hreflang="de" href="https://example.com/de/ueber-uns/" />
<link rel="alternate" hreflang="x-default" href="https://example.com/about/" />
```

### Language Code Reference

| Code | Language | Notes |
|------|----------|-------|
| `en` | English | Use `en-us`, `en-gb` for regional |
| `it` | Italian | |
| `de` | German | Use `de-at` for Austrian German |
| `fr` | French | Use `fr-ca` for Canadian French |
| `es` | Spanish | Use `es-mx` for Mexican Spanish |
| `pt` | Portuguese | Use `pt-br` for Brazilian Portuguese |
| `zh-hans` | Chinese (Simplified) | |
| `zh-hant` | Chinese (Traditional) | |
| `x-default` | Fallback/default | One per page set |

### Rules

1. **Self-referencing required:** Every page must include an hreflang tag pointing to itself
2. **Reciprocal required:** If page A links to page B with hreflang, page B must link back to page A
3. **x-default:** One page per set should be designated as the default (usually English or main language)
4. **Absolute URLs:** Always use full absolute URLs in href attributes
5. **One tag per language-region:** Don't duplicate language codes

## Implementation Methods

### Method 1: HTML `<head>` Tags (Recommended)

```html
<head>
  <link rel="alternate" hreflang="en" href="https://example.com/products/" />
  <link rel="alternate" hreflang="it" href="https://example.com/it/prodotti/" />
  <link rel="alternate" hreflang="x-default" href="https://example.com/products/" />
</head>
```

### Method 2: HTTP Headers (for non-HTML content)

```
Link: <https://example.com/products/>; rel="alternate"; hreflang="en",
      <https://example.com/it/prodotti/>; rel="alternate"; hreflang="it"
```

### Method 3: XML Sitemap

```xml
<url>
  <loc>https://example.com/products/</loc>
  <xhtml:link rel="alternate" hreflang="en" href="https://example.com/products/" />
  <xhtml:link rel="alternate" hreflang="it" href="https://example.com/it/prodotti/" />
</url>
```

## mu-plugin for Automatic Hreflang Generation

This mu-plugin automatically generates hreflang tags across a multisite network by matching content via slug:

```php
<?php
/**
 * Plugin Name: Multisite Hreflang Generator
 * Description: Automatically generates hreflang tags across multisite network.
 * Version: 1.0.0
 */

add_action('wp_head', function () {
    if (!is_multisite()) return;

    $current_blog_id = get_current_blog_id();
    $current_path = trailingslashit(parse_url(get_permalink(), PHP_URL_PATH));

    // Map blog IDs to language codes
    $language_map = [
        1 => 'en',       // Main site = English
        2 => 'it',       // /it/ sub-site
        3 => 'de',       // /de/ sub-site
        4 => 'fr',       // /fr/ sub-site
        // Add more as needed
    ];

    // Get current post slug for matching
    $current_slug = '';
    if (is_singular()) {
        $current_slug = get_post_field('post_name', get_queried_object_id());
    }

    if (empty($current_slug)) return;

    $sites = get_sites(['number' => 100]);
    $alternates = [];

    foreach ($sites as $site) {
        $lang = $language_map[$site->blog_id] ?? null;
        if (!$lang) continue;

        switch_to_blog($site->blog_id);

        // Find matching content by slug
        $matched_post = get_page_by_path($current_slug, OBJECT, ['post', 'page', 'product']);
        if ($matched_post && $matched_post->post_status === 'publish') {
            $alternates[] = [
                'lang' => $lang,
                'href' => get_permalink($matched_post->ID),
            ];
        }

        restore_current_blog();
    }

    // Only output if we found at least 2 alternates (including self)
    if (count($alternates) < 2) return;

    // Output hreflang tags
    foreach ($alternates as $alt) {
        printf(
            '<link rel="alternate" hreflang="%s" href="%s" />' . "\n",
            esc_attr($alt['lang']),
            esc_url($alt['href'])
        );
    }

    // x-default = main site (blog_id 1)
    $default = array_filter($alternates, fn($a) => $a['lang'] === ($language_map[1] ?? 'en'));
    if (!empty($default)) {
        printf(
            '<link rel="alternate" hreflang="x-default" href="%s" />' . "\n",
            esc_url(reset($default)['href'])
        );
    }
});
```

**Installation:**
1. Save as `wp-content/mu-plugins/multisite-hreflang.php`
2. Update `$language_map` with your blog IDs and language codes
3. Content matching is by slug — ensure translated pages share the same slug or use a custom meta field for cross-referencing

## Hreflang Validation

### Google Search Console

1. Go to International Targeting report
2. Check for hreflang errors: missing return tags, unknown language codes, conflicting tags
3. Verify per-language properties are set up (if using subdomains/domains)

### Online Validators

| Tool | URL | Checks |
|------|-----|--------|
| Hreflang Tags Checker | `hreflang.org` | Tag syntax, return links, x-default |
| Ahrefs Hreflang Audit | Ahrefs Site Audit | Reciprocal links, missing alternates |
| Screaming Frog | Desktop crawler | Bulk hreflang validation |

### Manual Verification

```bash
# Check hreflang tags on a page
curl -s https://example.com/products/ | grep -i "hreflang"

# Verify reciprocal: check that the Italian page links back
curl -s https://example.com/it/prodotti/ | grep -i "hreflang"
```

## Common Mistakes

| Mistake | Impact | Fix |
|---------|--------|-----|
| Missing self-referencing tag | Search engines ignore the set | Always include hreflang for current page |
| Missing reciprocal (A→B but not B→A) | Both tags get ignored | Ensure all pages in set link to each other |
| Wrong language codes | Tags treated as invalid | Use ISO 639-1 codes, verify spelling |
| Relative URLs in href | Tags get ignored | Always use absolute URLs with protocol |
| Mixing hreflang methods (head + sitemap) | Potential conflicts | Choose one method and use it consistently |
| Pointing hreflang to redirecting URLs | Tag gets ignored | Point to final destination URL |
| Duplicate language codes on same page | Ambiguous signal | One tag per language-region combination |

## Decision Checklist

1. Are all language sites created in the multisite network? → Verify with `list_sites`
2. Is the `$language_map` in the mu-plugin correct? → Map each blog_id to its language code
3. Do translated pages share slugs for matching? → If not, use custom meta field for cross-reference
4. Are hreflang tags present on all public pages? → Spot-check with `curl | grep hreflang`
5. Are reciprocal tags correct? → Check both directions for 3+ sample pages
6. Is `x-default` set to the main language site? → Verify in page source
7. Is Google Search Console showing no hreflang errors? → Check International Targeting report
