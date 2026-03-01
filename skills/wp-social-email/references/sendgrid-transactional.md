# SendGrid Transactional Email

## Overview

SendGrid handles transactional email delivery — messages triggered by user actions such as account creation, password resets, order confirmations, and notifications. The WP REST Bridge provides 6 MCP tools (`sg_*`) for sending email, managing templates, and tracking contacts.

## Setup

### API Key Configuration

Add SendGrid credentials to `WP_SITES_CONFIG`:

```json
{
  "sites": [{
    "name": "my-site",
    "url": "https://example.com",
    "distribution": {
      "sendgrid": {
        "api_key": "SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        "from_email": "noreply@example.com",
        "from_name": "My Site"
      }
    }
  }]
}
```

Use a Restricted Access API key with only the permissions needed (Mail Send, Template Engine, Marketing Contacts).

## Transactional Email

### Send a plain email

```
Tool: sg_send_email
Params:
  to: "user@example.com"
  subject: "Welcome to My Site"
  html: "<h1>Welcome!</h1><p>Thanks for creating your account.</p>"
```

### Send with a dynamic template

```
Tool: sg_send_email
Params:
  to: "user@example.com"
  template_id: "d-abc123def456"
  dynamic_template_data:
    first_name: "Jane"
    order_number: "WC-1042"
    order_total: "$49.99"
    order_url: "https://example.com/my-account/orders/1042"
```

### Common transactional email types

| Type | Trigger | Template Variables |
|------|---------|-------------------|
| Welcome email | User registration | `first_name`, `login_url` |
| Password reset | Password reset request | `reset_link`, `expiry_time` |
| Order confirmation | WooCommerce order placed | `order_number`, `items`, `total` |
| Shipping notification | Order status → shipped | `tracking_number`, `carrier`, `eta` |
| Review request | 7 days after delivery | `product_name`, `review_url` |

## Template Management

### List templates

```
Tool: sg_list_templates
Params:
  generations: "dynamic"    # legacy | dynamic
Returns: Array of templates with id, name, generation, versions
```

### Get template details

```
Tool: sg_get_template
Params:
  template_id: "d-abc123def456"
Returns:
  id, name, generation
  versions: [{ id, name, subject, html_content, active }]
```

Dynamic templates use Handlebars syntax for variable substitution:

```html
<h1>Hi {{first_name}},</h1>
<p>Your order #{{order_number}} has been confirmed.</p>
{{#if tracking_number}}
  <p>Tracking: {{tracking_number}}</p>
{{/if}}
```

## Contact Management

### List contacts

```
Tool: sg_list_contacts
Params:
  # Optional search query using SGQL
  query: "email LIKE '%@example.com'"
Returns: Array of contacts with id, email, first_name, last_name, custom_fields
```

### Add or update contacts

```
Tool: sg_add_contacts
Params:
  list_ids: ["list_abc123"]
  contacts:
    - email: "user@example.com"
      first_name: "Jane"
      last_name: "Doe"
      custom_fields:
        wp_user_id: "42"
        signup_source: "blog"
```

Contacts are upserted by email address. If the email already exists, fields are merged.

## WordPress Integration Patterns

### New user → Welcome email

```
1. WordPress user_register event triggers webhook
2. Webhook handler calls sg_send_email with welcome template
3. sg_add_contacts adds user to "New Users" contact list
```

### WooCommerce order → Confirmation email

```
1. order.created webhook fires
2. Extract order details (number, items, total)
3. sg_send_email with order confirmation template + dynamic data
```

### Blog subscriber → Drip sequence

```
1. Newsletter form submission adds subscriber via mc_add_subscriber
2. sg_send_email sends immediate welcome/confirmation
3. Scheduled follow-ups via campaign automation
```

## Best Practices

- **SPF/DKIM/DMARC**: Configure DNS records for your sending domain; without these, emails land in spam
  - SPF: Add SendGrid's include to your TXT record
  - DKIM: Create CNAME records provided by SendGrid domain authentication
  - DMARC: Start with `p=none` policy, move to `p=quarantine` after monitoring
- **Dedicated IP**: For volumes above 50k emails/month, use a dedicated IP and warm it gradually (start with 100/day, increase over 4 weeks)
- **Bounce handling**: Monitor `sg_get_stats` for bounce rates; rates above 5% trigger SendGrid compliance review
- **Unsubscribe**: Include an unsubscribe link in every email (required by CAN-SPAM); use SendGrid's built-in unsubscribe groups
- **Template versioning**: Keep templates in version control; use SendGrid's active version feature to deploy changes safely
- **Rate limiting**: SendGrid enforces rate limits per API key; batch contact additions in groups of 1000
- **From address consistency**: Use the same `from_email` across all transactional messages to build domain reputation
