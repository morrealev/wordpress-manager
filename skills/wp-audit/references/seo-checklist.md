# WordPress SEO Audit Checklist

## 1. Technical SEO (CRITICAL)

### Crawlability
- [ ] robots.txt exists and is valid (`/robots.txt`)
- [ ] robots.txt allows search engine crawling of key content
- [ ] XML sitemap exists and is submitted to Google Search Console
- [ ] Sitemap includes all important pages and posts
- [ ] No unintentional `noindex` directives on key pages
- [ ] No orphaned pages (pages with no internal links)

### Indexability
- [ ] Site is not set to "Discourage search engines" (Settings > Reading)
- [ ] Important pages return HTTP 200
- [ ] No duplicate content issues (www vs non-www, HTTP vs HTTPS)
- [ ] Canonical URLs properly set on all pages
- [ ] Pagination handled with rel=next/prev or load-more

### URL Structure
- [ ] Permalinks set to post name (`/%postname%/`)
- [ ] URLs are clean (no query parameters for content pages)
- [ ] Slugs are descriptive and include keywords
- [ ] No excessively long URLs (target < 75 characters)
- [ ] 301 redirects in place for changed URLs

## 2. On-Page SEO Sampling (HIGH)

### Meta Data (sample 10 most important pages)
- [ ] Title tag present and unique (50-60 chars)
- [ ] Title includes primary keyword
- [ ] Meta description present and unique (120-160 chars)
- [ ] Meta description includes keyword and CTA
- [ ] Open Graph tags present (og:title, og:description, og:image)
- [ ] Twitter Card tags present

### Content Structure
- [ ] Single H1 per page
- [ ] H2/H3 hierarchy logical (no skipped levels)
- [ ] Primary keyword in H1
- [ ] Secondary keywords in H2/H3
- [ ] Alt text on all images
- [ ] Internal links present (2-3 per page minimum)
- [ ] External links to authoritative sources

### Content Quality
- [ ] No thin content pages (< 300 words for blog posts)
- [ ] No duplicate content across pages
- [ ] Content freshness (key pages updated within last 6 months)
- [ ] E-E-A-T signals present (author bios, credentials, sources)

## 3. Structured Data (MEDIUM)

### Checks
- [ ] Organization schema on homepage
- [ ] BreadcrumbList schema on inner pages
- [ ] Article schema on blog posts
- [ ] Product schema on product pages (if e-commerce)
- [ ] FAQ schema where applicable
- [ ] LocalBusiness schema (if local business)
- [ ] Validate with Google Rich Results Test

### Common WordPress Schema Implementations
- Yoast SEO: automatic schema generation
- Rank Math: schema module
- Schema Pro: dedicated schema plugin
- Manual: JSON-LD in theme header

## 4. Site Performance (for SEO — see also Performance Checklist)

### Core Web Vitals Impact on SEO
- [ ] LCP < 2.5s (ranking factor since 2021)
- [ ] INP < 200ms
- [ ] CLS < 0.1
- [ ] Mobile-friendly (responsive design)
- [ ] HTTPS enabled (ranking signal)

### Mobile SEO
- [ ] Mobile responsive design (no separate mobile site)
- [ ] Touch targets >= 48px
- [ ] Font size >= 16px on mobile
- [ ] No horizontal scrolling
- [ ] Mobile page speed acceptable

## 5. Local SEO (if applicable)

### Checks
- [ ] Google Business Profile claimed and optimized
- [ ] NAP consistency (Name, Address, Phone) across site
- [ ] LocalBusiness schema with accurate data
- [ ] Location pages for each service area
- [ ] Google Maps embed on contact page
- [ ] Local keywords in title tags and content

## 6. Content Architecture (MEDIUM)

### Taxonomy Assessment
- [ ] Categories are logical and not too deep (max 2 levels)
- [ ] No empty categories
- [ ] No single-post categories (merge or expand)
- [ ] Tags are used consistently
- [ ] Taxonomy pages have custom descriptions (not blank)
- [ ] Category/tag archive pages are indexable

### Internal Linking
- [ ] Homepage links to key category/pillar pages
- [ ] Pillar pages link to related cluster content
- [ ] New content links to existing related content
- [ ] No broken internal links (404s)
- [ ] Anchor text is descriptive (not "click here")

## 7. WordPress-Specific SEO Settings

### SEO Plugin Configuration (Yoast/Rank Math/All in One SEO)
- [ ] XML sitemap enabled and valid
- [ ] Social profiles configured
- [ ] Breadcrumbs enabled
- [ ] Author archives: enabled or disabled intentionally
- [ ] Date archives: disabled (usually thin content)
- [ ] Tag archives: noindex if thin content
- [ ] Media attachment pages: redirected to parent post

### WordPress Settings
- [ ] Site title and tagline set properly
- [ ] Permalinks: post name structure
- [ ] Reading settings: posts page and homepage set correctly
- [ ] Discussion: comment moderation enabled
- [ ] Search engine visibility: "Do not discourage" checked
