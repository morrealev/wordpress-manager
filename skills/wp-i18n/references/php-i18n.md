# PHP Internationalization

Use this file when internationalizing PHP code in WordPress plugins and themes.

## Core translation functions

### Simple strings

```php
// Return translated string
$text = __('Hello World', 'my-text-domain');

// Echo translated string
_e('Hello World', 'my-text-domain');
```

### Strings with context

```php
// "Post" as a verb vs noun
$verb = _x('Post', 'verb', 'my-text-domain');
$noun = _x('Post', 'noun', 'my-text-domain');

// Echo version
_ex('Post', 'verb', 'my-text-domain');
```

### Strings with variables

```php
// Single placeholder
$text = sprintf(
    /* translators: %s: user display name */
    __('Welcome, %s!', 'my-text-domain'),
    $user->display_name
);

// Multiple placeholders (use numbered)
$text = sprintf(
    /* translators: 1: product name, 2: price */
    __('%1$s costs %2$s', 'my-text-domain'),
    $product_name,
    $price
);
```

### Plurals

```php
$text = sprintf(
    /* translators: %d: number of items */
    _n('%d item', '%d items', $count, 'my-text-domain'),
    $count
);

// With context
$text = sprintf(
    _nx('%d post', '%d posts', $count, 'blog posts', 'my-text-domain'),
    $count
);
```

## Escaping functions

Always use escaping variants when outputting to HTML:

```php
// Escape for HTML content
echo esc_html__('Safe text', 'my-text-domain');
esc_html_e('Safe text', 'my-text-domain');

// Escape for HTML attributes
echo esc_attr__('attribute value', 'my-text-domain');
esc_attr_e('attribute value', 'my-text-domain');

// With context
echo esc_html_x('Post', 'verb', 'my-text-domain');
```

### When to use which

| Context | Function |
|---------|----------|
| HTML content | `esc_html__()` / `esc_html_e()` |
| HTML attributes | `esc_attr__()` / `esc_attr_e()` |
| URLs | `esc_url()` around `__()` |
| JavaScript strings | `esc_js()` around `__()` |
| Already-safe internal use | `__()` / `_e()` |

## Text domain loading

### Plugins

```php
add_action('init', function() {
    load_plugin_textdomain(
        'my-text-domain',
        false,
        dirname(plugin_basename(__FILE__)) . '/languages'
    );
});
```

### Themes

```php
add_action('after_setup_theme', function() {
    load_theme_textdomain(
        'my-text-domain',
        get_template_directory() . '/languages'
    );
});

// Child theme
add_action('after_setup_theme', function() {
    load_child_theme_textdomain(
        'my-child-domain',
        get_stylesheet_directory() . '/languages'
    );
});
```

### WordPress 6.7+ (automatic loading)

Since WordPress 6.7, translation files placed in `wp-content/languages/plugins/` or `wp-content/languages/themes/` are loaded automatically. Manual `load_plugin_textdomain()` is still recommended as a fallback.

## Common mistakes

### Do NOT concatenate translatable strings

```php
// WRONG — translators cannot reorder
__('There are ' . $count . ' items', 'my-text-domain');

// CORRECT
sprintf(__('There are %d items', 'my-text-domain'), $count);
```

### Do NOT use variables as text domain

```php
// WRONG — tools cannot extract
__('Hello', $domain);

// CORRECT — literal string only
__('Hello', 'my-text-domain');
```

### Do NOT translate HTML

```php
// WRONG — HTML in translatable string
__('<strong>Warning:</strong> This is dangerous', 'my-text-domain');

// CORRECT — separate HTML from text
'<strong>' . esc_html__('Warning:', 'my-text-domain') . '</strong> '
    . esc_html__('This is dangerous', 'my-text-domain');
```

### Do NOT split sentences

```php
// WRONG — sentence split across calls
__('Click ', 'my-text-domain') . '<a>' . __('here', 'my-text-domain') . '</a>';

// CORRECT — full sentence with placeholder
sprintf(
    /* translators: %s: link HTML */
    __('Click %s for details', 'my-text-domain'),
    '<a href="...">' . esc_html__('here', 'my-text-domain') . '</a>'
);
```

## Translator comments

Add context for translators with `/* translators: */` comments:

```php
/* translators: %s: date in ISO 8601 format */
sprintf(__('Published on %s', 'my-text-domain'), $date);

/* translators: 1: opening link tag, 2: closing link tag */
sprintf(__('Read the %1$sfull article%2$s', 'my-text-domain'), '<a href="...">', '</a>');
```

These comments must appear on the line immediately before the translation function call.

## Verification

```bash
# Check for missing text domains
wp i18n make-pot . languages/my-text-domain.pot --slug=my-text-domain

# Audit for untranslated strings
grep -rn "echo \"\|echo '" --include="*.php" | grep -v "__\|_e\|esc_"
```
