---
name: wp-backup
description: Create, list, or restore WordPress site backups. Supports Hostinger and SSH-based backup strategies.
---

# WordPress Backup Management

Manage backups for your WordPress sites — create, verify, and restore.

## Usage

- `/wordpress-manager:wp-backup create` — Create a backup of the active site
- `/wordpress-manager:wp-backup create on <site>` — Backup a specific site
- `/wordpress-manager:wp-backup list` — List available backups
- `/wordpress-manager:wp-backup restore <backup-id>` — Restore from a backup

## Process

### Create Backup
1. **Identify site**: Confirm active site or parse target site
2. **Determine method**:
   - Hostinger-hosted → Use Hostinger VPS snapshot tools if available
   - SSH access → Use `mysqldump` + `tar` via SSH
   - WP REST only → Export content via API (content-only backup)
3. **Execute backup**:
   - Database: `mysqldump` of the WordPress database
   - Files: `tar` of `wp-content/` directory
   - Record backup metadata (date, site, method, location)
4. **Verify backup**: Check file integrity and size
5. **Report**: Confirm backup location and contents

### Restore Backup
1. **Confirm with user**: This is a destructive operation — always require explicit confirmation
2. **Verify backup integrity**: Check backup files exist and are valid
3. **Execute restore**:
   - Hostinger: Use `hosting_importWordpressWebsite` with backup archive
   - SSH: Upload and extract files, import database
4. **Post-restore checks**: Verify site accessibility and content integrity

## Safety

- Always confirm with user before creating or restoring backups
- Restoring a backup OVERWRITES current site state
- Recommend creating a backup BEFORE any major operation (deploy, migrate, update)
- Keep at least 3 recent backups when possible
