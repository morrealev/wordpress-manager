# Content Webhooks

Use this file when implementing webhooks to keep a headless frontend in sync with WordPress content changes.

## Why webhooks

In a headless setup, the frontend caches content (SSG/ISR). When editors publish or update content in WordPress, the frontend must be notified to rebuild or revalidate the affected pages.

```
Editor publishes post → WordPress fires webhook → Frontend revalidates page
```

## WordPress webhook implementation

### Using action hooks

```php
// mu-plugins/headless-webhooks.php

add_action('transition_post_status', 'headless_notify_frontend', 10, 3);
add_action('edited_term', 'headless_notify_frontend_term', 10, 3);
add_action('wp_update_nav_menu', 'headless_notify_frontend_menu');

function headless_notify_frontend($new_status, $old_status, $post) {
    // Only fire for published/updated/unpublished content
    $trigger_statuses = ['publish', 'trash'];
    if (!in_array($new_status, $trigger_statuses) && !in_array($old_status, $trigger_statuses)) {
        return;
    }

    // Skip revisions and autosaves
    if (wp_is_post_revision($post) || wp_is_post_autosave($post)) {
        return;
    }

    $path = get_permalink_path($post);
    send_revalidation_webhook($path, [
        'action'    => 'post_updated',
        'post_id'   => $post->ID,
        'post_type' => $post->post_type,
        'slug'      => $post->post_name,
        'status'    => $new_status,
    ]);
}

function headless_notify_frontend_term($term_id, $tt_id, $taxonomy) {
    $term = get_term($term_id, $taxonomy);
    send_revalidation_webhook("/category/{$term->slug}", [
        'action'   => 'term_updated',
        'term_id'  => $term_id,
        'taxonomy' => $taxonomy,
        'slug'     => $term->slug,
    ]);
}

function headless_notify_frontend_menu($menu_id) {
    send_revalidation_webhook('/', [
        'action'  => 'menu_updated',
        'menu_id' => $menu_id,
    ]);
}

function get_permalink_path($post) {
    $permalink = get_permalink($post);
    $parsed = wp_parse_url($permalink);
    return $parsed['path'] ?? '/';
}

function send_revalidation_webhook($path, $payload = []) {
    $webhook_url = defined('HEADLESS_WEBHOOK_URL')
        ? HEADLESS_WEBHOOK_URL
        : '';

    $webhook_secret = defined('HEADLESS_WEBHOOK_SECRET')
        ? HEADLESS_WEBHOOK_SECRET
        : '';

    if (!$webhook_url) return;

    $body = array_merge($payload, ['path' => $path]);

    wp_remote_post($webhook_url, [
        'timeout' => 5,
        'headers' => [
            'Content-Type'        => 'application/json',
            'X-Revalidate-Secret' => $webhook_secret,
        ],
        'body' => wp_json_encode($body),
    ]);
}
```

### wp-config.php constants

```php
define('HEADLESS_WEBHOOK_URL', 'https://app.example.com/api/revalidate');
define('HEADLESS_WEBHOOK_SECRET', 'your-shared-secret-here');
```

## Frontend webhook receivers

### Next.js (App Router)

```js
// app/api/revalidate/route.js
import { revalidatePath, revalidateTag } from 'next/cache';

export async function POST(request) {
    const secret = request.headers.get('x-revalidate-secret');
    if (secret !== process.env.REVALIDATE_SECRET) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, path, post_type, slug } = body;

    // Revalidate the specific page
    if (path) {
        revalidatePath(path);
    }

    // Revalidate related pages
    switch (action) {
        case 'post_updated':
            revalidatePath('/blog'); // blog listing
            if (post_type === 'post') {
                revalidatePath(`/blog/${slug}`);
            }
            break;
        case 'term_updated':
            revalidatePath('/blog'); // categories affect listings
            break;
        case 'menu_updated':
            revalidatePath('/', 'layout'); // menus are in layout
            break;
    }

    return Response.json({
        revalidated: true,
        path,
        action,
        timestamp: Date.now(),
    });
}
```

### Nuxt 3

```js
// server/api/revalidate.post.js
export default defineEventHandler(async (event) => {
    const secret = getHeader(event, 'x-revalidate-secret');
    if (secret !== process.env.REVALIDATE_SECRET) {
        throw createError({ statusCode: 401, message: 'Unauthorized' });
    }

    const body = await readBody(event);

    // Clear Nuxt cache for the path
    // For Nitro with built-in caching:
    const storage = useStorage('cache');
    await storage.clear(); // or selectively clear by path

    return { revalidated: true, path: body.path };
});
```

### Astro (with SSR adapter)

```js
// src/pages/api/revalidate.js
export async function POST({ request }) {
    const secret = request.headers.get('x-revalidate-secret');
    if (secret !== import.meta.env.REVALIDATE_SECRET) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    // Astro SSG: trigger rebuild via deployment hook
    const body = await request.json();

    // Example: trigger Vercel deploy hook
    if (import.meta.env.VERCEL_DEPLOY_HOOK) {
        await fetch(import.meta.env.VERCEL_DEPLOY_HOOK, { method: 'POST' });
    }

    return new Response(JSON.stringify({ revalidated: true }));
}
```

## Deployment platform hooks

### Vercel

```php
// WordPress: trigger Vercel deploy on major changes
function trigger_vercel_deploy() {
    $hook_url = defined('VERCEL_DEPLOY_HOOK') ? VERCEL_DEPLOY_HOOK : '';
    if (!$hook_url) return;

    wp_remote_post($hook_url, ['timeout' => 5]);
}
add_action('save_post', function($post_id, $post) {
    if ($post->post_status === 'publish' && !wp_is_post_revision($post_id)) {
        trigger_vercel_deploy();
    }
}, 10, 2);
```

### Netlify

```php
define('NETLIFY_BUILD_HOOK', 'https://api.netlify.com/build_hooks/YOUR_HOOK_ID');

function trigger_netlify_build() {
    wp_remote_post(NETLIFY_BUILD_HOOK, ['timeout' => 5]);
}
```

## WP-CLI webhook testing

```bash
# Simulate a webhook fire
wp eval "do_action('transition_post_status', 'publish', 'draft', get_post(1));"

# Test webhook endpoint manually
curl -X POST https://app.example.com/api/revalidate \
  -H "Content-Type: application/json" \
  -H "X-Revalidate-Secret: your-shared-secret" \
  -d '{"action":"post_updated","path":"/blog/hello-world","slug":"hello-world"}'
```

## Using WP Webhooks plugin (alternative)

For non-developers or complex workflows:

```bash
wp plugin install wp-webhooks --activate
```

The plugin provides a UI for configuring webhook endpoints, triggers, and authentication.

## Security

1. **Always use a shared secret** — validate on the receiver side
2. **Use HTTPS** — webhook payloads may contain content data
3. **Rate limit** — debounce rapid-fire saves (WordPress autosave triggers frequently)
4. **Timeout** — set short timeouts (5s) to avoid blocking WordPress
5. **Async processing** — use `wp_schedule_single_event` for non-critical webhooks

### Debouncing

```php
function send_revalidation_webhook_debounced($path, $payload = []) {
    $key = 'webhook_debounce_' . md5($path);

    // Skip if webhook was sent for this path in the last 10 seconds
    if (get_transient($key)) return;

    set_transient($key, true, 10);
    send_revalidation_webhook($path, $payload);
}
```

## Verification

```bash
# Check webhook constant is defined
wp config get HEADLESS_WEBHOOK_URL

# Test webhook fires on post save
wp post update 1 --post_title="Webhook Test $(date +%s)"
# Check frontend logs for incoming webhook

# Verify revalidation worked
curl -s -o /dev/null -w "%{http_code}" https://app.example.com/blog/hello-world
# Should return 200 with updated content
```
