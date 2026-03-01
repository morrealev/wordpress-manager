# GA4 Data API v1beta Integration

## Service Account Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select a project
3. Enable the **Google Analytics Data API** (v1beta)
4. Navigate to **IAM & Admin > Service Accounts**
5. Create a service account with a descriptive name (e.g., `wp-analytics-reader`)
6. Download the JSON key file
7. In GA4 Admin, grant the service account email **Viewer** role on the property

## WP_SITES_CONFIG Configuration

```json
{
  "id": "my-site",
  "url": "https://example.com",
  "ga4_property_id": "properties/123456789",
  "ga4_service_account_key": "/path/to/service-account-key.json"
}
```

- `ga4_property_id` — format is `properties/NUMERIC_ID` (find in GA4 Admin > Property Settings)
- `ga4_service_account_key` — absolute path to the downloaded JSON key file

## Property ID Format

- GA4 uses numeric property IDs prefixed with `properties/`
- Example: `properties/350123456`
- Find it in GA4 Admin > Property Settings > Property ID
- Do NOT use the Measurement ID (G-XXXXXXX) — that is for the tracking tag only

## Common Dimensions

| Dimension | API Name | Description |
|-----------|----------|-------------|
| Date | `date` | Date in YYYYMMDD format |
| Page path | `pagePath` | URL path of the page |
| Page title | `pageTitle` | HTML title of the page |
| Source | `sessionSource` | Traffic source (google, facebook, etc.) |
| Medium | `sessionMedium` | Traffic medium (organic, cpc, referral) |
| Campaign | `sessionCampaignName` | UTM campaign name |
| Country | `country` | User country |
| Device category | `deviceCategory` | desktop, mobile, tablet |
| Landing page | `landingPage` | First page of the session |

## Common Metrics

| Metric | API Name | Description |
|--------|----------|-------------|
| Sessions | `sessions` | Total sessions |
| Active users | `activeUsers` | Users with engaged sessions |
| Pageviews | `screenPageViews` | Total page views |
| Engagement rate | `engagementRate` | Percentage of engaged sessions |
| Avg. session duration | `averageSessionDuration` | Mean session length in seconds |
| Bounce rate | `bounceRate` | Percentage of non-engaged sessions |
| Conversions | `conversions` | Total conversion events |
| Event count | `eventCount` | Total events fired |

## Quota Limits

| Quota | Limit | Notes |
|-------|-------|-------|
| Requests per day | 25,000 | Per project |
| Requests per minute | 1,200 | Per project |
| Concurrent requests | 10 | Per project |
| Tokens per query | 17,500 | Complexity-based; dimensions and metrics consume tokens |
| Response rows | 100,000 | Max rows per response; use pagination for larger datasets |

## Sampling and Data Freshness

- GA4 Data API may return **sampled data** for large date ranges or complex queries
- Check `metadata.dataLossFromOtherRow` in responses for row aggregation
- Real-time data has a 24–48 hour processing delay for standard reports
- Use `keepEmptyRows: true` to include zero-value rows in reports
