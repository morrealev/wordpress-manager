# WP-CLI i18n Commands

Use this file when working with WP-CLI's `i18n` command group for translation management.

## Prerequisites

```bash
# WP-CLI i18n is built-in since WP-CLI 2.0
wp i18n --help

# If missing, install the i18n command package
wp package install wp-cli/i18n-command
```

## make-pot — Generate POT template

```bash
# Basic usage (from plugin/theme root)
wp i18n make-pot . languages/my-text-domain.pot

# Full options
wp i18n make-pot . languages/my-text-domain.pot \
    --slug=my-plugin \
    --domain=my-text-domain \
    --include="src/,includes/,templates/" \
    --exclude="node_modules/,vendor/,tests/,build/" \
    --skip-js \
    --skip-php \
    --skip-block-json \
    --skip-theme-json \
    --skip-audit \
    --headers='{"Report-Msgid-Bugs-To":"support@example.com","Last-Translator":"Dev Team"}' \
    --file-comment="Copyright (c) 2026 My Company"
```

### Key options

| Option | Purpose |
|--------|---------|
| `--domain=<domain>` | Only extract strings with this text domain |
| `--include=<paths>` | Comma-separated list of directories to scan |
| `--exclude=<paths>` | Comma-separated list of directories to skip |
| `--skip-js` | Skip JavaScript file scanning |
| `--skip-php` | Skip PHP file scanning |
| `--skip-block-json` | Skip block.json translation extraction |
| `--skip-theme-json` | Skip theme.json translation extraction |
| `--skip-audit` | Skip string auditing (faster, no warnings) |
| `--headers` | JSON object of PO headers |

### What it scans

- PHP: `__()`, `_e()`, `_x()`, `_ex()`, `_n()`, `_nx()`, `esc_html__()`, `esc_html_e()`, `esc_attr__()`, `esc_attr_e()`, `esc_html_x()`, `esc_attr_x()`
- JS: `@wordpress/i18n` functions via static analysis
- block.json: `title`, `description`, `keywords`, `styles[].label`, `variations[].title`
- theme.json: Custom template names, style variation names

## update-po — Merge new strings into PO files

```bash
# Update all PO files in the directory
wp i18n update-po languages/my-text-domain.pot languages/

# Update a specific PO file
wp i18n update-po languages/my-text-domain.pot languages/my-text-domain-it_IT.po
```

This is equivalent to `msgmerge --update` but integrated into WP-CLI. Preserves existing translations and marks removed strings as obsolete.

## make-mo — Compile PO to MO

```bash
# Compile all PO files in directory
wp i18n make-mo languages/

# Compile a specific file
wp i18n make-mo languages/my-text-domain-it_IT.po
```

## make-json — Generate JS translation files

```bash
# Generate JSON files for all PO files
wp i18n make-json languages/

# Keep JS strings in PO files (don't purge)
wp i18n make-json languages/ --no-purge

# Pretty-print JSON output
wp i18n make-json languages/ --pretty-print
```

Output: `{text-domain}-{locale}-{md5}.json` where `{md5}` is the hash of the relative JS file path.

### When to use `--no-purge`

- Use `--no-purge` if strings appear in both PHP and JS files
- Without it, JS-only strings are removed from PO, breaking PHP translations if shared

## make-php — Generate PHP translation files (WP 6.5+)

```bash
# Convert PO files to PHP format
wp i18n make-php languages/
```

PHP translation files load faster than MO files. WordPress 6.5+ supports this format natively.

## Complete workflow example

```bash
# 1. Generate fresh POT
wp i18n make-pot . languages/my-text-domain.pot \
    --exclude="node_modules/,vendor/"

# 2. Update existing translations
wp i18n update-po languages/my-text-domain.pot languages/

# 3. (Translate the PO files — manual or via Poedit)

# 4. Compile MO files
wp i18n make-mo languages/

# 5. Generate JSON for JavaScript
wp i18n make-json languages/ --no-purge

# 6. (Optional) Generate PHP translations
wp i18n make-php languages/
```

## Audit strings

The `make-pot` command includes a string auditor. Common warnings:

| Warning | Meaning |
|---------|---------|
| `Mismatched placeholders` | Printf placeholders differ between singular/plural |
| `Multiple text domains` | File mixes text domains |
| `Missing translator comment` | Placeholder string without `/* translators: */` |

Run the audit explicitly:
```bash
wp i18n make-pot . /dev/null --skip-js
# Warnings are printed to stderr
```

## Language management

```bash
# Install a language pack for core
wp language core install it_IT

# Set site language
wp site switch-language it_IT

# List installed languages
wp language core list --status=installed

# Install plugin language pack
wp language plugin install my-plugin it_IT

# Install theme language pack
wp language theme install my-theme it_IT
```

## Verification

```bash
# Verify POT is up to date (compare counts)
wp i18n make-pot . /tmp/fresh.pot --quiet
diff <(grep -c "^msgid" languages/my-text-domain.pot) <(grep -c "^msgid" /tmp/fresh.pot)

# Check MO files are current (MO should be newer than PO)
find languages/ -name "*.po" -newer languages/*.mo

# Verify JSON files exist for JS translations
ls languages/*.json
```
