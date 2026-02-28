# Network Setup

WordPress Multisite allows a single WordPress installation to host multiple websites (sub-sites) sharing the same codebase and database. Understanding the setup options is critical for architecture decisions.

## MCP Tools

| Tool | Usage |
|------|-------|
| `ms_get_network_settings` | View current network configuration |

## Sub-directory vs Sub-domain

| Mode | URL Pattern | Example | Requirements |
|------|------------|---------|-------------|
| Sub-directory | `example.com/site1/` | `example.com/blog/` | Default, works everywhere |
| Sub-domain | `site1.example.com` | `blog.example.com` | Wildcard DNS (`*.example.com`), wildcard SSL |

Decision factors:
- **Sub-directory**: simpler DNS, single SSL cert, better for related sites
- **Sub-domain**: each site feels independent, better for unrelated brands

## wp-config.php Constants

Required constants for multisite (set during network installation):

```php
define('WP_ALLOW_MULTISITE', true);     // Step 1: enables Network Setup menu
define('MULTISITE', true);               // Step 2: after network creation
define('SUBDOMAIN_INSTALL', false);      // true for sub-domain, false for sub-directory
define('DOMAIN_CURRENT_SITE', 'example.com');
define('PATH_CURRENT_SITE', '/');
define('SITE_ID_CURRENT_SITE', 1);
define('BLOG_ID_CURRENT_SITE', 1);
```

## Installation Procedure

1. Start with a fresh single-site WordPress installation
2. Add `define('WP_ALLOW_MULTISITE', true);` to wp-config.php
3. Navigate to Tools > Network Setup in wp-admin
4. Choose sub-directory or sub-domain
5. WordPress generates the remaining constants and .htaccess rules
6. Add the generated code to wp-config.php and .htaccess
7. Log in again — Network Admin menu appears

## .htaccess Rules (sub-directory mode)

```apache
RewriteEngine On
RewriteBase /
RewriteRule ^index\.php$ - [L]

# add a trailing slash to /wp-admin
RewriteRule ^([_0-9a-zA-Z-]+/)?wp-admin$ $1wp-admin/ [R=301,L]

RewriteCond %{REQUEST_FILENAME} -f [OR]
RewriteCond %{REQUEST_FILENAME} -d
RewriteRule ^ - [L]
RewriteRule ^([_0-9a-zA-Z-]+/)?(wp-(content|admin|includes).*) $2 [L]
RewriteRule ^([_0-9a-zA-Z-]+/)?(.*\.php)$ $2 [L]
RewriteRule . index.php [L]
```

## Tips and Gotchas

- **Cannot switch modes**: You cannot change from sub-directory to sub-domain (or vice versa) after network creation without a fresh install or complex migration.
- **Existing content**: If the single site already has content, sub-directory mode may conflict with existing page slugs.
- **SSL**: Sub-domain mode requires wildcard SSL (`*.example.com`). Let's Encrypt supports wildcard via DNS-01 challenge.
- **WP_ALLOW_MULTISITE vs MULTISITE**: `WP_ALLOW_MULTISITE` enables the setup UI; `MULTISITE` activates the network. They are different constants.
