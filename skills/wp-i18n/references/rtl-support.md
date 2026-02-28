# RTL (Right-to-Left) Support

Use this file when adding right-to-left language support to WordPress themes and plugins.

## RTL languages

Arabic (`ar`), Hebrew (`he`), Persian/Farsi (`fa`), Urdu (`ur`), Pashto (`ps`), Sindhi (`sd`), Kurdish (Sorani) (`ckb`), Uyghur (`ug`), Divehi (`dv`).

## How WordPress handles RTL

WordPress automatically:
1. Sets `dir="rtl"` on `<html>` when the locale is RTL
2. Adds `class="rtl"` to `<body>`
3. Loads `*-rtl.css` stylesheets (if they exist) instead of `*.css`

Check direction in PHP:
```php
if (is_rtl()) {
    // RTL-specific logic
}
```

Check in JavaScript:
```js
const isRtl = document.documentElement.dir === 'rtl';
// or
const isRtl = document.body.classList.contains('rtl');
```

## CSS approach: Logical properties (recommended)

Modern CSS logical properties handle both LTR and RTL automatically:

```css
/* AVOID physical properties */
.card {
    margin-left: 20px;      /* LTR only */
    padding-right: 10px;    /* LTR only */
    text-align: left;       /* LTR only */
    float: left;            /* LTR only */
    border-left: 1px solid; /* LTR only */
}

/* USE logical properties */
.card {
    margin-inline-start: 20px;     /* left in LTR, right in RTL */
    padding-inline-end: 10px;      /* right in LTR, left in RTL */
    text-align: start;             /* left in LTR, right in RTL */
    float: inline-start;           /* left in LTR, right in RTL */
    border-inline-start: 1px solid; /* left in LTR, right in RTL */
}
```

### Logical property mapping

| Physical | Logical | LTR | RTL |
|----------|---------|-----|-----|
| `left` | `inline-start` | left | right |
| `right` | `inline-end` | right | left |
| `margin-left` | `margin-inline-start` | margin-left | margin-right |
| `margin-right` | `margin-inline-end` | margin-right | margin-left |
| `padding-left` | `padding-inline-start` | padding-left | padding-right |
| `padding-right` | `padding-inline-end` | padding-right | padding-left |
| `border-left` | `border-inline-start` | border-left | border-right |
| `text-align: left` | `text-align: start` | left | right |
| `float: left` | `float: inline-start` | left | right |

### Shorthand

```css
/* Physical: top right bottom left */
margin: 10px 20px 10px 0;

/* Logical */
margin-block: 10px;         /* top and bottom */
margin-inline: 0 20px;      /* start and end */
```

## CSS approach: RTL stylesheets (legacy)

### Automatic RTL generation

```bash
# Generate RTL stylesheets with rtlcss
npx rtlcss style.css style-rtl.css

# Watch mode
npx rtlcss -w src/style.css dist/style-rtl.css
```

### rtlcss directives

Control flipping with comments:

```css
/* rtl:ignore — skip this rule */
.icon-arrow {
    /* rtl:ignore */
    transform: rotate(45deg);
}

/* rtl:remove — remove this rule in RTL */
.ltr-only {
    /* rtl:remove */
    float: left;
}

/* rtl:raw — insert raw CSS in RTL */
.custom {
    /* rtl:raw:
    float: right;
    */
}
```

### Enqueuing RTL stylesheets

WordPress handles this automatically when you enqueue properly:

```php
wp_enqueue_style('my-style', plugins_url('css/style.css', __FILE__));
// WordPress will automatically load css/style-rtl.css in RTL contexts
// IF the RTL file exists in the same directory
```

For custom paths:
```php
wp_style_add_data('my-style', 'rtl', 'replace');
// WordPress will load style-rtl.css instead of style.css
```

Or add an independent RTL stylesheet:
```php
wp_style_add_data('my-style', 'rtl', plugin_dir_url(__FILE__) . 'css/custom-rtl.css');
```

## Block editor RTL support

### Block styles

```css
/* Use logical properties in block stylesheets */
.wp-block-my-plugin-card {
    padding-inline-start: 1rem;
    border-inline-start: 3px solid var(--wp--preset--color--primary);
}
```

### useBlockProps and direction

```js
import { useBlockProps } from '@wordpress/block-editor';

export default function Edit() {
    const blockProps = useBlockProps();
    // blockProps automatically inherits the document direction
    return <div {...blockProps}>Content</div>;
}
```

## Icons and directional elements

Flip directional icons in RTL:

```css
/* Arrows, chevrons, navigation icons */
.rtl .icon-arrow-right {
    transform: scaleX(-1);
}

/* Or with logical approach */
[dir="rtl"] .icon-next {
    transform: scaleX(-1);
}
```

Do NOT flip:
- Clocks (always clockwise)
- Media playback controls (play/pause universal)
- Checkmarks
- Phone icons
- Logos and brand marks

## Testing RTL

```bash
# Switch site to Arabic
wp site switch-language ar

# Switch back to English
wp site switch-language en_US
```

Quick browser test: add `dir="rtl"` to `<html>` in DevTools.

WordPress admin: Settings → General → Site Language → Arabic (or any RTL language).

## Verification checklist

- [ ] All CSS uses logical properties (or RTL stylesheets exist)
- [ ] No hardcoded `left`/`right` in positioning
- [ ] Directional icons flip correctly
- [ ] Text alignment uses `start`/`end` not `left`/`right`
- [ ] Flexbox/Grid layout respects direction
- [ ] RTL stylesheets are properly enqueued with `wp_style_add_data`
- [ ] Tested with at least one RTL locale (Arabic recommended)
