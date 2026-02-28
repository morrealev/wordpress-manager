# Interactive Component Accessibility

Use this file when building accessible interactive components (modals, tabs, accordions, tooltips) in WordPress.

## Modal / Dialog

Based on [ARIA Authoring Practices Guide (APG) Dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/).

```html
<div role="dialog" aria-modal="true"
     aria-labelledby="dialog-title"
     aria-describedby="dialog-desc">
    <h2 id="dialog-title">Confirm Action</h2>
    <p id="dialog-desc">Are you sure you want to proceed?</p>
    <button>Confirm</button>
    <button>Cancel</button>
</div>
```

### Keyboard behavior

| Key | Action |
|-----|--------|
| Tab | Move focus to next focusable element inside dialog |
| Shift+Tab | Move focus to previous focusable element |
| Escape | Close dialog |

### Focus management

```js
class AccessibleModal {
    open(trigger) {
        this.trigger = trigger;
        this.dialog.hidden = false;
        this.dialog.setAttribute('aria-modal', 'true');

        // Trap focus inside dialog
        this.firstFocusable = this.dialog.querySelector(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        this.firstFocusable?.focus();

        // Prevent background scroll
        document.body.style.overflow = 'hidden';
    }

    close() {
        this.dialog.hidden = true;
        document.body.style.overflow = '';

        // Return focus to trigger element
        this.trigger?.focus();
    }

    trapFocus(e) {
        if (e.key !== 'Tab') return;
        const focusable = this.dialog.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
        }
    }
}
```

## Tabs

Based on [APG Tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/).

```html
<div class="tabs">
    <div role="tablist" aria-label="Settings">
        <button role="tab" id="tab-1" aria-selected="true"
                aria-controls="panel-1" tabindex="0">
            General
        </button>
        <button role="tab" id="tab-2" aria-selected="false"
                aria-controls="panel-2" tabindex="-1">
            Advanced
        </button>
    </div>
    <div role="tabpanel" id="panel-1" aria-labelledby="tab-1" tabindex="0">
        General settings content
    </div>
    <div role="tabpanel" id="panel-2" aria-labelledby="tab-2" tabindex="0"
         hidden>
        Advanced settings content
    </div>
</div>
```

### Keyboard behavior

| Key | Action |
|-----|--------|
| Arrow Right | Activate next tab |
| Arrow Left | Activate previous tab |
| Home | Activate first tab |
| End | Activate last tab |
| Tab | Move focus into the active tab panel |

```js
tablist.addEventListener('keydown', (e) => {
    const tabs = [...tablist.querySelectorAll('[role="tab"]')];
    const index = tabs.indexOf(document.activeElement);

    let newIndex;
    switch (e.key) {
        case 'ArrowRight':
            newIndex = (index + 1) % tabs.length;
            break;
        case 'ArrowLeft':
            newIndex = (index - 1 + tabs.length) % tabs.length;
            break;
        case 'Home':
            newIndex = 0;
            break;
        case 'End':
            newIndex = tabs.length - 1;
            break;
        default:
            return;
    }
    e.preventDefault();
    activateTab(tabs[newIndex]);
});

function activateTab(tab) {
    // Deactivate all
    tablist.querySelectorAll('[role="tab"]').forEach((t) => {
        t.setAttribute('aria-selected', 'false');
        t.setAttribute('tabindex', '-1');
        document.getElementById(t.getAttribute('aria-controls')).hidden = true;
    });
    // Activate selected
    tab.setAttribute('aria-selected', 'true');
    tab.setAttribute('tabindex', '0');
    tab.focus();
    document.getElementById(tab.getAttribute('aria-controls')).hidden = false;
}
```

## Accordion

Based on [APG Accordion pattern](https://www.w3.org/WAI/ARIA/apg/patterns/accordion/).

```html
<div class="accordion">
    <h3>
        <button aria-expanded="true" aria-controls="sect1"
                id="accordion1-header">
            Section 1
        </button>
    </h3>
    <div id="sect1" role="region" aria-labelledby="accordion1-header">
        <p>Section 1 content</p>
    </div>

    <h3>
        <button aria-expanded="false" aria-controls="sect2"
                id="accordion2-header">
            Section 2
        </button>
    </h3>
    <div id="sect2" role="region" aria-labelledby="accordion2-header"
         hidden>
        <p>Section 2 content</p>
    </div>
</div>
```

### Keyboard behavior

| Key | Action |
|-----|--------|
| Enter / Space | Toggle section |
| Arrow Down | Next header |
| Arrow Up | Previous header |
| Home | First header |
| End | Last header |

## Tooltip

```html
<button aria-describedby="tooltip-1">
    Settings
</button>
<div role="tooltip" id="tooltip-1" class="tooltip" hidden>
    Configure application settings
</div>
```

### Behavior

- Show on hover and focus
- Hide on Escape
- Do not use for essential information (tooltips are supplementary)
- Keep content brief (one sentence max)

```js
const trigger = document.querySelector('[aria-describedby]');
const tooltip = document.getElementById('tooltip-1');

trigger.addEventListener('mouseenter', () => tooltip.hidden = false);
trigger.addEventListener('mouseleave', () => tooltip.hidden = true);
trigger.addEventListener('focus', () => tooltip.hidden = false);
trigger.addEventListener('blur', () => tooltip.hidden = true);
trigger.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') tooltip.hidden = true;
});
```

## Disclosure (show/hide)

```html
<button aria-expanded="false" aria-controls="details-content">
    Show Details
</button>
<div id="details-content" hidden>
    <p>Additional details here.</p>
</div>
```

```js
button.addEventListener('click', () => {
    const expanded = button.getAttribute('aria-expanded') === 'true';
    button.setAttribute('aria-expanded', String(!expanded));
    content.hidden = expanded;
    button.textContent = expanded ? 'Show Details' : 'Hide Details';
});
```

## WordPress @wordpress/components

WordPress core components are pre-built with accessibility:

```js
import { Modal, TabPanel, Notice } from '@wordpress/components';

// Modal — handles focus trap, Escape, aria-modal automatically
<Modal title="Settings" onRequestClose={closeModal}>
    <p>Modal content</p>
</Modal>

// TabPanel — handles arrow keys, aria-selected automatically
<TabPanel
    tabs={[
        { name: 'general', title: 'General' },
        { name: 'advanced', title: 'Advanced' },
    ]}
>
    {(tab) => <p>{tab.name} content</p>}
</TabPanel>
```

Prefer `@wordpress/components` over custom implementations when building for the block editor.

## Verification

1. Keyboard-only navigation: can you operate the component without a mouse?
2. Screen reader: does it announce state changes (expanded/collapsed, selected tab)?
3. Focus management: does focus move to the right place on open/close?
4. Escape key: does it close overlays and tooltips?
5. No focus traps: can you escape from every component?
