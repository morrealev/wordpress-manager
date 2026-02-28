# Translation Workflow

Use this file when managing the .pot/.po/.mo translation file lifecycle.

## File types

| File | Purpose | Format |
|------|---------|--------|
| `.pot` | Template — master list of all translatable strings | Portable Object Template |
| `.po` | Translation — human-editable translations for a locale | Portable Object |
| `.mo` | Compiled — binary version loaded by PHP at runtime | Machine Object |
| `.json` | JS translations — JED format for `@wordpress/i18n` | JSON |

## Directory structure

```
my-plugin/
├── languages/
│   ├── my-text-domain.pot              # Template
│   ├── my-text-domain-it_IT.po         # Italian translations
│   ├── my-text-domain-it_IT.mo         # Compiled Italian
│   ├── my-text-domain-it_IT-{hash}.json  # JS Italian translations
│   └── my-text-domain-de_DE.po         # German translations
```

Naming convention: `{text-domain}-{locale}.{ext}`

Common locales: `it_IT`, `de_DE`, `fr_FR`, `es_ES`, `pt_BR`, `ja`, `zh_CN`, `ar`

## Step 1: Generate POT file

```bash
# From plugin root
wp i18n make-pot . languages/my-text-domain.pot

# With options
wp i18n make-pot . languages/my-text-domain.pot \
    --slug=my-plugin \
    --domain=my-text-domain \
    --include="src/,includes/" \
    --exclude="node_modules/,vendor/,tests/" \
    --headers='{"Report-Msgid-Bugs-To":"https://github.com/user/repo/issues"}'
```

The `make-pot` command scans:
- PHP files for `__()`, `_e()`, `esc_html__()`, etc.
- JS/JSX files for `@wordpress/i18n` calls
- `block.json` files for translatable fields (title, description, keywords)

## Step 2: Create/update PO files

### From scratch

```bash
# Create a new PO file for Italian
msginit --input=languages/my-text-domain.pot \
        --output-file=languages/my-text-domain-it_IT.po \
        --locale=it_IT
```

### Update existing PO with new strings

```bash
# Merge new POT into existing PO (preserves existing translations)
wp i18n update-po languages/my-text-domain.pot languages/
```

Or with `msgmerge`:
```bash
msgmerge --update languages/my-text-domain-it_IT.po languages/my-text-domain.pot
```

## Step 3: Translate

### Using a PO editor

Recommended tools:
- **Poedit** (desktop, free + pro) — the standard tool
- **GlotPress** (web-based, used by WordPress.org)
- **Loco Translate** (WordPress plugin, in-dashboard editing)

### PO file format

```po
#: src/includes/class-main.php:42
#. translators: %s: site name
msgid "Welcome to %s"
msgstr "Benvenuto su %s"

#: src/includes/class-main.php:55
msgid "Save Changes"
msgstr "Salva Modifiche"

#: src/includes/class-main.php:60
msgctxt "verb"
msgid "Post"
msgstr "Pubblica"

#: src/includes/class-main.php:70
msgid "%d item"
msgid_plural "%d items"
msgstr[0] "%d elemento"
msgstr[1] "%d elementi"
```

## Step 4: Compile MO files

```bash
# Compile all PO files to MO
wp i18n make-mo languages/

# Or with msgfmt
msgfmt languages/my-text-domain-it_IT.po -o languages/my-text-domain-it_IT.mo
```

## Step 5: Generate JSON for JavaScript

```bash
# Generate JSON from PO files (for wp_set_script_translations)
wp i18n make-json languages/ --no-purge
```

`--no-purge` keeps the JS strings in the PO file (useful if you also use them server-side).

## Automation: Build script integration

### package.json

```json
{
    "scripts": {
        "i18n:pot": "wp i18n make-pot . languages/my-text-domain.pot --exclude=node_modules/,vendor/",
        "i18n:update": "wp i18n update-po languages/my-text-domain.pot languages/",
        "i18n:mo": "wp i18n make-mo languages/",
        "i18n:json": "wp i18n make-json languages/ --no-purge",
        "i18n:build": "npm run i18n:pot && npm run i18n:update && npm run i18n:mo && npm run i18n:json"
    }
}
```

### Pre-release checklist

1. Run `wp i18n make-pot` to capture all new strings
2. Run `wp i18n update-po` to merge into existing translations
3. Send updated PO files to translators
4. Compile MO files after translations are complete
5. Generate JSON files for JS strings
6. Test each locale by switching `WPLANG` in `wp-config.php`

## WordPress.org translation (GlotPress)

For plugins/themes hosted on WordPress.org:
1. Set `Text Domain` and `Domain Path` in the plugin header
2. Upload the POT file to SVN `trunk/languages/`
3. Translations are crowdsourced via translate.wordpress.org
4. Users receive translations automatically via WordPress updates

Plugin header:
```php
/**
 * Plugin Name: My Plugin
 * Text Domain: my-text-domain
 * Domain Path: /languages
 */
```

## Verification

```bash
# Check PO file for errors
msgfmt --check languages/my-text-domain-it_IT.po

# Count translated/untranslated strings
msgfmt --statistics languages/my-text-domain-it_IT.po

# Verify text domain consistency
grep -rn "__('" --include="*.php" src/ | grep -v "'my-text-domain'"
```
