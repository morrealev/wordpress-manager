# API Restriction

Use this file when restricting WordPress API exposure (XML-RPC, REST API).

## Disable XML-RPC

XML-RPC is rarely needed and is a common brute-force target.

### Via filter (recommended)

```php
// Completely disable XML-RPC
add_filter('xmlrpc_enabled', '__return_false');

// Also remove the HTTP header advertising it
add_filter('wp_headers', function($headers) {
    unset($headers['X-Pingback']);
    return $headers;
});
```

### Via .htaccess (blocks at server level)

```apache
<Files xmlrpc.php>
    order deny,allow
    deny from all
</Files>
```

### Via nginx

```nginx
location = /xmlrpc.php {
    deny all;
}
```

## Restrict REST API to authenticated users

```php
add_filter('rest_authentication_errors', function($result) {
    if (true === $result || is_wp_error($result)) {
        return $result;
    }
    if (!is_user_logged_in()) {
        return new WP_Error(
            'rest_not_logged_in',
            __('You are not currently logged in.'),
            ['status' => 401]
        );
    }
    return $result;
});
```

**Warning**: this breaks any public-facing REST API usage. Whitelist specific namespaces if needed:

```php
add_filter('rest_authentication_errors', function($result) {
    if (true === $result || is_wp_error($result)) {
        return $result;
    }
    $request_uri = $_SERVER['REQUEST_URI'] ?? '';
    // Allow public access to specific namespaces
    $public = ['/wp-json/wp/v2/posts', '/wp-json/wp/v2/pages', '/wp-json/oembed/'];
    foreach ($public as $path) {
        if (str_contains($request_uri, $path)) {
            return $result;
        }
    }
    if (!is_user_logged_in()) {
        return new WP_Error('rest_not_logged_in', 'Authentication required.', ['status' => 401]);
    }
    return $result;
});
```

## Block user enumeration via REST

```php
add_filter('rest_endpoints', function($endpoints) {
    if (isset($endpoints['/wp/v2/users'])) {
        unset($endpoints['/wp/v2/users']);
    }
    if (isset($endpoints['/wp/v2/users/(?P<id>[\d]+)'])) {
        unset($endpoints['/wp/v2/users/(?P<id>[\d]+)']);
    }
    return $endpoints;
});
```

## Remove REST API discovery links

```php
// Remove from HTML <head>
remove_action('wp_head', 'rest_output_link_wp_head');
// Remove from HTTP headers
remove_action('template_redirect', 'rest_output_link_header', 11);
```

## Disable file editing and modifications

```php
// Disable theme/plugin editor in admin
define('DISALLOW_FILE_EDIT', true);

// Disable all file modifications (includes updates)
define('DISALLOW_FILE_MODS', true);
```

## Rate limiting

Server-level rate limiting is more effective than PHP-based:

### Nginx
```nginx
limit_req_zone $binary_remote_addr zone=wp_api:10m rate=10r/s;
location /wp-json/ {
    limit_req zone=wp_api burst=20 nodelay;
    # ... rest of config
}
```

### Apache (mod_ratelimit)
```apache
<Location /wp-json/>
    SetOutputFilter RATE_LIMIT
    SetEnv rate-limit 10
</Location>
```

## Verification

```bash
# Test XML-RPC is disabled
curl -X POST https://site.com/xmlrpc.php
# Should return 403 or connection refused

# Test REST API user enumeration
curl https://site.com/wp-json/wp/v2/users
# Should return 401 or 404

# Test author enumeration
curl -s -o /dev/null -w "%{redirect_url}" "https://site.com/?author=1"
# Should redirect to homepage, not author archive
```
