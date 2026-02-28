---
name: wp-e2e-testing
description: "Use when setting up, writing, or debugging WordPress tests: E2E with Playwright, unit tests with PHPUnit, JavaScript tests with Jest, visual regression, test data generation, wp-env test environment, and CI pipeline integration."
compatibility: "Targets WordPress 6.9+ (PHP 7.2.24+). Filesystem-based agent with bash + node. Some workflows require WP-CLI and Docker."
version: 1.0.0
source: "vinmor/wordpress-manager"
---

# WP E2E Testing

## When to use

Use this skill when the task involves WordPress testing workflows:

- Setting up a test suite from scratch for a WordPress plugin, theme, or block
- Writing E2E tests with Playwright against a running WordPress instance
- Adding PHPUnit tests for PHP code (hooks, filters, REST endpoints, custom post types)
- Writing Jest unit tests for JavaScript/React block code
- Debugging test failures in CI or locally
- Setting up a CI pipeline (GitHub Actions) for WordPress test automation
- Adding visual regression testing to catch unintended UI changes
- Generating test data and fixtures for reproducible test runs
- Configuring wp-env as a Docker-based test environment

## Inputs required

- **Repo root**: current working directory or `--cwd` path
- **Project kind**: plugin, theme, or block (auto-detected via `detect_wp_project.mjs`)
- **Existing test setup**: which frameworks are already configured (auto-detected via `test_inspect.mjs`)
- **CI platform**: GitHub Actions is the primary target; adaptable to others

## Procedure

### 0) Detect existing test setup

Run the detection scripts to understand what is already in place:

```bash
node skills/wp-e2e-testing/scripts/test_inspect.mjs
node skills/wp-project-triage/scripts/detect_wp_project.mjs
```

The `test_inspect.mjs` script outputs JSON with:
- `frameworks` — which test frameworks are configured (Playwright, Jest, PHPUnit, visual regression)
- `testEnvironment` — whether wp-env and Docker are available
- `ci` — whether CI workflows exist and which platform
- `summary` — boolean flags for quick decision-making

Use this output to skip steps that are already complete and focus on gaps.

### 1) Choose testing strategy by project kind

Different WordPress project types need different testing approaches:

| Project kind | E2E (Playwright) | Unit JS (Jest) | Unit PHP (PHPUnit) | Visual regression |
|-------------|:-:|:-:|:-:|:-:|
| Plugin (classic) | Optional | If has JS | Recommended | Optional |
| Plugin (block) | Recommended | Recommended | Recommended | Recommended |
| Theme (classic) | Optional | Rare | Optional | Recommended |
| Theme (block/FSE) | Recommended | If has JS | Optional | Recommended |
| Gutenberg contrib | Required | Required | Required | Required |

**General rule**: if the project has a user-facing UI, add E2E tests. If it has PHP logic (hooks, filters, REST), add PHPUnit. If it has JS/React, add Jest. If appearance matters, add visual regression.

### 2) Set up test environment (wp-env)

wp-env provides a Docker-based WordPress instance purpose-built for testing. It spins up two environments: development (port 8888) and tests (port 8889).

Key steps:
1. Ensure Docker is running (`docker info`)
2. Create or verify `.wp-env.json` in the project root
3. Start the environment with `npx wp-env start`
4. Verify with `npx wp-env run tests-cli wp option get siteurl`

The tests environment is isolated and can be reset without affecting development data. PHPUnit runs inside the tests container. Playwright connects to the development or tests URL.

Read: `references/wp-env-setup.md`

### 3) E2E tests with Playwright

WordPress provides `@wordpress/e2e-test-utils-playwright` which wraps Playwright with WordPress-specific utilities: authenticated admin sessions, block editor helpers, REST API seeding.

Key steps:
1. Install Playwright and WP utilities
2. Configure `playwright.config.ts` with WordPress base URL
3. Write tests using `admin`, `editor`, and `requestUtils` fixtures
4. Run with `npx wp-scripts test-playwright` or `npx playwright test`

Read: `references/playwright-wordpress.md`

### 4) JavaScript unit tests with Jest

`@wordpress/scripts` bundles a preconfigured Jest setup. It handles JSX/TSX transforms, WordPress global mocks, and module resolution.

Key steps:
1. Ensure `@wordpress/scripts` is a devDependency
2. Add a `test-unit-js` script to package.json (or use the default)
3. Create test files alongside source (`*.test.js`) or in `__tests__/`
4. Mock WordPress globals (`wp`, `jQuery`) as needed
5. Run with `npx wp-scripts test-unit-js`

Read: `references/jest-wordpress.md`

### 5) PHP unit tests with PHPUnit

WordPress ships a PHPUnit test bootstrapper. The `wp scaffold plugin-tests` WP-CLI command generates the full scaffolding.

Key steps:
1. Scaffold test files with `wp scaffold plugin-tests my-plugin`
2. Extend `WP_UnitTestCase` for WordPress-aware tests
3. Use `set_up()` and `tear_down()` for test lifecycle
4. Test hooks, filters, REST endpoints, and custom post types
5. Run with `npx wp-env run tests-cli --env-cwd=wp-content/plugins/my-plugin phpunit`

Read: `references/phpunit-wordpress.md`

### 6) Visual regression testing

Screenshot comparison catches unintended UI changes. Playwright's built-in `toHaveScreenshot()` matcher is the simplest approach for WordPress projects already using Playwright.

Key steps:
1. Add screenshot assertions to existing Playwright tests
2. Generate baseline screenshots on the main branch
3. Configure threshold tolerance for acceptable pixel differences
4. Store baselines in the repository or as CI artifacts
5. Review diffs on failure before updating baselines

Read: `references/visual-regression.md`

### 7) Test data and fixtures

Reproducible tests need predictable data. WordPress provides factory methods for PHP tests and REST API utilities for E2E tests.

Key steps:
1. Use `self::factory()->post->create()` in PHPUnit tests
2. Use `requestUtils.createPost()` in Playwright E2E tests
3. Seed bulk data via WP-CLI (`wp post generate`)
4. Clean up after each test to prevent state leakage

Read: `references/test-data-generation.md`

### 8) CI pipeline integration

GitHub Actions is the standard CI platform for WordPress projects. A typical pipeline runs PHPUnit across a PHP version matrix, Jest for JS tests, and Playwright for E2E.

Key steps:
1. Create `.github/workflows/tests.yml`
2. Add MySQL service container for PHPUnit
3. Define a test matrix for PHP and WP version combinations
4. Cache node_modules and Composer vendor
5. Upload Playwright traces and screenshots as artifacts on failure

Read: `references/ci-integration.md`

## Verification

After completing the setup, verify:

- `npx wp-scripts test-unit-js` passes (if Jest tests exist)
- `npx wp-env run tests-cli --env-cwd=wp-content/plugins/<plugin> phpunit` passes (if PHPUnit tests exist)
- `npx wp-scripts test-playwright` passes (if E2E tests exist)
- Visual regression baselines are generated and stored
- CI workflow runs green on push and pull request events
- Test coverage meets project threshold (aim for 80%+ on critical paths)

## Failure modes / debugging

- **wp-env fails to start**: check Docker is running (`docker info`), check port conflicts (`lsof -i :8888`), try `npx wp-env destroy` then `npx wp-env start`
- **Playwright tests timeout**: increase `timeout` in `playwright.config.ts`, ensure wp-env is fully started before tests run, check `baseURL` matches the running instance
- **PHPUnit "No tests executed"**: verify `phpunit.xml` points to the correct test directory, ensure test class extends `WP_UnitTestCase`, ensure method names start with `test_`
- **Jest "Cannot find module"**: check `moduleNameMapper` in jest config, ensure `@wordpress/scripts` is installed, run `npm install` to refresh dependencies
- **Visual regression false positives**: increase pixel threshold, mask dynamic elements (timestamps, ads), use consistent viewport sizes, disable animations in test config
- **CI MySQL connection refused**: ensure the `mysql` service container is healthy before running PHPUnit, add a wait step or health check
- **"Class WP_UnitTestCase not found"**: the test bootstrap is missing or the WordPress test library is not installed; re-run `bin/install-wp-tests.sh` or use wp-env which handles this automatically

## Escalation

- For Gutenberg-specific testing: https://developer.wordpress.org/block-editor/contributors/code/testing-overview/
- For @wordpress/scripts: https://developer.wordpress.org/block-editor/reference-guides/packages/packages-scripts/
- For wp-env: https://developer.wordpress.org/block-editor/reference-guides/packages/packages-env/
- For Playwright WP utilities: https://developer.wordpress.org/block-editor/reference-guides/packages/packages-e2e-test-utils-playwright/
- For PHPUnit with WordPress: https://make.wordpress.org/core/handbook/testing/automated-testing/phpunit/
