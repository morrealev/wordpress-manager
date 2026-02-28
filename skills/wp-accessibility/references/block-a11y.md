# Block Accessibility

Use this file when making WordPress blocks accessible.

## Block markup requirements

### Semantic HTML

```js
// WRONG — generic divs
export default function Edit() {
    return (
        <div className="my-block">
            <div className="title">Heading</div>
            <div className="content">Paragraph text</div>
        </div>
    );
}

// CORRECT — semantic elements
export default function Edit({ attributes }) {
    const { level } = attributes;
    const TagName = `h${level}`;
    return (
        <section className="my-block">
            <TagName>{attributes.title}</TagName>
            <p>{attributes.content}</p>
        </section>
    );
}
```

### Heading hierarchy

Allow users to choose heading level:

```js
import { InspectorControls } from '@wordpress/block-editor';
import { PanelBody, SelectControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

<InspectorControls>
    <PanelBody title={__('Heading Settings')}>
        <SelectControl
            label={__('Heading Level')}
            value={attributes.level}
            options={[
                { label: 'H2', value: 2 },
                { label: 'H3', value: 3 },
                { label: 'H4', value: 4 },
            ]}
            onChange={(level) => setAttributes({ level: Number(level) })}
        />
    </PanelBody>
</InspectorControls>
```

## ARIA attributes in blocks

### Images with alt text

```js
import { MediaUpload, MediaUploadCheck } from '@wordpress/block-editor';
import { TextControl } from '@wordpress/components';

// Always include alt text control when a block has images
<TextControl
    label={__('Alternative Text')}
    help={__('Describe the image for screen reader users.')}
    value={attributes.alt}
    onChange={(alt) => setAttributes({ alt })}
/>

// In save:
<img src={attributes.url} alt={attributes.alt} />
```

### Interactive elements

```js
// Buttons must have accessible names
<button
    className="my-block__toggle"
    aria-expanded={isOpen}
    aria-controls="panel-content"
    onClick={() => setIsOpen(!isOpen)}
>
    {__('Toggle Details')}
</button>
<div id="panel-content" role="region" hidden={!isOpen}>
    {content}
</div>
```

### Live regions

For blocks with dynamic content updates:

```js
// Announce changes to screen readers
<div aria-live="polite" aria-atomic="true" className="screen-reader-text">
    {statusMessage}
</div>
```

## Block supports for accessibility

### block.json supports

```json
{
    "supports": {
        "color": {
            "text": true,
            "background": true,
            "link": true
        },
        "typography": {
            "fontSize": true,
            "lineHeight": true
        },
        "spacing": {
            "margin": true,
            "padding": true
        }
    }
}
```

These core supports are pre-tested for accessibility by the WordPress a11y team.

### Color contrast

When blocks allow color customization, warn about contrast:

```js
import { ContrastChecker } from '@wordpress/block-editor';

<ContrastChecker
    textColor={attributes.textColor}
    backgroundColor={attributes.backgroundColor}
    fontSize={attributes.fontSize}
/>
```

`ContrastChecker` checks WCAG 2.1 AA contrast ratios (4.5:1 normal text, 3:1 large text).

## Focus management in the editor

### RichText

```js
import { RichText } from '@wordpress/block-editor';

// RichText handles focus and keyboard navigation automatically
<RichText
    tagName="p"
    value={attributes.content}
    onChange={(content) => setAttributes({ content })}
    placeholder={__('Write your content...')}
    allowedFormats={['core/bold', 'core/italic', 'core/link']}
/>
```

### Custom interactive controls

```js
// Toolbar buttons with proper labels
import { BlockControls } from '@wordpress/block-editor';
import { ToolbarGroup, ToolbarButton } from '@wordpress/components';

<BlockControls>
    <ToolbarGroup>
        <ToolbarButton
            icon="editor-alignleft"
            title={__('Align Left')}
            isActive={attributes.alignment === 'left'}
            onClick={() => setAttributes({ alignment: 'left' })}
        />
    </ToolbarGroup>
</BlockControls>
```

## Save output requirements

### Skip links and landmarks

For blocks that create page sections:

```php
// save.js
export default function save({ attributes }) {
    return (
        <nav aria-label={attributes.label || __('Navigation')}>
            <ul>
                {/* navigation items */}
            </ul>
        </nav>
    );
}
```

### Tables

```php
export default function save({ attributes }) {
    return (
        <table>
            <caption>{attributes.caption}</caption>
            <thead>
                <tr>
                    <th scope="col">{__('Name')}</th>
                    <th scope="col">{__('Value')}</th>
                </tr>
            </thead>
            <tbody>
                {attributes.rows.map((row, i) => (
                    <tr key={i}>
                        <th scope="row">{row.name}</th>
                        <td>{row.value}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
```

## Verification

```bash
# Run axe-core on a page containing the block
npx @axe-core/cli https://localhost:8888/test-page/

# Check block output for ARIA issues
curl -s https://site.com/test-page/ | grep -E "role=|aria-" | head -20

# Validate HTML output
curl -s https://site.com/test-page/ | npx html-validate --stdin
```

Manual testing:
1. Navigate the block using only keyboard (Tab, Enter, Escape, Arrow keys)
2. Test with a screen reader (NVDA on Windows, VoiceOver on macOS)
3. Verify heading hierarchy doesn't skip levels
4. Ensure all images have meaningful alt text
5. Confirm color contrast passes WCAG AA
