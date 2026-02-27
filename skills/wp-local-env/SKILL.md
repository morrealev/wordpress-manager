---
name: wp-local-env
description: "Use when the user wants to work with a local WordPress development environment
  — WordPress Studio, LocalWP, or wp-env. Handles environment detection, site lifecycle,
  WP-CLI proxy, REST API access, symlink workflows, database operations, and preview/share."
compatibility: "Cross-platform (Linux, macOS, Windows). WordPress Studio requires the desktop app + CLI enabled. LocalWP requires the desktop app. wp-env requires Docker + Node.js."
version: 1.0.0
---

# Local WordPress Environment

## When to use

Use this skill when the task involves local WordPress development environments:

- Detecting which local dev tool is installed (Studio, LocalWP, wp-env)
- Creating, starting, stopping, or deleting local WordPress sites
- Running WP-CLI commands against a local site
- Setting up plugin/theme development via symlinks
- Accessing the local REST API or database
- Switching PHP/WordPress versions for testing
- Previewing or sharing a local site externally
- Preparing a local site for deployment to production

## Inputs required

- Whether the user has WordPress Studio, LocalWP, or wp-env (auto-detected)
- The site to operate on (name, path, or auto-detected from current directory)
- The desired operation (lifecycle, development, testing, deploy prep)

## Procedure

### 0) Detect local environments

Run the detection script to discover installed tools and sites:

```bash
node skills/wp-local-env/scripts/detect_local_env.mjs
```

The script outputs JSON with:
- `environments[]` — each tool found with its sites
- `recommended` — which tool to prefer for automation
- `wpCli` — how to invoke WP-CLI for each tool

If no environment is found, suggest installation:
- **WordPress Studio** (lightweight, fast): https://developer.wordpress.com/studio/
- **LocalWP** (production-parity): https://localwp.com/
- **wp-env** (Docker-based, for contributors): `npm -g install @wordpress/env`

### 1) Site lifecycle

#### Create a new local site

**WordPress Studio:**
```bash
studio site create --path ~/Studio/my-site
# Optional flags: --php-version=8.2 --domain=mysite.wp.local --https
```

**LocalWP:** Site creation is GUI-only. Guide the user through:
1. Open LocalWP → "Create a new site"
2. Choose site name, PHP version, web server (NGINX/Apache)
3. Set WordPress admin credentials

**wp-env:** Create `.wp-env.json` in the project root:
```json
{
  "core": "WordPress/WordPress#6.9",
  "plugins": ["./my-plugin"],
  "themes": ["./my-theme"]
}
```
Then: `npx wp-env start`

#### Start / stop / delete

| Operation | Studio | LocalWP | wp-env |
|-----------|--------|---------|--------|
| Start | `studio site start --path=<path>` | GUI only | `npx wp-env start` |
| Stop | `studio site stop --path=<path>` | GUI only | `npx wp-env stop` |
| Delete | `studio site delete --path=<path>` | GUI only | `npx wp-env destroy` |
| Status | `studio site status --path=<path>` | Parse `sites.json` | `npx wp-env run cli wp option get siteurl` |

### 2) WP-CLI operations

WP-CLI is the primary automation interface for all local tools. Each tool has a different invocation method:

**WordPress Studio** (no separate WP-CLI install needed):
```bash
studio wp <command> --path=<site-path>
# Examples:
studio wp plugin list --path=~/Studio/my-site
studio wp scaffold plugin my-plugin --path=~/Studio/my-site
studio wp db export backup.sql --path=~/Studio/my-site
```

**LocalWP** (uses bundled WP-CLI binary):
```bash
# Find the binary from detect_local_env.mjs output, then:
<wp-cli-bin> --path=<site-root> <command>
# Typical path on Linux:
~/.config/Local/lightning-services/wp-cli-*/bin/wp --path="~/Local Sites/my-site/app/public" plugin list
```

**wp-env** (Docker-wrapped):
```bash
npx wp-env run cli wp <command>
# Examples:
npx wp-env run cli wp plugin list
npx wp-env run cli wp scaffold block my-block --plugin=my-plugin
```

Read: `references/studio-adapter.md`, `references/localwp-adapter.md`, `references/wpenv-adapter.md`

### 3) Development workflow (symlink pattern)

For active plugin/theme development, symlink your project into the local site:

**WordPress Studio:**
```bash
ln -s /path/to/my-plugin ~/Studio/my-site/wp-content/plugins/my-plugin
studio wp plugin activate my-plugin --path=~/Studio/my-site
```

**LocalWP:**
```bash
ln -s /path/to/my-plugin ~/Local\ Sites/my-site/app/public/wp-content/plugins/my-plugin
<wp-cli-bin> --path="~/Local Sites/my-site/app/public" plugin activate my-plugin
```

**wp-env:** Map in `.wp-env.json` instead of symlinking:
```json
{ "plugins": ["./my-plugin", "/absolute/path/to/other-plugin"] }
```

### 4) REST API access

All local tools expose the WordPress REST API:

| Tool | URL pattern |
|------|-------------|
| Studio | `http://localhost:888x/wp-json/wp/v2/` |
| LocalWP | `http://<name>.local/wp-json/wp/v2/` or `http://127.0.0.1:<port>/wp-json/wp/v2/` |
| wp-env | `http://localhost:8888/wp-json/wp/v2/` |

For authenticated requests, create an Application Password:
```bash
studio wp user application-password create admin "claude-code" --path=<site>
# or via the WP-CLI equivalent for LocalWP / wp-env
```

The existing `wp-rest-bridge` MCP server can connect to local sites by configuring `WP_SITES_CONFIG` with the local URL.

### 5) Database operations

**Studio (SQLite):**
```bash
# Export as SQL (MySQL-compatible):
studio wp db export backup.sql --path=<site>
# Direct SQLite access:
sqlite3 ~/Studio/<site>/wp-content/database/.ht.sqlite
```

**LocalWP (MySQL):**
```bash
# Via WP-CLI:
<wp-cli-bin> --path=<site-root> db export backup.sql
# Direct MySQL access (credentials: root/root, db: local):
mysql --socket=~/.config/Local/run/<site-id>/mysql/mysqld.sock -u root -proot local
```

**wp-env (MySQL in Docker):**
```bash
npx wp-env run cli wp db export /tmp/backup.sql
```

### 6) Testing and version switching

**Switch PHP version:**
- Studio: `studio site set --php-version=8.2 --path=<site>`
- LocalWP: GUI → Site Settings → PHP Version
- wp-env: Set `"phpVersion": "8.2"` in `.wp-env.json`, then `npx wp-env start --update`

**Switch WordPress version:**
- Studio: `studio site set --wp-version=6.8 --path=<site>` (if supported) or `studio wp core update --version=6.8`
- LocalWP: `<wp-cli-bin> --path=<site-root> core update --version=6.8`
- wp-env: Set `"core": "WordPress/WordPress#6.8"` in `.wp-env.json`

### 7) Preview and share

**Studio:** Built-in preview deployment to WordPress.com:
```bash
studio preview create --path=<site>
# Returns a public URL like https://<hash>.wp.build
studio preview update <host> --path=<site>
studio preview delete <host>
```

**LocalWP:** Live Links feature (GUI only). Alternative:
```bash
# Use ngrok or cloudflared for tunneling:
ngrok http <port>
cloudflared tunnel --url http://localhost:<port>
```

**wp-env:** No built-in sharing. Use ngrok against port 8888.

### 8) MCP integration (optional)

For deeper AI integration, consider setting up the WordPress MCP Adapter plugin (WordPress 6.9+). This turns any local WordPress site into an MCP server.

Read: `references/mcp-adapter-setup.md`

## Verification

- Re-run `detect_local_env.mjs` after installing/removing tools or creating/deleting sites.
- Verify WP-CLI access: run `wp option get siteurl` via the tool-specific method.
- Verify REST API: `curl <site-url>/wp-json/wp/v2/` should return the API index.

## Failure modes / debugging

- **Studio CLI not found**: Enable CLI in Studio → Settings → toggle CLI.
- **LocalWP sites.json missing**: LocalWP may not be installed, or is a very old version.
- **LocalWP WP-CLI fails**: The MySQL server for that site must be running (start via GUI).
- **wp-env fails to start**: Check Docker is running (`docker info`).
- **Port conflicts**: Studio uses 8881+, LocalWP uses 10000+, wp-env uses 8888. If conflict, check `lsof -i :<port>`.

## Escalation

- If the user needs features not available in their tool (e.g., multisite on Studio, Xdebug on Studio), recommend switching to LocalWP or wp-env.
- If no local tool is installed and Docker is not available, fall back to `wp-playground` (ephemeral WASM-based).
- For production-parity testing, always recommend LocalWP (MySQL + native PHP).
