---
name: wp-headless
description: "Use when building headless/decoupled WordPress architectures: choosing between REST API and WPGraphQL, headless authentication (JWT, application passwords, NextAuth), CORS configuration, frontend framework integration (Next.js, Nuxt, Astro), content webhooks, and ISR/SSG strategies."
compatibility: "Targets WordPress 6.9+ (PHP 7.2.24+). Filesystem-based agent with bash + node."
version: 1.0.0
source: "vinmor/wordpress-manager"
---

# WP Headless

## When to use

Use this skill when building or maintaining a decoupled/headless WordPress architecture:

- Building a decoupled site with WordPress as the CMS and a separate frontend
- Choosing between REST API and WPGraphQL for data fetching
- Configuring WordPress as a headless CMS backend
- Integrating with Next.js, Nuxt, or Astro frontends
- Setting up headless authentication (JWT, application passwords, NextAuth/Auth.js)
- Configuring CORS for cross-origin API access
- Implementing content webhooks for on-demand revalidation (ISR)
- Planning SSG, SSR, or ISR rendering strategies

## Inputs required

- **WordPress site**: URL, admin access, hosting type
- **Frontend framework**: Next.js, Nuxt, Astro, or other
- **Authentication requirements**: public content only vs authenticated features
- **Hosting for frontend**: Vercel, Netlify, self-hosted, or other
- **Deployment strategy**: SSG (static), SSR (server), ISR (incremental), or hybrid

## Procedure

### 0) Detect headless setup

Run the detection script to assess the current architecture:

```bash
node skills/wp-headless/scripts/headless_inspect.mjs --cwd=/path/to/wordpress
```

The script outputs JSON with:
- `apiLayer` — REST API and/or WPGraphQL availability, custom endpoints count
- `frontend` — detected frontend framework (Next.js, Nuxt, Astro)
- `auth` — authentication methods available
- `cors` — CORS configuration status and allowed origins
- `webhooks` — outgoing webhook configuration
- `isHeadless` — boolean assessment of whether the setup is headless

### 1) Choose API layer

Decide between REST API (built-in) and WPGraphQL (plugin) based on project needs.

| Factor | REST API | WPGraphQL |
|--------|----------|-----------|
| Installation | Built-in, zero setup | Requires plugin |
| Data fetching | Fixed response shape | Fetch exactly what you need |
| Related data | Multiple requests | Single query with connections |
| Learning curve | Low (familiar HTTP) | Medium (GraphQL syntax) |
| Caching | Simple (HTTP cache) | Complex (query-level) |
| Best for | Simple sites, mobile apps | Complex content, performance-critical |

Use REST with `_fields` parameter for simple needs. Use WPGraphQL for complex content models.

Read: `references/api-layer-choice.md`

For REST endpoint development, also reference the `wp-rest-api` skill.

### 2) WPGraphQL setup

If using WPGraphQL:
1. Install: `wp plugin install wp-graphql --activate`
2. Explore schema at `/graphql` endpoint with GraphiQL
3. Register custom types and fields
4. Use cursor-based pagination (`first`/`after`)
5. Consider WPGraphQL Smart Cache for performance

Read: `references/wpgraphql.md`

### 3) Headless authentication

Choose the authentication method based on use case:

- **Application Passwords** (built-in): best for server-to-server and build-time fetching
- **JWT** (plugin): best for client-side authentication flows
- **NextAuth/Auth.js**: best for Next.js projects with WordPress as OAuth provider
- **Preview mode**: special auth for draft content preview

For security best practices in authentication, reference the `wp-security` skill.

Read: `references/headless-auth.md`

### 4) CORS configuration

Configure Cross-Origin Resource Sharing to allow the frontend to access WordPress APIs:

```php
add_filter('allowed_http_origins', function($origins) {
    $origins[] = 'https://frontend.example.com';
    return $origins;
});
```

Key rules:
- Never use `Access-Control-Allow-Origin: *` with credentials
- Always specify exact origins in production
- Handle preflight `OPTIONS` requests
- WPGraphQL has built-in CORS settings

Read: `references/cors-config.md`

### 5) Frontend integration

Connect the frontend framework to WordPress data:

- **Next.js**: `fetch()` in App Router with `revalidate`, `getStaticProps` in Pages Router, ISR for incremental updates
- **Nuxt**: `useFetch()` / `useAsyncData()`, ISR with `routeRules`
- **Astro**: content collections from API, static-first with on-demand rendering

Common patterns: centralized API client, TypeScript types from schema, image optimization with WordPress media URLs.

Read: `references/frontend-integration.md`

### 6) Content webhooks and revalidation

Trigger frontend rebuilds or cache invalidation when WordPress content changes:

```php
add_action('transition_post_status', function($new, $old, $post) {
    if ($new === 'publish') {
        wp_remote_post('https://frontend.example.com/api/revalidate', [
            'body'    => json_encode(['path' => '/' . $post->post_name]),
            'headers' => ['Content-Type' => 'application/json', 'Authorization' => 'Bearer SECRET'],
        ]);
    }
}, 10, 3);
```

Strategies: path-based ISR, tag-based revalidation, full rebuild triggers. WPGraphQL Smart Cache provides automatic invalidation.

Read: `references/webhooks.md`

## Verification

- API returns data: `curl https://wp.example.com/wp-json/wp/v2/posts` returns JSON
- Frontend renders WordPress content correctly
- Authentication works: protected endpoints require credentials, public ones don't
- CORS headers correct: check `Access-Control-Allow-Origin` in response headers
- Preview mode: draft content visible in frontend preview
- Webhooks trigger: publish a post and confirm frontend revalidates
- Builds succeed: `next build` / `nuxt generate` / `astro build` completes

## Failure modes / debugging

- **CORS errors**: check browser DevTools Network tab for preflight failures; verify origin whitelist matches exactly (protocol + domain + port)
- **Authentication failures**: verify application password format (`user:xxxx xxxx xxxx`), check JWT token expiry, confirm `Authorization` header is forwarded
- **Stale content**: ISR `revalidate` interval too high; webhook not triggering; check `transition_post_status` hook fires on publish
- **GraphQL schema missing fields**: custom post types need `show_in_graphql => true`; ACF fields need WPGraphQL for ACF extension
- **Preview not working**: draft mode API route misconfigured; preview secret mismatch; WordPress preview URL not pointing to frontend
- **Build failures**: API unreachable during build; increase timeout; add fallback for missing data

## Escalation

- WPGraphQL documentation: https://www.wpgraphql.com/docs
- Next.js WordPress examples: https://github.com/vercel/next.js/tree/canary/examples/cms-wordpress
- Astro WordPress integration: https://docs.astro.build/en/guides/cms/wordpress/
- For REST endpoint development, use the `wp-rest-api` skill
- For authentication security, use the `wp-security` skill
- For webhook configuration and management, use the `wp-webhooks` skill
- For scalable programmatic page generation with ISR/SSG, use the `wp-programmatic-seo` skill
