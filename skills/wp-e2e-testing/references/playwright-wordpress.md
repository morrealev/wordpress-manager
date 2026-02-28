# Playwright for WordPress E2E Testing

Use this file when writing or configuring Playwright E2E tests for WordPress projects.

## Installation

```bash
npm install -D @playwright/test @wordpress/e2e-test-utils-playwright
npx playwright install chromium
```

## Configuration (`playwright.config.ts`)

```ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  outputDir: './tests/e2e/artifacts',
  fullyParallel: false, // WordPress state can conflict in parallel
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: process.env.WP_BASE_URL || 'http://localhost:8888',
    storageState: process.env.STORAGE_STATE_PATH,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npx wp-env start',
    url: 'http://localhost:8888',
    reuseExistingServer: true,
    timeout: 120000,
  },
});
```

## WordPress-specific fixtures

`@wordpress/e2e-test-utils-playwright` provides fixtures:

```ts
import { test, expect } from '@wordpress/e2e-test-utils-playwright';

test('can create a post', async ({ admin, editor, page }) => {
  await admin.visitAdminPage('post-new.php');
  await editor.canvas.locator('[data-type="core/paragraph"]').click();
  await page.keyboard.type('Hello from Playwright');
  await editor.publishPost();
  await expect(page.locator('.components-snackbar')).toContainText('published');
});
```

Key fixtures:
- `admin` — navigate to admin pages, authenticated as admin
- `editor` — block editor helpers (canvas, inserter, publish)
- `requestUtils` — REST API helpers for test data setup
- `page` — standard Playwright page object

## Authentication setup

Create a global setup that stores auth state:

```ts
// tests/e2e/global-setup.ts
import { request } from '@playwright/test';

export default async function globalSetup() {
  const api = await request.newContext({ baseURL: 'http://localhost:8888' });
  await api.post('/wp-login.php', {
    form: { log: 'admin', pwd: 'password', rememberme: 'forever' },
  });
  await api.storageState({ path: './tests/e2e/.auth/admin.json' });
  await api.dispose();
}
```

## Seeding test data via REST

```ts
test.beforeAll(async ({ requestUtils }) => {
  await requestUtils.createPost({
    title: 'Test Post',
    content: '<!-- wp:paragraph --><p>Content</p><!-- /wp:paragraph -->',
    status: 'publish',
  });
});

test.afterAll(async ({ requestUtils }) => {
  await requestUtils.deleteAllPosts();
});
```

## Running tests

```bash
npx wp-scripts test-playwright              # Using @wordpress/scripts
npx playwright test                          # Direct Playwright
npx playwright test --ui                     # Interactive UI mode
npx playwright test --grep "block editor"    # Filter by title
```

## Best practices

- Use `test.describe.serial()` for tests that depend on order
- Clean up test data in `afterAll` to prevent state leakage
- Use `page.waitForLoadState('networkidle')` sparingly — prefer specific selectors
- Store authentication state to avoid login in every test
- Use `test.slow()` for tests involving complex editor operations
