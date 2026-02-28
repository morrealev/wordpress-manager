# Filesystem Hardening

Use this file when securing WordPress file and directory permissions.

## Standard permissions

| Target | Permission | Meaning |
|--------|-----------|---------|
| Files (general) | `644` | Owner read/write, group+others read |
| Directories | `755` | Owner full, group+others read/execute |
| `wp-config.php` | `440` or `400` | Owner read only (most secure) |
| `.htaccess` | `644` | Owner read/write, others read |

Set recursively:
```bash
find /var/www/html -type f -exec chmod 644 {} \;
find /var/www/html -type d -exec chmod 755 {} \;
chmod 440 /var/www/html/wp-config.php
```

## Ownership

The web server user (usually `www-data` on Debian/Ubuntu, `nginx` on RHEL) should own files:

```bash
chown -R www-data:www-data /var/www/html
```

On shared hosting, use your user account and ensure the web server can read files.

## Disable file editing

Add to `wp-config.php` to disable the theme/plugin editor:

```php
define('DISALLOW_FILE_EDIT', true);
```

To also prevent plugin/theme installation and updates via admin:

```php
define('DISALLOW_FILE_MODS', true);
```

## Block PHP execution in uploads

Uploads directory should never execute PHP. Create `wp-content/uploads/.htaccess`:

```apache
# Block PHP execution
<Files *.php>
    deny from all
</Files>
```

For nginx:
```nginx
location ~* /wp-content/uploads/.*\.php$ {
    deny all;
}
```

## Protect sensitive files

In the root `.htaccess`:

```apache
# Protect wp-config.php
<Files wp-config.php>
    order allow,deny
    deny from all
</Files>

# Protect .htaccess itself
<Files .htaccess>
    order allow,deny
    deny from all
</Files>

# Block access to wp-includes
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
    RewriteRule ^wp-admin/includes/ - [F,L]
    RewriteRule !^wp-includes/ - [S=3]
    RewriteRule ^wp-includes/[^/]+\.php$ - [F,L]
    RewriteRule ^wp-includes/js/tinymce/langs/.+\.php - [F,L]
    RewriteRule ^wp-includes/theme-compat/ - [F,L]
</IfModule>
```

## Verification

```bash
# Find files with wrong permissions
find /var/www/html -type f ! -perm 644 -ls
find /var/www/html -type d ! -perm 755 -ls

# Check wp-config permissions
stat -c '%a %n' /var/www/html/wp-config.php

# Verify uploads PHP block
curl -s -o /dev/null -w "%{http_code}" https://site.com/wp-content/uploads/test.php
# Should return 403
```
