# WordPress Performance Audit Checklist

## 1. Plugin Analysis (HIGH IMPACT)

### Checks
- [ ] Count active plugins (target: < 20)
- [ ] Identify known heavy plugins (page builders, social sharing, analytics suites)
- [ ] Check for redundant plugins (multiple caching, multiple SEO, multiple security)
- [ ] Identify plugins that load assets on every page (even where not needed)
- [ ] Count inactive plugins (should be deleted, not just deactivated)

### Known Heavy Plugins
| Plugin | Impact | Alternative |
|--------|--------|-------------|
| Elementor Pro | High (CSS/JS on all pages) | Gutenberg / GenerateBlocks |
| Jetpack (full) | High (many modules) | Individual lightweight alternatives |
| Revolution Slider | High (heavy JS/CSS) | Lightweight slider or static hero |
| WooCommerce | Medium-High (DB queries) | Necessary for e-commerce, optimize with caching |
| WPML | Medium (DB overhead) | Polylang (lighter) |

## 2. Caching Assessment (HIGH IMPACT)

### Page Caching
- [ ] Caching plugin active? (WP Rocket, LiteSpeed Cache, W3 Total Cache)
- [ ] Page cache enabled?
- [ ] Cache preloading enabled?
- [ ] Cache exclusions properly configured? (cart, checkout, account pages)

### Browser Caching
- [ ] Expires headers set for static assets?
- [ ] Cache-Control headers configured?
- [ ] Target: images 1 year, CSS/JS 1 month

### Object Caching
- [ ] Redis or Memcached available on hosting?
- [ ] Object cache drop-in installed?
- [ ] Persistent object cache active?

### CDN
- [ ] CDN configured? (Cloudflare, StackPath, BunnyCDN)
- [ ] Static assets served via CDN?
- [ ] CDN cache hit rate acceptable? (>90%)

## 3. Media Optimization (MEDIUM IMPACT)

### Image Checks
- [ ] WebP format used? (40-60% smaller than JPEG)
- [ ] Images properly sized? (no 4000px images displayed at 800px)
- [ ] Lazy loading implemented? (native `loading="lazy"` or plugin)
- [ ] Responsive srcsets generated?
- [ ] Largest image on homepage < 200KB?

### Optimization Tools
- ShortPixel, Imagify, or Smush for automatic compression
- WebP Express for format conversion
- Native WordPress 5.8+ generates WebP if supported

## 4. Database Health (MEDIUM IMPACT)

### Checks
- [ ] Post revisions limited? (recommended: 3-5 max)
- [ ] Spam comments cleaned? (should be 0)
- [ ] Trashed items emptied?
- [ ] Orphaned meta data cleaned?
- [ ] Transients expired properly?
- [ ] Autoloaded options size < 1MB?

### wp-config.php Settings
```php
define('WP_POST_REVISIONS', 5);
define('EMPTY_TRASH_DAYS', 7);
define('AUTOSAVE_INTERVAL', 120);
```

## 5. Core Web Vitals (HIGH IMPACT for SEO)

### LCP (Largest Contentful Paint) — Target < 2.5s
- [ ] Hero image optimized and preloaded?
- [ ] Critical CSS inlined or preloaded?
- [ ] Server response time (TTFB) < 600ms?
- [ ] No render-blocking resources above the fold?

### INP (Interaction to Next Paint) — Target < 200ms
- [ ] JavaScript execution time minimized?
- [ ] Event handlers efficient?
- [ ] Third-party scripts deferred?
- [ ] No long tasks blocking main thread?

### CLS (Cumulative Layout Shift) — Target < 0.1
- [ ] Images/videos have explicit width/height?
- [ ] Fonts preloaded (no FOUT/FOIT)?
- [ ] No dynamically injected content above the fold?
- [ ] Ad slots have reserved dimensions?

## 6. Server Configuration (MEDIUM IMPACT)

### Checks
- [ ] PHP version >= 8.1 (8.2/8.3 preferred)
- [ ] PHP memory limit >= 256MB
- [ ] Max upload size appropriate
- [ ] MySQL/MariaDB latest stable
- [ ] HTTP/2 or HTTP/3 enabled
- [ ] Gzip/Brotli compression enabled
- [ ] Keep-alive connections enabled

## 7. Theme Assessment (LOW-MEDIUM IMPACT)

### Checks
- [ ] Theme is lightweight? (< 1MB total assets)
- [ ] Theme loads minimal CSS/JS?
- [ ] Theme is well-coded? (no inline styles, proper enqueueing)
- [ ] Child theme used? (no direct parent theme modifications)
- [ ] Unused theme assets removed?
