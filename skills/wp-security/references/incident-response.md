# Incident Response

Use this file when responding to a suspected or confirmed WordPress site compromise.

## Signs of compromise

- Unknown admin user accounts appeared
- Core files modified (checksums don't match)
- Suspicious cron jobs in `wp_options` → `cron` entry
- SEO spam injected into posts or pages
- Visitors redirected to malicious sites
- Google Search Console security warnings
- Hosting provider notifications about malware
- Unexpected file changes (new `.php` files in uploads, modified theme files)
- Unexplained outgoing network traffic
- Database entries with encoded/obfuscated content

## Phase 1: Containment (immediate)

1. **Change all passwords** — WordPress admin, database, FTP/SSH, hosting panel:
   ```bash
   wp user update admin --user_pass=NEW_STRONG_PASSWORD
   ```

2. **Revoke all sessions** — force all users to re-authenticate:
   ```bash
   wp user session destroy --all
   ```

3. **Regenerate security keys** — invalidates all existing cookies:
   ```bash
   wp config shuffle-salts
   ```

4. **Enable maintenance mode** (if the site is actively harmful):
   ```bash
   wp maintenance-mode activate
   ```

5. **Revoke application passwords**:
   ```bash
   wp user application-password delete admin --all
   ```

## Phase 2: Investigation

1. **Verify core file integrity**:
   ```bash
   wp core verify-checksums
   ```

2. **Find recently modified files**:
   ```bash
   find /var/www/html -type f -mtime -7 -name "*.php" -ls
   ```

3. **Search for common malware signatures**:
   ```bash
   grep -rl "eval(base64_decode" /var/www/html/
   grep -rl "eval(gzinflate" /var/www/html/
   grep -rl "preg_replace.*e'" /var/www/html/
   grep -rl "assert(" /var/www/html/wp-content/
   ```

4. **Check cron jobs for suspicious entries**:
   ```bash
   wp cron event list
   ```

5. **Review access logs** for the attack timeline:
   ```bash
   grep "POST" /var/log/apache2/access.log | grep -E "(wp-login|xmlrpc|admin-ajax)" | tail -100
   ```

6. **Check for unknown admin users**:
   ```bash
   wp user list --role=administrator --fields=ID,user_login,user_email,user_registered
   ```

## Phase 3: Remediation

1. **Remove malicious code** identified in investigation:
   ```bash
   # Delete unknown files in uploads
   find /var/www/html/wp-content/uploads -name "*.php" -delete
   ```

2. **Reinstall WordPress core**:
   ```bash
   wp core download --force --skip-content
   ```

3. **Update all plugins and themes**:
   ```bash
   wp plugin update --all
   wp theme update --all
   ```

4. **Remove inactive plugins and themes**:
   ```bash
   wp plugin delete $(wp plugin list --status=inactive --field=name)
   wp theme delete $(wp theme list --status=inactive --field=name)
   ```

5. **Review database** for injected content:
   ```bash
   wp db search "<script" --regex
   wp db search "eval(" --regex
   ```

6. **Check `.htaccess`** for malicious redirects — compare against WordPress default.

## Phase 4: Recovery

If a clean backup exists and is more reliable than manual cleanup:

```bash
# Restore from backup
wp db import clean-backup.sql
# Then re-apply only the security hardening steps
```

Post-recovery hardening:
1. Apply all steps from `filesystem-hardening.md`
2. Apply all steps from `wp-config-security.md`
3. Install a security monitoring plugin (Wordfence, Sucuri)
4. Set up file integrity monitoring

## Phase 5: Post-incident

1. **Document the timeline** — when the breach occurred, when detected, actions taken
2. **Identify the attack vector** — vulnerable plugin, weak password, unpatched core
3. **Update security procedures** — add the missing controls that allowed the breach
4. **Notify affected users** if personal data was exposed (GDPR, state laws may require this)
5. **Request Google review** if the site was flagged in Search Console
6. **Monitor** for re-infection over the following 30 days

## When to engage professionals

- Malware persists after cleanup (re-infection)
- Database contains encrypted/obfuscated payloads you can't decode
- Hosting provider requires professional remediation report
- Legal obligations require forensic analysis
- Site handles payments or sensitive personal data
