---
name: wp-accessibility
description: "Use when improving WordPress accessibility: block accessibility (ARIA, keyboard navigation), theme accessibility (landmarks, skip links, color contrast), interactive component accessibility, media accessibility (alt text, captions, transcripts), and automated/manual a11y testing with WCAG 2.2 compliance."
compatibility: "Targets WordPress 6.9+ (PHP 7.2.24+). Filesystem-based agent with bash + node."
version: 1.0.0
source: "vinmor/wordpress-manager"
---

# WP Accessibility

## When to use

Use this skill for accessibility work such as:

- Making custom blocks accessible (ARIA roles, keyboard navigation, screen reader support)
- Ensuring a theme meets WCAG 2.2 AA requirements
- Fixing accessibility audit findings (axe-core violations, Lighthouse issues)
- Adding keyboard navigation to interactive components (modals, tabs, dropdowns, accordions)
- Implementing ARIA patterns from the APG (ARIA Authoring Practices Guide)
- Making media accessible (alt text, captions, transcripts, audio descriptions)
- Preparing a theme for WordPress.org `accessibility-ready` tag
- Setting up automated a11y testing in CI pipelines

## Inputs required

- Repo root and target (plugin, theme, or block).
- Project kind: plugin, theme, block, or full site.
- Target WCAG level: AA (default) or AAA.
- Specific a11y issues reported (audit results, user feedback, review team comments).

## Procedure

### 0) Understand WordPress a11y standards

WordPress core has a dedicated Accessibility Team. Key principles:

1. **WordPress.org theme review** requires `accessibility-ready` themes to pass tests covering skip links, keyboard navigation, contrast, heading hierarchy, landmarks, and form labels.
2. **Block editor** blocks must meet core a11y standards: `useBlockProps()` provides baseline ARIA attributes; interactive blocks must handle keyboard events.
3. **WCAG 2.2** is the target standard. WordPress aims for Level AA at minimum.

For automated a11y testing setup, reference the `wp-e2e-testing` skill.

Run project triage:
```bash
node skills/wp-project-triage/scripts/detect_wp_project.mjs
```

### 1) Block accessibility

Ensure custom blocks are accessible to keyboard and screen reader users.

Key areas:
- ARIA roles and properties for custom block markup
- Keyboard interaction patterns for block controls
- Focus management when blocks are inserted, removed, or transformed
- Screen reader announcements via `wp.a11y.speak()`
- Block supports: `anchor`, `ariaLabel`

Read: `references/block-a11y.md`

### 2) Theme accessibility

Ensure the theme meets WCAG 2.2 and `accessibility-ready` requirements.

Key areas:
- Landmark roles: `<header>`, `<nav>`, `<main>`, `<footer>`, `<aside>`
- Skip links to main content
- Heading hierarchy (single H1, logical nesting)
- Color contrast (4.5:1 normal text, 3:1 large text at AA)
- Visible focus indicators (`:focus-visible`)
- `prefers-reduced-motion` and `prefers-contrast` media queries
- `theme.json` color palette contrast compliance

Read: `references/theme-a11y.md`

### 3) Interactive component accessibility

Implement ARIA design patterns from the APG for interactive UI components.

Key areas:
- Modal/dialog: focus trap, Escape to close, return focus to trigger
- Dropdown/menu: arrow key navigation, typeahead
- Tabs: arrow keys to switch, Home/End support
- Accordion: `aria-expanded`, Enter/Space to toggle
- Carousel: pause on hover/focus, slide announcements
- Live regions for dynamic content updates
- WordPress Interactivity API + a11y: pair `data-wp-on--click` with `data-wp-on--keydown`

Read: `references/interactive-a11y.md`

### 4) Media accessibility

Ensure all media content has appropriate text alternatives.

Key areas:
- Alt text for images (meaningful vs decorative `alt=""`)
- Video captions (`<track kind="captions">`) and audio descriptions
- Audio transcripts as text alternatives
- SVG accessibility: `role="img"` + `aria-label` or `<title>`
- WordPress media library alt text handling

Read: `references/media-a11y.md`

### 5) Automated a11y testing

Set up automated accessibility testing to catch regressions early.

Key areas:
- axe-core integration with Playwright (`@axe-core/playwright`)
- pa11y for quick page-level checks
- Lighthouse accessibility audits
- CI pipeline integration
- Interpreting and prioritizing violations

Read: `references/a11y-audit-tools.md`

### 6) Manual a11y testing

Automated tools catch only ~30-40% of a11y issues. Manual testing is essential.

Key areas:
- Keyboard-only navigation testing
- Screen reader testing (NVDA, VoiceOver, TalkBack)
- Zoom testing (200% and 400%)
- Color contrast verification
- Reduced motion preference testing
- Systematic per-page testing checklist

Read: `references/a11y-testing.md`

## Verification

- **axe-core** returns 0 violations at the target WCAG level
- **Keyboard** works for all interactive elements: focusable, operable, visible focus
- **Screen reader** announces correctly: landmarks, headings, form labels, updates
- **Color contrast** passes: 4.5:1 normal text, 3:1 large text (AA)
- **Heading hierarchy** is logical: single H1, no skipped levels
- **Skip link** is present and functional
- **Zoom to 400%** causes no content loss or horizontal scroll
- **Reduced motion** is respected: animations disabled when preference set

```bash
npx pa11y http://localhost:8888
npx lighthouse http://localhost:8888 --only-categories=accessibility --output=json
```

## Failure modes / debugging

| Symptom | Cause | Fix |
|---------|-------|-----|
| "Insufficient color contrast" | Ratio below 4.5:1 | Adjust in `theme.json` or CSS |
| "Images must have alt text" | Missing `alt` | Add via media library or `wp_get_attachment_image()` |
| "No main landmark" | Missing `<main>` | Add `<main id="main-content">` |
| "No level-one heading" | Missing/multiple H1 | Single `<h1>` per page |
| Can't reach element via keyboard | Non-interactive element | Use `<button>` or `<a>` instead of `<div>` |
| Focus trapped | Bad focus trap | Only trap in modals; release on close |
| No announcement on update | Missing live region | `aria-live="polite"` or `wp.a11y.speak()` |
| Wrong reading order | DOM/visual mismatch | Align DOM with visual order |
| Focus not visible | Outline removed | Use `:focus-visible` with visible style |

## Escalation

- WordPress Accessibility Handbook: https://make.wordpress.org/accessibility/handbook/
- WCAG 2.2: https://www.w3.org/TR/WCAG22/
- ARIA Authoring Practices Guide: https://www.w3.org/WAI/ARIA/apg/
- WordPress Accessibility Coding Standards: https://developer.wordpress.org/coding-standards/wordpress-coding-standards/accessibility/

## Recommended Agent

For automated accessibility scanning and WCAG compliance reports, use the **`wp-accessibility-auditor`** agent.
