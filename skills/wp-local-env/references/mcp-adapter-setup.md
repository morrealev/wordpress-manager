# WordPress MCP Adapter Setup

## What is the MCP Adapter?

The MCP Adapter is a WordPress plugin (available from WordPress 6.9+) that turns any WordPress installation into an MCP (Model Context Protocol) server. This allows AI agents like Claude Code to interact with WordPress through a standardized protocol.

**Source**: https://github.com/WordPress/mcp-adapter

## Transport modes

### STDIO (for local sites via WP-CLI)

The STDIO transport runs the MCP server as a WP-CLI command. Best for local development sites.

**Requirements:**
- WP-CLI available (via Studio, LocalWP bundled, or system install)
- MCP Adapter plugin installed and activated on the local site
- A WordPress user with sufficient permissions

### HTTP (for remote sites)

The HTTP transport exposes an MCP endpoint via the WordPress REST API. Best for remote or staging sites.

**Requirements:**
- MCP Adapter plugin installed and activated
- Application Password for authentication
- Site accessible via HTTPS (recommended)

## Setup: STDIO with WordPress Studio

1. Install the MCP Adapter plugin:
```bash
studio wp plugin install mcp-adapter --activate --path=~/Studio/my-site
```

2. Add to `.mcp.json`:
```json
{
  "mcpServers": {
    "wp-local-mcp": {
      "command": "studio",
      "args": [
        "wp", "mcp-adapter", "serve",
        "--server=mcp-adapter-default-server",
        "--user=admin",
        "--path=/home/user/Studio/my-site"
      ]
    }
  }
}
```

## Setup: STDIO with LocalWP

1. Find the WP-CLI binary (from `detect_local_env.mjs` output or manually):
```bash
WP_CLI=~/.config/Local/lightning-services/wp-cli-*/bin/wp
```

2. Install the MCP Adapter plugin:
```bash
$WP_CLI --path="$HOME/Local Sites/my-site/app/public" plugin install mcp-adapter --activate
```

3. Add to `.mcp.json`:
```json
{
  "mcpServers": {
    "wp-local-mcp": {
      "command": "/home/user/.config/Local/lightning-services/wp-cli-2.11.0/bin/wp",
      "args": [
        "--path=/home/user/Local Sites/my-site/app/public",
        "mcp-adapter", "serve",
        "--server=mcp-adapter-default-server",
        "--user=admin"
      ]
    }
  }
}
```

**Note**: The LocalWP site must be started (via GUI) for the MySQL connection to work.

## Setup: STDIO with wp-env

```json
{
  "mcpServers": {
    "wp-local-mcp": {
      "command": "npx",
      "args": [
        "wp-env", "run", "cli", "wp",
        "mcp-adapter", "serve",
        "--server=mcp-adapter-default-server",
        "--user=admin"
      ]
    }
  }
}
```

## Setup: HTTP (remote sites)

1. Install and activate the MCP Adapter plugin on the remote site.

2. Create an Application Password for the user (WP Admin → Users → Profile).

3. Use the remote MCP client:
```json
{
  "mcpServers": {
    "wp-remote-mcp": {
      "command": "npx",
      "args": ["-y", "@automattic/mcp-wordpress-remote@latest"],
      "env": {
        "WP_API_URL": "https://example.com/wp-json/mcp/mcp-adapter-default-server",
        "WP_API_USERNAME": "admin",
        "WP_API_PASSWORD": "<application-password>"
      }
    }
  }
}
```

## Studio MCP Server (alternative)

Automattic also publishes a dedicated Studio MCP server in the `wordpress-agent-skills` repo. This provides site management tools without requiring the MCP Adapter plugin.

Setup:
```bash
git clone https://github.com/Automattic/wordpress-agent-skills.git
cd wordpress-agent-skills/studio-mcp && npm install && npm run build
```

```json
{
  "mcpServers": {
    "studio-mcp": {
      "command": "node",
      "args": ["/path/to/wordpress-agent-skills/studio-mcp/dist/index.js"]
    }
  }
}
```

## Which approach to choose?

| Scenario | Recommended |
|----------|-------------|
| Quick local dev with Studio | Studio MCP Server |
| Full WP operations on local site | MCP Adapter (STDIO) |
| Remote/staging site | MCP Adapter (HTTP) via `@automattic/mcp-wordpress-remote` |
| Existing wp-rest-bridge setup | Point `WP_SITES_CONFIG` at `localhost:<port>` |
