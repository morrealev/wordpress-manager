# Integration Recipes

## Overview

Common webhook integration patterns for connecting WordPress to external services. Each recipe shows the webhook configuration and expected behavior.

## Zapier Integration

**Setup:**
1. Create a Zap with "Webhooks by Zapier" as trigger (Catch Hook)
2. Copy the Zapier webhook URL
3. Create webhook in WordPress:
   ```
   Tool: wc_create_webhook (for WooCommerce events)
   name: "Zapier - New Orders"
   topic: "order.created"
   delivery_url: "https://hooks.zapier.com/hooks/catch/123456/abcdef/"
   secret: "zapier-secret"
   ```
4. Test by creating a test order
5. Configure Zapier actions (email, Slack, Google Sheets, etc.)

**Common Zaps:**
| Trigger | Action | Use Case |
|---------|--------|----------|
| New order | Send email | Order confirmation to team |
| New order | Add row to Google Sheet | Order tracking spreadsheet |
| New product | Post to Slack | Team notification |
| New customer | Add to Mailchimp | Email list growth |

## Make (Integromat) Integration

**Setup:**
1. Create a scenario with "Webhooks" module (Custom webhook)
2. Copy the Make webhook URL
3. Create webhook:
   ```
   delivery_url: "https://hook.eu1.make.com/abc123def456"
   ```
4. Run the scenario once to register the webhook structure
5. Map fields and configure subsequent modules

**Common Scenarios:**
- Order placed → Create invoice in QuickBooks
- Product updated → Sync to external catalog
- Customer created → Add to CRM (HubSpot, Pipedrive)

## n8n Integration

**Setup (self-hosted n8n):**
1. Create a workflow with "Webhook" trigger node
2. Set to POST method, configure path
3. Copy the production webhook URL
4. Create webhook:
   ```
   delivery_url: "https://n8n.example.com/webhook/wordpress-events"
   ```

**Common Workflows:**
- Content published → SEO check → Notify team
- Order → Inventory check → Fulfillment API
- Customer feedback → Sentiment analysis → Support ticket

## Slack Notifications

**Setup:**
1. Create a Slack Incoming Webhook in Slack App settings
2. Use the mu-plugin approach (WordPress core webhooks) with custom formatting:

```php
add_action('transition_post_status', function($new, $old, $post) {
    if ($new === 'publish' && $old !== 'publish') {
        $slack_url = defined('SLACK_WEBHOOK_URL') ? SLACK_WEBHOOK_URL : '';
        if (!$slack_url) return;

        wp_remote_post($slack_url, [
            'headers' => ['Content-Type' => 'application/json'],
            'body'    => wp_json_encode([
                'text' => sprintf(
                    "New %s published: *%s*\n<%s|Read it here>",
                    $post->post_type,
                    $post->post_title,
                    get_permalink($post)
                ),
            ]),
        ]);
    }
}, 10, 3);
```

## Email Service Integration

### Mailchimp / SendGrid

**Trigger:** New subscriber or customer event
**Method:** WooCommerce webhook → Zapier/Make → Mailchimp API

Or direct with mu-plugin:
```php
add_action('user_register', function($user_id) {
    $user = get_userdata($user_id);
    // POST to Mailchimp API to add subscriber
    wp_remote_post('https://usX.api.mailchimp.com/3.0/lists/LIST_ID/members', [
        'headers' => [
            'Authorization' => 'Bearer ' . MAILCHIMP_API_KEY,
            'Content-Type'  => 'application/json',
        ],
        'body' => wp_json_encode([
            'email_address' => $user->user_email,
            'status'        => 'subscribed',
        ]),
    ]);
});
```

## CDN Purge

### Cloudflare

**Trigger:** Content updated
**Method:** mu-plugin that purges Cloudflare cache on publish:

```php
add_action('transition_post_status', function($new, $old, $post) {
    if ($new === 'publish') {
        wp_remote_post(
            'https://api.cloudflare.com/client/v4/zones/' . CF_ZONE_ID . '/purge_cache',
            [
                'headers' => [
                    'Authorization' => 'Bearer ' . CF_API_TOKEN,
                    'Content-Type'  => 'application/json',
                ],
                'body' => wp_json_encode([
                    'files' => [get_permalink($post)],
                ]),
            ]
        );
    }
}, 10, 3);
```

## Search Index Update

### Algolia / Meilisearch

**Trigger:** Content published or updated
**Method:** WooCommerce webhook or mu-plugin → search API

```php
add_action('save_post', function($post_id, $post) {
    if ($post->post_status !== 'publish') return;

    wp_remote_post(ALGOLIA_API_URL . '/indexes/posts', [
        'headers' => [
            'X-Algolia-API-Key'        => ALGOLIA_ADMIN_KEY,
            'X-Algolia-Application-Id' => ALGOLIA_APP_ID,
            'Content-Type'             => 'application/json',
        ],
        'body' => wp_json_encode([
            'objectID' => $post_id,
            'title'    => $post->post_title,
            'content'  => wp_strip_all_tags($post->post_content),
            'url'      => get_permalink($post),
        ]),
    ]);
}, 10, 2);
```

## Best Practices

- Always use HTTPS for delivery URLs
- Set a webhook secret and verify signatures on the receiving end
- Keep webhook timeout under 5 seconds to avoid blocking WordPress
- Use async processing on the receiving end for heavy operations
- Monitor webhook delivery logs for failures
- Group related events when possible to reduce webhook volume
