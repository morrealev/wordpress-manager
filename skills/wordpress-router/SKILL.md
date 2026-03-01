---
name: wordpress-router
description: “Use when the user asks about WordPress — whether development (plugins, themes,
  blocks, REST API) or operations (deploy, audit, backup, migrate, content management).
  Classifies the task and routes to the correct development or operational skill/agent.”
compatibility: “Targets WordPress 6.9+ (PHP 7.2.24+). Filesystem-based agent with bash + node. Some workflows require WP-CLI.”
version: 1.4.0
source: “WordPress/agent-skills (GPL-2.0-or-later) + wordpress-manager extensions”
---

# WordPress Router

## When to use

Use this skill at the start of most WordPress tasks to:

- identify what kind of WordPress task this is (development vs operations vs local environment),
- for development: classify the repo (plugin vs theme vs block theme vs WP core),
- for operations: identify the operation type (deploy, audit, backup, migrate, content),
- for local environment: detect tools (Studio, LocalWP, wp-env) and manage local sites,
- route to the most relevant skill(s) and/or agent(s).

## Inputs required

- Repo root (for development tasks) or site identifier (for operational tasks).
- The user’s intent and any constraints.

## Procedure

### 1) Determine task category

**Development tasks** (code changes to WordPress projects):
- Creating/modifying blocks, themes, plugins, REST endpoints
- Building UI with WordPress Design System (WPDS)
- Static analysis, build tooling, testing
- Sandbox testing via WordPress Playground
- Route via project triage → development skills

**Local Environment tasks** (managing local WordPress dev environments):
- Setting up, starting, stopping local WordPress sites
- Using WordPress Studio, LocalWP, or wp-env
- Running WP-CLI commands on local sites
- Symlink-based plugin/theme development
- Local database operations, PHP/WP version switching
- Route → `wp-local-env` skill (runs detection first)

**Operational tasks** (managing live WordPress sites):
- Deploying, auditing, backing up, migrating, managing content
- Route directly → operational skills and agents

### 2) For Development tasks

1. Run the project triage script:
   - `node skills/wp-project-triage/scripts/detect_wp_project.mjs`
2. Classify from triage output.
3. Route to development skills — see `references/decision-tree.md`.

### 3) For Local Environment tasks

1. Run detection: `node skills/wp-local-env/scripts/detect_local_env.mjs`
2. Route to `wp-local-env` skill with detected environment context.
3. For detailed tool guidance, see adapter references:
   - `wp-local-env/references/studio-adapter.md`
   - `wp-local-env/references/localwp-adapter.md`
   - `wp-local-env/references/wpenv-adapter.md`
4. For MCP integration: `wp-local-env/references/mcp-adapter-setup.md`

### 4) For Operational tasks

Route by intent keywords:

- **Deploy / push / production** → `wp-deploy` skill + `wp-deployment-engineer` agent
- **Audit / security / health check / SEO** → `wp-audit` skill + `wp-security-auditor` agent
- **Backup / restore / snapshot** → `wp-backup` skill
- **Migrate / move / transfer / clone** → `wp-migrate` skill
- **Content / blog post / pages / categories** → `wp-content` skill + `wp-content-strategist` agent
- **Performance / slow / PageSpeed / optimize** → `wp-audit` skill + `wp-performance-optimizer` agent
- **Site status / plugins / users / multi-site** → `wp-site-manager` agent

### 5) Apply guardrails

- For development: prefer repo’s existing tooling and conventions.
- For local environment: verify tool availability and site status before operations.
- For operations: confirm target site, verify backups, get user confirmation for destructive ops.

## Verification

- Re-run triage after structural changes (development).
- Verify site connectivity before operations.

## Failure modes / debugging

- Development: If triage reports `kind: unknown`, inspect root files.
- Operations: If site unreachable, check `WP_SITES_CONFIG` and credentials.

## Escalation

- If routing is ambiguous, ask: “Are you looking to develop/modify WordPress code, manage a local dev environment, or operate a live WordPress site?”
