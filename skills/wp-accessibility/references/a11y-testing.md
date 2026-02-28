# Accessibility Testing Methodology

Use this file when planning and executing accessibility testing for WordPress sites.

## Testing levels

| Level | Method | Coverage | When |
|-------|--------|----------|------|
| 1 | Automated scans | ~30-40% of issues | Every commit/build |
| 2 | Keyboard testing | +20% | Every feature |
| 3 | Screen reader testing | +15% | Major features |
| 4 | Manual expert audit | +25% | Releases, redesigns |

All four levels are needed for comprehensive coverage.

## Level 1: Automated testing

### Per-page scan

```bash
# axe-core CLI
npx @axe-core/cli http://localhost:8888/ --tags wcag2a,wcag2aa

# Playwright with axe
npx playwright test tests/a11y/
```

### What automated tools catch

- Missing alt text
- Missing form labels
- Insufficient color contrast
- Missing document language
- Missing page title
- Duplicate IDs
- Invalid ARIA attributes
- Missing landmarks

### What automated tools miss

- Quality of alt text ("image" vs. meaningful description)
- Logical reading order
- Meaningful heading hierarchy
- Keyboard trap issues
- Focus order correctness
- Context of links ("click here" vs. descriptive)
- Screen reader announcement quality
- Custom widget keyboard patterns

## Level 2: Keyboard testing

### Test procedure

1. **Start at the browser URL bar**
2. **Press Tab** — does focus move to skip link?
3. **Press Enter** on skip link — does focus move to main content?
4. **Tab through the page** — is every interactive element reachable?
5. **Check focus indicators** — is focus always visible?
6. **Test interactive widgets**:
   - Buttons: Enter and Space activate
   - Links: Enter activates
   - Dropdowns: Arrow keys navigate, Enter selects
   - Modals: Tab cycles within, Escape closes
   - Menus: Arrow keys navigate submenus

### Keyboard testing checklist

```
Page: _______________  Date: ___________

Navigation:
- [ ] Skip link is first focusable element
- [ ] Skip link moves focus to main content
- [ ] All navigation links are reachable via Tab
- [ ] Dropdown menus open with Enter/Space
- [ ] Dropdown menus navigate with Arrow keys
- [ ] Escape closes dropdown menus

Content:
- [ ] All links are reachable
- [ ] All buttons are activatable
- [ ] Focus order matches visual order
- [ ] No keyboard traps (can always Tab away)
- [ ] Focus indicator is always visible

Forms:
- [ ] All inputs are reachable
- [ ] Labels are associated (focus on label focuses input)
- [ ] Error messages are reachable
- [ ] Submit button is reachable
- [ ] Required fields are announced

Interactive Components:
- [ ] Modals trap focus and close with Escape
- [ ] Tabs navigate with Arrow keys
- [ ] Accordions toggle with Enter/Space
- [ ] Sliders adjust with Arrow keys
- [ ] Carousels have pause control
```

## Level 3: Screen reader testing

### Quick screen reader test flow

1. **Open the page** with screen reader active
2. **Listen to page title** — is it announced correctly?
3. **Check landmarks** (NVDA: D key) — are header, nav, main, footer present?
4. **Check headings** (NVDA: H key) — is the hierarchy logical (H1 → H2 → H3)?
5. **Read through content** — does the reading order make sense?
6. **Test forms** — are labels announced? Are errors announced?
7. **Test interactive components** — are state changes announced?

### Common screen reader issues in WordPress

| Issue | Cause | Fix |
|-------|-------|-----|
| "Image" with no description | Missing alt text | Add meaningful alt |
| "Link" or "Button" with no label | Icon-only elements | Add `aria-label` or `screen-reader-text` |
| "Group" or "Region" | Unlabeled landmarks | Add `aria-label` to nav, aside |
| State not announced | Missing aria-expanded/selected | Add ARIA state attributes |
| Content skipped | `display:none` or `aria-hidden="true"` | Fix visibility or remove aria-hidden |
| Duplicate announcements | Redundant labels | Remove duplicate text |

### WordPress admin screen reader mode

WordPress admin has a Screen Reader mode: Users → Profile → Enable "Disable the visual editor when writing."

The admin is tested by WordPress core a11y team, but custom admin pages need separate testing.

## Level 4: Manual expert audit

### WCAG 2.2 AA audit structure

Organize by WCAG principle:

**1. Perceivable**
- 1.1 Text Alternatives — alt text for images
- 1.2 Time-Based Media — captions, transcripts
- 1.3 Adaptable — semantic structure, meaningful sequence
- 1.4 Distinguishable — contrast, resize, images of text

**2. Operable**
- 2.1 Keyboard Accessible — all functionality via keyboard
- 2.2 Enough Time — adjustable time limits
- 2.3 Seizures — no flashing > 3/sec
- 2.4 Navigable — skip links, page titles, focus order
- 2.5 Input Modalities — pointer gestures, motion

**3. Understandable**
- 3.1 Readable — page language, unusual words
- 3.2 Predictable — consistent navigation, consistent identification
- 3.3 Input Assistance — error identification, labels, error prevention

**4. Robust**
- 4.1 Compatible — valid HTML, name/role/value

## Testing across WordPress contexts

### Pages to test

| Page | Why |
|------|-----|
| Homepage | Most visited, often most complex |
| Blog archive | Lists, pagination |
| Single post | Content, comments |
| Search results | Dynamic content |
| 404 page | Error handling |
| Contact/forms | Form accessibility |
| WooCommerce checkout | Complex forms, payment |
| Login page | Authentication |

### WordPress-specific elements to check

- **Block editor output** — each block type should be tested
- **Widget areas** — sidebar, footer widgets
- **Navigation menus** — primary, footer, mobile menus
- **Comment forms** — reply, nested comments
- **Pagination** — archive navigation
- **Search** — form and results
- **Admin bar** — visible to logged-in users

## Regression testing strategy

```js
// tests/a11y/critical-pages.spec.js
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const pages = [
    { name: 'Homepage', path: '/' },
    { name: 'Blog', path: '/blog/' },
    { name: 'Contact', path: '/contact/' },
    { name: 'Search', path: '/?s=test' },
];

for (const { name, path } of pages) {
    test(`${name} has no a11y violations`, async ({ page }) => {
        await page.goto(path);
        const results = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa'])
            .analyze();
        expect(results.violations).toEqual([]);
    });
}
```

Run as part of CI to catch regressions automatically.

## Reporting issues

### WordPress core

File accessibility bugs at https://core.trac.wordpress.org/ with the `accessibility` focus.

### Plugin/theme developers

Include:
1. WCAG criterion violated (e.g., "1.1.1 Non-text Content")
2. Steps to reproduce
3. Expected behavior
4. Screen reader / browser / OS used
5. Severity (who is blocked?)
