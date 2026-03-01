# Twitter/X Setup Guide

## Prerequisites

- Twitter Developer account (https://developer.twitter.com/)
- WordPress site with WP REST Bridge configured
- Twitter account for posting

## 1. Create Twitter Developer App

1. Go to https://developer.twitter.com/en/portal/dashboard
2. Create a new Project and App
3. Select "Free" or "Basic" tier (Free tier allows 1,500 tweets/month)
4. Note your **API Key**, **API Secret**, and **Bearer Token**

## 2. API Access Levels

| Tier | Read | Write | Cost |
|------|------|-------|------|
| Free | Yes | 1,500 tweets/month | $0 |
| Basic | Yes | 3,000 tweets/month | $100/month |
| Pro | Yes | 300,000 tweets/month | $5,000/month |

For most WordPress use cases, the Free tier is sufficient.

## 3. Configure WP_SITES_CONFIG

Add to your site configuration:

```json
{
  "id": "mysite",
  "url": "https://mysite.com/wp-json/",
  "username": "admin",
  "password": "app-password",
  "twitter_bearer_token": "AAAA...",
  "twitter_api_key": "abc123...",
  "twitter_api_secret": "xyz789...",
  "twitter_user_id": "1234567890"
}
```

### Finding Your User ID
1. Go to https://tweeterid.com/
2. Enter your Twitter handle
3. Copy the numeric user ID

## 4. Verify Configuration

Run the detection script:
```bash
node skills/wp-twitter/scripts/twitter_inspect.mjs
```

Expected output: `twitter_configured: true` with indicators listing configured credentials.

## 5. Important Notes

- Bearer tokens do not expire but can be regenerated
- The `twitter_user_id` is required for `tw_list_tweets` (listing your tweets)
- Rate limits apply per 15-minute window (varies by endpoint)
- Tweet deletion triggers a safety hook requiring explicit confirmation
