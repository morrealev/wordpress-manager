---
name: wp-migrate
description: This skill should be used when the user asks to "migrate a site", "move
  WordPress", "transfer my site", "clone site", "copy site to new hosting", or mentions
  any WordPress migration between hosts or platforms. Covers full site, content-only,
  and database migrations.
version: 1.0.0
---

# WordPress Migration Skill

## Overview

Guides WordPress site migrations between hosting providers, platforms, and environments. Supports full-site, content-only, and staging-to-production migrations.

## When to Use

- User wants to move a WordPress site to new hosting
- User needs to clone a site for staging/development
- User wants to migrate from WordPress.com to self-hosted
- User needs to transfer content between WordPress installations
- User is consolidating multiple sites

## Migration Decision Tree

1. **What is the source?**
   - WordPress self-hosted → Full site or content export
   - WordPress.com → WXR export or WordPress.com MCP
   - Static site → Fresh WordPress installation + content import

2. **What is the destination?**
   - Hostinger → Use `hosting_importWordpressWebsite` (preferred)
   - Other hosting → Use SSH/SFTP transfer
   - WordPress.com → Content import via WP admin

3. **What scope?**
   - Full site (files + database + config) → Full migration
   - Content only (posts, pages, media) → WXR or API transfer
   - Theme/plugins only → Selective file transfer

## Migration Workflows

### Full Site Migration to Hostinger
1. **Backup source**: Database dump + wp-content archive
2. **Prepare archive**: Combine into single zip/tar.gz
3. **Import**: Use `hosting_importWordpressWebsite` with archive + SQL dump
4. **DNS update**: Point domain to new hosting
5. **Verify**: Check site loads correctly on new host

### Content-Only Migration (API-based)
1. **Connect both sites**: Ensure both are in `WP_SITES_CONFIG`
2. **Export from source**: Use `list_content` to enumerate all content
3. **Transform**: Adapt URLs, media references
4. **Import to destination**: Use `create_content` for each item
5. **Transfer media**: Download and re-upload media files
6. **Verify**: Check content integrity and links

### WordPress.com to Self-Hosted
1. **Export from WordPress.com**: WXR export via wp-admin or WP.com MCP
2. **Prepare destination**: Fresh WordPress on Hostinger
3. **Import**: Use WordPress Importer plugin or API
4. **Redirect**: Set up domain forwarding from WordPress.com

## Pre-Migration Checklist

- [ ] Full backup of source site created and verified
- [ ] Full backup of destination site (if not empty)
- [ ] DNS TTL lowered to 300 (5 min) at least 24h before migration
- [ ] All credentials documented (source + destination)
- [ ] Plugin list documented (to reinstall if needed)
- [ ] Custom configuration noted (wp-config.php settings)
- [ ] SSL certificate ready for new hosting
- [ ] User informed about expected downtime

## Post-Migration Checklist

- [ ] Site loads on new hosting
- [ ] All pages and posts accessible
- [ ] Media files loading correctly
- [ ] Forms and interactive features working
- [ ] SSL/HTTPS working
- [ ] DNS propagation verified
- [ ] Search and replace for old URLs completed
- [ ] Caching cleared and rebuilt
- [ ] Search Console updated with new sitemap
- [ ] Old hosting cancelled or archived

## Safety

- ALWAYS backup before migration — both source AND destination
- NEVER delete the source site until migration is fully verified
- DNS changes take 24-72 hours to propagate worldwide
- Test the migrated site using hosts file or staging URL before DNS switch
- Keep source accessible for at least 1 week after migration

## Additional Resources

### Reference Files
- **`references/hostinger-migration.md`** - Hostinger-specific migration procedures
- **`references/cross-platform.md`** - Cross-platform migration strategies
