# Hostinger Migration Reference

## Using hosting_importWordpressWebsite

The Hostinger MCP provides `hosting_importWordpressWebsite` for full site imports.

### Input Requirements
- **Archive file**: zip or tar.gz containing WordPress files
- **SQL dump**: Database backup file

### Preparation

#### 1. Export Database from Source
```bash
# Via SSH on source server
mysqldump -u [db_user] -p [db_name] > /tmp/site-backup.sql

# Or via wp-cli
wp db export /tmp/site-backup.sql
```

#### 2. Package WordPress Files
```bash
# From WordPress root directory
tar -czf /tmp/wp-files.tar.gz -C /path/to/wordpress .

# Or selective (wp-content only, faster)
tar -czf /tmp/wp-content.tar.gz -C /path/to/wordpress/wp-content .
```

#### 3. Import to Hostinger
Use `hosting_importWordpressWebsite` with:
- The archive file path
- The SQL dump file path

**WARNING**: This overwrites the existing WordPress installation on the destination.

## Post-Import Steps

### URL Search and Replace
After migration, update URLs in the database:

```bash
# Via wp-cli on Hostinger (SSH)
wp search-replace 'https://old-domain.com' 'https://new-domain.com' --all-tables

# Or using a plugin: Better Search Replace
```

### File Permissions
Hostinger standard permissions:
```
Directories: 755
Files: 644
wp-config.php: 440
```

```bash
# Fix permissions via SSH
find /home/[user]/htdocs/[domain]/ -type d -exec chmod 755 {} \;
find /home/[user]/htdocs/[domain]/ -type f -exec chmod 644 {} \;
chmod 440 /home/[user]/htdocs/[domain]/wp-config.php
```

### DNS Configuration
After import, update DNS to point to Hostinger:
1. Get Hostinger's IP via `hosting_listWebsites`
2. Update A record via `DNS_updateDNSRecordsV1`
3. Verify with `DNS_validateDNSRecordsV1`

## Hostinger-Specific Paths

```
Web root:   /home/[username]/htdocs/[domain]/
Plugins:    /home/[username]/htdocs/[domain]/wp-content/plugins/
Themes:     /home/[username]/htdocs/[domain]/wp-content/themes/
Uploads:    /home/[username]/htdocs/[domain]/wp-content/uploads/
wp-config:  /home/[username]/htdocs/[domain]/wp-config.php
```

## Rollback

If migration fails:
1. The original source site should still be intact (never delete source first)
2. On Hostinger, re-import from a pre-migration backup
3. Revert DNS changes if domain was already pointed to new host
