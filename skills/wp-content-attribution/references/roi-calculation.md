# ROI Calculation

Use this file when calculating content return on investment — revenue per post, content ROI formula, customer acquisition cost, and lifetime value by content source.

## Revenue Per Post

The most straightforward content attribution metric.

**Formula:**
```
Revenue Per Post = Total attributed revenue / Number of posts
```

**Per-post attribution (last-touch):**
```
Revenue(Post X) = SUM(order_total) WHERE _last_utm_campaign = "post-x-slug"
```

**Per-post attribution (first-touch):**
```
Revenue(Post X) = SUM(order_total) WHERE _first_utm_campaign = "post-x-slug"
```

### Calculating with WooCommerce MCP Tools

```bash
# Step 1: Get completed orders for the period
wc_list_orders(status="completed", after="2025-01-01", before="2025-01-31", per_page=100)

# Step 2: For each order, read utm meta
# Group orders by _last_utm_campaign value
# Sum order_total per campaign (campaign = post slug)

# Step 3: Get content list for the same period
list_content(type="post", status="publish", after="2025-01-01", before="2025-01-31")

# Step 4: Match campaign slugs to post titles
# Result: { post_title: "Cactus Water Benefits", slug: "cactus-water-benefits", revenue: 2500, orders: 15 }
```

### Revenue Per Post Benchmarks

| Content Type | Typical Revenue/Post | Notes |
|-------------|---------------------|-------|
| Product review | $500–$5,000 | High intent, bottom-of-funnel |
| How-to guide | $100–$1,000 | Indirect conversion, builds trust |
| Comparison post | $1,000–$10,000 | Very high intent, decision-stage |
| Category guide | $200–$2,000 | Mid-funnel, product discovery |
| News/update | $50–$500 | Low intent, brand awareness |

## Content ROI Formula

**Formula:**
```
Content ROI = (Revenue - Content Cost) / Content Cost × 100%
```

**Example:**
```
Blog post cost:   $200 (writer) + $50 (images) + $30 (editing) = $280
Revenue attributed: $1,400 (last-touch, 3 months)
Content ROI: ($1,400 - $280) / $280 × 100% = 400% ROI
```

### Content Cost Components

| Component | Typical Cost | How to Track |
|-----------|-------------|--------------|
| Writing | $0.10–$0.50/word | Per-post invoice or hourly rate |
| Editing | $25–$100/post | Editor time tracking |
| Images/media | $10–$100/post | Stock photo licenses, design time |
| SEO optimization | $25–$75/post | SEO tool costs + specialist time |
| Publishing/formatting | $15–$30/post | CMS time |
| **Total typical cost** | **$100–$500/post** | Sum all components |

### ROI by Content Category

Track ROI by category to identify the most profitable content pillars:

```
Category        Posts  Total Cost  Total Revenue  ROI
──────────────────────────────────────────────────────
Product reviews   10    $3,000      $25,000       733%
How-to guides     20    $4,000      $8,000        100%
Company news      15    $1,500      $750          -50%
Case studies       5    $2,500      $12,000       380%
```

**Action:** Double down on product reviews and case studies; reduce company news investment.

## Customer Acquisition Cost (CAC) by Content Type

**Formula:**
```
CAC = Total content investment / New customers acquired from content
```

**By content type:**
```
CAC(blog) = Blog content costs / New customers with _first_utm_source = "blog"
CAC(email) = Email costs / New customers with _first_utm_source = "newsletter"
CAC(social) = Social costs / New customers with _first_utm_source = "facebook|instagram"
```

### CAC Benchmarks (E-commerce)

| Channel | Typical CAC | Notes |
|---------|------------|-------|
| Organic blog content | $20–$80 | Lower CAC, longer to build |
| Email newsletter | $10–$40 | Lowest CAC, requires list |
| Paid search (Google) | $30–$100 | Immediate but expensive |
| Social media (organic) | $25–$75 | Variable, platform-dependent |
| Social media (paid) | $15–$60 | Scalable with budget |

## Lifetime Value (LTV) by Acquisition Source

**Formula:**
```
LTV = Average Order Value × Purchase Frequency × Customer Lifespan
```

**By source:**
```
LTV(blog) = AOV(blog customers) × Frequency(blog customers) × Lifespan(blog customers)
```

### Calculating with WooCommerce Data

```bash
# Get top sellers to understand AOV patterns
wc_get_top_sellers(period="year")

# Get sales report for overall metrics
wc_get_sales_report(period="year")
# Returns: total_sales, total_orders → AOV = total_sales / total_orders

# For source-specific LTV:
# 1. Filter orders by _first_utm_source
# 2. Group by customer_id
# 3. Calculate per-customer: total_spent, order_count, first_order_date, last_order_date
# 4. Average across customers from that source
```

### LTV:CAC Ratio

```
Healthy ratio: LTV:CAC > 3:1

Example:
  Blog customers: LTV = $240, CAC = $50 → Ratio = 4.8:1 ✓ Excellent
  Paid ad customers: LTV = $180, CAC = $80 → Ratio = 2.25:1 ⚠ Below target
```

**Action:** If LTV:CAC < 3:1, either reduce acquisition cost or increase customer retention/upsell.

## Content Efficiency Metrics

### Revenue Per Word

```
Revenue Per Word = Total attributed revenue / Total words published
```

Useful for comparing content formats: long-form guides vs short product reviews.

### Revenue Per Topic

```
Revenue Per Topic = SUM(revenue of posts in topic cluster) / Number of posts in cluster
```

Identifies which topic clusters are most commercially valuable.

### Time to ROI

```
Time to ROI = Days from publish date to break-even (revenue ≥ content cost)
```

Short time to ROI = content with immediate commercial intent (product reviews).
Long time to ROI = evergreen SEO content (compounds over months).

## Using WC Reports for Date Correlation

```bash
# Monthly sales report
wc_get_sales_report(date_min="2025-03-01", date_max="2025-03-31")

# Top-selling products in the period
wc_get_top_sellers(date_min="2025-03-01", date_max="2025-03-31")

# Cross-reference with content published before the period:
list_content(type="post", status="publish", before="2025-03-31", orderby="date", order="desc", per_page=20)
```

## Decision Checklist

1. Is content cost tracked per post? → Set up cost tracking (spreadsheet or custom field)
2. Is revenue attributed to individual posts via UTM? → Verify mu-plugin capturing data
3. Is CAC calculated by acquisition source? → Group orders by first-touch source
4. Is LTV:CAC ratio above 3:1? → If not, optimize acquisition or retention
5. Are content investments being shifted to highest-ROI categories? → Review quarterly
