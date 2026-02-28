# CORS Configuration

Use this file when configuring Cross-Origin Resource Sharing for headless WordPress.

## Why CORS matters for headless

In a headless setup, the frontend (e.g., `app.example.com`) and WordPress backend (`wp.example.com`) are on different origins. Browsers block cross-origin requests unless the server explicitly allows them via CORS headers.

## WordPress CORS via PHP

### Allow specific origin (recommended)

```php
add_action('init', function() {
    $allowed_origins = [
        'https://app.example.com',
        'https://staging.example.com',
    ];

    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';

    if (in_array($origin, $allowed_origins, true)) {
        header("Access-Control-Allow-Origin: $origin");
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Authorization, Content-Type, X-WP-Nonce');
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Max-Age: 86400');
    }

    // Handle preflight
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        status_header(204);
        exit;
    }
});
```

### REST API specific filter

```php
add_action('rest_api_init', function() {
    remove_filter('rest_pre_serve_request', 'rest_send_cors_headers');

    add_filter('rest_pre_serve_request', function($value) {
        $allowed_origins = [
            'https://app.example.com',
            'https://staging.example.com',
        ];

        $origin = get_http_origin();

        if ($origin && in_array($origin, $allowed_origins, true)) {
            header("Access-Control-Allow-Origin: $origin");
            header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
            header('Access-Control-Allow-Headers: Authorization, Content-Type, X-WP-Nonce');
            header('Access-Control-Allow-Credentials: true');
        }

        return $value;
    });
});
```

### WPGraphQL CORS

```php
add_action('graphql_response_headers_to_send', function($headers) {
    $allowed_origins = [
        'https://app.example.com',
    ];

    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';

    if (in_array($origin, $allowed_origins, true)) {
        $headers['Access-Control-Allow-Origin'] = $origin;
        $headers['Access-Control-Allow-Headers'] = 'Authorization, Content-Type';
        $headers['Access-Control-Allow-Credentials'] = 'true';
    }

    return $headers;
});
```

## Server-level CORS

### Nginx

```nginx
# /etc/nginx/conf.d/cors.conf or within server block
map $http_origin $cors_origin {
    default "";
    "https://app.example.com"     "https://app.example.com";
    "https://staging.example.com" "https://staging.example.com";
}

server {
    # ... existing config

    location /wp-json/ {
        if ($cors_origin != "") {
            add_header Access-Control-Allow-Origin $cors_origin always;
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
            add_header Access-Control-Allow-Headers "Authorization, Content-Type, X-WP-Nonce" always;
            add_header Access-Control-Allow-Credentials "true" always;
            add_header Access-Control-Max-Age 86400 always;
        }

        if ($request_method = OPTIONS) {
            return 204;
        }

        # ... proxy or fastcgi config
    }

    location /graphql {
        # Same CORS headers as above
        if ($cors_origin != "") {
            add_header Access-Control-Allow-Origin $cors_origin always;
            add_header Access-Control-Allow-Methods "GET, POST, OPTIONS" always;
            add_header Access-Control-Allow-Headers "Authorization, Content-Type" always;
            add_header Access-Control-Allow-Credentials "true" always;
        }

        if ($request_method = OPTIONS) {
            return 204;
        }

        # ... proxy or fastcgi config
    }
}
```

### Apache (.htaccess)

```apache
<IfModule mod_headers.c>
    SetEnvIf Origin "^https://(app|staging)\.example\.com$" CORS_ORIGIN=$0
    Header always set Access-Control-Allow-Origin %{CORS_ORIGIN}e env=CORS_ORIGIN
    Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
    Header always set Access-Control-Allow-Headers "Authorization, Content-Type, X-WP-Nonce"
    Header always set Access-Control-Allow-Credentials "true"
    Header always set Access-Control-Max-Age "86400"
</IfModule>

# Handle preflight
RewriteEngine On
RewriteCond %{REQUEST_METHOD} OPTIONS
RewriteRule ^(.*)$ $1 [R=204,L]
```

## CORS headers explained

| Header | Purpose |
|--------|---------|
| `Access-Control-Allow-Origin` | Which origins can access the resource |
| `Access-Control-Allow-Methods` | Which HTTP methods are allowed |
| `Access-Control-Allow-Headers` | Which request headers are allowed |
| `Access-Control-Allow-Credentials` | Whether cookies/auth can be sent |
| `Access-Control-Max-Age` | How long preflight results can be cached (seconds) |
| `Access-Control-Expose-Headers` | Which response headers the client can read |

## Common issues

### "No 'Access-Control-Allow-Origin' header"

The server doesn't include the CORS header. Fix: add the headers as shown above.

### "The value of 'Access-Control-Allow-Origin' is not equal to the supplied origin"

Origin mismatch. Check:
- Trailing slashes (`https://app.example.com` vs `https://app.example.com/`)
- Protocol (`http` vs `https`)
- Port numbers (`localhost:3000` vs `localhost`)

### "Credentials flag is true but Access-Control-Allow-Origin is '*'"

Cannot use `*` with `credentials: true`. Must specify the exact origin:
```
Access-Control-Allow-Origin: https://app.example.com  ✓
Access-Control-Allow-Origin: *                          ✗ (with credentials)
```

### Preflight (OPTIONS) returns 401/403

WordPress or a security plugin is blocking OPTIONS requests. Fix:
```php
add_action('init', function() {
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        // Send CORS headers and exit before WordPress auth runs
        header('Access-Control-Allow-Origin: https://app.example.com');
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Authorization, Content-Type');
        header('Access-Control-Allow-Credentials: true');
        status_header(204);
        exit;
    }
});
```

## Development CORS

```php
// ONLY for local development — never in production
if (defined('WP_DEBUG') && WP_DEBUG) {
    add_action('init', function() {
        header('Access-Control-Allow-Origin: http://localhost:3000');
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Authorization, Content-Type');
        header('Access-Control-Allow-Credentials: true');

        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            status_header(204);
            exit;
        }
    });
}
```

## Security rules

1. **Never use `*` in production** — always whitelist specific origins
2. **Never reflect the Origin header blindly** — validate against a whitelist
3. **Use `Credentials: true` only when needed** — for authenticated requests
4. **Set `Max-Age` for caching** — reduces preflight requests (86400 = 24 hours)
5. **Expose only needed headers** — minimize `Access-Control-Expose-Headers`

## Verification

```bash
# Test CORS headers
curl -I -X OPTIONS https://wp.example.com/wp-json/wp/v2/posts \
  -H "Origin: https://app.example.com" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Authorization"

# Check response headers include:
# Access-Control-Allow-Origin: https://app.example.com
# Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
# Access-Control-Allow-Headers: Authorization, Content-Type

# Test from frontend
fetch('https://wp.example.com/wp-json/wp/v2/posts', {
    credentials: 'include',
}).then(r => console.log('CORS OK:', r.ok));
```
