# Reporting Dashboards

Use this file when setting up content attribution reporting — GA4 integration, analytics plugin configuration, dashboard KPIs, and automated reporting workflows.

## WooCommerce + WordPress Analytics Correlation

The core reporting methodology links three data sources:

```
WordPress Content Data          WooCommerce Order Data         Analytics Data
(list_content, post dates)  +   (wc_list_orders, order meta) + (GA4, MonsterInsights)
         │                              │                              │
         └──────────── Correlate via UTM campaign = post slug ─────────┘
```

### Manual Correlation Workflow

1. **Export orders** with UTM meta for the reporting period
2. **Export content** published in the same period
3. **Match** `_last_utm_campaign` values to post slugs
4. **Aggregate** revenue per post, per category, per content type
5. **Rank** by revenue, ROI, or conversion rate

## Google Analytics 4 Integration

### UTM → GA4 → WooCommerce Reconciliation

GA4 automatically captures UTM parameters as session-level dimensions:

| GA4 Dimension | UTM Parameter | Use |
|---------------|--------------|-----|
| Session source | `utm_source` | Where traffic came from |
| Session medium | `utm_medium` | Channel type |
| Session campaign | `utm_campaign` | Specific campaign/post |
| Session manual ad content | `utm_content` | Link variant |
| Session manual term | `utm_term` | Search keyword |

**GA4 Exploration report for content attribution:**
1. Go to Explore → Free-form
2. Dimensions: Session campaign, Landing page
3. Metrics: Sessions, Conversions, Revenue
4. Filter: Session source = "blog"
5. Sort by Revenue descending

### Enhanced E-commerce Events

GA4 tracks the full purchase funnel when configured:
- `view_item` — product page view
- `add_to_cart` — item added to cart
- `begin_checkout` — checkout started
- `purchase` — order completed with revenue

## MonsterInsights / WooCommerce Google Analytics Plugin

### MonsterInsights Setup

MonsterInsights bridges WordPress content data with GA4:

1. **Install:** MonsterInsights plugin (free tier sufficient for basic attribution)
2. **Connect:** Link to GA4 property via the setup wizard
3. **Enable:** Enhanced E-commerce tracking in MonsterInsights settings
4. **Dashboard:** View top posts by revenue directly in WordPress admin

**Key MonsterInsights reports:**
- Top Landing Pages (awareness stage)
- Top Outbound Links (consideration stage)
- E-commerce Revenue by Source (attribution)
- Top Products (conversion stage)

### WooCommerce Google Analytics Plugin (Official)

Alternative for sites already using GA4 without MonsterInsights:

1. Install: "WooCommerce Google Analytics" (official extension)
2. Enter GA4 Measurement ID
3. Enable: Enhanced E-commerce events
4. Events auto-tracked: `view_item`, `add_to_cart`, `purchase`

## Custom Dashboard Options

### WP Admin Dashboard Widget

Create a simple attribution summary widget:

```php
add_action('wp_dashboard_setup', function () {
    wp_add_dashboard_widget(
        'content_attribution_widget',
        'Content Attribution — Top 5 Posts by Revenue',
        function () {
            // Query recent completed orders with UTM data
            $orders = wc_get_orders([
                'status' => 'completed',
                'limit'  => 100,
                'date_created' => '>' . date('Y-m-d', strtotime('-30 days')),
            ]);
            $revenue_by_campaign = [];
            foreach ($orders as $order) {
                $campaign = $order->get_meta('_last_utm_campaign');
                if ($campaign) {
                    $revenue_by_campaign[$campaign] = ($revenue_by_campaign[$campaign] ?? 0) + $order->get_total();
                }
            }
            arsort($revenue_by_campaign);
            echo '<table><tr><th>Content</th><th>Revenue</th></tr>';
            $i = 0;
            foreach ($revenue_by_campaign as $campaign => $revenue) {
                if ($i++ >= 5) break;
                echo '<tr><td>' . esc_html($campaign) . '</td><td>' . wc_price($revenue) . '</td></tr>';
            }
            echo '</table>';
        }
    );
});
```

### External BI Tools

For larger operations, export data to external dashboards:

| Tool | Integration Method | Cost |
|------|-------------------|------|
| Google Looker Studio | GA4 connector + WC data export | Free |
| Tableau | WooCommerce REST API → CSV/database | Paid |
| Metabase | Direct MySQL/PostgreSQL connection | Free (self-hosted) |
| Power BI | REST API connector or CSV import | Paid |

## Automated Reporting

### Monthly Content Attribution Report Template

```
## Content Attribution Report — {Month} {Year}

### Summary
- Total content-attributed revenue: ${total}
- Orders with UTM attribution: {count} ({percentage}% of total orders)
- Top attribution model used: {model}

### Top 10 Converting Content Pieces
| Rank | Post | Revenue | Orders | Avg Order Value |
|------|------|---------|--------|-----------------|
| 1 | {title} | ${rev} | {n} | ${aov} |
| ... | ... | ... | ... | ... |

### Revenue by Content Category
| Category | Revenue | Posts | Revenue/Post |
|----------|---------|-------|-------------|
| {cat} | ${rev} | {n} | ${rpp} |

### Revenue by Source
| Source | Revenue | Orders | CAC |
|--------|---------|--------|-----|
| blog | ${rev} | {n} | ${cac} |
| newsletter | ${rev} | {n} | ${cac} |

### Recommendations
- Invest more in: {top category}
- Reduce investment in: {lowest ROI category}
- Content gap: {opportunity identified}
```

### Automation via WP-Cron

Schedule monthly report generation:

```php
// Register cron event
if (!wp_next_scheduled('generate_attribution_report')) {
    wp_schedule_event(time(), 'monthly', 'generate_attribution_report');
}

add_action('generate_attribution_report', function () {
    // Generate report data (query orders, correlate with content)
    // Save as a private post or send via email
    // Uses same logic as dashboard widget but for full month
});
```

## Key KPIs Dashboard

The essential metrics for an at-a-glance attribution dashboard:

| KPI | Description | Update Frequency |
|-----|-------------|-----------------|
| **Content-Attributed Revenue** | Total revenue from orders with UTM data | Weekly |
| **Top Converting Post** | Post with highest attributed revenue this month | Monthly |
| **Attribution Rate** | % of orders with UTM attribution data | Weekly |
| **Content ROI** | (Revenue - Cost) / Cost × 100% | Monthly |
| **CAC by Source** | Customer acquisition cost per channel | Monthly |
| **Revenue/Post Trend** | Month-over-month revenue per post | Monthly |

## Decision Checklist

1. Is GA4 connected and tracking enhanced e-commerce events? → Verify in GA4 Realtime report
2. Is MonsterInsights or equivalent analytics plugin active? → Check WordPress admin dashboard
3. Are WooCommerce orders showing UTM meta data? → Spot-check 5 recent orders
4. Is a monthly report process defined (manual or automated)? → Set up template + schedule
5. Are KPIs reviewed and actioned on regularly? → Schedule monthly review meeting
