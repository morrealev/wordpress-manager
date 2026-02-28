# Visual Regression Testing

Use this file when adding screenshot-based visual regression tests to a WordPress project.

## Playwright built-in approach (recommended)

Playwright includes `toHaveScreenshot()` for visual comparison:

```ts
import { test, expect } from '@wordpress/e2e-test-utils-playwright';

test('homepage matches visual baseline', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveScreenshot('homepage.png', {
    maxDiffPixelRatio: 0.01, // Allow 1% pixel difference
  });
});

test('block renders correctly in editor', async ({ admin, editor, page }) => {
  await admin.visitAdminPage('post-new.php');
  await editor.insertBlock({ name: 'my-plugin/my-block' });
  const block = editor.canvas.locator('[data-type="my-plugin/my-block"]');
  await expect(block).toHaveScreenshot('my-block-editor.png');
});
```

## Generating baselines

```bash
# First run: creates baseline screenshots
npx playwright test --update-snapshots

# Subsequent runs: compare against baselines
npx playwright test
```

Baselines are stored in `tests/e2e/__snapshots__/` by default.

## Handling dynamic content

Mask elements that change between runs:

```ts
await expect(page).toHaveScreenshot('dashboard.png', {
  mask: [
    page.locator('.current-time'),
    page.locator('.random-ad'),
    page.locator('#wpadminbar'), // Admin bar may show user-specific data
  ],
});
```

## Disable animations

Add to `playwright.config.ts` to prevent animation-related flakiness:

```ts
use: {
  // ...
  contextOptions: {
    reducedMotion: 'reduce',
  },
},
```

## Consistent viewport

```ts
use: {
  viewport: { width: 1280, height: 720 },
},
```

## CI integration

Playwright stores screenshots as test artifacts. In GitHub Actions:

```yaml
- uses: actions/upload-artifact@v4
  if: failure()
  with:
    name: visual-regression-diffs
    path: tests/e2e/artifacts/
    retention-days: 7
```

## Updating baselines after intentional changes

```bash
npx playwright test --update-snapshots
git add tests/e2e/__snapshots__/
git commit -m "Update visual regression baselines"
```

## Threshold tuning

- `maxDiffPixelRatio: 0.01` — 1% tolerance (good default)
- `maxDiffPixels: 100` — absolute pixel count tolerance
- `threshold: 0.2` — per-pixel color sensitivity (0-1, lower = stricter)

Use higher thresholds for pages with web fonts (rendering varies across OS).

## Common issues

- **False positives on CI**: OS font rendering differs; consider running in Docker or using consistent font stacks
- **Flaky screenshots**: add `await page.waitForLoadState('networkidle')` before screenshots; mask dynamic elements
- **Large snapshot files**: use PNG compression; store in Git LFS for large projects
