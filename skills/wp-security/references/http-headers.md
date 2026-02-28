# HTTP Security Headers

Use this file when configuring HTTP security headers for a WordPress site.

## Recommended headers

### Content-Security-Policy

WordPress admin requires `unsafe-inline` and `unsafe-eval`. Use a relaxed policy for admin, strict for frontend:

```apache
# Frontend (strict)
Header set Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; frame-ancestors 'self'"
```

For sites using inline scripts/styles (common with plugins):
```apache
Header set Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data: https:; frame-ancestors 'self'"
```

### X-Frame-Options

Prevents clickjacking. WordPress sends this by default via `send_frame_options_header()`:

```apache
Header always set X-Frame-Options "SAMEORIGIN"
```

### X-Content-Type-Options

Prevents MIME type sniffing:

```apache
Header always set X-Content-Type-Options "nosniff"
```

### Strict-Transport-Security (HSTS)

Enforces HTTPS. Only enable if SSL is fully configured:

```apache
Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
```

### Permissions-Policy

Restricts browser features:

```apache
Header always set Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=()"
```

### Referrer-Policy

Controls referrer information:

```apache
Header always set Referrer-Policy "strict-origin-when-cross-origin"
```

## Implementation methods

### Apache (.htaccess)

```apache
<IfModule mod_headers.c>
    Header always set X-Frame-Options "SAMEORIGIN"
    Header always set X-Content-Type-Options "nosniff"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
    Header always set Permissions-Policy "camera=(), microphone=(), geolocation=()"
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
</IfModule>
```

### Nginx

```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

### PHP (via WordPress hook)

```php
add_action('send_headers', function() {
    header('X-Content-Type-Options: nosniff');
    header('Referrer-Policy: strict-origin-when-cross-origin');
    header('Permissions-Policy: camera=(), microphone=(), geolocation=()');
});
```

## Testing

- Use https://securityheaders.com to scan headers
- Use browser DevTools → Network tab → click request → Headers
- Use `curl -I https://site.com` to view response headers

## Common issues

- **CSP breaks admin**: exclude `/wp-admin/` from strict CSP rules or add `unsafe-inline`/`unsafe-eval`
- **HSTS lockout**: if SSL breaks, users can't access the site; start with a short `max-age` (3600) and increase gradually
- **Headers not applying**: verify Apache `mod_headers` is enabled; verify nginx config is included and reloaded
