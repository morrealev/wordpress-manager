---
name: wp-cicd
description: |
  This skill should be used when the user asks about "CI/CD", "pipeline",
  "GitHub Actions", "GitLab CI", "Bitbucket Pipelines", "deploy automation",
  "quality gates", "continuous integration", "continuous deployment",
  or any WordPress CI/CD workflow configuration.
compatibility: "Targets WordPress 6.9+ (PHP 7.2.24+). Filesystem-based agent with bash + node. Generates YAML pipeline configs."
version: 1.0.0
source: "vinmor/wordpress-manager"
---

# WP CI/CD

## Overview

CI/CD pipeline management for WordPress projects. Supports three platforms (GitHub Actions, GitLab CI, Bitbucket Pipelines) with WordPress-specific stages: PHP linting, static analysis, unit/E2E testing with wp-env, and automated deployment.

## When to Use

- Setting up a CI/CD pipeline from scratch for a WordPress project
- Adding quality gates (PHPStan, PHPCS, coverage thresholds) to an existing pipeline
- Configuring automated deployment (staging, production) via CI
- Troubleshooting CI failures (Docker timeout, wp-env issues, test flakiness)
- Managing secrets for WordPress deployment (SSH keys, API tokens)
- Choosing a deployment strategy (blue-green, rolling, canary)
- Migrating CI configuration between platforms

## Detection

Run the detection script to assess the current CI/CD setup:

```bash
node skills/wp-cicd/scripts/cicd_inspect.mjs [--cwd=/path/to/project]
```

The script outputs JSON with:
- `platforms` — GitHub Actions, GitLab CI, Bitbucket Pipelines detection
- `quality_tools` — PHPStan, PHPCS, Playwright, Jest, PHPUnit presence
- `wp_env_ready` — whether `.wp-env.json` exists for E2E in CI
- `recommendations` — actionable suggestions

## CI/CD Decision Tree

### 1. Which platform?

| Platform | Config location | Best for |
|----------|----------------|----------|
| GitHub Actions | `.github/workflows/*.yml` | Open-source plugins, GitHub-hosted repos |
| GitLab CI | `.gitlab-ci.yml` | Self-hosted, enterprise GitLab |
| Bitbucket Pipelines | `bitbucket-pipelines.yml` | Atlassian ecosystem teams |

→ Read the platform-specific reference file for complete templates.

### 2. What pipeline stages?

Standard WordPress CI pipeline:

```
lint → static-analysis → test → build → deploy
```

| Stage | Tool | What it checks |
|-------|------|---------------|
| Lint | PHPCS | WordPress coding standards |
| Static analysis | PHPStan | Type safety, undefined methods |
| Unit test | PHPUnit / Jest | Business logic, hooks, filters |
| E2E test | Playwright + wp-env | User flows, block interactions |
| Build | npm run build | Block assets, translations |
| Deploy | SSH / Hostinger MCP | Push to staging or production |

### 3. Quality gates

Configure pass/fail thresholds that block merging:

- PHPStan: fail on new errors (baseline strategy)
- PHPCS: zero violations on changed files
- Coverage: minimum threshold (e.g., 80%)
- Playwright: zero failures, screenshot diff tolerance

→ Read: `references/quality-gates.md`

### 4. Deploy strategy

| Strategy | Risk | Downtime | Use when |
|----------|------|----------|----------|
| Direct push | High | Brief | Simple sites, dev/staging |
| Blue-green | Low | Zero | Production with traffic |
| Rolling | Medium | Zero | Multi-server setups |
| Manual approval | Low | Varies | Production with review gate |

→ Read: `references/deploy-strategies.md`

## Recommended Agent

For hands-on pipeline generation, troubleshooting, and deployment configuration, use the **`wp-cicd-engineer`** agent.

## Reference Files

- **`references/github-actions-wordpress.md`** — Complete GitHub Actions workflow templates for WordPress
- **`references/gitlab-ci-wordpress.md`** — GitLab CI multi-stage pipeline for WordPress
- **`references/bitbucket-pipelines-wordpress.md`** — Bitbucket Pipelines configuration for WordPress
- **`references/wp-env-ci.md`** — Running wp-env in CI for E2E tests (Docker-in-Docker, healthchecks)
- **`references/deploy-strategies.md`** — Blue-green, rolling, canary, manual approval for WordPress
- **`references/secrets-management.md`** — SSH keys, API tokens, env vars across CI platforms
- **`references/quality-gates.md`** — PHPStan, PHPCS, coverage thresholds, merge blocking

## Related Skills

- **`wp-e2e-testing`** — Test framework setup, Playwright/Jest/PHPUnit guides (CI test stage)
- **`wp-deploy`** — Deployment procedures for Hostinger and SSH (CI deploy stage)
- **`wp-phpstan`** — PHPStan configuration and WordPress typing (CI quality gate)
- **`wp-local-env`** — wp-env setup for local and CI test environments

## Escalation

- For complex Docker networking in CI, consult the CI platform's Docker-in-Docker documentation
- For Hostinger-specific deploy hooks, see Hostinger API documentation
- For multi-environment orchestration (staging → canary → production), consider a dedicated deployment tool (Deployer, Capistrano)
