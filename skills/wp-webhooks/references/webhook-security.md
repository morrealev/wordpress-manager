# Webhook Security

## Overview

Webhook security ensures that only legitimate notifications are processed by the receiving endpoint. Without verification, an attacker could send fake payloads to trigger unauthorized actions.

## Shared Secret Authentication (HMAC-SHA256)

The standard approach: sender and receiver share a secret key. The sender computes an HMAC hash of the payload and includes it in a header. The receiver recomputes the hash and compares.

### Sending (WordPress side)

```php
$payload   = wp_json_encode($data);
$secret    = WEBHOOK_SECRET;
$signature = hash_hmac('sha256', $payload, $secret);

wp_remote_post($url, [
    'headers' => [
        'Content-Type'              => 'application/json',
        'X-WP-Webhook-Signature'    => $signature,
    ],
    'body' => $payload,
]);
```

### Receiving (endpoint side)

```javascript
const crypto = require('crypto');

function verifyWebhookSignature(rawBody, signature, secret) {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(rawBody, 'utf8')
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}

// In your webhook handler:
app.post('/webhook', (req, res) => {
  const signature = req.headers['x-wp-webhook-signature'];
  if (!verifyWebhookSignature(req.rawBody, signature, SECRET)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  // Process the webhook...
  res.status(200).json({ received: true });
});
```

## WooCommerce Signature Verification

WooCommerce uses base64-encoded HMAC-SHA256 in the `X-WC-Webhook-Signature` header:

```javascript
function verifyWooCommerceWebhook(rawBody, signature, secret) {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(rawBody, 'utf8')
    .digest('base64');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}
```

**Important:** Always use `crypto.timingSafeEqual()` to prevent timing attacks.

## HTTPS Enforcement

- **Always use HTTPS** for delivery URLs — never HTTP in production
- WooCommerce webhooks require HTTPS by default (configurable)
- Self-signed certificates will cause delivery failures
- Use Let's Encrypt for free, auto-renewing SSL

## IP Allowlisting

If the receiving endpoint supports it, restrict incoming webhooks to known IPs:

| Source | IP Ranges |
|--------|-----------|
| Your WordPress host | Check with your hosting provider |
| Zapier | Published at zapier.com/help/account/data-management/ip-addresses |
| Make | Published in Make documentation |

**Note:** IP allowlisting is a defense-in-depth measure, not a replacement for signature verification.

## Rate Limiting

### Sender Side (WordPress)
- Debounce rapid-fire events (e.g., bulk post updates)
- Use `wp_schedule_single_event()` for non-urgent webhooks
- Limit to 1 webhook per resource per 5 seconds

### Receiver Side
- Accept webhooks immediately (200 OK) and process asynchronously
- Queue incoming webhooks for processing
- Reject if rate exceeds threshold (429 Too Many Requests)

## Timeout Configuration

- **WordPress default timeout**: 5 seconds (`wp_remote_post` timeout parameter)
- **WooCommerce default**: 5 seconds
- **Recommendation**: Keep timeouts at 5 seconds or less
- If the receiver needs more time, respond 200 immediately and process in background

## Retry Behavior

### WooCommerce Built-in Retries
- Retries up to 5 times on failure
- Exponential backoff between retries
- After 5 failures: webhook set to `disabled`
- Re-enable manually via `wc_update_webhook` with `status: "active"`

### Custom Retry (mu-plugin)
```php
function send_webhook_with_retry($url, $payload, $max_retries = 3) {
    for ($i = 0; $i < $max_retries; $i++) {
        $response = wp_remote_post($url, [
            'timeout' => 5,
            'headers' => ['Content-Type' => 'application/json'],
            'body'    => wp_json_encode($payload),
        ]);
        if (!is_wp_error($response) && wp_remote_retrieve_response_code($response) === 200) {
            return true;
        }
        sleep(pow(2, $i)); // Exponential backoff: 1s, 2s, 4s
    }
    error_log("Webhook delivery failed after {$max_retries} retries: {$url}");
    return false;
}
```

## Security Checklist

- [ ] HTTPS enforced on all delivery URLs
- [ ] Shared secret configured and verified
- [ ] Signature verification uses timing-safe comparison
- [ ] Payload validated (expected structure and types)
- [ ] Rate limiting in place on receiver
- [ ] Timeout set to 5 seconds or less
- [ ] Failed webhooks logged for monitoring
- [ ] Secrets stored securely (environment variables, not code)
