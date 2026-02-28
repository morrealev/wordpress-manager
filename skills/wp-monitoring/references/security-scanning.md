# Security Scanning

## Plugin Vulnerability Checks

### WP-CLI Plugin Audit

```bash
# List all plugins with versions
wp plugin list --fields=name,version,status,update_version --format=table

# Check for available updates (potential security fixes)
wp plugin list --update=available --format=table
```

### CVE Database Lookup

For each active plugin, check against known vulnerabilities:

```bash
# Using WPScan API (requires API token)
curl -s "https://wpscan.com/api/v3/plugins/PLUGIN_SLUG" \
  -H "Authorization: Token token=YOUR_API_TOKEN" | jq '.vulnerabilities'

# Using Wordfence vulnerability feed
curl -s "https://www.wordfence.com/api/intelligence/v2/vulnerabilities/production" | \
  jq --arg plugin "PLUGIN_SLUG" '.[] | select(.software[].slug == $plugin)'
```

### Automated Plugin Security Check Script

```bash
#!/bin/bash
# plugin-security-check.sh — Check plugins against known CVEs

SITE_URL="$1"
ALERT_EMAIL="admin@example.com"

# Get list of active plugins via WP-CLI
PLUGINS=$(wp plugin list --status=active --fields=name,version --format=json --url="$SITE_URL")

OUTDATED=$(echo "$PLUGINS" | jq -r '.[] | select(.update_version != null) | "\(.name) \(.version) -> \(.update_version)"')

if [ -n "$OUTDATED" ]; then
  echo "Outdated plugins on $SITE_URL:" > /tmp/security-alert.txt
  echo "$OUTDATED" >> /tmp/security-alert.txt
  mail -s "Security: Outdated Plugins on $SITE_URL" "$ALERT_EMAIL" < /tmp/security-alert.txt
fi
```

## File Integrity Monitoring

### WordPress Core Verification

```bash
# Verify core files against checksums
wp core verify-checksums

# Check for modified core files
wp core verify-checksums 2>&1 | grep -v "Success"
```

### Custom File Hash Baseline

```bash
#!/bin/bash
# file-integrity-baseline.sh — Create/compare file hash baseline

WP_ROOT="$1"
BASELINE_FILE="$WP_ROOT/.file-integrity-baseline.sha256"

if [ "$2" == "--create" ]; then
  # Create baseline
  find "$WP_ROOT" -type f \
    \( -name "*.php" -o -name "*.js" -o -name ".htaccess" \) \
    -not -path "*/wp-content/uploads/*" \
    -not -path "*/wp-content/cache/*" \
    -exec sha256sum {} \; | sort > "$BASELINE_FILE"
  echo "Baseline created: $(wc -l < "$BASELINE_FILE") files"
else
  # Compare against baseline
  CURRENT=$(mktemp)
  find "$WP_ROOT" -type f \
    \( -name "*.php" -o -name "*.js" -o -name ".htaccess" \) \
    -not -path "*/wp-content/uploads/*" \
    -not -path "*/wp-content/cache/*" \
    -exec sha256sum {} \; | sort > "$CURRENT"

  DIFF=$(diff "$BASELINE_FILE" "$CURRENT")
  if [ -n "$DIFF" ]; then
    echo "FILE INTEGRITY ALERT:"
    echo "$DIFF"
  else
    echo "All files match baseline"
  fi
  rm "$CURRENT"
fi
```

## User Account Anomaly Detection

Monitor for suspicious user activity via WP REST Bridge:

1. **New admin accounts** — `list_users` with `roles: "administrator"`, compare count with baseline
2. **Unknown accounts** — Compare user list with known/approved users
3. **Role escalation** — Track user roles over time, alert on changes

### Check Script

```bash
# Count administrators
wp user list --role=administrator --format=count

# List all admins with last login (if tracked)
wp user list --role=administrator --fields=ID,user_login,user_email,user_registered --format=table
```

## Malware Scanning

### WP-CLI Based Scan

```bash
# Search for common malware patterns in PHP files
grep -rn "eval(base64_decode\|eval(gzinflate\|eval(str_rot13\|preg_replace.*e'" \
  --include="*.php" /path/to/wordpress/

# Check for suspicious files in uploads
find /path/to/wordpress/wp-content/uploads -name "*.php" -type f

# Check for hidden files
find /path/to/wordpress -name ".*" -type f -not -name ".htaccess" -not -name ".maintenance"
```

### Core File Comparison

```bash
# Download fresh WordPress and compare
wp core download --path=/tmp/fresh-wp --version=$(wp core version) --skip-content
diff -rq /path/to/wordpress/wp-includes /tmp/fresh-wp/wp-includes | grep "differ"
diff -rq /path/to/wordpress/wp-admin /tmp/fresh-wp/wp-admin | grep "differ"
rm -rf /tmp/fresh-wp
```

## WordPress Core Version Tracking

```bash
# Current version
wp core version

# Check for updates
wp core check-update --format=json
```

Alert thresholds:
- **Info**: Minor update available (e.g., 6.4.1 → 6.4.2)
- **Warning**: Major update available (e.g., 6.4 → 6.5)
- **Critical**: Security release available (check release notes)

## Scanning Schedule

| Scan Type | Frequency | Method |
|-----------|-----------|--------|
| Plugin update check | Daily | WP-CLI / WP REST Bridge |
| Core verify checksums | Weekly | WP-CLI |
| File integrity check | Daily | Hash comparison script |
| Admin user audit | Weekly | WP REST Bridge list_users |
| Malware scan | Weekly | grep patterns + file check |
| Core version check | Daily | WP-CLI |
| Full vulnerability scan | Monthly | WPScan API or Wordfence |
