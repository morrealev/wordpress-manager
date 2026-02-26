# WordPress Restore Procedures

## Full Site Restore via Hostinger MCP

### Using hosting_importWordpressWebsite

**Prerequisites:**
- Archive containing WordPress files (zip or tar.gz)
- SQL database dump file

**Process:**
1. Use `hosting_importWordpressWebsite` with the archive and SQL file
2. Wait for import to complete
3. Verify site loads correctly
4. Clear all caches
5. Verify SSL certificate is still valid

**WARNING:** This operation OVERWRITES the current WordPress installation.

## Full Site Restore via SSH

### Step 1: Restore Database
```bash
# Uncompress if gzipped
ssh user@host 'gunzip /tmp/db-backup.sql.gz'

# Import database
ssh user@host 'mysql -u [db_user] -p[db_pass] [db_name] < /tmp/db-backup.sql'

# Or with wp-cli
ssh user@host 'cd /path/to/wordpress && wp db import /tmp/db-backup.sql'
```

### Step 2: Restore Files
```bash
# Upload backup
scp ./backups/wp-content.tar.gz user@host:/tmp/

# Backup current files (safety net)
ssh user@host 'mv /path/to/wordpress/wp-content /path/to/wordpress/wp-content.pre-restore'

# Extract backup
ssh user@host 'mkdir -p /path/to/wordpress/wp-content && tar -xzf /tmp/wp-content.tar.gz -C /path/to/wordpress/wp-content'

# Fix permissions
ssh user@host 'chmod -R 755 /path/to/wordpress/wp-content'
```

### Step 3: Post-Restore Verification
```bash
# Check site is accessible
curl -s -o /dev/null -w "%{http_code}" https://site-url.com

# Check for PHP errors
ssh user@host 'tail -20 /path/to/wordpress/wp-content/debug.log 2>/dev/null'
```

## Content-Only Restore via API

For API-based content recovery (when no file/DB backup available):

### Restore Posts
```
For each backed-up post:
1. create_content with content_type, title, content, excerpt, slug, status
2. assign_terms_to_content for categories and tags
3. Re-upload media if needed
```

### Restore Taxonomies
```
For each taxonomy:
1. create_term with taxonomy, name, slug, description
2. Rebuild parent-child hierarchy
```

## Partial Restore Scenarios

### Restore Single Plugin
```bash
# Upload the specific plugin
scp -r ./backups/plugins/plugin-name user@host:/tmp/
ssh user@host 'rm -rf /path/to/wp-content/plugins/plugin-name'
ssh user@host 'mv /tmp/plugin-name /path/to/wp-content/plugins/'
ssh user@host 'chmod -R 755 /path/to/wp-content/plugins/plugin-name'
```

### Restore Theme
```bash
# Same pattern as plugin but for themes directory
scp -r ./backups/themes/theme-name user@host:/tmp/
ssh user@host 'rm -rf /path/to/wp-content/themes/theme-name'
ssh user@host 'mv /tmp/theme-name /path/to/wp-content/themes/'
ssh user@host 'chmod -R 755 /path/to/wp-content/themes/theme-name'
```

### Restore Database Only (rollback content changes)
```bash
# Create current snapshot first
ssh user@host 'mysqldump -u [user] -p[pass] [db] > /tmp/pre-rollback.sql'

# Import backup database
ssh user@host 'mysql -u [user] -p[pass] [db] < /tmp/db-backup.sql'

# Verify
curl -s -o /dev/null -w "%{http_code}" https://site-url.com
```

## Troubleshooting After Restore

### White Screen of Death
- Check debug.log: `ssh user@host 'tail -50 /path/to/wp-content/debug.log'`
- Enable debug: Set `WP_DEBUG = true` in wp-config.php
- Common cause: Plugin incompatibility → rename plugins folder to deactivate all

### Database Connection Error
- Verify wp-config.php has correct DB credentials
- Check DB server is running
- Verify DB user has proper permissions

### Missing Media Files
- Check uploads directory permissions
- Verify media files were included in the backup
- Re-import media if needed

### Wrong URLs After Restore
- Run search-replace for old URL to new URL
- Clear all caches (page cache, object cache, CDN)
- Verify .htaccess is correct
