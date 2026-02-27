# WPDS MCP Server Setup

The `wpds` skill depends on an external **WPDS MCP server** to access canonical WordPress Design System documentation (components, tokens, patterns).

## What the WPDS MCP server provides

| Resource URI | Description |
|-------------|-------------|
| `wpds://pages` | Reference site pages (getting started, principles, guidelines) |
| `wpds://components` | List of all available WPDS components |
| `wpds://components/:name` | Detailed documentation for a specific component |
| `wpds://design-tokens` | Full list of design tokens (colors, spacing, typography) |

## Setup

### Option 1: Official WPDS MCP server (when available)

Check the [WordPress Design System](https://wordpress.github.io/gutenberg/?path=/docs/docs-introduction--page) for an official MCP server package.

### Option 2: Custom MCP server

If no official server exists, you can build a lightweight MCP server that serves WPDS documentation from the Gutenberg repository:

```json
{
  "mcpServers": {
    "wpds": {
      "command": "node",
      "args": ["path/to/wpds-mcp-server.js"]
    }
  }
}
```

### Option 3: Without MCP server (degraded mode)

The skill still works without the MCP server but with limitations:
- Cannot query live component documentation
- Cannot list design tokens programmatically
- Falls back to general knowledge of `@wordpress/components` and `@wordpress/ui`

## Key WPDS packages

| Package | Purpose |
|---------|---------|
| `@wordpress/components` | Core UI component library (Button, Modal, TextControl, etc.) |
| `@wordpress/ui` | Next-gen component library (experimental) |
| `@wordpress/primitives` | SVG icons and primitive UI elements |
| `@wordpress/icons` | Icon set for WordPress admin UI |

## Design tokens reference

When the MCP server is unavailable, use these canonical sources:

- **Color primitives**: `packages/components/src/utils/colors-values.js` in Gutenberg repo
- **Spacing scale**: Based on 4px grid (4, 8, 12, 16, 20, 24, 32, 40, 48, 56, 64)
- **Typography**: System font stack, sizes from 11px to 32px
- **Border radius**: 2px (default), 4px (cards), 50% (circular)
- **Elevation/shadows**: 3 levels (low, medium, high)
