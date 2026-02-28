# wp-env Test Environment Setup

Use this file when setting up or configuring wp-env as a test environment for WordPress development.

## Minimal `.wp-env.json` for testing

```json
{
  "core": null,
  "phpVersion": "8.2",
  "plugins": ["./"],
  "config": {
    "WP_DEBUG": true,
    "SCRIPT_DEBUG": true
  },
  "port": 8888,
  "testsPort": 8889
}
```

For a theme project, replace `"plugins": ["./"]` with `"themes": ["./"]`.

## Starting and managing

```bash
npx wp-env start              # Start both dev and test environments
npx wp-env start --update     # Start and pull latest images
npx wp-env stop               # Stop containers (preserves data)
npx wp-env destroy             # Remove containers and data
npx wp-env clean all           # Reset databases only
```

## Running commands inside wp-env

```bash
# WP-CLI in development environment
npx wp-env run cli wp plugin list

# WP-CLI in tests environment
npx wp-env run tests-cli wp option get siteurl

# PHPUnit in tests container
npx wp-env run tests-cli --env-cwd=wp-content/plugins/my-plugin phpunit

# Arbitrary bash
npx wp-env run cli bash -c "cat wp-config.php | grep WP_DEBUG"
```

## Default credentials

- **Development**: `http://localhost:8888` — admin / password
- **Tests**: `http://localhost:8889` — admin / password

## Custom PHP and WP versions

```json
{
  "core": "WordPress/WordPress#6.8",
  "phpVersion": "8.1"
}
```

This is useful for testing compatibility matrices. Each CI job can override these values.

## Mounting additional plugins/themes

```json
{
  "plugins": [
    "./",
    "https://downloads.wordpress.org/plugin/gutenberg.latest-stable.zip"
  ],
  "mappings": {
    "wp-content/mu-plugins": "./test-utils/mu-plugins"
  }
}
```

## Override file for local settings

Create `.wp-env.override.json` (gitignored) for developer-specific settings:

```json
{
  "port": 9999,
  "config": {
    "WP_DEBUG_LOG": true
  }
}
```

## Common issues

- **Port conflict**: change `port`/`testsPort` or stop the conflicting service
- **Docker not running**: `docker info` must succeed; start Docker Desktop or daemon
- **Stale containers**: `npx wp-env destroy && npx wp-env start` for a clean slate
- **Plugin not activated**: run `npx wp-env run cli wp plugin activate my-plugin`
