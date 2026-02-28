/**
 * cicd_inspect.mjs — Detect CI/CD configuration for WordPress projects.
 *
 * Scans for CI platforms (GitHub Actions, GitLab CI, Bitbucket Pipelines),
 * quality tools (PHPStan, PHPCS, Playwright, Jest, PHPUnit), and wp-env readiness.
 *
 * Usage:
 *   node cicd_inspect.mjs [--cwd=/path/to/project]
 *
 * Exit codes:
 *   0 — CI/CD configuration found
 *   1 — no CI/CD configuration found
 */

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { argv, stdout, exit } from 'node:process';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function readFileSafe(filePath) {
  try { return readFileSync(filePath, 'utf-8'); } catch { return null; }
}

function existsSafe(filePath) {
  try { return existsSync(filePath); } catch { return false; }
}

function globDir(dirPath) {
  try { return readdirSync(dirPath); } catch { return []; }
}

// ---------------------------------------------------------------------------
// Detectors
// ---------------------------------------------------------------------------

function detectGitHubActions(cwd) {
  const workflowDir = join(cwd, '.github', 'workflows');
  const files = globDir(workflowDir).filter(f => f.endsWith('.yml') || f.endsWith('.yaml'));

  if (files.length === 0) return null;

  const workflows = [];
  let hasWpSteps = false;

  for (const file of files) {
    const content = readFileSafe(join(workflowDir, file));
    if (!content) continue;

    const nameMatch = content.match(/^name:\s*(.+)$/m);
    const triggers = [];
    if (/on:\s*push/m.test(content) || /push:/m.test(content)) triggers.push('push');
    if (/pull_request/m.test(content)) triggers.push('pull_request');
    if (/schedule/m.test(content)) triggers.push('schedule');
    if (/workflow_dispatch/m.test(content)) triggers.push('workflow_dispatch');

    const wpIndicators = /wp-env|wordpress|phpunit|phpstan|phpcs|playwright.*wp|wp-scripts/i.test(content);
    if (wpIndicators) hasWpSteps = true;

    workflows.push({
      file,
      name: nameMatch ? nameMatch[1].trim() : file,
      triggers,
      has_wp_steps: wpIndicators,
    });
  }

  return { found: true, workflows, has_wp_steps: hasWpSteps };
}

function detectGitLabCI(cwd) {
  const content = readFileSafe(join(cwd, '.gitlab-ci.yml'));
  if (!content) return null;

  const stages = [];
  const stagesMatch = content.match(/^stages:\s*\n((?:\s+-\s+.+\n?)+)/m);
  if (stagesMatch) {
    const lines = stagesMatch[1].split('\n');
    for (const line of lines) {
      const m = line.match(/^\s+-\s+(.+)/);
      if (m) stages.push(m[1].trim());
    }
  }

  const hasWpSteps = /wp-env|wordpress|phpunit|phpstan|phpcs|playwright/i.test(content);

  return { found: true, stages, has_wp_steps: hasWpSteps };
}

function detectBitbucket(cwd) {
  const content = readFileSafe(join(cwd, 'bitbucket-pipelines.yml'));
  if (!content) return null;

  const hasWpSteps = /wp-env|wordpress|phpunit|phpstan|phpcs|playwright/i.test(content);

  return { found: true, has_wp_steps: hasWpSteps };
}

function detectQualityTools(cwd) {
  return {
    phpstan: existsSafe(join(cwd, 'phpstan.neon')) ||
             existsSafe(join(cwd, 'phpstan.neon.dist')) ||
             existsSafe(join(cwd, 'phpstan.dist.neon')),
    phpcs: existsSafe(join(cwd, 'phpcs.xml')) ||
           existsSafe(join(cwd, 'phpcs.xml.dist')) ||
           existsSafe(join(cwd, '.phpcs.xml')) ||
           existsSafe(join(cwd, '.phpcs.xml.dist')),
    playwright: existsSafe(join(cwd, 'playwright.config.ts')) ||
                existsSafe(join(cwd, 'playwright.config.js')),
    jest: existsSafe(join(cwd, 'jest.config.ts')) ||
          existsSafe(join(cwd, 'jest.config.js')) ||
          existsSafe(join(cwd, 'jest.config.json')),
    phpunit: existsSafe(join(cwd, 'phpunit.xml')) ||
             existsSafe(join(cwd, 'phpunit.xml.dist')),
  };
}

function detectWpEnvReady(cwd) {
  return existsSafe(join(cwd, '.wp-env.json')) ||
         existsSafe(join(cwd, '.wp-env.override.json'));
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const cwdArg = argv.find(a => a.startsWith('--cwd='));
  const cwd = cwdArg ? resolve(cwdArg.split('=')[1]) : process.cwd();

  const githubActions = detectGitHubActions(cwd);
  const gitlabCI = detectGitLabCI(cwd);
  const bitbucket = detectBitbucket(cwd);
  const qualityTools = detectQualityTools(cwd);
  const wpEnvReady = detectWpEnvReady(cwd);

  const hasCi = !!(githubActions || gitlabCI || bitbucket);
  const hasAnyTool = Object.values(qualityTools).some(Boolean);

  const recommendations = [];

  if (!hasCi && hasAnyTool) {
    recommendations.push('Quality tools detected but no CI pipeline configured — consider adding GitHub Actions');
  }
  if (hasCi && !qualityTools.phpstan) {
    recommendations.push('CI pipeline found but no PHPStan config — consider adding static analysis');
  }
  if (hasCi && !qualityTools.phpunit && !qualityTools.jest && !qualityTools.playwright) {
    recommendations.push('CI pipeline found but no test framework detected — consider adding tests');
  }
  if (qualityTools.playwright && !wpEnvReady) {
    recommendations.push('Playwright found but no .wp-env.json — E2E tests may need wp-env for CI');
  }
  if (githubActions?.has_wp_steps) {
    recommendations.push('GitHub Actions with WordPress steps detected — review workflow for optimization');
  }
  if (!hasCi && !hasAnyTool) {
    recommendations.push('No CI/CD configuration or quality tools found — use wp-cicd skill to set up a pipeline');
  }

  const report = {
    tool: 'cicd_inspect',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    cwd,
    found: hasCi,
    platforms: {
      github_actions: githubActions || { found: false },
      gitlab_ci: gitlabCI || { found: false },
      bitbucket: bitbucket || { found: false },
    },
    quality_tools: qualityTools,
    wp_env_ready: wpEnvReady,
    recommendations,
  };

  stdout.write(JSON.stringify(report, null, 2) + '\n');
  exit(hasCi ? 0 : 1);
}

main();
