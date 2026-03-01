# Audience Segmentation

## Overview

Audience segmentation divides your subscriber base into targeted groups for more relevant messaging. Effective segmentation improves open rates, click rates, and reduces unsubscribes. This reference covers segmentation strategies across Mailchimp, SendGrid, and Buffer.

## Mailchimp List Segmentation

### Segment by subscriber data

Mailchimp segments are dynamic filters applied to an audience. Subscribers matching the criteria are automatically included.

```
Tool: mc_get_audience_members
Params:
  audience_id: "abc123def4"
  status: "subscribed"
  # Filter by merge fields, tags, or activity in the Mailchimp UI
```

### Tag-based segmentation

Tags are the most flexible segmentation method via the API:

```
Tool: mc_add_subscriber
Params:
  audience_id: "abc123def4"
  email: "user@example.com"
  tags: ["wordpress-user", "product-interest-seo", "signup-2026-q1"]
```

### Common Mailchimp segments

| Segment | Criteria | Use Case |
|---------|----------|----------|
| New subscribers | Signup date < 30 days | Welcome series, onboarding |
| Engaged readers | Opened last 3 campaigns | Premium content, surveys |
| Inactive | Not opened in 90 days | Re-engagement campaign |
| Product interest | Tagged by category | Targeted product launches |
| High-value | Purchase history > $100 | VIP offers, early access |
| Location-based | Merge field `COUNTRY` | Localized content, events |

### Merge fields for segmentation

Define custom merge fields to capture WordPress user data:

| Merge Tag | Type | WordPress Source |
|-----------|------|-----------------|
| `FNAME` | Text | `user.first_name` |
| `LNAME` | Text | `user.last_name` |
| `WP_ROLE` | Text | `user.role` (subscriber, customer, etc.) |
| `SIGNUP_SRC` | Text | Registration source (blog, checkout, popup) |
| `LAST_ORDER` | Date | Most recent WooCommerce order date |
| `ORDER_TOTAL` | Number | Lifetime order value |

## SendGrid Contact Segmentation

### Contact lists

SendGrid uses contact lists for static segmentation:

```
Tool: sg_add_contacts
Params:
  list_ids: ["list_new_users", "list_blog_subscribers"]
  contacts:
    - email: "user@example.com"
      first_name: "Jane"
      custom_fields:
        signup_source: "blog_popup"
        wp_user_id: "42"
```

### Custom fields

Define custom fields in SendGrid to mirror WordPress user data:

| Field Name | Type | Purpose |
|------------|------|---------|
| `wp_user_id` | Number | Link to WordPress user record |
| `signup_source` | Text | Track acquisition channel |
| `user_role` | Text | WordPress role for permission-based content |
| `last_purchase_date` | Date | Trigger post-purchase sequences |
| `content_preference` | Text | Category interest for targeted notifications |

### SGQL queries for segmentation

```
Tool: sg_list_contacts
Params:
  query: "signup_source = 'blog_popup' AND last_purchase_date IS NULL"
```

Common SGQL patterns:

| Query | Segment |
|-------|---------|
| `signup_source = 'checkout'` | Customers who bought |
| `last_purchase_date < '2026-01-01'` | Lapsed customers |
| `user_role = 'subscriber'` | Blog-only subscribers |
| `content_preference = 'tutorials'` | Tutorial readers |

## Buffer Profile-Based Targeting

Buffer segments audiences by social profile rather than individual users. Each profile reaches a different audience.

### Profile selection strategy

| Profile | Audience Type | Content Style |
|---------|--------------|---------------|
| Twitter/X | Tech-savvy, real-time | Short, punchy, hashtags |
| LinkedIn | Professional, B2B | Thought leadership, data-driven |
| Facebook | Broad, community | Storytelling, engagement prompts |
| Instagram | Visual-first, younger | Image-heavy, lifestyle |

### Targeting by profile

```
Tool: buf_create_update
Params:
  profile_ids: ["linkedin_id"]    # Only post to LinkedIn for B2B content
  text: "Our latest research on WordPress performance..."
```

Select profiles based on content type:
- **Product launches**: All profiles
- **Technical tutorials**: Twitter + LinkedIn
- **Behind-the-scenes**: Instagram + Facebook
- **Industry news**: Twitter + LinkedIn

## Building Personas from WordPress Data

### Data sources for persona building

| Source | Data | Tool |
|--------|------|------|
| WordPress users | Role, registration date, profile fields | `wp_list_users` |
| WooCommerce orders | Purchase history, AOV, frequency | `wc_list_orders` |
| Post analytics | Most-read categories, time on page | Site analytics |
| Form submissions | Stated interests, preferences | Contact form data |

### Persona-to-segment mapping

| Persona | Characteristics | Mailchimp Tags | SendGrid Lists |
|---------|----------------|----------------|----------------|
| New Visitor | First 30 days, no purchase | `new-visitor` | `list_onboarding` |
| Blog Reader | Regular reader, no purchase | `blog-reader`, category tags | `list_blog` |
| First Buyer | 1 order, < $50 | `first-buyer` | `list_customers` |
| Loyal Customer | 3+ orders, > $200 | `loyal-customer`, `vip` | `list_vip` |
| Churning | No activity 60+ days | `at-risk` | `list_reengagement` |

### Sync WordPress users to segments

Workflow to keep segments current:

```
1. wp_list_users → fetch all users with roles and metadata
2. For each user, determine persona based on rules
3. mc_add_subscriber → set tags matching persona
4. sg_add_contacts → add to appropriate contact lists
5. Schedule weekly sync to update segment membership
```

## Best Practices

- **Start simple**: Begin with 3-4 segments (new, active, inactive, customer); add granularity as data grows
- **Dynamic over static**: Prefer Mailchimp tag-based segments that update automatically over manually managed lists
- **Consistent field naming**: Use the same custom field names across Mailchimp and SendGrid for easier cross-channel management
- **Hygiene**: Remove hard bounces and unsubscribes from all platforms; sync removals across services
- **Privacy compliance**: Honor opt-out preferences across all channels; never re-add unsubscribed contacts
- **Test segments**: Before sending a campaign to a new segment, verify member count and sample members for accuracy
- **Document segments**: Maintain a segment registry with criteria, purpose, and last review date
