# UTM Tracking Setup

Use this file when setting up UTM parameter capture for WooCommerce orders — parameter architecture, mu-plugin installation, naming conventions, and verification.

## UTM Parameter Architecture

| Parameter | Purpose | Example |
|-----------|---------|---------|
| `utm_source` | Where traffic originates | `blog`, `newsletter`, `google`, `facebook` |
| `utm_medium` | Marketing channel type | `organic`, `email`, `cpc`, `social`, `referral` |
| `utm_campaign` | Specific campaign name | `spring-sale-2025`, `product-launch-x` |
| `utm_content` | Differentiates ad/link variants | `cta-button`, `sidebar-banner`, `post-footer` |
| `utm_term` | Paid search keywords | `cactus-water-buy`, `zero-calorie-drink` |

## mu-plugin Pattern: Capture UTM on Checkout

Create a mu-plugin to automatically capture UTM parameters from the visitor session and store them as WooCommerce order meta:

```php
<?php
/**
 * Plugin Name: UTM Order Attribution
 * Description: Captures UTM parameters from visitor session and stores as order meta.
 * Version: 1.0.0
 */

// Store UTM params in session cookie on first visit
add_action('init', function () {
    if (!is_admin() && !wp_doing_cron()) {
        $utm_params = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
        foreach ($utm_params as $param) {
            if (isset($_GET[$param]) && !empty($_GET[$param])) {
                // Store in cookie for 30 days (first-touch attribution)
                $cookie_name = '_wc_' . $param;
                if (!isset($_COOKIE[$cookie_name])) {
                    setcookie($cookie_name, sanitize_text_field($_GET[$param]), time() + (30 * DAY_IN_SECONDS), '/');
                }
                // Always update last-touch cookie
                setcookie('_wc_last_' . $param, sanitize_text_field($_GET[$param]), time() + (30 * DAY_IN_SECONDS), '/');
            }
        }
    }
});

// Save UTM data to order meta on checkout
add_action('woocommerce_checkout_order_processed', function ($order_id) {
    $order = wc_get_order($order_id);
    if (!$order) return;

    $utm_params = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
    foreach ($utm_params as $param) {
        // Save first-touch
        $first_cookie = '_wc_' . $param;
        if (isset($_COOKIE[$first_cookie]) && !empty($_COOKIE[$first_cookie])) {
            $order->update_meta_data('_first_' . $param, sanitize_text_field($_COOKIE[$first_cookie]));
        }
        // Save last-touch
        $last_cookie = '_wc_last_' . $param;
        if (isset($_COOKIE[$last_cookie]) && !empty($_COOKIE[$last_cookie])) {
            $order->update_meta_data('_last_' . $param, sanitize_text_field($_COOKIE[$last_cookie]));
        }
    }

    // Save landing page URL (first page visited)
    if (isset($_COOKIE['_wc_landing_page'])) {
        $order->update_meta_data('_landing_page', sanitize_url($_COOKIE['_wc_landing_page']));
    }

    $order->save();
});

// Track landing page
add_action('init', function () {
    if (!is_admin() && !wp_doing_cron() && !isset($_COOKIE['_wc_landing_page'])) {
        $landing = esc_url_raw((isset($_SERVER['HTTPS']) ? 'https' : 'http') . '://' . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI']);
        setcookie('_wc_landing_page', $landing, time() + (30 * DAY_IN_SECONDS), '/');
    }
});
```

**Installation:**
1. Save as `wp-content/mu-plugins/utm-order-attribution.php`
2. mu-plugins load automatically — no activation needed
3. Verify by placing a test order with UTM params in the URL

## UTM Naming Conventions

Consistent naming is critical for accurate attribution. Adopt these rules:

| Rule | Good | Bad |
|------|------|-----|
| Lowercase always | `utm_source=blog` | `utm_source=Blog` |
| Hyphens for spaces | `spring-sale-2025` | `spring_sale_2025` or `spring sale` |
| No special chars | `product-launch` | `product_launch!` |
| Consistent source names | `newsletter` (always) | `email`, `newsletter`, `mail` (mixed) |
| Date in campaigns | `black-friday-2025` | `black-friday` (ambiguous year) |

**Recommended source taxonomy:**

| Source | Medium | When to Use |
|--------|--------|-------------|
| `blog` | `organic` | Internal blog post links to products |
| `blog` | `cta` | Blog post CTA buttons to products |
| `newsletter` | `email` | Email newsletter links |
| `google` | `cpc` | Google Ads campaigns |
| `facebook` | `social` | Facebook organic or paid posts |
| `instagram` | `social` | Instagram bio/stories links |
| `partner-name` | `referral` | Partner/affiliate links |

## Internal Link UTM Tagging

Tag all blog-to-product links with UTMs:

```html
<!-- Blog post CTA linking to product -->
<a href="/product/cactus-water/?utm_source=blog&utm_medium=cta&utm_campaign=cactus-water-benefits&utm_content=post-footer-button">
  Buy Cactus Water
</a>

<!-- Sidebar widget linking to product -->
<a href="/product/cactus-water/?utm_source=blog&utm_medium=sidebar&utm_campaign=always-on&utm_content=product-widget">
  Try Cactus Water
</a>
```

**Automated tagging approach:** Use a WordPress filter to append UTMs to all internal product links in post content:

```php
add_filter('the_content', function ($content) {
    if (!is_singular('post')) return $content;
    $post_slug = get_post_field('post_name', get_the_ID());
    // Append UTM to internal /product/ links that don't already have UTM
    $content = preg_replace_callback(
        '#href="(/product/[^"]*?)(?<!\?[^"]*utm_source[^"]*)"#',
        function ($matches) use ($post_slug) {
            $sep = strpos($matches[1], '?') !== false ? '&' : '?';
            return 'href="' . $matches[1] . $sep . 'utm_source=blog&utm_medium=organic&utm_campaign=' . $post_slug . '"';
        },
        $content
    );
    return $content;
});
```

## Verification

After installing the mu-plugin:

1. **Test visit:** Navigate to `yoursite.com/product/example/?utm_source=test&utm_medium=test&utm_campaign=test`
2. **Place test order** through WooCommerce checkout
3. **Check order meta:** Use `wc_list_orders` MCP tool or WooCommerce admin → Orders → order details
4. **Verify fields:** `_first_utm_source`, `_last_utm_source`, `_first_utm_campaign`, etc. should be populated
5. **Check cookies:** Browser dev tools → Application → Cookies → look for `_wc_utm_*` cookies

## Decision Checklist

1. Is the mu-plugin installed in `wp-content/mu-plugins/`? → Verify file exists
2. Are UTM naming conventions documented for the team? → Share taxonomy table
3. Are internal blog→product links tagged with UTMs? → Audit sample posts
4. Has a test order been placed with UTM params to verify capture? → Must pass before going live
5. Is cookie duration appropriate (30 days default)? → Adjust for sales cycle length
