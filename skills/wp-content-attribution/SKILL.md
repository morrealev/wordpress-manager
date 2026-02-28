---
name: wp-content-attribution
description: |
  This skill should be used when the user asks to "track content ROI",
  "attribute sales to content", "measure content performance", "conversion tracking",
  "UTM tracking setup", "which content drives sales", "content attribution",
  "revenue per post", "customer acquisition source", "marketing attribution",
  or mentions connecting WordPress content metrics with WooCommerce sales data.
version: 1.0.0
---

## Overview

Content-Commerce Attribution measures which WordPress content pieces drive WooCommerce conversions, enabling data-driven content strategy. By linking UTM-tracked traffic to order data, you can calculate ROI per content piece — answering "which blog posts actually generate revenue?"

This skill orchestrates existing MCP tools — WooCommerce reports, content CRUD, order management — into attribution workflows. No new tools or custom plugins are required; UTM capture uses lightweight mu-plugin patterns.

## When to Use

- User has a WooCommerce store plus blog/content and wants to understand content ROI
- "Which of my blog posts are driving the most sales?"
- "How do I track which content leads to purchases?"
- "Set up UTM tracking for my WooCommerce store"
- "Calculate revenue per blog post"
- "Build a content attribution dashboard"
- "What's my customer acquisition cost by content type?"

## Attribution vs Analytics

| Aspect | Attribution | Analytics |
|--------|------------|-----------|
| Measures | Contribution to conversion | Traffic and engagement |
| Answer | "This post generated $5,000 in revenue" | "This post got 10,000 visits" |
| Data source | Order meta + UTM params | Page views + sessions |
| Granularity | Revenue per content piece | Visitors per content piece |
| Action | Invest more in high-ROI content | Invest in high-traffic topics |

## Prerequisites / Detection

```bash
node skills/wp-content-attribution/scripts/attribution_inspect.mjs --cwd=/path/to/wordpress
```

The script checks WooCommerce presence, analytics plugins, UTM tracking setup, content/product volume ratio, and existing order meta with source fields.

## Content Attribution Operations Decision Tree

1. **What attribution task?**

   - "UTM tracking" / "campaign tracking" / "source tracking"
     → **UTM Setup** — Read: `references/utm-tracking-setup.md`

   - "conversion funnel" / "customer journey" / "touchpoints"
     → **Funnel Analysis** — Read: `references/conversion-funnels.md`

   - "attribution model" / "first touch" / "last touch" / "multi-touch"
     → **Attribution Models** — Read: `references/attribution-models.md`

   - "content ROI" / "revenue per post" / "cost per acquisition"
     → **ROI Calculation** — Read: `references/roi-calculation.md`

   - "dashboard" / "report" / "analytics setup"
     → **Reporting** — Read: `references/reporting-dashboards.md`

2. **Common workflow (first-time setup):**
   1. Verify WooCommerce + content setup (run `attribution_inspect.mjs`)
   2. Install UTM capture mu-plugin (see `utm-tracking-setup.md`)
   3. Tag internal links from content → product pages with UTM parameters
   4. Wait for data accumulation (minimum 2–4 weeks)
   5. Pull sales data: `wc_get_sales_report` for period
   6. Pull content data: `list_content` for same period
   7. Correlate: match order UTM sources with content pieces
   8. Apply attribution model (default: last-touch)
   9. Generate attribution report with top converting content

## Recommended Agent

`wp-ecommerce-manager` — handles WooCommerce data, sales reports, and order analysis with attribution context.

## Additional Resources

### Reference Files

| File | Description |
|------|-------------|
| **`references/utm-tracking-setup.md`** | UTM parameter design, mu-plugin for capture, naming conventions |
| **`references/conversion-funnels.md`** | Funnel stages, drop-off analysis, cart abandonment metrics |
| **`references/attribution-models.md`** | First-touch, last-touch, linear, time-decay, position-based models |
| **`references/roi-calculation.md`** | Revenue per post, content ROI formula, CAC, LTV by source |
| **`references/reporting-dashboards.md`** | GA4 integration, MonsterInsights setup, dashboard KPIs |

### Related Skills

- `wp-woocommerce` — WooCommerce store management and reporting tools
- `wp-content` — content management and editorial workflows
- `wp-monitoring` — ongoing site performance and health tracking
- `wp-content-repurposing` — transform high-ROI content into multi-channel formats
