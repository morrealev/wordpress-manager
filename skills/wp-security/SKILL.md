---
name: wp-security
description: "Use when hardening WordPress security: filesystem permissions, HTTP security headers, authentication hardening, REST/XML-RPC API restriction, user capabilities audit, wp-config security constants, and incident response procedures."
compatibility: "Targets WordPress 6.9+ (PHP 7.2.24+). Filesystem-based agent with bash + node. Some workflows require WP-CLI and SSH access."
version: 1.0.0
source: "vinmor/wordpress-manager"
---

# WP Security

## When to use

Use this skill for security hardening and incident response:

- Hardening a WordPress installation against common attack vectors
- Fixing security vulnerabilities found in an audit or scan
- Responding to a suspected or confirmed site compromise
- Configuring HTTP security headers (CSP, HSTS, X-Frame-Options)
- Restricting REST API and XML-RPC exposure
- Auditing user accounts, roles, and capabilities
- Securing `wp-config.php` constants and secrets
- Implementing login protection (brute-force, 2FA)

## Inputs required

- **Site access**: SSH/SFTP credentials, WP-CLI availability, or hosting panel
- **Hosting type**: shared, VPS, managed WordPress, or cloud
- **Current security posture**: output from `wp-audit` skill or `security_inspect.mjs`
- **Specific threat or vulnerability**: CVE, audit finding, or incident description

## Procedure

### 0) Security inspection

Run the detection script to assess the current security posture:

```bash
node skills/wp-security/scripts/security_inspect.mjs --cwd=/path/to/wordpress
```

The script outputs JSON with:
- `wpConfig` — security-related constants and their values
- `filesystem` — file permissions and exposed sensitive files
- `apiExposure` — XML-RPC and REST API exposure
- `headers` — security headers found in `.htaccess`
- `riskLevel` — overall risk assessment (low/medium/high/critical)
- `findings[]` — specific issues with severity and recommended fixes

Address findings in priority order: critical → high → medium → low.

For a comprehensive initial assessment, run the `wp-audit` skill first. This skill focuses on **remediation** — the procedures to fix issues found during an audit.

### 1) Filesystem hardening

Set correct file permissions, prevent unauthorized file modification, and block PHP execution in upload directories.

Key actions:
- Files: `644`, Directories: `755`, wp-config.php: `440` or `400`
- Add `DISALLOW_FILE_EDIT` to wp-config.php to disable the theme/plugin editor
- Add `DISALLOW_FILE_MODS` to prevent all file modifications including updates
- Block PHP execution in `wp-content/uploads/` via `.htaccess` or nginx rules
- Protect `wp-config.php` and `.htaccess` from direct access

Read: `references/filesystem-hardening.md`

### 2) HTTP security headers

Configure security headers to prevent clickjacking, XSS, MIME sniffing, and other browser-level attacks.

Key headers:
- `Content-Security-Policy` — control which resources the browser can load
- `X-Frame-Options: SAMEORIGIN` — prevent clickjacking (WordPress sends this by default)
- `X-Content-Type-Options: nosniff` — prevent MIME type sniffing
- `Strict-Transport-Security` — enforce HTTPS connections
- `Permissions-Policy` — restrict browser feature access
- `Referrer-Policy: strict-origin-when-cross-origin` — control referrer information

Implementation methods: `.htaccess` (Apache), `nginx.conf`, or PHP via `send_headers` action.

Read: `references/http-headers.md`

### 3) Authentication hardening

Protect the login process against brute-force attacks, credential stuffing, and session hijacking.

Key actions:
- Limit failed login attempts (plugins: Limit Login Attempts Reloaded, or custom `wp_login_failed` hook)
- Enable two-factor authentication (plugins: Two Factor, WP 2FA)
- Enforce strong password policies via `user_profile_update_errors` filter
- Configure session idle timeout and concurrent session limits
- Use application passwords for REST API access instead of sharing main credentials
- Block username enumeration via `?author=N` redirects

Read: `references/authentication-hardening.md`

### 4) API restriction

Reduce the attack surface by restricting or disabling unnecessary API endpoints.

Key actions:
- Disable XML-RPC: `add_filter('xmlrpc_enabled', '__return_false')` plus `.htaccess` block
- Restrict REST API to authenticated users via `rest_authentication_errors` filter
- Block user enumeration via `/wp-json/wp/v2/users` endpoint
- Remove REST API discovery link from HTML `<head>`
- Rate-limit API endpoints at the server level

Read: `references/api-restriction.md`

### 5) User capabilities audit

Review and tighten user accounts and permissions following the principle of least privilege.

Key actions:
- Audit all administrator accounts (should be 1-2 maximum)
- Remove or downgrade dormant accounts (inactive > 90 days)
- Verify no accounts use weak usernames ("admin", "test", "user")
- Review custom capabilities and remove unnecessary elevated permissions
- Use WP-CLI for bulk auditing: `wp user list --role=administrator`

Read: `references/user-capabilities.md`

### 6) wp-config.php security constants

Secure WordPress configuration with appropriate constants and settings.

Key actions:
- Regenerate security keys and salts (use https://api.wordpress.org/secret-key/1.1/salt/)
- Change the default table prefix from `wp_` (for new installations)
- Set `WP_DEBUG` to `false` in production; disable `WP_DEBUG_LOG` and `WP_DEBUG_DISPLAY`
- Enable `FORCE_SSL_ADMIN` for encrypted admin connections
- Configure `WP_AUTO_UPDATE_CORE` for automatic security updates
- Move `wp-config.php` one directory above the web root if hosting allows

Read: `references/wp-config-security.md`

### 7) Incident response

If the site is suspected or confirmed to be compromised, follow a structured response process.

Phases:
1. **Containment** — change all passwords, revoke sessions, enable maintenance mode
2. **Investigation** — verify core checksums (`wp core verify-checksums`), scan for malware, review access logs, check recently modified files
3. **Remediation** — remove malicious code, update all components, reinstall WordPress core, review database for injected content
4. **Recovery** — restore from clean backup if available, re-harden the site
5. **Post-incident** — document the timeline, update security procedures, notify affected users if data was exposed

Read: `references/incident-response.md`

## Verification

After hardening, verify the security posture:

- Re-run `security_inspect.mjs` and confirm all critical/high findings are resolved
- Test security headers with https://securityheaders.com
- Verify file permissions: `find . -type f ! -perm 644` and `find . -type d ! -perm 755`
- Confirm XML-RPC is disabled: `curl -X POST https://site.com/xmlrpc.php` returns 403 or empty
- Confirm REST API user enumeration is blocked
- Test login rate limiting by attempting multiple failed logins
- Verify `wp-config.php` is not accessible via browser

## Failure modes / debugging

- **Headers not applying**: check `.htaccess` is being read (Apache `AllowOverride All`), or nginx config is included and reloaded
- **CSP breaking admin UI**: WordPress admin requires `unsafe-inline` and `unsafe-eval` for scripts; use a relaxed policy for `/wp-admin/` and a strict one for the frontend
- **Login lockout**: if rate limiting locks out the admin, access via WP-CLI (`wp user update admin --user_pass=newpassword`) or directly in the database
- **REST API restriction breaks plugins**: some plugins (Jetpack, WooCommerce) require public REST API access; whitelist specific namespaces
- **File permission errors after hardening**: ensure the web server user owns the files; use `chown -R www-data:www-data /path/to/wp`

## Escalation

- For sites actively under attack: involve the hosting provider's security team
- For data breaches: follow legal notification requirements (GDPR, state laws)
- For persistent malware: engage a professional WordPress security service (Sucuri, Wordfence)
- For complex hosting configurations: consult the server administrator
- For initial security assessment, use the `wp-audit` skill which provides checklists and scoring
