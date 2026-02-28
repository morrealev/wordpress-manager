# Conversion Funnels

Use this file when analyzing the content-to-commerce funnel — mapping funnel stages, measuring drop-off, and correlating WooCommerce events with content interactions.

## Content-to-Commerce Funnel Stages

```
Awareness → Consideration → Decision → Purchase → Retention
   │              │              │           │           │
   Blog post      Product page   Cart        Checkout    Re-order
   Social share   Comparison     Wishlist    Payment     Review
   SEO landing    Category page  Pricing     Confirm     Referral
```

### Stage Definitions

| Stage | User Intent | Content Type | WooCommerce Event |
|-------|------------|--------------|-------------------|
| **Awareness** | "I have a problem" | Blog posts, guides, educational content | Page view (no WC interaction) |
| **Consideration** | "What are my options?" | Product pages, comparisons, reviews | Product view, add to wishlist |
| **Decision** | "I'm choosing this one" | Product detail, pricing, testimonials | Add to cart |
| **Purchase** | "I'm buying now" | Cart, checkout | Checkout initiated → Order placed |
| **Retention** | "I'll come back" | Thank-you page, follow-up emails | Re-order, review submitted |

## Funnel Metrics per Stage

| Metric | Formula | Target | Data Source |
|--------|---------|--------|-------------|
| **Awareness rate** | Unique blog visitors / Total visitors | > 40% | Google Analytics |
| **Content→Product rate** | Product page views from blog / Blog page views | > 5% | UTM tracking |
| **Add-to-cart rate** | Add-to-cart events / Product page views | > 8% | WooCommerce analytics |
| **Cart→Checkout rate** | Checkout initiated / Add-to-cart events | > 50% | WooCommerce analytics |
| **Checkout conversion** | Orders placed / Checkout initiated | > 60% | `wc_get_sales_report` |
| **Overall content→sale** | Orders from blog / Blog visitors | > 0.5% | UTM + order correlation |

## WordPress Content Mapping to Funnel Stages

### Awareness Content (Top of Funnel)

- **Blog posts** — educational, informational, SEO-targeted
- **Guides/tutorials** — how-to content solving user problems
- **Infographics/media** — shareable, high-reach content
- **SEO landing pages** — targeting informational keywords

Query awareness content:
```bash
# List recent blog posts (awareness stage content)
list_content(type="post", status="publish", per_page=50, orderby="date")
```

### Consideration Content (Middle of Funnel)

- **Product pages** — detailed product information
- **Category pages** — curated product collections
- **Comparison posts** — "Product A vs Product B"
- **Case studies/reviews** — social proof content

### Decision Content (Bottom of Funnel)

- **Product detail with CTA** — pricing, buy button, urgency
- **Testimonials/reviews** — conversion reinforcement
- **FAQ pages** — objection handling
- **Pricing/plans pages** — clear value proposition

## Funnel Drop-Off Analysis

### Identifying Drop-Off Points

```
Stage               Visitors    Drop-off    Rate
─────────────────────────────────────────────────
Blog post view      10,000      -           100%
Click to product     500        9,500       5.0%
Add to cart          80         420         16.0%
Begin checkout       50         30          62.5%
Complete purchase    35         15          70.0%
─────────────────────────────────────────────────
Overall conversion: 35 / 10,000 = 0.35%
```

### Common Drop-Off Causes and Fixes

| Drop-Off Point | Common Cause | Fix |
|----------------|-------------|-----|
| Blog → Product | Weak CTA in blog post | Add prominent product CTA with UTM |
| Product → Cart | Missing social proof | Add reviews, ratings, trust badges |
| Cart → Checkout | Unexpected costs (shipping) | Show shipping calculator earlier |
| Checkout → Purchase | Complex checkout form | Simplify, enable guest checkout |
| Purchase → Re-order | No follow-up engagement | Set up post-purchase email sequence |

## WooCommerce Cart Abandonment as Funnel Metric

Cart abandonment rate = (Carts created - Orders completed) / Carts created

### Measuring with WooCommerce

```bash
# Get total orders in period
wc_get_sales_report(period="month")
# Returns: total_orders, total_sales, etc.

# Compare with add-to-cart events (requires analytics plugin or custom tracking)
```

### Abandonment Recovery Strategies

1. **Abandoned cart emails** — send 1h, 24h, 72h after abandonment
2. **Exit-intent popup** — offer discount at checkout page exit
3. **Retargeting ads** — Facebook/Google remarketing to cart abandoners
4. **Simplified checkout** — reduce form fields, add payment options

## Cross-Referencing Sales with Content Dates

Correlate content publication with sales spikes:

```bash
# Get sales by date range
wc_get_sales_report(date_min="2025-01-01", date_max="2025-01-31")

# Get content published in same period
list_content(type="post", status="publish", after="2025-01-01", before="2025-01-31")
```

**Analysis pattern:**
1. Pull monthly sales report from WooCommerce
2. Pull content published that month
3. Identify sales spikes after content publication
4. Match spikes with UTM source data on orders
5. Calculate correlation: content publish date → sales uplift window (typically 1–7 days)

## Decision Checklist

1. Are funnel stages defined and mapped to content types? → Use table above as starting point
2. Are drop-off rates measured at each stage? → Set up analytics tracking if not
3. Is cart abandonment rate tracked? → Check WooCommerce reports or analytics plugin
4. Are content publish dates correlated with sales data? → Cross-reference monthly
5. Are recovery strategies in place for the biggest drop-off point? → Prioritize highest-impact fix
