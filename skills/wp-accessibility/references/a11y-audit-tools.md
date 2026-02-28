# Accessibility Audit Tools

Use this file when selecting and configuring tools for accessibility testing.

## Automated testing tools

### axe-core (Deque)

Industry standard engine. Used by Google Lighthouse, Microsoft Accessibility Insights.

```bash
# CLI testing
npx @axe-core/cli https://localhost:8888/

# With specific tags
npx @axe-core/cli https://localhost:8888/ --tags wcag2a,wcag2aa

# Save results
npx @axe-core/cli https://localhost:8888/ --save results.json
```

Browser extensions:
- **axe DevTools** (Chrome/Firefox) — free version covers most WCAG checks
- **Accessibility Insights** (Microsoft, Chrome) — guided assessments

### Playwright integration

```js
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('homepage has no a11y violations', async ({ page }) => {
    await page.goto('/');

    const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .exclude('.third-party-widget') // exclude elements you don't control
        .analyze();

    expect(results.violations).toEqual([]);
});

test('editor page is accessible', async ({ page }) => {
    await page.goto('/wp-admin/post-new.php');

    const results = await new AxeBuilder({ page })
        .include('.editor-styles-wrapper') // focus on specific area
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();

    expect(results.violations).toEqual([]);
});
```

### pa11y

```bash
# Single page
npx pa11y https://localhost:8888/

# With specific standard
npx pa11y --standard WCAG2AA https://localhost:8888/

# Multiple pages
npx pa11y-ci --config .pa11yci.json
```

`.pa11yci.json`:
```json
{
    "defaults": {
        "standard": "WCAG2AA",
        "timeout": 30000,
        "wait": 1000
    },
    "urls": [
        "http://localhost:8888/",
        "http://localhost:8888/sample-page/",
        "http://localhost:8888/blog/",
        "http://localhost:8888/contact/"
    ]
}
```

### Lighthouse

```bash
# Accessibility audit via CLI
npx lighthouse https://localhost:8888/ --only-categories=accessibility --output=json --output-path=a11y-report.json

# Chrome DevTools: Lighthouse tab → Accessibility checkbox → Generate report
```

## WordPress-specific tools

### WordPress Accessibility Checker plugin

Dashboard widget showing issues per page/post.

### FLAVOR (by WordPress a11y team)

Browser extension specifically for WordPress theme review. Tests `accessibility-ready` requirements.

### WP-CLI health check

```bash
# Check theme support for accessibility features
wp theme mod list
wp eval "var_dump(current_theme_supports('html5'));"
```

## Color contrast tools

### WebAIM Contrast Checker

https://webaim.org/resources/contrastchecker/

| Ratio | WCAG Level | Applies to |
|-------|-----------|-----------|
| 4.5:1 | AA | Normal text (< 24px / 18.66px bold) |
| 3:1 | AA | Large text (≥ 24px / 18.66px bold) |
| 7:1 | AAA | Normal text |
| 4.5:1 | AAA | Large text |
| 3:1 | AA | UI components and graphical objects |

### Programmatic contrast checking

```js
// Calculate relative luminance
function luminance(r, g, b) {
    const [rs, gs, bs] = [r, g, b].map((c) => {
        c = c / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function contrastRatio(rgb1, rgb2) {
    const l1 = luminance(...rgb1);
    const l2 = luminance(...rgb2);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
}
```

### Browser DevTools

Chrome DevTools: Inspect element → Color picker → Shows contrast ratio and WCAG compliance.

Firefox: Accessibility tab in DevTools → Check for Issues → Contrast.

## Screen readers

### Testing matrix

| OS | Screen Reader | Browser |
|----|--------------|---------|
| Windows | NVDA (free) | Firefox or Chrome |
| Windows | JAWS | Chrome or Edge |
| macOS | VoiceOver (built-in) | Safari |
| iOS | VoiceOver (built-in) | Safari |
| Android | TalkBack (built-in) | Chrome |

### NVDA quick reference

| Key | Action |
|-----|--------|
| Insert+Space | Toggle focus/browse mode |
| H | Next heading |
| Shift+H | Previous heading |
| D | Next landmark |
| Tab | Next focusable element |
| Insert+F7 | Elements list (links, headings, landmarks) |

### VoiceOver quick reference (macOS)

| Key | Action |
|-----|--------|
| Cmd+F5 | Toggle VoiceOver |
| VO+Right | Next element |
| VO+Left | Previous element |
| VO+U | Rotor (navigate by headings, links, etc.) |
| Tab | Next focusable element |

(VO = Control+Option)

## CI/CD integration

### GitHub Actions

```yaml
name: Accessibility Tests
on: [push, pull_request]

jobs:
  a11y:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Start WordPress
        run: npx wp-env start

      - name: Run axe tests
        run: npx @axe-core/cli http://localhost:8888/ --tags wcag2a,wcag2aa --exit

      - name: Run pa11y
        run: npx pa11y-ci --config .pa11yci.json
```

## Audit report template

```markdown
## Accessibility Audit Report

**Date:** YYYY-MM-DD
**Standard:** WCAG 2.2 Level AA
**Tool:** axe-core 4.x + manual testing

### Summary
- Critical: X issues
- Serious: X issues
- Moderate: X issues
- Minor: X issues

### Critical Issues
1. **[Rule ID]** — Description
   - Location: page/element
   - Impact: who is affected
   - Fix: recommended remediation

### Manual Testing Results
- [ ] Keyboard navigation: Pass/Fail
- [ ] Screen reader: Pass/Fail
- [ ] Color contrast: Pass/Fail
- [ ] Zoom 200%: Pass/Fail
- [ ] Reduced motion: Pass/Fail
```

## Verification

Automated tools catch ~30-40% of accessibility issues. Always supplement with:
1. Keyboard-only navigation test
2. Screen reader walk-through
3. Color contrast verification
4. Content zoom to 200%
5. Reduced motion preference test
