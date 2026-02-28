# Authentication Hardening

Use this file when securing the WordPress login process and user sessions.

## Limit login attempts

### Via plugin (recommended)
Install "Limit Login Attempts Reloaded" or "WP Limit Login Attempts" for a ready-made solution.

### Custom implementation

```php
add_action('wp_login_failed', function($username) {
    $ip = $_SERVER['REMOTE_ADDR'];
    $key = 'login_attempts_' . md5($ip);
    $attempts = (int) get_transient($key);
    set_transient($key, $attempts + 1, 15 * MINUTE_IN_SECONDS);
});

add_filter('authenticate', function($user, $username, $password) {
    $ip = $_SERVER['REMOTE_ADDR'];
    $key = 'login_attempts_' . md5($ip);
    $attempts = (int) get_transient($key);
    if ($attempts >= 5) {
        return new WP_Error('too_many_attempts',
            __('Too many login attempts. Please try again in 15 minutes.'));
    }
    return $user;
}, 30, 3);
```

## Two-factor authentication

Recommended plugins:
- **Two Factor** (WordPress.org) — supports TOTP, email, FIDO U2F
- **WP 2FA** — user-friendly with grace periods

Enable for all administrator accounts at minimum.

## Password policies

```php
add_action('user_profile_update_errors', function($errors, $update, $user) {
    if (strlen($user->user_pass) < 12) {
        $errors->add('weak_password', __('Password must be at least 12 characters.'));
    }
}, 10, 3);
```

WordPress 4.3+ includes a password strength meter. Enforce "strong" passwords for privileged roles.

## Session management

List active sessions:
```bash
wp user session list <user_id>
```

Destroy all sessions for a user:
```bash
wp user session destroy <user_id> --all
```

Limit concurrent sessions in PHP:
```php
add_filter('attach_session_information', function($info) {
    $manager = WP_Session_Tokens::get_instance(get_current_user_id());
    $sessions = $manager->get_all();
    if (count($sessions) > 2) {
        $oldest = array_key_first($sessions);
        $manager->destroy($oldest);
    }
    return $info;
});
```

## Application passwords

WordPress 5.6+ includes application passwords for REST API authentication:
- Created in Users → Profile → Application Passwords
- Use Basic Auth: `Authorization: Basic base64(username:app_password)`
- Each app password has its own revocation control
- Better than sharing main credentials

## Block username enumeration

Prevent `?author=1` from revealing usernames:

```php
add_filter('redirect_canonical', function($redirect, $request) {
    if (preg_match('/\?author=\d+/', $request)) {
        return home_url('/');
    }
    return $redirect;
}, 10, 2);
```

Also block via REST API (see `references/api-restriction.md`).

## Login URL considerations

Plugins like "WPS Hide Login" can change the login URL. Trade-offs:
- **Pro**: reduces automated bot traffic to `wp-login.php`
- **Con**: security through obscurity; doesn't stop targeted attacks
- **Verdict**: useful as a supplementary measure, not a primary defense
