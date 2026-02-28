---
name: wp-i18n
description: "Use when internationalizing WordPress plugins or themes: PHP gettext functions (__/esc_html__/etc.), JavaScript i18n (@wordpress/i18n), .pot/.po/.mo translation workflow, WP-CLI i18n commands, RTL stylesheet support, and multilingual plugin setup (Polylang/WPML)."
compatibility: "Targets WordPress 6.9+ (PHP 7.2.24+). Filesystem-based agent with bash + node. WP-CLI required for i18n make-pot/make-json."
version: 1.0.0
source: "vinmor/wordpress-manager"
---

# WP i18n

## When to use

- Adding internationalization (i18n) to a WordPress plugin or theme
- Preparing a plugin or theme for WordPress.org submission (i18n is required)
- Generating `.pot` template files from source code
- Adding JavaScript translations via `@wordpress/i18n`
- Supporting right-to-left (RTL) languages such as Arabic, Hebrew, or Persian
- Setting up a multilingual WordPress site with Polylang or WPML

## Inputs required

- **Repo root** — path to the plugin or theme project directory
- **Text domain** — the unique slug used in all gettext calls (matches the plugin/theme slug)
- **Project kind** — `plugin` or `theme` (determines how text domain is loaded)
- **Target languages** — locale codes for translations (e.g., `it_IT`, `de_DE`, `ar`)
- **Whether JS translation is needed** — true if the project has JavaScript files with user-facing strings

## Procedure

### 0) Detect i18n status

Run the detection script to assess the current state of internationalization:

```bash
node skills/wp-i18n/scripts/i18n_inspect.mjs --cwd=/path/to/project
node skills/wp-project-triage/scripts/detect_wp_project.mjs
```

The i18n inspection script outputs JSON with:
- `textDomain` — the text domain declared in the plugin/theme header
- `phpI18n` — count and distribution of PHP gettext function usage
- `jsI18n` — whether `@wordpress/i18n` is installed and configured
- `translationFiles` — existing .pot, .po, .mo, and .json files
- `issues[]` — problems found with severity and suggested fixes

If the project has no i18n at all, start from step 1. If partial i18n exists, jump to the step that addresses the gaps.

### 1) PHP internationalization

Wrap all user-facing strings in PHP files with the appropriate gettext function:

| Function | Use case |
|----------|----------|
| `__('text', 'domain')` | Return translated string |
| `_e('text', 'domain')` | Echo translated string |
| `esc_html__('text', 'domain')` | Return translated + HTML-escaped |
| `esc_html_e('text', 'domain')` | Echo translated + HTML-escaped |
| `esc_attr__('text', 'domain')` | Return translated + attribute-escaped |
| `_n('single', 'plural', $count, 'domain')` | Pluralization |
| `_x('text', 'context', 'domain')` | Disambiguation context |
| `sprintf(__('Hello %s', 'domain'), $name)` | Variable substitution |

Key rules:
- The text domain **must** match the `Text Domain:` header in the main plugin file or `style.css`
- Never pass variables as the first argument — strings must be literal for extraction
- Use `sprintf()` / `printf()` for dynamic content, never string concatenation
- Load the text domain: `load_plugin_textdomain()` on `init` or `load_theme_textdomain()` on `after_setup_theme`

Read: `references/php-i18n.md`

### 2) JavaScript internationalization

For JavaScript files with user-facing strings, use `@wordpress/i18n`:

```js
import { __, _n, _x, sprintf } from '@wordpress/i18n';
const label = __('Save Changes', 'my-plugin');
```

Setup requires:
1. Add `@wordpress/i18n` as a dependency (or use `wp-scripts` which includes it)
2. Register script translations in PHP via `wp_set_script_translations()`
3. Generate JSON translation files from `.po` files via `wp i18n make-json`
4. For blocks, set the `textdomain` field in `block.json`

Read: `references/js-i18n.md`

### 3) Translation file workflow

The WordPress translation pipeline has four file types:

1. **`.pot`** — Template with all extractable strings (generated, never edited manually)
2. **`.po`** — Per-locale translations (human-edited or via Poedit/GlotPress)
3. **`.mo`** — Compiled binary for PHP runtime (generated from `.po`)
4. **`.json`** — Compiled translations for JavaScript (generated from `.po`)

File naming: `{text-domain}-{locale}.{po|mo}` (e.g., `my-plugin-it_IT.po`)

Workflow: extract → `.pot` → create/update `.po` → compile `.mo` + `.json`

Read: `references/translation-workflow.md`

### 4) WP-CLI i18n commands

```bash
wp i18n make-pot . languages/my-plugin.pot --domain=my-plugin
wp i18n make-json languages/ --no-purge
wp i18n make-mo languages/
wp i18n update-po languages/my-plugin.pot languages/
```

Integrate into `package.json`:
```json
{
  "scripts": {
    "i18n:pot": "wp i18n make-pot . languages/my-plugin.pot",
    "i18n:json": "wp i18n make-json languages/ --no-purge",
    "i18n:mo": "wp i18n make-mo languages/",
    "i18n:build": "npm run i18n:pot && npm run i18n:mo && npm run i18n:json"
  }
}
```

Read: `references/wpcli-i18n.md`

### 5) RTL support

WordPress auto-loads `style-rtl.css` when the locale is RTL:
- Use CSS logical properties (`margin-inline-start` vs `margin-left`)
- Use `@wordpress/scripts` with `rtlcss` to auto-generate RTL stylesheets
- Use `is_rtl()` in PHP for conditional logic
- Test with an RTL locale (Arabic `ar` or Hebrew `he_IL`)

Read: `references/rtl-support.md`

### 6) Multilingual site setup

For content translation (not just UI strings):
- **Polylang** (free) — `pll_register_string()`, `pll__()`, `pll_e()`
- **WPML** (paid) — `wpml-config.xml` for custom post types and taxonomies
- Both require hreflang tags and a language switcher

Read: `references/multilingual-setup.md`

## Verification

- `.pot` file generates without errors: `wp i18n make-pot . languages/<domain>.pot`
- Translations load in the UI: switch locale and confirm translated strings
- RTL renders correctly: switch to Arabic and check layout
- Text domain matches: `Text Domain:` header matches domain in all gettext calls
- JS translations work: `wp.i18n.__()` returns translated strings in browser console
- No untranslated strings: search for hardcoded user-facing strings

Re-run: `node skills/wp-i18n/scripts/i18n_inspect.mjs --cwd=/path`

## Failure modes / debugging

- **Translations not loading** — `load_plugin_textdomain()` missing or called on wrong hook; `languages/` path incorrect
- **Wrong text domain** — domain in gettext calls must exactly match `Text Domain:` header
- **JS translations missing** — `wp_set_script_translations()` must be called after `wp_enqueue_script()`; JSON files must exist with correct handle-based naming
- **`.mo` not found** — file must follow `{domain}-{locale}.mo` naming convention
- **Plural forms broken** — verify `Plural-Forms` header in `.po` matches target language
- **`make-pot` misses strings** — strings with variables or concatenation cannot be extracted; refactor to literals with `sprintf()`
- **RTL layout broken** — hardcoded `left`/`right` in CSS; use logical properties or `rtlcss`

## Escalation

- WordPress i18n Handbook: https://developer.wordpress.org/plugins/internationalization/
- CLDR Plural Rules: https://www.unicode.org/cldr/charts/latest/supplemental/language_plural_rules.html
- Translator Handbook: https://make.wordpress.org/polyglots/handbook/
