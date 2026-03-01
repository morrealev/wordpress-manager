# Traffic Attribution

## UTM Parameter Standards

UTM (Urchin Tracking Module) parameters tag URLs to track marketing campaign performance.

### Required Parameters
| Parameter | Purpose | Example |
|-----------|---------|---------|
| `utm_source` | Traffic origin | `google`, `facebook`, `newsletter` |
| `utm_medium` | Marketing channel | `cpc`, `email`, `social`, `referral` |
| `utm_campaign` | Campaign name | `spring-sale-2024`, `black-friday` |

### Optional Parameters
| Parameter | Purpose | Example |
|-----------|---------|---------|
| `utm_term` | Paid search keyword | `running+shoes` |
| `utm_content` | Ad variation / CTA | `cta-button-red`, `hero-banner` |

### URL Format
```
https://example.com/page?utm_source=google&utm_medium=cpc&utm_campaign=spring-sale
```

## Source/Medium Mapping

### Standard Mappings in GA4
| Source/Medium | Description |
|---------------|-------------|
| `google / organic` | Google organic search |
| `google / cpc` | Google Ads paid search |
| `facebook / social` | Facebook organic posts |
| `facebook / cpc` | Facebook paid ads |
| `newsletter / email` | Email marketing campaigns |
| `(direct) / (none)` | Direct traffic or untagged |
| `referral / referral` | Incoming links from other sites |

### Plausible Source Mapping
Plausible uses `visit:source` which maps to the referrer or `utm_source`:
- Organic search: `Google`, `Bing`, `DuckDuckGo`
- Social: `Facebook`, `Twitter`, `LinkedIn`
- UTM-tagged: uses the `utm_source` value directly

## Combining GA4 Traffic with WooCommerce Conversions

### Data Flow
1. **GA4** tracks the user journey: source, medium, pages visited, events
2. **WooCommerce** records the transaction: products, revenue, order ID
3. **Attribution** connects which traffic source led to which purchase

### Attribution Models
| Model | Logic | Best For |
|-------|-------|----------|
| Last click | Credits the last touchpoint before conversion | Simple campaigns |
| First click | Credits the first touchpoint in the journey | Brand awareness |
| Linear | Equal credit to all touchpoints | Multi-touch evaluation |
| Data-driven | ML-based credit distribution (GA4 default) | Complex funnels |

### Implementation Steps
1. Ensure GA4 enhanced e-commerce tracking is active (via Site Kit or GTM)
2. Map WooCommerce order IDs to GA4 transaction events
3. Use `ga4_conversions` tool with `purchase` event to get revenue by source
4. Cross-reference with WooCommerce order data for product-level attribution

## Cross-Platform Discrepancy Analysis

### Common Causes of Data Differences
| Issue | GA4 Impact | Plausible Impact |
|-------|-----------|-----------------|
| Ad blockers | Under-reports (blocked) | Under-reports (blocked) |
| Cookie consent | Under-reports if declined | No impact (cookieless) |
| Bot traffic | Filtered (mostly) | Filtered |
| SPA navigation | May miss if not configured | Tracks via History API |
| Caching | CDN may cache tracking | Same |
| Sampling | Large datasets sampled | No sampling |

### Reconciliation Steps
1. Compare total sessions (GA4) vs visits (Plausible) for the same period
2. Calculate the gap percentage: typically 10-30% difference is normal
3. Check source-level: organic search should be closest between platforms
4. Investigate large discrepancies in specific sources or pages
5. Use CWV data as an independent third reference for page-level traffic

## Campaign Tracking Best Practices

- **Always tag** paid campaign URLs with UTM parameters
- **Use consistent naming** conventions (lowercase, hyphens, no spaces)
- **Document all campaigns** in a shared spreadsheet or naming convention guide
- **Test tagged URLs** before launching campaigns
- **Monitor `(not set)`** values in GA4 — indicates untagged traffic
- **Review referral exclusions** in GA4 to prevent self-referrals
- **Set up conversion goals** in both GA4 and WooCommerce for accurate ROI
