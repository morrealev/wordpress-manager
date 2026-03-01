# Plausible Analytics Setup

## Overview

Plausible is a privacy-friendly, lightweight analytics platform. It does not use cookies, fully complies with GDPR/CCPA, and provides a simple API for data retrieval.

## Cloud vs Self-Hosted

| Aspect | Plausible Cloud | Self-Hosted |
|--------|----------------|-------------|
| URL | `https://plausible.io` | Your own domain (e.g., `https://analytics.example.com`) |
| API base | `https://plausible.io/api` | `https://analytics.example.com/api` |
| Hosting | Managed | You manage the server |
| Cost | Subscription-based | Free (server costs apply) |
| Data ownership | Plausible servers (EU) | Your infrastructure |

## API Key Generation

1. Log into your Plausible dashboard
2. Go to **Settings > API Keys**
3. Click **+ New API Key**
4. Name it (e.g., `wp-analytics-read`) and copy the key
5. Store the key securely — it is shown only once

## WP_SITES_CONFIG Configuration

```json
{
  "id": "my-site",
  "url": "https://example.com",
  "plausible_api_key": "plausible-api-key-here",
  "plausible_base_url": "https://plausible.io"
}
```

- `plausible_api_key` — the API key generated above
- `plausible_base_url` — omit for cloud (defaults to `https://plausible.io`), set for self-hosted

## Available Metrics

| Metric | Description |
|--------|-------------|
| `visitors` | Unique visitors |
| `visits` | Total visits (sessions) |
| `pageviews` | Total page views |
| `views_per_visit` | Average pages per visit |
| `bounce_rate` | Percentage of single-page visits |
| `visit_duration` | Average visit duration in seconds |
| `events` | Total custom events |

## Available Properties (Breakdown Dimensions)

| Property | Description |
|----------|-------------|
| `event:page` | Page path |
| `visit:source` | Traffic source |
| `visit:referrer` | Full referrer URL |
| `visit:utm_source` | UTM source parameter |
| `visit:utm_medium` | UTM medium parameter |
| `visit:utm_campaign` | UTM campaign parameter |
| `visit:country` | Visitor country (ISO 3166-1 alpha-2) |
| `visit:device` | Device type (Desktop, Mobile, Tablet) |
| `visit:browser` | Browser name |
| `visit:os` | Operating system |

## Period Formats

| Period | Format | Example |
|--------|--------|---------|
| Day | `day` | Current day |
| 7 days | `7d` | Last 7 days |
| 30 days | `30d` | Last 30 days |
| Month | `month` | Current month |
| 6 months | `6mo` | Last 6 months |
| 12 months | `12mo` | Last 12 months |
| Custom | `custom` | Requires `date` param: `2024-01-01,2024-01-31` |

## Filtering

Filters use the format `property operator value`:
- `visit:source==Google` — exact match
- `event:page==/blog**` — wildcard match
- `visit:country!=US` — not equal
- Multiple filters: separate with `;` (AND logic)

Example: `visit:source==Google;visit:country==IT`

## Rate Limits

- **600 requests per hour** per API key
- **10 requests per second** burst limit
- Responses include `X-RateLimit-Remaining` header
