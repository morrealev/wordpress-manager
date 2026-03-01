# WordPress Action/Filter Hooks for Workflows

## Core WordPress Action Hooks

### User Actions

| Hook | Fires When | Key Parameters |
|------|------------|----------------|
| `user_register` | New user created | `$user_id` |
| `wp_login` | User logs in | `$user_login`, `$user` |
| `wp_logout` | User logs out | `$user_id` |
| `profile_update` | Profile updated | `$user_id`, `$old_user_data` |
| `delete_user` | User deleted | `$user_id`, `$reassign` |
| `set_user_role` | Role changed | `$user_id`, `$role`, `$old_roles` |

### Comment Actions

| Hook | Fires When | Key Parameters |
|------|------------|----------------|
| `comment_post` | New comment posted | `$comment_id`, `$approved` |
| `edit_comment` | Comment edited | `$comment_id` |
| `wp_set_comment_status` | Status changed (approve/spam/trash) | `$comment_id`, `$status` |
| `delete_comment` | Comment deleted | `$comment_id` |

### Plugin & Theme Actions

| Hook | Fires When | Key Parameters |
|------|------------|----------------|
| `activated_plugin` | Plugin activated | `$plugin`, `$network_wide` |
| `deactivated_plugin` | Plugin deactivated | `$plugin` |
| `upgrader_process_complete` | Update completed | `$upgrader`, `$options` |
| `switch_theme` | Theme switched | `$new_name`, `$new_theme` |

### System Actions

| Hook | Fires When | Key Parameters |
|------|------------|----------------|
| `wp_mail_failed` | Email delivery failed | `$wp_error` |
| `recovery_mode_email_sent` | Recovery mode triggered | — |
| `wp_privacy_personal_data_export_file_created` | GDPR export ready | `$archive_pathname` |

## WooCommerce Action Hooks

| Hook | Fires When | Key Parameters |
|------|------------|----------------|
| `woocommerce_new_order` | New order placed | `$order_id` |
| `woocommerce_order_status_changed` | Order status transition | `$order_id`, `$old_status`, `$new_status` |
| `woocommerce_payment_complete` | Payment received | `$order_id` |
| `woocommerce_order_refunded` | Order refunded | `$order_id`, `$refund_id` |
| `woocommerce_low_stock` | Product low stock | `$product` |
| `woocommerce_no_stock` | Product out of stock | `$product` |
| `woocommerce_new_customer_note` | Customer note added | `$args` |

### Trigger Config Example (WooCommerce)

```json
{
  "type": "action_hook",
  "event": "woocommerce_order_status_changed",
  "condition": "new_status == 'completed'",
  "actions": [
    { "channel": "slack", "message": ":package: Order #{{order_id}} completed — {{order_total}}" },
    { "channel": "email", "to": "fulfillment@example.com", "subject": "Order #{{order_id}} ready for shipping" }
  ]
}
```

## Filter Hooks for Content Transformation

Filters modify data before saving or displaying. Use for content transformation workflows:

| Filter | Purpose | Parameters |
|--------|---------|------------|
| `wp_insert_post_data` | Modify post before save | `$data`, `$postarr` |
| `the_content` | Transform content on display | `$content` |
| `wp_handle_upload_prefilter` | Validate uploads before processing | `$file` |
| `comment_text` | Transform comment text on display | `$comment_text` |

**Note:** Filter-based triggers observe data flow but should not block it. Use filters for logging and auditing, not for heavy action dispatch.

## Hook Priority and Execution Order

```php
// Default priority is 10. Lower = earlier execution.
add_action('user_register', 'workflow_on_register', 20); // Fires after core handlers
add_action('user_register', 'audit_log_register', 5);    // Fires before most handlers
```

- Use priority `20+` for workflow triggers to ensure core WordPress operations complete first
- Avoid priority `1` unless the trigger must run before all other handlers

## Example: Email Admin on New User Registration

```json
{
  "name": "New User Registration Alert",
  "type": "action_hook",
  "event": "user_register",
  "actions": [
    {
      "channel": "email",
      "to": "admin@example.com",
      "subject": "New user registered: {{user_name}}",
      "body": "A new user ({{user_email}}) registered on {{site_url}} at {{timestamp}}.",
      "template": "new_user_alert"
    },
    {
      "channel": "slack",
      "message": ":bust_in_silhouette: New user: *{{user_name}}* ({{user_email}})"
    }
  ],
  "status": "active"
}
```
