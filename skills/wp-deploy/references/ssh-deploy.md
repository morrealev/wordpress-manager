# SSH/SFTP Deployment Reference

## Prerequisites

1. SSH key configured in `~/.ssh/config`
2. SSH access verified: `ssh user@host 'echo ok'`
3. Know the WordPress installation path (typically `/home/user/htdocs/` on Hostinger)

## Plugin Deployment via SSH

```bash
# 1. Package the plugin
tar -czf /tmp/plugin-name.tar.gz -C /path/to/plugin-dir .

# 2. Upload to server
scp /tmp/plugin-name.tar.gz user@host:/tmp/

# 3. Extract to plugins directory
ssh user@host 'mkdir -p /path/to/wp-content/plugins/plugin-name && tar xzf /tmp/plugin-name.tar.gz -C /path/to/wp-content/plugins/plugin-name'

# 4. Set correct permissions
ssh user@host 'chmod -R 755 /path/to/wp-content/plugins/plugin-name'

# 5. Clean up
ssh user@host 'rm /tmp/plugin-name.tar.gz'
rm /tmp/plugin-name.tar.gz
```

## Theme Deployment via SSH

```bash
# Same pattern as plugin but targeting themes directory
tar -czf /tmp/theme-name.tar.gz -C /path/to/theme-dir .
scp /tmp/theme-name.tar.gz user@host:/tmp/
ssh user@host 'mkdir -p /path/to/wp-content/themes/theme-name && tar xzf /tmp/theme-name.tar.gz -C /path/to/wp-content/themes/theme-name'
ssh user@host 'chmod -R 755 /path/to/wp-content/themes/theme-name'
ssh user@host 'rm /tmp/theme-name.tar.gz'
```

## Hostinger-Specific Paths

- Web root: `/home/<username>/htdocs/<domain>/`
- Plugins: `/home/<username>/htdocs/<domain>/wp-content/plugins/`
- Themes: `/home/<username>/htdocs/<domain>/wp-content/themes/`
- Uploads: `/home/<username>/htdocs/<domain>/wp-content/uploads/`

## SSH Config for Hostinger

```
Host opencactus-hostinger
    HostName <ip-or-hostname>
    User <hostinger-username>
    IdentityFile ~/.ssh/hostinger_opencactus_20250904
    IdentitiesOnly yes
```

## Rollback via SSH

```bash
# If you backed up before deploying:
ssh user@host 'mv /path/to/wp-content/plugins/plugin-name /path/to/wp-content/plugins/plugin-name.broken'
ssh user@host 'mv /path/to/wp-content/plugins/plugin-name.backup /path/to/wp-content/plugins/plugin-name'
```
