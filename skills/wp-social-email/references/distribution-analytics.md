# Distribution Analytics

## Overview

Distribution analytics measure the effectiveness of content distributed across email (Mailchimp, SendGrid) and social (Buffer) channels. Tracking performance per channel enables data-driven decisions on content strategy, send timing, and audience targeting.

## Mailchimp Campaign Reports

### Get campaign performance

```
Tool: mc_get_campaign_report
Params:
  campaign_id: "campaign_xyz"
Returns:
  emails_sent: 1250
  opens:
    total: 487
    unique: 412
    rate: 0.33
  clicks:
    total: 98
    unique: 76
    rate: 0.061
  bounces:
    hard: 3
    soft: 12
  unsubscribes: 2
  forwards: 5
  abuse_reports: 0
```

### Key Mailchimp metrics

| Metric | Calculation | Benchmark |
|--------|-------------|-----------|
| Open rate | Unique opens / Delivered | 20-25% |
| Click rate | Unique clicks / Delivered | 2.5-5% |
| Click-to-open rate | Unique clicks / Unique opens | 10-15% |
| Bounce rate | (Hard + Soft bounces) / Sent | < 2% |
| Unsubscribe rate | Unsubscribes / Delivered | < 0.5% |
| List growth rate | (New - Unsubscribes) / Total | > 2% monthly |

### Analyzing campaign trends

Compare multiple campaigns to identify patterns:

```
# Fetch reports for recent campaigns
mc_get_campaign_report campaign_id="campaign_1" → { open_rate: 0.28, click_rate: 0.04 }
mc_get_campaign_report campaign_id="campaign_2" → { open_rate: 0.35, click_rate: 0.07 }
mc_get_campaign_report campaign_id="campaign_3" → { open_rate: 0.22, click_rate: 0.03 }

# Campaign 2 outperformed — analyze: subject line? send time? content type?
```

## Buffer Analytics

### Get social profile analytics

```
Tool: buf_get_analytics
Params:
  profile_id: "profile_abc123"
Returns:
  posts_count: 45
  total_reach: 12500
  total_engagement: 890
  total_clicks: 234
  per_post_average:
    reach: 278
    engagement: 19.8
    clicks: 5.2
```

### Key Buffer metrics

| Metric | Description | Benchmark |
|--------|-------------|-----------|
| Reach | Number of unique users who saw the post | Varies by platform |
| Engagement | Likes + comments + shares + retweets | 1-3% of reach |
| Engagement rate | Engagement / Reach | 1-5% (varies by platform) |
| Clicks | Link clicks from post | 0.5-2% of reach |
| Click-through rate | Clicks / Reach | 1-3% |
| Best time to post | Time slot with highest engagement | Platform-specific |

### Identifying top-performing content

```
Tool: buf_list_sent
Params:
  profile_id: "profile_abc123"
  count: 50

# Sort results by engagement metrics to find top performers
# Re-share top content using buf_create_update with updated text
```

## SendGrid Statistics

### Get email delivery stats

```
Tool: sg_get_stats
Params:
  start_date: "2026-03-01"
  end_date: "2026-03-15"
Returns:
  - date: "2026-03-01"
    metrics:
      requests: 150
      delivered: 148
      opens: 52
      unique_opens: 45
      clicks: 12
      unique_clicks: 10
      bounces: 2
      spam_reports: 0
      blocks: 0
```

### Key SendGrid metrics

| Metric | Calculation | Benchmark |
|--------|-------------|-----------|
| Delivery rate | Delivered / Requests | > 95% |
| Open rate | Unique opens / Delivered | 15-25% (transactional: 40-60%) |
| Click rate | Unique clicks / Delivered | 2-5% |
| Bounce rate | Bounces / Requests | < 3% |
| Spam complaint rate | Spam reports / Delivered | < 0.1% |
| Block rate | Blocks / Requests | < 1% |

### Transactional vs marketing benchmarks

Transactional emails (welcome, order confirmation) consistently outperform marketing emails:

| Type | Open Rate | Click Rate |
|------|-----------|------------|
| Transactional | 40-60% | 10-20% |
| Marketing | 15-25% | 2-5% |

## Cross-Channel Performance Comparison

### Unified metrics dashboard

Build a cross-channel view by combining data from all three services:

```
# Email (Mailchimp campaigns)
mc_get_campaign_report → opens, clicks, unsubscribes

# Social (Buffer)
buf_get_analytics → reach, engagement, clicks

# Transactional (SendGrid)
sg_get_stats → deliveries, opens, clicks
```

### Channel comparison table

| Channel | Reach | Engagement Rate | Click Rate | Cost per Click |
|---------|-------|-----------------|------------|----------------|
| Email (Mailchimp) | Audience size | Open rate 20-25% | 2.5-5% | Low |
| Social (Buffer) | Follower count + viral | 1-5% | 0.5-2% | Free (organic) |
| Transactional (SendGrid) | Per-event | 40-60% open | 10-20% | Per email |

### Attribution tracking

Use UTM parameters to track which channel drives conversions in WordPress/WooCommerce:

| Channel | UTM Source | UTM Medium | UTM Campaign |
|---------|-----------|------------|--------------|
| Mailchimp | `mailchimp` | `email` | `{campaign_name}` |
| Buffer | `buffer` | `social` | `{post_slug}` |
| SendGrid | `sendgrid` | `email` | `{template_name}` |

## KPIs and Benchmarks

### Weekly KPIs to track

| KPI | Target | Tool |
|-----|--------|------|
| Email open rate | > 22% | `mc_get_campaign_report` |
| Email click rate | > 3% | `mc_get_campaign_report` |
| Social engagement rate | > 2% | `buf_get_analytics` |
| Email delivery rate | > 95% | `sg_get_stats` |
| List growth (net) | > 50/week | `mc_get_audience_members` count delta |
| Content distributed | 3+ posts/week | Track distribution events |

### Red flags requiring action

| Signal | Threshold | Action |
|--------|-----------|--------|
| Open rate drop | < 15% | Review subject lines, check deliverability |
| High unsubscribe rate | > 0.5% | Reduce frequency, improve segmentation |
| Bounce rate spike | > 5% | Clean list, verify new signups |
| Spam complaints | > 0.1% | Review content, check opt-in process |
| Social engagement decline | < 0.5% | Refresh content format, test new posting times |
| Delivery blocks | > 1% | Check domain reputation, review SPF/DKIM |

## Best Practices

- **Weekly review cadence**: Pull analytics every Monday; compare to previous week and 4-week average
- **A/B test systematically**: Test one variable at a time (subject line, send time, content format) and track results in `mc_get_campaign_report`
- **Channel-specific goals**: Email optimizes for clicks; social optimizes for engagement; transactional optimizes for delivery
- **Sunset inactive contacts**: After 90 days of no opens, move contacts to a re-engagement segment or suppress
- **Document learnings**: Record what subject lines, content types, and send times produce the best results
- **Automate reporting**: Build a weekly script that calls `mc_get_campaign_report`, `buf_get_analytics`, and `sg_get_stats` to generate a unified report
