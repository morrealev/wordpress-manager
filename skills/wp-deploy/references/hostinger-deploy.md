# Hostinger MCP Deployment Reference

## Plugin Deployment

### Tool: `hosting_deployWordpressPlugin`
Deploys a WordPress plugin from a local directory to a Hostinger-hosted site.

**Input:** Local directory path containing plugin files
**Process:** Uploads all files, triggers server-side deployment
**Post-deploy:** Use `activate_plugin` via WP REST Bridge to activate

### Example workflow:
```
1. Verify plugin: php -l main-plugin-file.php
2. Deploy: hosting_deployWordpressPlugin(directory)
3. Verify: list_plugins → check plugin appears
4. Activate: activate_plugin(plugin_slug)
5. Test: visit site to confirm functionality
```

## Theme Deployment

### Tool: `hosting_deployWordpressTheme`
Deploys a WordPress theme from a local directory with optional activation.

**Input:** Local directory path + optional activate flag
**Process:** Uploads all theme files, triggers deployment, activates if requested

### Required theme files:
- `style.css` (with valid theme headers)
- `index.php`
- `functions.php` (recommended)

## Static Site Deployment

### Tool: `hosting_deployStaticWebsite`
Deploys pre-built static HTML/CSS/JS from an archive.

**Supported formats:** zip, tar, tar.gz, tgz
**Process:** Upload archive → extract to web root → serve

## Site Import

### Tool: `hosting_importWordpressWebsite`
Full WordPress site migration/restore.

**Input:**
- Archive file (zip/tar.gz) with WordPress files
- SQL database dump file

**WARNING:** This overwrites the existing installation.
