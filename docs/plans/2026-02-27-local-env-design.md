# Design: wp-local-env — Local Environment Abstraction Layer

**Data**: 2026-02-27
**Approccio**: A (Abstraction Layer)
**Target version**: 1.5.0
**Stato**: Implementato
**Stato**: Approvato

---

## 1. Nuova skill `wp-local-env`

### Directory structure

```
skills/wp-local-env/
├── SKILL.md
├── references/
│   ├── studio-adapter.md
│   ├── localwp-adapter.md
│   ├── wpenv-adapter.md
│   └── mcp-adapter-setup.md
└── scripts/
    └── detect_local_env.mjs
```

### Detection script output schema

```json
{
  "environments": [
    {
      "tool": "studio|localwp|wpenv",
      "version": "string",
      "cli": "path or null",
      "sites": [
        {
          "name": "string",
          "path": "string",
          "url": "string",
          "port": "number|null",
          "status": "running|stopped|unknown",
          "php": "string",
          "wp": "string|null",
          "db": "sqlite|mysql",
          "webServer": "wasm|nginx|apache|null"
        }
      ]
    }
  ],
  "recommended": "studio|localwp|wpenv|null",
  "wpCli": {
    "studio": "studio wp --path=<site>",
    "localwp": "<wp-cli-bin> --path=<site>",
    "wpenv": "npx wp-env run cli wp"
  }
}
```

### Unified operations

| Operation | Studio | LocalWP | wp-env |
|-----------|--------|---------|--------|
| Create site | `studio site create --path X` | Manual (GUI) + doc | `npx wp-env start` |
| Start site | `studio site start --path X` | Manual (GUI) | `npx wp-env start` |
| Stop site | `studio site stop --path X` | Manual (GUI) | `npx wp-env stop` |
| WP-CLI | `studio wp <cmd> --path=X` | `<wp-cli-bin> --path=X` | `npx wp-env run cli wp <cmd>` |
| REST API | `localhost:888x/wp-json/` | `localhost:<port>/wp-json/` | `localhost:8888/wp-json/` |
| Symlink plugin | `ln -s src ~/Studio/X/wp-content/plugins/` | `ln -s src ~/Local Sites/X/app/public/wp-content/plugins/` | `.wp-env.json` mapping |
| DB export | `studio wp db export` | `wp db export` (bundled) | `npx wp-env run cli wp db export` |

---

## 2. Router Decision Tree v3

### New Step 0

```
Step 0: determine task category
├── Development (modifying code) → Step 1 (triage)
├── Operations (managing live sites) → Step 2b (ops routing)
└── Local Environment (NEW) → Step 2c (local routing)
```

### New Step 2c keywords

```
local site, local dev, studio, localwp, local wp, create local,
test locally, local environment, spin up, setup dev environment,
preview locally, wp-env, dev server
```

### Step 2c routing

- Create/setup local site → wp-local-env (create workflow)
- List/discover local sites → wp-local-env (detect_local_env.mjs)
- Start/stop/delete local site → wp-local-env (lifecycle)
- Scaffold + develop locally → wp-local-env + development skill
- Test locally / switch PHP / debug → wp-local-env (testing)
- Preview/share local site → wp-local-env (preview)
- Deploy from local to remote → wp-local-env (source) + wp-deploy (target)

---

## 3. Detection script logic

### Platform paths

```
Linux:
  Studio: ~/Studio/, ~/.config/WordPressStudio/
  LocalWP: ~/Local Sites/, ~/.config/Local/sites.json

macOS:
  Studio: ~/Studio/, ~/Library/Application Support/WordPressStudio/
  LocalWP: ~/Local Sites/, ~/Library/Application Support/Local/sites.json

Windows:
  Studio: ~/Studio/, %APPDATA%/WordPressStudio/
  LocalWP: ~/Local Sites/, %APPDATA%/Local/sites.json
```

### Recommendation logic

```
Studio CLI available AND sites found → recommended: "studio"
Only LocalWP found → recommended: "localwp"
Only .wp-env.json found → recommended: "wpenv"
None found → recommended: null
Multiple → prefer Studio (best CLI), then LocalWP, then wp-env
```

---

## 4. MCP server additions (disabled by default)

```json
{
  "studio-mcp": {
    "command": "node",
    "args": ["${STUDIO_MCP_PATH}/dist/index.js"],
    "disabled": true
  },
  "wp-local-mcp": {
    "command": "studio",
    "args": ["wp", "mcp-adapter", "serve", "--server=mcp-adapter-default-server", "--user=admin"],
    "env": { "WP_LOCAL_SITE_PATH": "${WP_LOCAL_SITE_PATH}" },
    "disabled": true
  }
}
```

---

## 5. Files modified

| Existing file | Change |
|---------------|--------|
| `skills/wordpress-router/SKILL.md` | Add "Local Environment" category |
| `skills/wordpress-router/references/decision-tree.md` | v2 → v3, add Step 2c |
| `skills/wp-wpcli-and-ops/SKILL.md` | Add "WP-CLI in local environments" section |
| `skills/wp-deploy/SKILL.md` | Add "Deploy from local environment" workflow |
| `skills/wp-playground/SKILL.md` | Add differentiation note (ephemeral vs persistent) |
| `.mcp.json` | Add 2 disabled MCP servers |
| `README.md` | Update to 19 skills, add local dev section |
| `docs/GUIDE.md` | Add "Sviluppo Locale" section |
| `CHANGELOG.md` | Add v1.5.0 entry |
| `package.json` | Version bump 1.4.0 → 1.5.0 |
| `.claude-plugin/plugin.json` | Version bump 1.4.0 → 1.5.0 |

---

## 6. Deliverable summary

6 new files + 11 modifications = 17 deliverables

---

*Design approvato il 2026-02-27*
