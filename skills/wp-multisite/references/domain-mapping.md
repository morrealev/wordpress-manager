# Domain Mapping

Domain mapping allows each sub-site in a WordPress Multisite network to use its own custom domain instead of the default sub-directory or sub-domain URL.

## Overview

| Default URL | Mapped Domain |
|-------------|---------------|
| `network.com/shopA/` | `shopA.com` |
| `shopB.network.com` | `shopB.com` |

Since WordPress 4.5+, domain mapping is built into core (no plugin required for basic mapping).

## Setup Procedure

### 1. DNS Configuration

For each custom domain, create a DNS record pointing to the network server:

| Record Type | Name | Value |
|-------------|------|-------|
| A | `shopA.com` | `<server-ip>` |
| CNAME | `www.shopA.com` | `shopA.com` |

### 2. WordPress Configuration

In Network Admin > Sites > Edit Site > Domain:
- Change the site URL to the custom domain

Or via WP-CLI:
```bash
wp site list  # find the blog_id
wp option update home 'https://shopA.com' --url=network.com/shopA/
wp option update siteurl 'https://shopA.com' --url=network.com/shopA/
```

### 3. SSL Certificate

Each mapped domain needs its own SSL certificate:
- **Let's Encrypt**: Use Certbot with `--domains shopA.com,shopB.com`
- **Wildcard**: Only covers `*.network.com`, NOT custom domains
- **Multi-domain SAN cert**: Can cover all mapped domains in one cert

### 4. Web Server Configuration

The web server must accept requests for all mapped domains. In Nginx:

```nginx
server {
    server_name shopA.com shopB.com network.com *.network.com;
    # ... standard WordPress config
}
```

## sunrise.php (Advanced)

For complex domain mapping logic, WordPress supports a `sunrise.php` drop-in:

- Location: `wp-content/sunrise.php`
- Loaded very early in the WordPress bootstrap (before plugins)
- Must be enabled: `define('SUNRISE', true);` in wp-config.php
- Used by plugins like "WordPress MU Domain Mapping" (legacy) or "Mercator"

## Tips and Gotchas

- **Cookie domain**: After mapping, update `COOKIE_DOMAIN` if login issues occur.
- **Mixed content**: Ensure all mapped domains use HTTPS to avoid mixed content warnings.
- **Caching**: Flush caches after domain mapping changes — both server-side and CDN.
- **Search Console**: Register each mapped domain separately in Google Search Console.
- **Reverse proxy**: If using Cloudflare or similar, configure the DNS to point to the origin server's IP, not the CDN.
