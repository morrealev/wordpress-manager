---
name: wp-deploy
description: Deploy a WordPress plugin, theme, or static site to a hosting server. Supports Hostinger MCP and SSH deployment methods.
---

# WordPress Deploy

Deploy WordPress components to production. This command guides you through a safe deployment workflow.

## Usage

Specify what to deploy and where:
- `/wordpress-manager:wp-deploy plugin <path> to <site>`
- `/wordpress-manager:wp-deploy theme <path> to <site>`
- `/wordpress-manager:wp-deploy static <path> to <site>`

## Process

1. **Identify deployment target**: Parse the user's request for component type, local path, and target site
2. **Pre-flight checks**:
   - Verify local files exist
   - Run syntax validation (PHP lint for plugins/themes)
   - Check for hardcoded credentials in source files
   - Confirm with user before proceeding
3. **Select deployment method**:
   - Hostinger-hosted → Use Hostinger MCP tools
   - Other hosting → Use SSH/SFTP
4. **Execute deployment**: Use the appropriate tool/method
5. **Post-deployment verification**:
   - Verify component appears in WordPress
   - Check site accessibility
   - Report success/failure to user

## Safety

- Always confirm with user before deploying
- Check for credentials in files before uploading
- Provide rollback instructions after deployment
