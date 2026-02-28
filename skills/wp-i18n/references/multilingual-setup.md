# Multilingual Setup

Use this file when configuring WordPress for multilingual content delivery.

## Plugin-based solutions

### WPML (commercial)

Most widely used. Supports posts, pages, custom post types, taxonomies, strings, menus, and widgets.

```php
// Check if WPML is active
if (defined('ICL_SITEPRESS_VERSION')) {
    // WPML-specific code
}

// Get current language
$current_lang = apply_filters('wpml_current_language', null);

// Get element translation
$translated_id = apply_filters('wpml_object_id', $post_id, 'post', true, 'it');

// Switch language in a template
do_action('wpml_switch_lang', 'it');
// ... output Italian content
do_action('wpml_switch_lang', null); // reset
```

Theme/plugin compatibility header:
```php
/**
 * Plugin Name: My Plugin
 * WPML Compatible: yes
 */
```

### Polylang (free + pro)

```php
// Check if Polylang is active
if (function_exists('pll_current_language')) {
    $lang = pll_current_language();
}

// Get translated post ID
$translated_id = pll_get_post($post_id, 'it');

// Get translated term ID
$translated_term = pll_get_term($term_id, 'it');

// Register a string for translation
pll_register_string('my-string-name', 'Default text', 'My Plugin');

// Get translated string
$text = pll__('Default text');
// or echo
pll_e('Default text');
```

### TranslatePress (visual)

Frontend visual editing — translates directly on the page.

```php
// Check if TranslatePress is active
if (class_exists('TRP_Translate_Press')) {
    // TranslatePress-specific code
}
```

## URL structure options

| Strategy | Example | Pros | Cons |
|----------|---------|------|------|
| Subdirectories | `example.com/it/` | Simple, single domain | Shared hosting limits |
| Subdomains | `it.example.com` | Separate analytics | DNS setup required |
| Domains | `example.it` | Best for SEO by country | Multiple SSL certs |
| URL parameter | `example.com?lang=it` | Easiest setup | Worst for SEO |

Recommended: **subdirectories** for most projects.

## Making plugins translation-compatible

### String registration (WPML)

```php
// Register admin strings
add_action('init', function() {
    if (function_exists('icl_register_string')) {
        icl_register_string('my-plugin', 'CTA Button Text', get_option('my_cta_text'));
    }
});

// Retrieve translated string
function get_my_cta_text() {
    $text = get_option('my_cta_text');
    if (function_exists('icl_t')) {
        return icl_t('my-plugin', 'CTA Button Text', $text);
    }
    return $text;
}
```

### wpml-config.xml

Required for WPML to know which custom fields and options to translate:

```xml
<wpml-config>
    <custom-fields>
        <custom-field action="translate">subtitle</custom-field>
        <custom-field action="copy">price</custom-field>
        <custom-field action="ignore">internal_notes</custom-field>
    </custom-fields>
    <admin-texts>
        <key name="my_plugin_options">
            <key name="cta_text" />
            <key name="footer_text" />
        </key>
    </admin-texts>
    <custom-types>
        <custom-type translate="1">product</custom-type>
    </custom-types>
    <taxonomies>
        <taxonomy translate="1">product_category</taxonomy>
    </taxonomies>
</wpml-config>
```

Place at plugin or theme root. WPML reads it automatically.

## Multilingual REST API

### WPML

```bash
# Get posts in Italian
curl "https://site.com/wp-json/wp/v2/posts?lang=it"

# Requires WPML REST API addon or custom filter
```

### Polylang

```bash
# Polylang adds ?lang= support to REST API
curl "https://site.com/wp-json/wp/v2/posts?lang=it"
```

### Custom REST language filtering

```php
add_filter('rest_post_query', function($args, $request) {
    $lang = $request->get_param('lang');
    if ($lang && function_exists('pll_current_language')) {
        $args['lang'] = $lang;
    }
    return $args;
}, 10, 2);
```

## hreflang tags

Essential for SEO — tells search engines which language version to show:

```php
add_action('wp_head', function() {
    // WPML handles this automatically
    // For custom implementations:
    $languages = [
        'en' => 'https://example.com/page/',
        'it' => 'https://example.com/it/pagina/',
        'de' => 'https://example.com/de/seite/',
    ];
    foreach ($languages as $lang => $url) {
        printf('<link rel="alternate" hreflang="%s" href="%s" />' . "\n",
            esc_attr($lang), esc_url($url));
    }
    // x-default for language selector/default page
    printf('<link rel="alternate" hreflang="x-default" href="%s" />' . "\n",
        esc_url($languages['en']));
});
```

## WooCommerce multilingual

### WPML + WooCommerce Multilingual

- Synchronizes products, variations, attributes across languages
- Multi-currency support
- Translated emails and checkout

```php
// Get translated product ID
$translated_product_id = apply_filters('wpml_object_id', $product_id, 'product', true, 'it');

// Get price in current currency
// Handled automatically by WooCommerce Multilingual
```

### Polylang + Hyyan WooCommerce Polylang Integration

Free alternative. Syncs stock, prices, and product data.

## Verification

```bash
# Check hreflang tags
curl -s https://site.com/ | grep -i "hreflang"

# Verify language switcher works
curl -s -o /dev/null -w "%{http_code}" https://site.com/it/

# Check WPML config file exists (for WPML-compatible plugins)
ls wpml-config.xml

# Verify translated content exists
wp post list --lang=it --post_type=page --fields=ID,post_title
```
