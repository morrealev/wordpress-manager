# wp-config.php Security Constants

Use this file when securing WordPress configuration via `wp-config.php` constants.

## Security keys and salts

WordPress uses 8 security keys for cookie signing and nonce generation. Regenerate them if compromised:

```php
// Generate fresh keys at: https://api.wordpress.org/secret-key/1.1/salt/
define('AUTH_KEY',         'unique-random-string');
define('SECURE_AUTH_KEY',  'unique-random-string');
define('LOGGED_IN_KEY',    'unique-random-string');
define('NONCE_KEY',        'unique-random-string');
define('AUTH_SALT',        'unique-random-string');
define('SECURE_AUTH_SALT', 'unique-random-string');
define('LOGGED_IN_SALT',   'unique-random-string');
define('NONCE_SALT',       'unique-random-string');
```

**Check for defaults**: if any key contains `put your unique phrase here`, it must be replaced immediately.

Via WP-CLI:
```bash
wp config shuffle-salts
```

## Database table prefix

Default `wp_` prefix is widely known. Change for new installations:

```php
$table_prefix = 'wp8x_'; // Custom prefix
```

**Warning**: changing the prefix on an existing site requires renaming all database tables and updating `usermeta` and `options` entries.

## Debug settings

Production:
```php
define('WP_DEBUG', false);
define('WP_DEBUG_LOG', false);
define('WP_DEBUG_DISPLAY', false);
```

Development only:
```php
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);    // Logs to wp-content/debug.log
define('WP_DEBUG_DISPLAY', false); // Don't show errors to visitors
define('SCRIPT_DEBUG', true);     // Use unminified core scripts
```

**Risk**: `WP_DEBUG_DISPLAY true` in production exposes file paths and error details to attackers.

## Force SSL for admin

```php
define('FORCE_SSL_ADMIN', true);
```

Ensures all admin and login pages use HTTPS.

## Auto-update configuration

```php
// Enable automatic updates for minor releases (security patches)
define('WP_AUTO_UPDATE_CORE', 'minor');

// Or enable all automatic updates
define('WP_AUTO_UPDATE_CORE', true);

// Disable all automatic updates (manage manually)
define('WP_AUTO_UPDATE_CORE', false);
```

Recommended: at least `'minor'` for security patches.

## File modification controls

```php
// Disable theme/plugin editor in admin
define('DISALLOW_FILE_EDIT', true);

// Disable all file modifications (blocks installs, updates, editor)
define('DISALLOW_FILE_MODS', true);
```

## Move wp-config above web root

If your hosting allows it, move `wp-config.php` one directory above the web root:

```
/home/user/wp-config.php      ← Here (not web-accessible)
/home/user/public_html/        ← Web root
/home/user/public_html/wp-admin/
/home/user/public_html/wp-content/
```

WordPress automatically checks the parent directory for `wp-config.php`.

## Multisite security

```php
// Prevent administrators from using unfiltered HTML (important for multisite)
define('DISALLOW_UNFILTERED_HTML', true);
```

## Database credentials

Ensure database credentials in `wp-config.php` use a dedicated WordPress user with only the required privileges:

```sql
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, DROP, INDEX, ALTER
ON wordpress_db.* TO 'wp_user'@'localhost' IDENTIFIED BY 'strong_password';
```

Never use the `root` MySQL user for WordPress.

## Verification

```bash
# Check key constants via WP-CLI
wp config get WP_DEBUG
wp config get DISALLOW_FILE_EDIT
wp config get FORCE_SSL_ADMIN
wp config get table_prefix
```
