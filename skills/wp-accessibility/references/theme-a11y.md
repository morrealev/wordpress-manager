# Theme Accessibility

Use this file when building accessible WordPress themes and achieving `accessibility-ready` tag compliance.

## accessibility-ready tag requirements

WordPress.org requires these for the `accessibility-ready` tag:

1. **Skip links** — must be the first focusable element
2. **Keyboard navigation** — all interactive elements reachable and operable
3. **Contrast ratios** — text meets WCAG 2.1 AA (4.5:1 normal, 3:1 large)
4. **Resize text** — content usable at 200% zoom
5. **Form labels** — all inputs have associated labels
6. **Image alt text** — all images have alt attributes (decorative = `alt=""`)
7. **Visible focus** — focus indicators on all interactive elements
8. **Landmarks** — proper use of HTML5 landmark elements
9. **No autoplay** — media must not autoplay with sound

## Landmarks and page structure

```html
<body <?php body_class(); ?>>
    <?php wp_body_open(); ?>

    <a class="skip-link screen-reader-text" href="#primary">
        <?php esc_html_e('Skip to content', 'my-theme'); ?>
    </a>

    <header id="masthead" role="banner">
        <nav id="site-navigation" role="navigation"
             aria-label="<?php esc_attr_e('Primary Menu', 'my-theme'); ?>">
            <?php wp_nav_menu(['theme_location' => 'primary']); ?>
        </nav>
    </header>

    <main id="primary" role="main">
        <!-- page content -->
    </main>

    <aside id="sidebar" role="complementary"
           aria-label="<?php esc_attr_e('Sidebar', 'my-theme'); ?>">
        <?php dynamic_sidebar('sidebar-1'); ?>
    </aside>

    <footer id="colophon" role="contentinfo">
        <!-- footer content -->
    </footer>
</body>
```

## Skip link CSS

```css
.skip-link {
    position: absolute;
    top: -100%;
    left: 0;
    z-index: 999999;
    padding: 0.5rem 1rem;
    background: #000;
    color: #fff;
    text-decoration: none;
    font-size: 1rem;
}

.skip-link:focus {
    top: 0;
    clip: auto;
    clip-path: none;
    width: auto;
    height: auto;
}
```

## Focus indicators

```css
/* Visible focus for all interactive elements */
a:focus,
button:focus,
input:focus,
select:focus,
textarea:focus,
[tabindex]:focus {
    outline: 2px solid var(--wp--preset--color--primary, #0073aa);
    outline-offset: 2px;
}

/* Remove default only if replacing with custom indicator */
a:focus-visible {
    outline: 3px solid #0073aa;
    outline-offset: 2px;
    border-radius: 2px;
}
```

Never use `outline: none` without providing an alternative visible focus indicator.

## Navigation menus

### Menu walker with ARIA

```php
// In header.php or navigation template
wp_nav_menu([
    'theme_location' => 'primary',
    'container'      => 'nav',
    'container_class' => 'main-navigation',
    'container_id'    => 'primary-menu',
    'items_wrap'     => '<ul id="%1$s" class="%2$s" role="menubar">%3$s</ul>',
]);
```

### Dropdown submenus

```js
// Accessible submenu toggle
document.querySelectorAll('.menu-item-has-children > a').forEach((link) => {
    const submenu = link.nextElementSibling;
    const toggle = document.createElement('button');
    toggle.className = 'submenu-toggle';
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label',
        link.textContent.trim() + ' submenu');
    toggle.innerHTML = '<span class="screen-reader-text">Toggle submenu</span>';

    toggle.addEventListener('click', () => {
        const expanded = toggle.getAttribute('aria-expanded') === 'true';
        toggle.setAttribute('aria-expanded', String(!expanded));
        submenu.hidden = expanded;
    });

    link.after(toggle);
});
```

## Forms

```html
<!-- Every input needs a label -->
<label for="search-input">
    <?php esc_html_e('Search', 'my-theme'); ?>
</label>
<input type="search" id="search-input" name="s"
       placeholder="<?php esc_attr_e('Search...', 'my-theme'); ?>">

<!-- Group related fields -->
<fieldset>
    <legend><?php esc_html_e('Contact Information', 'my-theme'); ?></legend>
    <label for="name"><?php esc_html_e('Name', 'my-theme'); ?></label>
    <input type="text" id="name" name="name" required
           aria-required="true">
    <label for="email"><?php esc_html_e('Email', 'my-theme'); ?></label>
    <input type="email" id="email" name="email" required
           aria-required="true">
</fieldset>

<!-- Error messages -->
<input type="email" id="email" name="email"
       aria-describedby="email-error" aria-invalid="true">
<p id="email-error" class="form-error" role="alert">
    <?php esc_html_e('Please enter a valid email address.', 'my-theme'); ?>
</p>
```

## Images in themes

```php
<!-- Content images: meaningful alt -->
<img src="<?php echo esc_url($image_url); ?>"
     alt="<?php echo esc_attr($image_alt); ?>">

<!-- Decorative images: empty alt -->
<img src="decorative-border.png" alt="" role="presentation">

<!-- Background images with text: ensure contrast or provide alt -->
<div class="hero" style="background-image: url(hero.jpg);"
     role="img" aria-label="<?php esc_attr_e('Mountain landscape', 'my-theme'); ?>">
    <h1><?php esc_html_e('Welcome', 'my-theme'); ?></h1>
</div>
```

### Post thumbnails

```php
// Theme support with alt text
if (has_post_thumbnail()) {
    the_post_thumbnail('large', [
        'alt' => get_the_title(), // fallback if no alt set
    ]);
}
```

## Color and typography

```css
/* Ensure readable text sizes */
body {
    font-size: 1rem;    /* At least 16px */
    line-height: 1.5;   /* WCAG recommends 1.5 for body text */
}

/* Respect user preferences */
@media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
        animation-duration: 0.01ms !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
    }
}

@media (prefers-contrast: more) {
    :root {
        --text-color: #000;
        --bg-color: #fff;
        --link-color: #00008b;
    }
}
```

## Screen reader utilities

```css
/* WordPress core screen-reader-text class */
.screen-reader-text {
    border: 0;
    clip: rect(1px, 1px, 1px, 1px);
    clip-path: inset(50%);
    height: 1px;
    margin: -1px;
    overflow: hidden;
    padding: 0;
    position: absolute !important;
    width: 1px;
    word-wrap: normal !important;
}

.screen-reader-text:focus {
    background-color: #f1f1f1;
    clip: auto !important;
    clip-path: none;
    display: block;
    font-size: 0.875rem;
    height: auto;
    left: 5px;
    line-height: normal;
    padding: 15px 23px 14px;
    text-decoration: none;
    top: 5px;
    width: auto;
    z-index: 100000;
}
```

## theme.json accessibility settings

```json
{
    "settings": {
        "color": {
            "palette": [
                {
                    "slug": "primary",
                    "color": "#0073aa",
                    "name": "Primary"
                },
                {
                    "slug": "foreground",
                    "color": "#1e1e1e",
                    "name": "Foreground"
                },
                {
                    "slug": "background",
                    "color": "#ffffff",
                    "name": "Background"
                }
            ]
        },
        "typography": {
            "fluid": true,
            "fontSizes": [
                { "slug": "small", "size": "0.875rem", "name": "Small" },
                { "slug": "medium", "size": "1rem", "name": "Medium" },
                { "slug": "large", "size": "1.25rem", "name": "Large" }
            ]
        }
    }
}
```

Ensure all palette color combinations meet WCAG AA contrast ratios.

## Verification

```bash
# Test theme accessibility-ready requirements
npx @axe-core/cli https://localhost:8888/ --tags wcag2a,wcag2aa

# Check for missing alt attributes
curl -s https://site.com/ | grep -oP '<img[^>]*>' | grep -v 'alt='

# Check for skip link
curl -s https://site.com/ | grep -i "skip"

# Validate landmarks
curl -s https://site.com/ | grep -cE "<(main|nav|header|footer|aside|section)"
```
