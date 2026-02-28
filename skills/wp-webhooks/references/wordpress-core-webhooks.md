# WordPress Core Webhooks

## Overview

WordPress core does not have a built-in webhook management UI like WooCommerce. Instead, you implement outbound notifications by hooking into WordPress action hooks and using `wp_remote_post()` to send HTTP requests. The recommended approach is deploying a mu-plugin.

## mu-Plugin Approach

Create a mu-plugin at `wp-content/mu-plugins/outbound-webhooks.php`:

```php
<?php
/**
 * Plugin Name: Outbound Webhooks
 * Description: Sends webhook notifications on content events.
 */

// Configuration — set these in wp-config.php
// define('WEBHOOK_URL', 'https://hooks.example.com/wordpress');
// define('WEBHOOK_SECRET', 'your-secret-key');

if (!defined('WEBHOOK_URL') || !WEBHOOK_URL) {
    return;
}

/**
 * Send a webhook notification.
 */
function send_webhook($event, $data) {
    $payload = wp_json_encode([
        'event'     => $event,
        'timestamp' => gmdate('c'),
        'site_url'  => home_url(),
        'data'      => $data,
    ]);

    $signature = hash_hmac('sha256', $payload, WEBHOOK_SECRET ?? '');

    wp_remote_post(WEBHOOK_URL, [
        'timeout' => 5,
        'headers' => [
            'Content-Type'         => 'application/json',
            'X-WP-Webhook-Event'   => $event,
            'X-WP-Webhook-Signature' => $signature,
        ],
        'body' => $payload,
    ]);
}

/**
 * Hook: Post published or updated.
 */
add_action('transition_post_status', function($new_status, $old_status, $post) {
    if ($new_status === 'publish' && $old_status !== 'publish') {
        send_webhook('post.published', [
            'id'    => $post->ID,
            'title' => $post->post_title,
            'slug'  => $post->post_name,
            'type'  => $post->post_type,
            'url'   => get_permalink($post),
        ]);
    } elseif ($new_status === 'publish' && $old_status === 'publish') {
        send_webhook('post.updated', [
            'id'    => $post->ID,
            'title' => $post->post_title,
            'slug'  => $post->post_name,
            'type'  => $post->post_type,
            'url'   => get_permalink($post),
        ]);
    }
}, 10, 3);

/**
 * Hook: Term created or edited.
 */
add_action('edited_term', function($term_id, $tt_id, $taxonomy) {
    $term = get_term($term_id, $taxonomy);
    send_webhook('term.updated', [
        'id'       => $term_id,
        'name'     => $term->name,
        'slug'     => $term->slug,
        'taxonomy' => $taxonomy,
    ]);
}, 10, 3);

/**
 * Hook: User registered.
 */
add_action('user_register', function($user_id) {
    $user = get_userdata($user_id);
    send_webhook('user.created', [
        'id'       => $user_id,
        'username' => $user->user_login,
        'email'    => $user->user_email,
        'role'     => implode(', ', $user->roles),
    ]);
});

/**
 * Hook: Navigation menu updated.
 */
add_action('wp_update_nav_menu', function($menu_id) {
    send_webhook('menu.updated', [
        'menu_id' => $menu_id,
    ]);
});
```

## Key WordPress Action Hooks

| Hook | Fires When | Arguments |
|------|-----------|-----------|
| `transition_post_status` | Post status changes | $new_status, $old_status, $post |
| `save_post` | Post is saved (any status) | $post_id, $post, $update |
| `delete_post` | Post is deleted | $post_id |
| `edited_term` | Term is created or edited | $term_id, $tt_id, $taxonomy |
| `user_register` | New user registers | $user_id |
| `profile_update` | User profile updated | $user_id, $old_user_data |
| `wp_update_nav_menu` | Navigation menu updated | $menu_id |
| `updated_option` | Option value changed | $option_name, $old, $new |
| `activated_plugin` | Plugin activated | $plugin |
| `switch_theme` | Theme switched | $new_name, $new_theme |

## wp-config.php Constants

Add these constants to `wp-config.php` for the mu-plugin:

```php
// Primary webhook endpoint
define('WEBHOOK_URL', 'https://hooks.example.com/wordpress');

// HMAC secret for signature verification
define('WEBHOOK_SECRET', 'your-secret-key-here');

// Optional: headless frontend revalidation
define('HEADLESS_WEBHOOK_URL', 'https://frontend.example.com/api/revalidate');
define('HEADLESS_WEBHOOK_SECRET', 'revalidation-secret');
```

## Deployment

Deploy the mu-plugin via:
1. **SSH/SFTP**: Upload to `wp-content/mu-plugins/`
2. **WP-CLI**: `wp eval 'file_put_contents(WPMU_PLUGIN_DIR . "/outbound-webhooks.php", $code);'`
3. **Hostinger MCP**: Use file deployment tools

mu-plugins load automatically — no activation needed.

## Testing

Verify webhooks fire correctly:

```bash
# Check if mu-plugin is loaded
wp eval "echo defined('WEBHOOK_URL') ? 'configured' : 'not configured';"

# Trigger a test by updating a post
wp post update 1 --post_title="Test Webhook Trigger"

# Check for errors in debug.log
tail -f wp-content/debug.log | grep -i webhook
```
