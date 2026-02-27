# wp-env Adapter

## Prerequisites

- **Docker** installed and running (`docker info`)
- **Node.js** 18+ and npm
- `.wp-env.json` in the project root

## Installation

```bash
npm -g install @wordpress/env
# or use npx (no install):
npx @wordpress/env start
```

## Configuration (.wp-env.json)

Minimal:
```json
{
  "core": null,
  "plugins": ["./my-plugin"],
  "themes": ["./my-theme"]
}
```

Full example:
```json
{
  "core": "WordPress/WordPress#6.9",
  "phpVersion": "8.2",
  "plugins": [
    "./my-plugin",
    "https://downloads.wordpress.org/plugin/woocommerce.latest-stable.zip"
  ],
  "themes": ["./my-theme"],
  "port": 8888,
  "testsPort": 8889,
  "config": {
    "WP_DEBUG": true,
    "WP_DEBUG_LOG": true,
    "SCRIPT_DEBUG": true
  },
  "mappings": {
    "wp-content/mu-plugins": "./mu-plugins"
  }
}
```

Override per-developer settings in `.wp-env.override.json` (gitignored).

## Commands

```bash
# Start development and test environments
npx wp-env start
npx wp-env start --update   # Also pull latest images

# Stop environments
npx wp-env stop

# Destroy (remove containers and data)
npx wp-env destroy

# Run WP-CLI commands
npx wp-env run cli wp <command>
npx wp-env run cli wp plugin list
npx wp-env run cli wp scaffold block my-block --plugin=my-plugin
npx wp-env run cli wp db export /tmp/backup.sql

# Run arbitrary commands in containers
npx wp-env run cli bash
npx wp-env run tests-cli wp test
```

## Ports

| Environment | Default port |
|-------------|-------------|
| Development | `http://localhost:8888` |
| Tests | `http://localhost:8889` |

Configurable via `port` and `testsPort` in `.wp-env.json`.

## Default credentials

- **User**: `admin`
- **Password**: `password`
- **Database**: Inside Docker container (not directly accessible from host)

## REST API

```bash
curl http://localhost:8888/wp-json/wp/v2/posts
curl -u "admin:password" http://localhost:8888/wp-json/wp/v2/posts
```

## When to use wp-env

- **WordPress core contribution** — standard for Gutenberg development
- **CI/CD pipelines** — Docker-based, reproducible
- **Plugin/theme testing** — isolated, disposable
- **PHPUnit tests** — `npx wp-env run tests-cli --env-cwd=wp-content/plugins/my-plugin phpunit`

## When NOT to use wp-env

- Quick theme previews → use WordPress Studio instead
- Production-parity with specific hosting → use LocalWP
- No Docker available → use WordPress Studio (WASM-based)

## Comparison with Studio and LocalWP

| Feature | wp-env | Studio | LocalWP |
|---------|--------|--------|---------|
| Requires Docker | Yes | No | No |
| Config as code | `.wp-env.json` | CLI flags | GUI |
| CI/CD friendly | Excellent | Limited | No |
| Setup speed | Medium (Docker pull) | Fast (WASM) | Slow (native) |
| Multiple sites | 2 (dev + test) | Unlimited | Unlimited |
| Multisite | Yes | No | Yes |
