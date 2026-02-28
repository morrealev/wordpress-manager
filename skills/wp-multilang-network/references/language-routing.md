# Language Routing

Use this file when configuring how users are directed to the correct language version — browser language detection, geo-IP redirect, language switcher widgets, and cookie-based preferences.

## Browser Language Detection

The `Accept-Language` HTTP header indicates the user's preferred languages:

```
Accept-Language: it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7
```

### PHP Detection (mu-plugin)

```php
<?php
/**
 * Language redirect based on Accept-Language header.
 * Only redirects on first visit (no cookie set yet).
 */
add_action('template_redirect', function () {
    if (!is_multisite() || is_admin()) return;

    // Skip if user has language preference cookie
    if (isset($_COOKIE['wp_lang_pref'])) return;

    // Skip if already on a language sub-site
    $current_blog = get_current_blog_id();
    if ($current_blog !== 1) return; // Only redirect from main site

    $accepted = $_SERVER['HTTP_ACCEPT_LANGUAGE'] ?? '';
    $preferred_lang = substr($accepted, 0, 2); // Get primary language code

    $language_sites = [
        'it' => '/it/',
        'de' => '/de/',
        'fr' => '/fr/',
        'es' => '/es/',
    ];

    if (isset($language_sites[$preferred_lang])) {
        $target = home_url($language_sites[$preferred_lang]);
        // Set cookie so we don't redirect again
        setcookie('wp_lang_pref', $preferred_lang, time() + (365 * DAY_IN_SECONDS), '/');
        wp_redirect($target, 302); // 302 = temporary (important for SEO)
        exit;
    }
});
```

**Important:** Always use 302 (temporary) redirect for language detection, never 301 (permanent). A 301 would cache the redirect for all users, regardless of their language.

## Geo-IP Based Language Redirect

Use server-side geo-IP to redirect by country:

### Nginx Configuration

```nginx
# Requires ngx_http_geoip2_module
geoip2 /usr/share/GeoIP/GeoLite2-Country.mmdb {
    $geoip2_country_code default=US country iso_code;
}

server {
    # Redirect Italian visitors to /it/
    if ($geoip2_country_code = "IT") {
        set $lang_redirect "/it/";
    }
    if ($geoip2_country_code = "DE") {
        set $lang_redirect "/de/";
    }

    # Only redirect if no cookie and on root
    location = / {
        if ($cookie_wp_lang_pref = "") {
            return 302 $scheme://$host$lang_redirect;
        }
    }
}
```

### CloudFlare Workers

```javascript
export default {
  async fetch(request) {
    const url = new URL(request.url);
    const country = request.cf?.country || 'US';
    const hasPref = request.headers.get('cookie')?.includes('wp_lang_pref');

    if (url.pathname === '/' && !hasPref) {
      const langMap = { IT: '/it/', DE: '/de/', FR: '/fr/', ES: '/es/' };
      if (langMap[country]) {
        return Response.redirect(url.origin + langMap[country], 302);
      }
    }

    return fetch(request);
  }
};
```

## Language Switcher Widget

### HTML/CSS Language Switcher

```html
<nav class="language-switcher" aria-label="Language selection">
  <ul>
    <li><a href="https://example.com/about/" hreflang="en" lang="en">English</a></li>
    <li><a href="https://example.com/it/chi-siamo/" hreflang="it" lang="it">Italiano</a></li>
    <li><a href="https://example.com/de/ueber-uns/" hreflang="de" lang="de">Deutsch</a></li>
    <li><a href="https://example.com/fr/a-propos/" hreflang="fr" lang="fr">Français</a></li>
  </ul>
</nav>
```

### WordPress Widget (mu-plugin)

```php
add_action('widgets_init', function () {
    register_widget('Multilang_Switcher_Widget');
});

class Multilang_Switcher_Widget extends WP_Widget {
    public function __construct() {
        parent::__construct('multilang_switcher', 'Language Switcher');
    }

    public function widget($args, $instance) {
        $sites = get_sites(['number' => 20]);
        $language_names = [
            1 => ['code' => 'en', 'name' => 'English'],
            2 => ['code' => 'it', 'name' => 'Italiano'],
            3 => ['code' => 'de', 'name' => 'Deutsch'],
            // Add more...
        ];

        echo $args['before_widget'];
        echo '<nav class="language-switcher" aria-label="Language"><ul>';
        foreach ($sites as $site) {
            $lang = $language_names[$site->blog_id] ?? null;
            if (!$lang) continue;
            $url = get_home_url($site->blog_id);
            $active = ($site->blog_id === get_current_blog_id()) ? ' class="active"' : '';
            printf('<li%s><a href="%s" hreflang="%s" lang="%s">%s</a></li>',
                $active, esc_url($url), esc_attr($lang['code']),
                esc_attr($lang['code']), esc_html($lang['name'])
            );
        }
        echo '</ul></nav>';
        echo $args['after_widget'];
    }
}
```

## URL Structure Consistency

Ensure consistent URL patterns across all language sites:

| English (primary) | Italian | German | Rule |
|-------------------|---------|--------|------|
| `/about/` | `/it/chi-siamo/` | `/de/ueber-uns/` | Translated slugs (better UX) |
| `/about/` | `/it/about/` | `/de/about/` | Same slugs (easier hreflang matching) |
| `/products/shoes/` | `/it/prodotti/scarpe/` | `/de/produkte/schuhe/` | Full translation |

**Recommendation:** Use **same slugs** for easier hreflang matching via the mu-plugin. If translated slugs are preferred for UX, maintain a cross-reference table or use the multilingual plugin's content connections.

## Cookie-Based Language Preference

Store user's explicit language choice to persist across sessions:

```php
// When user clicks language switcher, set preference cookie
add_action('init', function () {
    if (isset($_GET['set_lang'])) {
        $lang = sanitize_text_field($_GET['set_lang']);
        $allowed = ['en', 'it', 'de', 'fr', 'es'];
        if (in_array($lang, $allowed, true)) {
            setcookie('wp_lang_pref', $lang, time() + (365 * DAY_IN_SECONDS), '/');
        }
    }
});
```

**Priority order for language selection:**
1. Explicit choice (cookie from language switcher click) — highest
2. URL path (user navigated to `/it/` directly)
3. Browser `Accept-Language` header (auto-detect)
4. Geo-IP (server-side guess)
5. Default language (x-default / main site) — lowest

## Headless Frontend Language Routing

### Next.js i18n

```javascript
// next.config.js
module.exports = {
  i18n: {
    locales: ['en', 'it', 'de', 'fr'],
    defaultLocale: 'en',
    localeDetection: true, // Auto-detect from Accept-Language
  },
};
```

### Nuxt i18n Module

```javascript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@nuxtjs/i18n'],
  i18n: {
    locales: ['en', 'it', 'de', 'fr'],
    defaultLocale: 'en',
    strategy: 'prefix_except_default', // /it/about, /de/about, /about (en)
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_redirected',
    },
  },
});
```

## Decision Checklist

1. Should language be detected automatically or only via switcher? → Auto-detect on first visit, respect explicit choice after
2. Is geo-IP available at the hosting/CDN level? → CloudFlare/nginx = yes; shared hosting = maybe not
3. Are redirect rules using 302 (not 301)? → 301 caches per-user, breaks multi-language
4. Is a language switcher present on all pages? → Add to header/footer template
5. Is cookie-based preference persisted? → Set on switcher click, check before redirect
6. For headless: is frontend i18n routing configured? → Next.js `i18n` or Nuxt i18n module
