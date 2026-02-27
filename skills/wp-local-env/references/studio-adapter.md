# WordPress Studio Adapter

## Prerequisites

- WordPress Studio desktop app installed and running
- CLI enabled: Studio → Settings → toggle "Enable CLI"
- The `studio` command must be available in PATH

## CLI reference

### Site lifecycle

```bash
# Create a new site
studio site create --path ~/Studio/my-site
studio site create --path ~/Studio/my-site --php-version=8.2 --https --domain=mysite.wp.local

# List all sites
studio site list

# Site status
studio site status --path=~/Studio/my-site

# Start / stop
studio site start --path=~/Studio/my-site
studio site stop --path=~/Studio/my-site

# Delete (--files removes files on disk)
studio site delete --path=~/Studio/my-site
studio site delete --path=~/Studio/my-site --files

# Configure
studio site set --php-version=8.3 --path=~/Studio/my-site
```

### WP-CLI proxy

No separate WP-CLI installation needed. Studio bundles and configures it automatically.

```bash
studio wp <command> --path=<site-path>

# Common operations:
studio wp plugin list --path=~/Studio/my-site
studio wp plugin install woocommerce --activate --path=~/Studio/my-site
studio wp theme activate twentytwentyfive --path=~/Studio/my-site
studio wp scaffold plugin my-plugin --path=~/Studio/my-site
studio wp scaffold block my-block --plugin=my-plugin --path=~/Studio/my-site
studio wp user create testuser test@example.com --role=editor --path=~/Studio/my-site
studio wp db export backup.sql --path=~/Studio/my-site
studio wp eval 'echo get_bloginfo("name");' --path=~/Studio/my-site
studio wp option update blogname "My Site" --path=~/Studio/my-site
```

### Preview (WordPress.com deployment)

```bash
studio preview create --path=~/Studio/my-site
studio preview list
studio preview update <host> --path=~/Studio/my-site
studio preview delete <host>
```

### Authentication

```bash
studio auth login    # OAuth browser flow to WordPress.com
studio auth status
studio auth logout
```

## Path conventions

| Item | Path |
|------|------|
| Sites root | `~/Studio/` |
| WordPress root | `~/Studio/<site-name>/` |
| Plugins | `~/Studio/<site-name>/wp-content/plugins/` |
| Themes | `~/Studio/<site-name>/wp-content/themes/` |
| Uploads | `~/Studio/<site-name>/wp-content/uploads/` |
| SQLite DB | `~/Studio/<site-name>/wp-content/database/.ht.sqlite` |
| App config (Linux) | `~/.config/WordPressStudio/` |
| App config (macOS) | `~/Library/Application Support/WordPressStudio/` |

## Ports

Sites are assigned ports sequentially starting at **8881**:
- First site: `http://localhost:8881`
- Second site: `http://localhost:8882`

Custom domains with HTTPS are supported via `--domain` and `--https` flags.

## Database (SQLite)

Studio uses SQLite instead of MySQL. The database file is at:
```
<site-root>/wp-content/database/.ht.sqlite
```

Direct access:
```bash
sqlite3 ~/Studio/my-site/wp-content/database/.ht.sqlite
sqlite> .tables
sqlite> SELECT * FROM wp_options WHERE option_name = 'siteurl';
```

**SQLite limitations:**
- No stored procedures or complex triggers
- Some plugins with complex MySQL-specific queries may break (notably WooCommerce complex queries)
- SQLite dumps are NOT directly compatible with MySQL — use `wp db export` for MySQL-compatible `.sql` files

## Symlink workflow

For development, symlink your project repo into the site:

```bash
ln -s /home/user/projects/my-plugin ~/Studio/my-site/wp-content/plugins/my-plugin
studio wp plugin activate my-plugin --path=~/Studio/my-site
```

## Known limitations

- **No multisite / WordPress network**
- **No Xdebug** (WASM runtime does not support it)
- **Limited PHP extensions** (only those compiled to WASM)
- **Linux**: may require building from source (no official package)
- **Requires Studio app running** for CLI to work (IPC communication)
