# LocalWP Adapter

## Prerequisites

- LocalWP desktop app installed (https://localwp.com/)
- Site must be started via GUI before WP-CLI or REST API access

## Site discovery

LocalWP stores all site metadata in a JSON file:

| Platform | Path |
|----------|------|
| Linux | `~/.config/Local/sites.json` |
| macOS | `~/Library/Application Support/Local/sites.json` |
| Windows | `%APPDATA%\Local\sites.json` |

### sites.json schema (per site)

```json
{
  "<site-id>": {
    "id": "<uuid>",
    "name": "My Site",
    "domain": "my-site.local",
    "path": "/home/user/Local Sites/my-site",
    "services": {
      "nginx": { "port": 10006, "sslPort": 10007 },
      "mysql": { "port": 10008 },
      "php": { "version": "8.2.10" }
    },
    "url": "http://my-site.local",
    "sslUrl": "https://my-site.local"
  }
}
```

## Directory structure

```
~/Local Sites/<site-name>/
├── app/
│   └── public/              ← WordPress root (document root)
│       ├── wp-content/
│       │   ├── themes/
│       │   ├── plugins/
│       │   └── uploads/
│       ├── wp-config.php
│       └── ...
├── conf/
│   ├── nginx/site.conf
│   ├── php/php.ini
│   └── mysql/my.cnf
└── logs/
    ├── nginx/{error.log, access.log}
    ├── php/error.log
    └── mysql/error.log
```

## WP-CLI access

LocalWP bundles WP-CLI. Find the binary at:

| Platform | Path |
|----------|------|
| Linux | `~/.config/Local/lightning-services/wp-cli-<version>/bin/wp` |
| macOS | `~/Library/Application Support/Local/lightning-services/wp-cli-<version>/bin/wp` |
| Windows | `%APPDATA%\Local\lightning-services\wp-cli-<version>\bin\wp.bat` |

Usage:
```bash
<wp-cli-bin> --path="~/Local Sites/my-site/app/public" <command>

# Examples:
<wp-cli-bin> --path="$HOME/Local Sites/my-site/app/public" plugin list
<wp-cli-bin> --path="$HOME/Local Sites/my-site/app/public" db export backup.sql
<wp-cli-bin> --path="$HOME/Local Sites/my-site/app/public" scaffold plugin my-plugin
```

**Important**: The site's MySQL server must be running (started via GUI) for WP-CLI to work.

## MySQL access

Default credentials for all LocalWP sites:
- **User**: `root`
- **Password**: `root`
- **Database**: `local`

### Via socket

```bash
# Find socket path from sites.json site id:
mysql --socket=~/.config/Local/run/<site-id>/mysql/mysqld.sock -u root -proot local
```

### Via TCP

```bash
# Port from sites.json → services.mysql.port:
mysql -h 127.0.0.1 -P <port> -u root -proot local
```

## REST API

Accessible when site is running:
```bash
# Via custom domain (requires hosts file entry, managed by LocalWP):
curl http://my-site.local/wp-json/wp/v2/posts

# Via port directly:
curl http://127.0.0.1:<nginx-port>/wp-json/wp/v2/posts
```

## Blueprints

LocalWP supports site blueprints (templates):

| Platform | Path |
|----------|------|
| Linux | `~/.config/Local/blueprints/` |
| macOS | `~/Library/Application Support/Local/blueprints/` |

Create: Right-click site → "Save as Blueprint"
Use: New site → select Blueprint during creation

## Symlink workflow

```bash
ln -s /path/to/my-plugin "$HOME/Local Sites/my-site/app/public/wp-content/plugins/my-plugin"
<wp-cli-bin> --path="$HOME/Local Sites/my-site/app/public" plugin activate my-plugin
```

## Logs

Direct access to web server, PHP, and MySQL logs:
```bash
tail -f ~/Local\ Sites/my-site/logs/nginx/error.log
tail -f ~/Local\ Sites/my-site/logs/php/error.log
tail -f ~/Local\ Sites/my-site/logs/mysql/error.log
```

## Known limitations

- **No CLI for site creation/start/stop** — GUI only
- **Live Links** — GUI only (not scriptable)
- **Heavy resource usage** — runs native NGINX + PHP-FPM + MySQL processes per site
- **PHP version changes** — GUI only

## Strengths over Studio

- **Full MySQL** — production parity, no SQLite compatibility issues
- **Multisite** — WordPress network fully supported
- **Xdebug** — available via add-on
- **MailHog** — email testing built-in
- **NGINX or Apache** — choose per site
- **Native PHP extensions** — full set available
