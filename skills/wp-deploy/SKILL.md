---
name: wp-deploy
description: This skill should be used when the user asks to "deploy a plugin",
  "deploy a theme", "push to production", "deploy to WordPress", "deploy to Hostinger",
  or mentions deployment of WordPress components. Provides step-by-step deployment
  workflows for Hostinger-hosted and SSH-accessible WordPress sites.
version: 1.0.0
---

# WordPress Deployment Skill

## Overview

Guides deployment of WordPress plugins, themes, and static sites to production servers. Supports Hostinger MCP (preferred for Hostinger hosting) and SSH/SFTP (universal).

## When to Use

- User asks to deploy a plugin or theme
- User wants to push changes to a WordPress site
- User needs to migrate a WordPress installation
- User wants to set up a deployment pipeline

## Deployment Decision Tree

1. **Is the target Hostinger-hosted?**
   - Yes → Use Hostinger MCP tools (`hosting_deployWordpressPlugin`, `hosting_deployWordpressTheme`)
   - No → Use SSH/SFTP deployment

2. **What are you deploying?**
   - Plugin → Package plugin directory, deploy, activate
   - Theme → Package theme directory, deploy, optionally activate
   - Static site → Archive build output, deploy
   - Full site → Export DB + files, use `hosting_importWordpressWebsite`

## Pre-Deployment Steps

1. **Verify files** - Check all required files exist and are valid
2. **Check for secrets** - Ensure no credentials are in deployment files
3. **Confirm target** - Verify which site and environment (staging/production)
4. **Backup** - Ensure a rollback path exists
5. **Local environment export** (if deploying from local) - If the source is a local dev site (Studio, LocalWP, wp-env), use `wp-local-env` skill to export the database and files before deploying

## Post-Deployment Steps

1. **Verify** - Check the deployed component appears in WordPress
2. **Test** - Verify core functionality works
3. **Report** - Summarize what was deployed and where

## Deploying from Local Environment

When deploying from a local development site, use the appropriate export method:

- **Studio**: `studio wp db export backup.sql --path=<site>` + copy `wp-content/`
- **LocalWP**: `<wp-cli> --path=<site-root> db export backup.sql` + copy `app/public/wp-content/`
- **wp-env**: `npx wp-env run cli wp db export /tmp/backup.sql` + Docker volume copy
- **Studio Preview**: `studio preview create --path=<site>` for quick sharing (WordPress.com hosted)

For full details on local environment operations, see the `wp-local-env` skill.

## Additional Resources

### Reference Files
- **`references/hostinger-deploy.md`** - Hostinger MCP deployment details
- **`references/ssh-deploy.md`** - SSH/SFTP deployment procedures
