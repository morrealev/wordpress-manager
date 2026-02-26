# WordPress Security Audit Checklist

## 1. Plugin Security (CRITICAL)

### Checks
- [ ] List all active and inactive plugins
- [ ] Verify each plugin is from a trusted source (WordPress.org, reputable vendor)
- [ ] Check each plugin version against latest available
- [ ] Search for known CVEs: `[plugin-name] WordPress vulnerability [year]`
- [ ] Flag plugins not updated in > 12 months
- [ ] Flag plugins with < 1,000 active installations
- [ ] Count inactive plugins (should be 0 — delete unused)

### Common Vulnerable Plugins (check specifically)
- Contact Form 7: ensure latest version
- WooCommerce: critical for e-commerce sites
- Elementor: frequent security patches
- Yoast SEO: moderate risk
- WPForms: check version

### Red Flags
- Plugin from unknown/non-WordPress.org source
- Plugin with no recent updates
- Plugin requesting excessive permissions
- Nulled/pirated premium plugins

## 2. User Account Security (HIGH)

### Checks
- [ ] List all users with `list_users` (context: edit)
- [ ] Count administrator accounts (should be 1-2 max)
- [ ] Check for username "admin" (brute force target)
- [ ] Check for generic usernames (test, demo, admin1)
- [ ] Verify email addresses are valid and unique
- [ ] Review user roles (principle of least privilege)
- [ ] Identify dormant accounts (no posts, no recent login)

### Role Guidelines
| Role | Who Should Have It |
|------|-------------------|
| Administrator | Site owner only (1-2 max) |
| Editor | Content managers |
| Author | Regular content creators |
| Contributor | Guest writers |
| Subscriber | Registered users |

## 3. Content Integrity (MEDIUM)

### Checks
- [ ] Review recently modified pages for injected content
- [ ] Search for suspicious HTML: `<iframe`, `<script`, `eval(`, `base64_decode`
- [ ] Check for hidden SEO spam (invisible links, cloaked content)
- [ ] Review comments for spam injection
- [ ] Check for unauthorized new user accounts
- [ ] Verify no unexpected custom post types exist

## 4. DNS and Email Security (MEDIUM)

### Checks
- [ ] SPF record exists: `v=spf1 ... -all`
- [ ] DKIM record configured
- [ ] DMARC policy set: `v=DMARC1; p=quarantine` (minimum)
- [ ] No unexpected A/CNAME records pointing elsewhere
- [ ] MX records pointing to expected mail server
- [ ] SSL certificate valid and not expiring soon

## 5. Server Configuration (LOW-MEDIUM)

### Checks (SSH required)
- [ ] PHP version >= 8.1
- [ ] wp-config.php permissions: 440 or 400
- [ ] WP_DEBUG set to false in production
- [ ] Database table prefix is NOT `wp_`
- [ ] File editing disabled: `DISALLOW_FILE_EDIT = true`
- [ ] Directory listing disabled
- [ ] .htaccess contains security headers
- [ ] XML-RPC disabled if not needed

### Recommended wp-config.php Settings
```php
define('DISALLOW_FILE_EDIT', true);
define('WP_DEBUG', false);
define('WP_DEBUG_LOG', false);
define('WP_DEBUG_DISPLAY', false);
define('FORCE_SSL_ADMIN', true);
```

### Recommended .htaccess Security Headers
```apache
Header set X-Content-Type-Options "nosniff"
Header set X-Frame-Options "SAMEORIGIN"
Header set X-XSS-Protection "1; mode=block"
Header set Referrer-Policy "strict-origin-when-cross-origin"
Header set Content-Security-Policy "upgrade-insecure-requests"
```
