# Mailchimp Integration

## Overview

Mailchimp is the email marketing platform for audience management and campaign delivery. The WP REST Bridge provides 7 MCP tools (`mc_*`) that cover the full campaign lifecycle: audience management, campaign creation, content setting, sending, and reporting.

## Setup

### API Key Configuration

Add Mailchimp credentials to `WP_SITES_CONFIG`:

```json
{
  "sites": [{
    "name": "my-site",
    "url": "https://example.com",
    "distribution": {
      "mailchimp": {
        "api_key": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-us14",
        "server_prefix": "us14"
      }
    }
  }]
}
```

The server prefix is the suffix of your API key (e.g., `us14`). All Mailchimp API requests route through `https://{server_prefix}.api.mailchimp.com/3.0/`.

## Audience Management

### List all audiences

```
Tool: mc_list_audiences
Returns: Array of audiences with id, name, member count, stats
```

### Get audience members

```
Tool: mc_get_audience_members
Params:
  audience_id: "abc123def4"
  count: 50
  offset: 0
  status: "subscribed"    # subscribed | unsubscribed | cleaned | pending
```

### Add a subscriber

```
Tool: mc_add_subscriber
Params:
  audience_id: "abc123def4"
  email: "user@example.com"
  status: "subscribed"
  merge_fields:
    FNAME: "Jane"
    LNAME: "Doe"
  tags: ["wordpress-user", "blog-subscriber"]
```

If the email already exists, the subscriber record is updated (upsert behavior).

## Campaign Workflow

The campaign lifecycle follows four steps: create → set content → send → report.

### Step 1: Create campaign

```
Tool: mc_create_campaign
Params:
  type: "regular"             # regular | plaintext | absplit
  audience_id: "abc123def4"
  subject: "March Newsletter: New Blog Posts"
  from_name: "My Site"
  reply_to: "newsletter@example.com"
Returns: campaign_id
```

### Step 2: Set campaign content

```
Tool: mc_set_campaign_content
Params:
  campaign_id: "campaign_xyz"
  html: "<html><body><h1>Newsletter</h1>...</body></html>"
```

For WordPress content, fetch the post with `wp_get_post` and format the content as HTML for the campaign body.

### Step 3: Send campaign

```
Tool: mc_send_campaign
Params:
  campaign_id: "campaign_xyz"
  # Or schedule for later:
  # schedule_time: "2026-03-15T10:00:00Z"
```

### Step 4: Get report

```
Tool: mc_get_campaign_report
Params:
  campaign_id: "campaign_xyz"
Returns:
  emails_sent: 1250
  opens: { total: 487, unique: 412, rate: 0.33 }
  clicks: { total: 98, unique: 76, rate: 0.061 }
  bounces: { hard: 3, soft: 12 }
  unsubscribes: 2
```

## A/B Testing

Create an A/B split campaign to test subject lines, content, or send times:

```
Tool: mc_create_campaign
Params:
  type: "absplit"
  audience_id: "abc123def4"
  subject: "Version A Subject"
  variate_settings:
    test_size: 30           # 30% of audience gets test
    wait_time: 4            # hours before picking winner
    winner_criteria: "opens"
    subject_lines:
      - "Version A Subject"
      - "Version B Subject"
```

## Best Practices

- **Send time optimization**: Analyze `mc_get_campaign_report` data to identify peak open hours; schedule campaigns accordingly
- **List hygiene**: Regularly check for `cleaned` status members; high bounce rates damage sender reputation
- **Merge fields**: Use `FNAME` personalization in subject lines — personalized subjects see 20-30% higher open rates
- **Tags over groups**: Use tags for flexible segmentation; they are easier to manage via API than interest groups
- **Double opt-in**: Enable for GDPR compliance; set subscriber status to `pending` and let Mailchimp handle the confirmation email
- **Unsubscribe handling**: Never re-add unsubscribed users; check status before calling `mc_add_subscriber`
- **Frequency**: Monitor unsubscribe rate per campaign; rates above 0.5% indicate over-sending
