---
name: wp-backup
description: This skill should be used when the user asks to "backup my site", "create
  a backup", "restore my site", "disaster recovery", "snapshot", or mentions any form
  of WordPress backup or restore operation. Provides backup strategies for different
  hosting environments.
version: 1.0.0
---

# WordPress Backup & Recovery Skill

## Overview

Provides comprehensive backup and disaster recovery workflows for WordPress sites. Supports Hostinger-managed backups, SSH-based backups, and content-only exports via API.

## When to Use

- User wants to create a site backup
- User needs to restore from a backup
- Before major operations (deploy, migrate, update, plugin changes)
- User asks about disaster recovery planning
- Scheduled backup strategy setup

## Backup Method Decision Tree

1. **What hosting type?**
   - Hostinger VPS → VPS snapshot + file/DB backup
   - Hostinger shared → File/DB backup via SSH
   - Other hosting with SSH → SSH-based backup
   - No SSH access → Content-only export via API

2. **What scope?**
   - Full site (files + database) → Recommended for disaster recovery
   - Database only → For content/settings backup
   - Content only (via API) → For content portability
   - wp-content only → For themes/plugins/uploads

## Backup Workflow

### Full Site Backup (SSH)
1. Connect via SSH to the server
2. Export database: `mysqldump`
3. Archive wp-content: `tar -czf`
4. Optionally archive full WordPress root
5. Download backup files
6. Verify backup integrity (check file sizes, test extraction)
7. Store in a safe location

### Content-Only Backup (API)
1. Use `list_content` to enumerate all content types
2. Export posts, pages, custom content as JSON
3. Export taxonomies (categories, tags)
4. Export media metadata (and optionally download files)
5. Store as structured JSON backup

### Pre-Operation Backup
Before any risky operation (deploy, update, migration):
1. Quick database backup via SSH
2. Note current plugin versions via `list_plugins`
3. Document current site state
4. Proceed with operation only after backup confirmed

## Restore Workflow

1. **Confirm with user**: Restore overwrites current state
2. **Verify backup**: Check backup files are complete and valid
3. **Choose method**:
   - Hostinger: `hosting_importWordpressWebsite` with archive + SQL
   - SSH: Upload files + import database
   - API: Re-create content via `create_content`
4. **Execute restore**
5. **Verify**: Check site loads, content intact, plugins working
6. **Clear caches**: Flush all caching layers

## Safety Rules

- ALWAYS confirm with user before restoring (destructive operation)
- NEVER delete old backups until new backup is verified
- Keep minimum 3 rolling backups when possible
- Test restore procedure periodically (don't just create backups)
- Store backups off-site (not only on the same server)

## Additional Resources

### Reference Files
- **`references/backup-strategies.md`** - Detailed backup methods and automation
- **`references/restore-procedures.md`** - Step-by-step restore procedures
- For WooCommerce database backup, see `wp-woocommerce` skill
