# Headless Authentication

Use this file when implementing authentication for decoupled WordPress frontends.

## Authentication methods comparison

| Method | Use case | Security | Complexity |
|--------|----------|----------|-----------|
| Application Passwords | Server-to-server, CI/CD | Good | Low |
| JWT (plugin) | SPA authentication | Good | Medium |
| Cookie-based (same domain) | Subdomain frontends | Good | Low |
| OAuth 2.0 | Third-party apps | Best | High |
| Nonce + Cookie | Same-origin AJAX | Good | Low (but not for headless) |

## Application Passwords (WordPress 5.6+)

Best for: server-side requests, build-time data fetching, CI/CD pipelines.

### Setup

Users → Profile → Application Passwords → Add New

### Usage

```bash
# Basic Auth with application password
curl -u "username:xxxx xxxx xxxx xxxx xxxx xxxx" \
  https://site.com/wp-json/wp/v2/posts

# Base64 encoded
curl -H "Authorization: Basic $(echo -n 'username:xxxx xxxx xxxx xxxx' | base64)" \
  https://site.com/wp-json/wp/v2/posts
```

### In Next.js (server-side)

```js
// lib/wordpress.js
const WP_URL = process.env.WORDPRESS_URL;
const WP_AUTH = Buffer.from(
    `${process.env.WP_USER}:${process.env.WP_APP_PASSWORD}`
).toString('base64');

export async function fetchWP(endpoint, options = {}) {
    const res = await fetch(`${WP_URL}/wp-json/wp/v2/${endpoint}`, {
        ...options,
        headers: {
            'Authorization': `Basic ${WP_AUTH}`,
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });
    if (!res.ok) throw new Error(`WP API error: ${res.status}`);
    return res.json();
}
```

### Restrict application passwords

```php
// Only allow application passwords for specific roles
add_filter('wp_is_application_passwords_available_for_user', function($available, $user) {
    return in_array('administrator', $user->roles);
}, 10, 2);
```

## JWT Authentication

Best for: SPA (React/Vue) with user login, client-side authenticated requests.

### Plugin setup

```bash
wp plugin install jwt-authentication-for-wp-rest-api --activate
```

Add to `wp-config.php`:
```php
define('JWT_AUTH_SECRET_KEY', 'your-secret-key-at-least-32-chars-long');
define('JWT_AUTH_CORS_ENABLE', true);
```

Add to `.htaccess`:
```apache
RewriteEngine On
RewriteCond %{HTTP:Authorization} ^(.*)
RewriteRule .* - [E=HTTP_AUTHORIZATION:%1]
```

### Token flow

```js
// 1. Get token
const loginRes = await fetch('https://site.com/wp-json/jwt-auth/v1/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        username: 'user@example.com',
        password: 'password',
    }),
});
const { token, user_display_name } = await loginRes.json();

// 2. Use token for authenticated requests
const postsRes = await fetch('https://site.com/wp-json/wp/v2/posts', {
    headers: {
        'Authorization': `Bearer ${token}`,
    },
});

// 3. Validate token (optional)
const validateRes = await fetch('https://site.com/wp-json/jwt-auth/v1/token/validate', {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${token}`,
    },
});
```

### Token storage (frontend)

```js
// Store in httpOnly cookie (recommended for SSR frameworks)
// Set via API route, not client-side JavaScript

// For SPAs: store in memory (most secure for client-side)
let authToken = null;

function setToken(token) {
    authToken = token; // Lost on page refresh — that's OK for security
}

function getToken() {
    return authToken;
}

// AVOID: localStorage (XSS vulnerable)
// localStorage.setItem('token', token); // DON'T DO THIS
```

### Refresh token pattern

```js
class AuthManager {
    constructor() {
        this.token = null;
        this.refreshToken = null;
    }

    async login(username, password) {
        const res = await fetch('/wp-json/jwt-auth/v1/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });
        const data = await res.json();
        this.token = data.token;
        return data;
    }

    async authenticatedFetch(url, options = {}) {
        let res = await fetch(url, {
            ...options,
            headers: {
                ...options.headers,
                'Authorization': `Bearer ${this.token}`,
            },
        });

        // Token expired — re-authenticate
        if (res.status === 403) {
            // Redirect to login or use refresh token
            throw new Error('Session expired. Please log in again.');
        }

        return res;
    }
}
```

## WPGraphQL authentication

```graphql
# Login mutation (with wp-graphql-jwt-authentication plugin)
mutation Login($username: String!, $password: String!) {
  login(input: { username: $username, password: $password }) {
    authToken
    refreshToken
    user {
      id
      name
      email
    }
  }
}

# Refresh token
mutation RefreshToken($token: String!) {
  refreshJwtAuthToken(input: { jwtRefreshToken: $token }) {
    authToken
  }
}
```

## Next.js authentication pattern

### API route for login

```js
// pages/api/login.js (Next.js)
export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();

    const { username, password } = req.body;

    const wpRes = await fetch(`${process.env.WP_URL}/wp-json/jwt-auth/v1/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
    });

    if (!wpRes.ok) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    const { token } = await wpRes.json();

    // Set httpOnly cookie (not accessible via JavaScript)
    res.setHeader('Set-Cookie', [
        `wp_token=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=86400`,
    ]);

    return res.status(200).json({ success: true });
}
```

### Middleware for protected routes

```js
// middleware.js (Next.js)
import { NextResponse } from 'next/server';

export function middleware(request) {
    const token = request.cookies.get('wp_token')?.value;

    if (!token && request.nextUrl.pathname.startsWith('/dashboard')) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/dashboard/:path*', '/profile/:path*'],
};
```

## Security checklist

- [ ] Never store JWT in localStorage (XSS risk)
- [ ] Use httpOnly cookies for token storage when possible
- [ ] Set short token expiry (15 min) with refresh tokens
- [ ] Use HTTPS for all API requests
- [ ] Validate tokens server-side on every request
- [ ] Implement CORS properly (see `cors-config.md`)
- [ ] Rate-limit login endpoints
- [ ] Use strong JWT secret key (32+ characters)
- [ ] Disable XML-RPC if not needed

## Verification

```bash
# Test application password
curl -u "admin:xxxx xxxx xxxx xxxx" https://site.com/wp-json/wp/v2/users/me

# Test JWT token
TOKEN=$(curl -s -X POST https://site.com/wp-json/jwt-auth/v1/token \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}' | jq -r '.token')

curl -H "Authorization: Bearer $TOKEN" https://site.com/wp-json/wp/v2/users/me

# Verify unauthenticated access is blocked
curl -s -o /dev/null -w "%{http_code}" https://site.com/wp-json/wp/v2/users
# Should return 401 if REST API is restricted
```
