# User Roles in Multisite

WordPress Multisite adds a Super Admin role above the standard role hierarchy. Users can have different roles on different sub-sites within the same network.

## MCP Tools

| Tool | Usage |
|------|-------|
| `ms_list_super_admins` | List all Super Admin users in the network |

## Role Hierarchy

| Role | Scope | Key Capabilities |
|------|-------|-----------------|
| Super Admin | Entire network | All capabilities on all sites, network settings, site CRUD |
| Administrator | Single site | Full control of one sub-site (cannot install plugins/themes) |
| Editor | Single site | Manage and publish all posts on one site |
| Author | Single site | Publish own posts |
| Contributor | Single site | Write drafts, cannot publish |
| Subscriber | Single site | Read-only access |

## Super Admin vs Administrator (Multisite)

| Capability | Super Admin | Site Administrator |
|-----------|-------------|-------------------|
| Install plugins | Yes | No |
| Install themes | Yes | No |
| Create/delete sub-sites | Yes | No |
| Network activate plugins | Yes | No |
| Edit wp-config.php | Yes | No |
| Manage network settings | Yes | No |
| Edit files (theme/plugin editor) | Yes | No (disabled by default) |
| Manage site users | Yes | Yes (own site only) |
| Manage site options | Yes | Yes (own site only) |

## User Registration Modes

Network-wide setting (Network Admin > Settings):

| Mode | Description |
|------|-------------|
| Registration disabled | No one can register |
| User accounts may be registered | Users can register but not create sites |
| Logged-in users may register new sites | Existing users can create sub-sites |
| Both user accounts and sites can be registered | Open registration for users and sites |

## Common Operations

### List Super Admins
1. `ms_list_super_admins` — returns usernames with super admin status

### Add Super Admin (via wp-cli)
```bash
wp super-admin add username
```

### Remove Super Admin (via wp-cli)
```bash
wp super-admin remove username
```

### Add User to Sub-site (via wp-cli)
```bash
wp user set-role username editor --url=site1.example.com
```

## Tips and Gotchas

- **Super Admin bypass**: Super Admins bypass all capability checks. Use this role sparingly.
- **User exists once**: A user account exists once in the network but can have different roles on different sub-sites.
- **Cannot demote yourself**: The last Super Admin cannot remove their own super admin status.
- **wp-admin vs network-admin**: Super Admins see both site-level wp-admin and network-level wp-admin/network/.
- **Plugin capability checks**: Plugins using `current_user_can()` should work correctly with multisite, but some older plugins may not distinguish Super Admin from site Administrator.
