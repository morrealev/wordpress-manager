# WordPress Backup Strategies

## Full Site Backup via SSH

### Database Export
```bash
# Standard mysqldump
ssh user@host 'mysqldump -u [db_user] -p[db_pass] [db_name] > /tmp/db-backup-$(date +%Y%m%d).sql'

# Compressed
ssh user@host 'mysqldump -u [db_user] -p[db_pass] [db_name] | gzip > /tmp/db-backup-$(date +%Y%m%d).sql.gz'

# Using wp-cli (if available)
ssh user@host 'cd /path/to/wordpress && wp db export /tmp/db-backup-$(date +%Y%m%d).sql'
```

### File Backup
```bash
# Full WordPress backup
ssh user@host 'tar -czf /tmp/wp-full-$(date +%Y%m%d).tar.gz -C /path/to/wordpress .'

# wp-content only (faster, smaller)
ssh user@host 'tar -czf /tmp/wp-content-$(date +%Y%m%d).tar.gz -C /path/to/wordpress/wp-content .'

# Uploads only (media files)
ssh user@host 'tar -czf /tmp/uploads-$(date +%Y%m%d).tar.gz -C /path/to/wordpress/wp-content/uploads .'
```

### Download to Local
```bash
# Download backup files
scp user@host:/tmp/db-backup-*.sql.gz ./backups/
scp user@host:/tmp/wp-content-*.tar.gz ./backups/

# Clean up server-side temp files
ssh user@host 'rm /tmp/db-backup-*.sql.gz /tmp/wp-content-*.tar.gz'
```

## Hostinger-Specific Paths

```bash
# Database credentials from wp-config.php
ssh user@host "grep -E 'DB_(NAME|USER|PASSWORD|HOST)' /home/[user]/htdocs/[domain]/wp-config.php"

# Typical Hostinger paths
WP_ROOT="/home/[username]/htdocs/[domain]"
WP_CONTENT="$WP_ROOT/wp-content"
```

## Backup Retention Strategy

### Recommended Schedule
| Type | Frequency | Retention | Method |
|------|-----------|-----------|--------|
| Database | Daily | 7 days | Automated cron + mysqldump |
| Files | Weekly | 4 weeks | tar + cron |
| Full site | Monthly | 3 months | Full archive |
| Pre-deploy | Before each deploy | Until next deploy verified | Manual |

### Storage Locations
1. **On-server**: Quick restore, but lost if server fails
2. **Off-server**: Download via SCP to local or cloud storage
3. **Cloud storage**: S3, Google Cloud Storage, Backblaze B2
4. **Multiple locations**: Best practice — keep at least 2 copies in different locations

## Backup Verification

After creating a backup, always verify:

1. **File size check**: Backup should be non-zero and reasonable size
   ```bash
   ls -lh /tmp/db-backup-*.sql.gz  # DB should be at least a few MB
   ls -lh /tmp/wp-content-*.tar.gz  # Content varies, usually 100MB+
   ```

2. **Integrity check**: Test extraction
   ```bash
   # Test tar archive
   tar -tzf backup.tar.gz > /dev/null && echo "Archive OK"

   # Test SQL file (check first/last lines)
   zcat backup.sql.gz | head -5
   zcat backup.sql.gz | tail -5
   ```

3. **Restore test** (periodic): Restore to a staging environment to verify full recoverability.

## Automated Backup Script

```bash
#!/bin/bash
# wp-backup.sh — automated WordPress backup
# Usage: ./wp-backup.sh user@host /path/to/wordpress

SSH_TARGET=$1
WP_PATH=$2
DATE=$(date +%Y%m%d_%H%M)
BACKUP_DIR="./backups/$DATE"

mkdir -p "$BACKUP_DIR"

# Get DB credentials
DB_NAME=$(ssh $SSH_TARGET "grep DB_NAME $WP_PATH/wp-config.php | cut -d \"'\" -f4")
DB_USER=$(ssh $SSH_TARGET "grep DB_USER $WP_PATH/wp-config.php | cut -d \"'\" -f4")
DB_PASS=$(ssh $SSH_TARGET "grep DB_PASSWORD $WP_PATH/wp-config.php | cut -d \"'\" -f4")

# Database backup
ssh $SSH_TARGET "mysqldump -u $DB_USER -p'$DB_PASS' $DB_NAME | gzip" > "$BACKUP_DIR/database.sql.gz"

# Files backup
ssh $SSH_TARGET "tar -czf - -C $WP_PATH/wp-content ." > "$BACKUP_DIR/wp-content.tar.gz"

# Verify
echo "Backup created in $BACKUP_DIR"
ls -lh "$BACKUP_DIR/"
```
