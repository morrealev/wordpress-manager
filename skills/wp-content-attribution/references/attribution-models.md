# Attribution Models

Use this file when selecting and implementing an attribution model — first-touch, last-touch, linear, time-decay, and position-based approaches for WordPress + WooCommerce content attribution.

## Model Overview

| Model | Credit Distribution | Best For | Complexity |
|-------|-------------------|----------|------------|
| **First-Touch** | 100% to first interaction | Brand awareness measurement | Low |
| **Last-Touch** | 100% to last interaction before purchase | Direct conversion analysis | Low |
| **Linear** | Equal across all touchpoints | Balanced view of journey | Medium |
| **Time-Decay** | More to recent touchpoints | Short sales cycles | Medium |
| **Position-Based (U-shaped)** | 40% first, 40% last, 20% middle | Full journey with key moments | High |

## First-Touch Attribution

Credit goes entirely to the first content interaction that brought the customer.

**Logic:**
```
Customer journey: Blog Post A → Product Page → Blog Post B → Purchase
Attribution:      Blog Post A = 100%
```

**WordPress implementation:**
- Uses the `_first_utm_source` and `_first_utm_campaign` order meta fields
- Captured via the first-visit cookie in the UTM mu-plugin

**When to use:**
- You want to understand which content attracts new customers
- Evaluating top-of-funnel content effectiveness
- Measuring brand awareness investment ROI

**Limitation:** Ignores all subsequent interactions that nurtured the conversion.

## Last-Touch Attribution

Credit goes entirely to the last content interaction before purchase.

**Logic:**
```
Customer journey: Blog Post A → Product Page → Blog Post B → Purchase
Attribution:      Blog Post B = 100%
```

**WordPress implementation:**
- Uses the `_last_utm_source` and `_last_utm_campaign` order meta fields
- Captured via the always-updated last-touch cookie

**When to use:**
- Default starting model (simplest, most actionable)
- Identifying content that directly triggers purchases
- Short sales cycles where one touchpoint dominates

**Limitation:** Ignores the content that initially attracted the customer.

## Linear Attribution

Equal credit distributed across all touchpoints in the journey.

**Logic:**
```
Customer journey: Blog Post A → Product Page → Blog Post B → Purchase
Attribution:      Blog Post A = 33.3%, Product Page = 33.3%, Blog Post B = 33.3%
```

**WordPress implementation:**
Requires tracking all touchpoints, not just first and last. Options:
1. **Session tracking:** Store each page view with UTM in a user session log (more complex mu-plugin)
2. **GA4 integration:** Use Google Analytics 4's exploration reports for multi-touch paths
3. **Simplified approach:** Split credit between first-touch and last-touch (50/50)

**When to use:**
- All content in the journey contributes equally
- Long sales cycles with many touchpoints
- Content team needs validation that middle-of-funnel content matters

**Limitation:** Overvalues low-impact touchpoints (e.g., accidental page views).

## Time-Decay Attribution

More credit to touchpoints closer in time to the conversion.

**Logic (example decay: 7-day half-life):**
```
Day 1:  Blog Post A (30 days before purchase) = 6%
Day 15: Product Page (15 days before)         = 18%
Day 25: Blog Post B (5 days before)           = 31%
Day 29: Email Link (1 day before)             = 45%
```

**Formula:**
```
Credit = 2^(-(time_before_purchase / half_life))
Normalize all credits to sum to 100%
```

**When to use:**
- Sales cycle is short (< 30 days)
- Recent interactions are more influential than early ones
- Evaluating promotional/seasonal content effectiveness

**Limitation:** Undervalues brand awareness content that starts the journey.

## Position-Based (U-shaped) Attribution

40% to first touch, 40% to last touch, 20% distributed across middle touchpoints.

**Logic:**
```
Customer journey: Blog Post A → Product Page → Comparison → Blog Post B → Purchase
Attribution:      Blog Post A = 40%, Product Page = 10%, Comparison = 10%, Blog Post B = 40%
```

**When to use:**
- Both acquisition (first touch) and conversion (last touch) are strategically important
- Multi-step customer journeys with clear awareness and decision phases
- Most balanced model for content strategy decisions

**Limitation:** Requires full journey tracking; arbitrary 40/40/20 split.

## Choosing the Right Model

```
Start here:
    │
    ├─ "I just need something simple to start"
    │   → Last-Touch Attribution
    │
    ├─ "I want to know what content attracts new customers"
    │   → First-Touch Attribution
    │
    ├─ "My sales cycle is short (< 7 days)"
    │   → Last-Touch Attribution
    │
    ├─ "My sales cycle is medium (7-30 days)"
    │   → Time-Decay Attribution (7-day half-life)
    │
    ├─ "My sales cycle is long (30+ days, many touchpoints)"
    │   → Position-Based (U-shaped)
    │
    └─ "I want to validate all content stages equally"
        → Linear Attribution
```

## WordPress-Specific Implementation

### Building Attribution from Order Meta

With the UTM mu-plugin capturing first-touch and last-touch data:

```bash
# Pull orders with attribution data
wc_list_orders(status="completed", per_page=100)

# For each order, check meta fields:
# _first_utm_source, _first_utm_campaign → first-touch attribution
# _last_utm_source, _last_utm_campaign   → last-touch attribution
# _landing_page                          → first page visited
```

### Attribution Report Query

```
For each unique utm_campaign value in completed orders:
  1. Count orders with this campaign (first-touch)
  2. Count orders with this campaign (last-touch)
  3. Sum revenue for each
  4. Map campaign name back to content piece (campaign = post slug)
  5. Rank by revenue
```

### Simplified Multi-Touch (50/50 First/Last)

When full journey tracking is not available, split attribution between first and last touch:

```
Revenue per content piece =
  (orders where _first_utm_campaign = post_slug × order_total × 0.5) +
  (orders where _last_utm_campaign = post_slug × order_total × 0.5)
```

## Decision Checklist

1. What is the average sales cycle length? → Short = last-touch; Long = position-based
2. Is full journey tracking available (all touchpoints)? → No = use first/last touch only
3. Is the goal to optimize acquisition or conversion content? → Acquisition = first-touch; Conversion = last-touch
4. Does the team need a simple, actionable model first? → Start with last-touch, evolve later
5. Are UTM cookies capturing first and last touch? → Verify mu-plugin is installed
