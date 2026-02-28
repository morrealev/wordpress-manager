# User Capabilities Audit

Use this file when auditing and managing WordPress user accounts, roles, and capabilities.

## Default WordPress roles

| Role | Key capabilities |
|------|-----------------|
| Super Admin | Multisite: all capabilities across all sites |
| Administrator | `manage_options`, `install_plugins`, `edit_users`, `delete_users` |
| Editor | `publish_pages`, `edit_others_posts`, `manage_categories` |
| Author | `publish_posts`, `edit_published_posts`, `upload_files` |
| Contributor | `edit_posts` (cannot publish), `read` |
| Subscriber | `read` only |

## Audit administrator accounts

Best practice: 1-2 administrator accounts maximum.

```bash
# List all administrators
wp user list --role=administrator --fields=ID,user_login,user_email,user_registered

# Count administrators
wp user list --role=administrator --format=count
```

Flags for review:
- More than 2 administrators
- Generic usernames: `admin`, `administrator`, `test`, `user`
- Email addresses from external domains
- Accounts not used in 90+ days

## Find dormant accounts

```bash
# List users who haven't logged in recently (requires user meta tracking)
wp user list --fields=ID,user_login,user_registered --format=table

# List all users by role
wp user list --role=subscriber --format=count
wp user list --role=contributor --format=count
```

Remove or downgrade dormant accounts:
```bash
# Downgrade to subscriber
wp user set-role <user_id> subscriber

# Delete user (reassign content to admin)
wp user delete <user_id> --reassign=1
```

## Custom roles

```php
// Add a custom role
add_role('shop_manager', 'Shop Manager', [
    'read'           => true,
    'edit_posts'     => true,
    'publish_posts'  => true,
    'manage_woocommerce' => true,
]);

// Remove a role
remove_role('shop_manager');
```

## Custom capabilities

```php
// Grant a capability to a role
$role = get_role('editor');
$role->add_cap('manage_custom_settings');

// Remove a capability
$role->remove_cap('manage_custom_settings');

// Grant to a specific user
$user = get_userdata($user_id);
$user->add_cap('view_reports');
```

## WP-CLI capability management

```bash
# List all capabilities for a role
wp cap list administrator

# Add capability to role
wp cap add editor manage_custom_settings

# Remove capability from role
wp cap remove editor manage_custom_settings
```

## Principle of least privilege

Guidelines:
1. **Content creators** → Author role (can only edit/publish their own posts)
2. **Content managers** → Editor role (can edit all content, no admin access)
3. **Plugin managers** → Custom role with `install_plugins` but not `edit_users`
4. **SEO managers** → Custom role with specific plugin capabilities
5. **Developers** → Administrator only on staging/development; use deploy pipelines for production

Never give administrator access for tasks that can be accomplished with a lower role.

## Audit checklist

- [ ] Administrator count is 1-2
- [ ] No accounts with username "admin"
- [ ] All admin email addresses are verified and current
- [ ] No dormant accounts (inactive > 90 days) with elevated roles
- [ ] Custom roles follow principle of least privilege
- [ ] No unnecessary `unfiltered_html` capability (multisite: `DISALLOW_UNFILTERED_HTML`)
