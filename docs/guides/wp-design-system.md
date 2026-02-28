# WordPress Design System — Da Token a Pixel

**Tipologia:** Guida concettuale + pratica
**Versione:** 1.0.0
**Ultima modifica:** 2026-02-28
**Skill correlate:** wpds, wp-block-themes, wp-block-development, wp-interactivity-api

---

## 1. Paradigma Design-as-Data

### Il Problema

In un progetto WordPress tradizionale, le decisioni di design vivono disperse: colori hardcodati nel CSS, spaziature nei template, font nei file PHP. Ogni modifica richiede una caccia al tesoro nel codice.

I block theme di WordPress risolvono questo problema con un paradigma radicale: **il design e dati, non codice**.

### La Catena Completa

```
DESIGN TOKEN          COMPILATORE         CSS CUSTOM PROPERTY       BLOCCO            PIXEL
(dato puro)           (theme.json)        (variabile CSS)           (markup)          (browser)

  "accent"    ──→   color.palette   ──→  --wp--preset--color--     ──→  has-accent-   ──→  #6366f1
  "#6366f1"          [{ slug,             accent: #6366f1;              background-       sullo
                       color }]                                        color             schermo
```

### Perche Design-as-Data

| Approccio tradizionale | Design-as-Data |
|------------------------|----------------|
| `.header { color: #6366f1; }` | Token `accent` in theme.json |
| Duplicazione colori in N file | Singola fonte di verita |
| Modifica = cerca e sostituisci | Modifica = un valore, propagazione automatica |
| Sviluppatore decide lo stile | Utente personalizza nell'editor |
| CSS custom per ogni componente | Classi preset generate da WordPress |

### I 6 Strati

Il design system WordPress si articola in 6 strati, dal piu astratto al piu concreto:

```
┌─────────────────────────────────────────────────┐
│  Strato 6: Interattivita (Interactivity API)    │  ← Comportamento
├─────────────────────────────────────────────────┤
│  Strato 5: Blocchi Custom con WPDS              │  ← Componenti editor
├─────────────────────────────────────────────────┤
│  Strato 4: Patterns (pagine prefabbricate)      │  ← Layout compositi
├─────────────────────────────────────────────────┤
│  Strato 3: Blocchi Core (componenti UI)         │  ← Elementi singoli
├─────────────────────────────────────────────────┤
│  Strato 2: theme.json (compilatore)             │  ← Configurazione
├─────────────────────────────────────────────────┤
│  Strato 1: Design Tokens (dati puri)            │  ← Decisioni
└─────────────────────────────────────────────────┘
```

Ogni strato consuma quello inferiore. Un pattern (Strato 4) usa blocchi core (Strato 3) che leggono variabili CSS (Strato 2) generate dai token (Strato 1).

---

## 2. Strato 1: Design Tokens

### Cosa Sono

I design token sono le decisioni atomiche del design: un colore, una dimensione font, uno spazio. Sono **valori primitivi** senza contesto d'uso.

```
Token                    Valore          Tipo
─────────────────────    ──────────      ──────────
color/accent             #6366f1         Colore
color/base               #0f172a         Colore
font-size/medium         1rem            Tipografia
font-family/heading      JetBrains Mono  Tipografia
spacing/large            2rem            Spaziatura
border-radius/default    8px             Forma
```

### Convenzione di Naming

WordPress usa uno schema slug-based. Il nome (slug) diventa parte della CSS Custom Property:

```
Token slug: "accent"

    ↓ theme.json lo compila in:

--wp--preset--color--accent: #6366f1;

    ↓ WordPress genera la classe:

.has-accent-color         { color: var(--wp--preset--color--accent); }
.has-accent-background-color { background-color: var(--wp--preset--color--accent); }
```

### Token per il Blog "Developer Journal"

Le decisioni di design per un blog tecnico dark:

```
PALETTE
─────────────────────────────────────────
base       #0f172a   Sfondo principale (Slate 900)
contrast   #f8fafc   Testo principale (Slate 50)
accent     #6366f1   Link, CTA (Indigo 500)
surface    #1e293b   Card, sidebar (Slate 800)
muted      #94a3b8   Testo secondario (Slate 400)
border     #334155   Bordi, separatori (Slate 700)

TIPOGRAFIA
─────────────────────────────────────────
heading    JetBrains Mono   Titoli (monospace = dev feel)
body       Inter            Corpo testo (alta leggibilita)

SCALE FONT
─────────────────────────────────────────
small      0.875rem    Note, date
medium     1rem        Corpo testo
large      1.25rem     Lead paragraph
x-large    1.75rem     Titoli sezione (H2)
xx-large   2.5rem      Titolo pagina (H1)

LAYOUT
─────────────────────────────────────────
contentSize   720px    Colonna testo (65-75 char/riga)
wideSize      1100px   Code block, immagini larghe
```

### Regole per i Token

1. **Nomi semantici, non descrittivi**: `accent` non `indigo-500`
2. **Massimo 7 colori**: base, contrast, accent, surface, muted, + 1-2 varianti
3. **Scale tipografiche coerenti**: rapporto ~1.25 tra livelli (Major Third)
4. **Content width basato sulla leggibilita**: 65-75 caratteri per riga

---

## 3. Strato 2: theme.json come Compilatore

### Il Ruolo di theme.json

`theme.json` e il **compilatore** del design system WordPress. Prende i token in input e produce:

1. **CSS Custom Properties** nel `<head>` della pagina
2. **Classi CSS preset** per ogni valore (`.has-{slug}-color`, `.has-{slug}-font-size`)
3. **Opzioni nell'editor** visibili nell'interfaccia del Site Editor
4. **Stili elemento** che applicano token a elementi HTML (`<h1>`, `<p>`, `<a>`)

```
                    ┌──────────────┐
  Design Tokens ──→ │  theme.json  │ ──→  CSS Custom Properties
  (decisioni)       │              │ ──→  Classi preset
                    │  compilatore │ ──→  Opzioni editor
                    │              │ ──→  Stili elemento
                    └──────────────┘
```

### Struttura Completa

```json
{
  "$schema": "https://schemas.wp.org/wp/6.7/theme.json",
  "version": 3,
  "settings": {
    "color": {
      "palette": [
        { "slug": "base", "color": "#0f172a", "name": "Base" },
        { "slug": "contrast", "color": "#f8fafc", "name": "Contrast" },
        { "slug": "accent", "color": "#6366f1", "name": "Accent" },
        { "slug": "surface", "color": "#1e293b", "name": "Surface" },
        { "slug": "muted", "color": "#94a3b8", "name": "Muted" },
        { "slug": "border", "color": "#334155", "name": "Border" }
      ],
      "gradients": [],
      "defaultPalette": false,
      "defaultGradients": false
    },
    "typography": {
      "fontFamilies": [
        {
          "fontFamily": "'JetBrains Mono', monospace",
          "slug": "heading",
          "name": "Heading"
        },
        {
          "fontFamily": "'Inter', sans-serif",
          "slug": "body",
          "name": "Body"
        }
      ],
      "fontSizes": [
        { "slug": "small", "size": "0.875rem", "name": "Small" },
        { "slug": "medium", "size": "1rem", "name": "Medium" },
        { "slug": "large", "size": "1.25rem", "name": "Large" },
        { "slug": "x-large", "size": "1.75rem", "name": "X-Large" },
        { "slug": "xx-large", "size": "2.5rem", "name": "XX-Large" }
      ],
      "fluid": true,
      "defaultFontSizes": false
    },
    "spacing": {
      "units": ["px", "rem", "%", "vw"],
      "spacingSizes": [
        { "slug": "10", "size": "0.25rem", "name": "XXS" },
        { "slug": "20", "size": "0.5rem", "name": "XS" },
        { "slug": "30", "size": "1rem", "name": "S" },
        { "slug": "40", "size": "1.5rem", "name": "M" },
        { "slug": "50", "size": "2rem", "name": "L" },
        { "slug": "60", "size": "3rem", "name": "XL" },
        { "slug": "70", "size": "4rem", "name": "XXL" }
      ]
    },
    "layout": {
      "contentSize": "720px",
      "wideSize": "1100px"
    },
    "appearanceTools": true
  },
  "styles": {
    "color": {
      "background": "var(--wp--preset--color--base)",
      "text": "var(--wp--preset--color--contrast)"
    },
    "typography": {
      "fontFamily": "var(--wp--preset--font-family--body)",
      "fontSize": "var(--wp--preset--font-size--medium)",
      "lineHeight": "1.7"
    },
    "spacing": {
      "blockGap": "var(--wp--preset--spacing--40)"
    },
    "elements": {
      "heading": {
        "typography": {
          "fontFamily": "var(--wp--preset--font-family--heading)",
          "lineHeight": "1.2"
        }
      },
      "h1": {
        "typography": { "fontSize": "var(--wp--preset--font-size--xx-large)" }
      },
      "h2": {
        "typography": { "fontSize": "var(--wp--preset--font-size--x-large)" }
      },
      "h3": {
        "typography": { "fontSize": "var(--wp--preset--font-size--large)" }
      },
      "link": {
        "color": { "text": "var(--wp--preset--color--accent)" },
        ":hover": {
          "typography": { "textDecoration": "none" }
        }
      }
    },
    "blocks": {
      "core/code": {
        "color": {
          "background": "var(--wp--preset--color--surface)",
          "text": "var(--wp--preset--color--contrast)"
        },
        "typography": {
          "fontFamily": "var(--wp--preset--font-family--heading)",
          "fontSize": "var(--wp--preset--font-size--small)"
        },
        "border": {
          "radius": "8px"
        },
        "spacing": {
          "padding": {
            "top": "var(--wp--preset--spacing--40)",
            "bottom": "var(--wp--preset--spacing--40)",
            "left": "var(--wp--preset--spacing--40)",
            "right": "var(--wp--preset--spacing--40)"
          }
        }
      },
      "core/quote": {
        "border": {
          "left": {
            "color": "var(--wp--preset--color--accent)",
            "width": "3px",
            "style": "solid"
          }
        },
        "color": {
          "text": "var(--wp--preset--color--muted)"
        }
      }
    }
  }
}
```

### La Catena di Override

theme.json segue una gerarchia di specificita con 4 livelli. Ogni livello sovrascrive quello precedente:

```
┌─────────────────────────────────────────┐
│  4. Stili utente (Site Editor)          │  ← Massima priorita
├─────────────────────────────────────────┤
│  3. Child theme theme.json              │
├─────────────────────────────────────────┤
│  2. Parent theme theme.json             │
├─────────────────────────────────────────┤
│  1. WordPress core (default)            │  ← Minima priorita
└─────────────────────────────────────────┘
```

Questo significa che l'utente puo sempre personalizzare i token dal Site Editor senza toccare codice.

### Output CSS Generato

Da un singolo token colore, WordPress genera automaticamente:

```css
/* Custom Property */
body {
  --wp--preset--color--accent: #6366f1;
}

/* Classi preset (generate automaticamente) */
.has-accent-color {
  color: var(--wp--preset--color--accent) !important;
}
.has-accent-background-color {
  background-color: var(--wp--preset--color--accent) !important;
}

/* Stile elemento (da styles.elements.link) */
a {
  color: var(--wp--preset--color--accent);
}
```

### Tipografia Fluida con clamp()

WordPress 6.1+ supporta font size fluide. Invece di breakpoint rigidi:

```json
{
  "fontSizes": [
    {
      "slug": "xx-large",
      "size": "2.5rem",
      "fluid": {
        "min": "1.75rem",
        "max": "2.5rem"
      }
    }
  ]
}
```

Genera:

```css
--wp--preset--font-size--xx-large: clamp(1.75rem, 1.75rem + ((1vw - 0.48rem) * 1.442), 2.5rem);
```

Il titolo cresce fluidamente da 1.75rem (mobile) a 2.5rem (desktop) senza media query.

---

## 4. Strato 3: Blocchi Core come Componenti UI

### Blocchi = Componenti

In un design system tradizionale (Material Design, Ant Design), i componenti sono Button, Card, Input. In WordPress, i **blocchi core** sono i componenti:

```
Design System            WordPress Block
───────────────          ───────────────────────
Button                   core/button
Card                     core/group + backgroundColor
Grid                     core/columns
Image                    core/image
Text                     core/paragraph
Heading                  core/heading
List                     core/list
Separator                core/separator
Spacer                   core/spacer
Navigation               core/navigation
```

### Anatomia di un Blocco

Ogni blocco nel markup di un template e un commento HTML con attributi JSON:

```html
<!-- wp:group {"backgroundColor":"surface","style":{"spacing":{"padding":{"top":"2rem","bottom":"2rem"}},"border":{"radius":"8px"}}} -->
<div class="wp-block-group has-surface-background-color has-background"
     style="border-radius:8px;padding-top:2rem;padding-bottom:2rem">
  <!-- blocchi figli -->
</div>
<!-- /wp:group -->
```

WordPress trasforma gli attributi in:
1. **Classi CSS preset**: `has-surface-background-color` (dal token `surface`)
2. **Inline styles**: `border-radius: 8px` (proprietà non tokenizzate)
3. **Tag HTML**: `<div>` con le classi applicate

### Esempio: Card Articolo

Un componente "card articolo" per il blog, costruito interamente con blocchi core:

```html
<!-- wp:group {"backgroundColor":"surface","style":{"spacing":{"padding":{"top":"var:preset|spacing|40","bottom":"var:preset|spacing|40","left":"var:preset|spacing|40","right":"var:preset|spacing|40"}},"border":{"radius":"8px"}}} -->
<div class="wp-block-group has-surface-background-color has-background">

  <!-- wp:post-date {"textColor":"muted","fontSize":"small"} /-->

  <!-- wp:post-title {"level":3,"isLink":true} /-->

  <!-- wp:post-excerpt {"moreText":"continua →","excerptLength":25} /-->

  <!-- wp:post-terms {"term":"category","textColor":"accent","fontSize":"small"} /-->

</div>
<!-- /wp:group -->
```

I token in azione:
- `backgroundColor: "surface"` → card scura su sfondo piu scuro
- `textColor: "muted"` → data in grigio
- `textColor: "accent"` → categorie colorate
- `fontSize: "small"` → elementi secondari ridotti
- `spacing|40` → padding uniforme dal token

### Layout: Constrained vs Flex vs Grid

I blocchi supportano tre tipi di layout:

```
constrained (default)           flex                        grid (WP 6.3+)
┌──────────────────────┐       ┌──────────────────────┐    ┌──────────────────────┐
│  ┌──────────────┐    │       │ ┌────┐ ┌────┐ ┌────┐ │    │ ┌────┐ ┌────┐ ┌────┐ │
│  │   720px      │    │       │ │    │ │    │ │    │ │    │ │    │ │    │ │    │ │
│  │   content    │    │       │ └────┘ └────┘ └────┘ │    │ ├────┤ ├────┤ ├────┤ │
│  └──────────────┘    │       │  ← flex-direction →  │    │ │    │ │    │ │    │ │
│       1100px wide    │       │                      │    │ └────┘ └────┘ └────┘ │
└──────────────────────┘       └──────────────────────┘    └──────────────────────┘

Uso: testo lungo,              Uso: header, navigation,    Uso: gallerie, portfolio,
articoli, pagine               toolbar, card orizzontali   cataloghi prodotto
```

```html
<!-- Constrained: centra il contenuto con contentSize -->
<!-- wp:group {"layout":{"type":"constrained"}} -->

<!-- Flex: elementi affiancati -->
<!-- wp:group {"layout":{"type":"flex","justifyContent":"space-between"}} -->

<!-- Grid: griglia responsive -->
<!-- wp:group {"layout":{"type":"grid","minimumColumnWidth":"300px"}} -->
```

### Blocchi Essenziali per Tipo di Sito

| Blocco | Blog | Landing | E-commerce | Portfolio |
|--------|:----:|:-------:|:----------:|:---------:|
| `core/query` + `core/post-template` | ● | - | ○ | ● |
| `core/cover` | ○ | ● | ○ | ○ |
| `core/columns` | ○ | ● | ● | ○ |
| `core/group` (card) | ● | ● | ● | ● |
| `core/image` / `core/gallery` | ○ | ○ | ● | ● |
| `core/navigation` | ● | - | ● | ● |
| `core/button` | ○ | ● | ● | ○ |
| `core/heading` + `core/paragraph` | ● | ● | ● | ● |

● = essenziale | ○ = opzionale | - = non usato

---

## 5. Strato 4: Patterns come Pagine Prefabbricate

### Cosa Sono i Patterns

I patterns sono **composizioni riutilizzabili** di blocchi. Se i blocchi core sono i mattoni, i patterns sono le pareti prefabbricate: combinazioni testate e pronte all'uso.

```
Blocco singolo              Pattern
───────────────             ───────────────────
core/heading                "Hero con titolo, sottotitolo
                             e CTA su sfondo immagine"

core/paragraph              = core/cover + core/heading +
                               core/paragraph + core/button
core/button                  (pre-assemblati con stili)
```

### Registrazione Automatica

WordPress scopre automaticamente i file PHP nella directory `patterns/` del tema:

```php
<?php
/**
 * Title: Newsletter CTA
 * Slug: developer-journal/newsletter-cta
 * Categories: call-to-action
 * Keywords: email, subscribe, newsletter
 * Block Types: core/group
 */
?>
<!-- wp:group {"backgroundColor":"surface","style":{"spacing":{"padding":{"top":"var:preset|spacing|50","bottom":"var:preset|spacing|50","left":"var:preset|spacing|40","right":"var:preset|spacing|40"}},"border":{"radius":"8px"}},"layout":{"type":"constrained","contentSize":"600px"}} -->
<div class="wp-block-group has-surface-background-color has-background">

  <!-- wp:heading {"level":3,"textColor":"contrast"} -->
  <h3 class="wp-block-heading has-contrast-color has-text-color">Resta aggiornato</h3>
  <!-- /wp:heading -->

  <!-- wp:paragraph {"textColor":"muted"} -->
  <p class="has-muted-color has-text-color">Ricevi i nuovi post nella inbox. Niente spam, solo contenuti tecnici.</p>
  <!-- /wp:paragraph -->

  <!-- wp:buttons {"layout":{"type":"flex","justifyContent":"center"}} -->
  <div class="wp-block-buttons">
    <!-- wp:button {"backgroundColor":"accent","textColor":"contrast"} -->
    <div class="wp-block-button"><a class="wp-block-button__link has-accent-background-color has-contrast-color has-text-color has-background wp-element-button">Iscriviti</a></div>
    <!-- /wp:button -->
  </div>
  <!-- /wp:buttons -->

</div>
<!-- /wp:group -->
```

### Template Lock

I patterns possono bloccare la struttura per evitare modifiche accidentali:

```html
<!-- wp:group {"templateLock":"all"} -->
<!-- L'utente NON puo aggiungere, rimuovere o riordinare i blocchi -->
<!-- /wp:group -->

<!-- wp:group {"templateLock":"insert"} -->
<!-- L'utente puo riordinare ma NON aggiungere/rimuovere -->
<!-- /wp:group -->

<!-- wp:group {"templateLock":"contentOnly"} -->
<!-- L'utente puo solo modificare il testo, non la struttura -->
<!-- /wp:group -->
```

`contentOnly` e ideale per i pattern di brand: il layout resta fisso, l'utente cambia solo i contenuti.

### Patterns Chiave per Developer Journal

| Pattern | Slug | Dove si usa |
|---------|------|-------------|
| Hero post in evidenza | `hero-featured-post` | Homepage, sopra il loop |
| Card articolo | `post-card` | Dentro `core/post-template` |
| Newsletter CTA | `newsletter-cta` | Fine articolo, sidebar |
| About autore | `author-bio` | Template `single.html` |
| Footer con link | `footer-minimal` | Part `footer.html` |

### Categorie di Pattern

Le categorie organizzano i pattern nell'inserter dell'editor:

```php
// In functions.php del tema
register_block_pattern_category('developer-journal', [
    'label' => 'Developer Journal'
]);

register_block_pattern_category('call-to-action', [
    'label' => 'Call to Action'
]);
```

Il frontmatter PHP del pattern (`Categories: call-to-action`) lo assegna automaticamente alla categoria.

---

## 6. Strato 5: Blocchi Custom con WPDS

### Quando Creare un Blocco Custom

I blocchi core coprono l'80% dei casi. Serve un blocco custom quando:

1. **Logica specifica**: calcolo, API esterna, dati dinamici
2. **Markup non riproducibile**: struttura HTML non ottenibile con blocchi core
3. **Interazione nell'editor**: controlli personalizzati nella sidebar
4. **Riuso cross-progetto**: componente da pubblicare come plugin

### @wordpress/components (WPDS)

WordPress fornisce una libreria di componenti React per l'editor: il **WordPress Design System** (WPDS). Questi componenti si usano SOLO nell'editor (edit.js), non nel frontend.

```
Componenti WPDS principali:
─────────────────────────────────────
Panel / PanelBody        Sidebar controls
TextControl              Input testo
SelectControl            Dropdown
ToggleControl            Switch on/off
RangeControl             Slider numerico
ColorPalette             Selezione colore
Button                   Azioni
Placeholder              Stato vuoto del blocco
ToolbarButton            Barra strumenti blocco
```

### Esempio: Blocco "Tech Stack Badge"

Un blocco custom che mostra badge tecnologici nel portfolio.

#### block.json (metadata)

```json
{
  "$schema": "https://schemas.wp.org/trunk/block.json",
  "apiVersion": 3,
  "name": "developer-journal/tech-badge",
  "version": "1.0.0",
  "title": "Tech Stack Badge",
  "category": "text",
  "icon": "tag",
  "description": "Badge per tecnologia con nome e colore personalizzabile.",
  "keywords": ["tech", "badge", "stack", "tag"],
  "attributes": {
    "label": {
      "type": "string",
      "default": "WordPress"
    },
    "badgeColor": {
      "type": "string",
      "default": ""
    }
  },
  "supports": {
    "html": false,
    "color": {
      "background": true,
      "text": true
    },
    "typography": {
      "fontSize": true
    },
    "spacing": {
      "padding": true
    }
  },
  "textdomain": "developer-journal",
  "editorScript": "file:./index.js",
  "editorStyle": "file:./index.css",
  "style": "file:./style-index.css",
  "render": "file:./render.php"
}
```

#### edit.js (interfaccia editor)

```jsx
import { useBlockProps } from '@wordpress/block-editor';
import { TextControl, PanelBody, ColorPalette } from '@wordpress/components';
import { InspectorControls } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

export default function Edit({ attributes, setAttributes }) {
    const { label, badgeColor } = attributes;
    const blockProps = useBlockProps({
        className: 'tech-badge',
        style: badgeColor ? { backgroundColor: badgeColor } : undefined
    });

    return (
        <>
            <InspectorControls>
                <PanelBody title={__('Impostazioni Badge', 'developer-journal')}>
                    <TextControl
                        label={__('Tecnologia', 'developer-journal')}
                        value={label}
                        onChange={(val) => setAttributes({ label: val })}
                    />
                    <ColorPalette
                        value={badgeColor}
                        onChange={(val) => setAttributes({ badgeColor: val })}
                    />
                </PanelBody>
            </InspectorControls>
            <span {...blockProps}>{label}</span>
        </>
    );
}
```

#### render.php (output frontend)

```php
<?php
/**
 * Render del blocco Tech Stack Badge.
 *
 * @var array    $attributes Attributi del blocco.
 * @var string   $content    Contenuto del blocco.
 * @var WP_Block $block      Istanza del blocco.
 */

$label = esc_html($attributes['label'] ?? 'WordPress');
$color = $attributes['badgeColor'] ?? '';
$style = $color ? sprintf('background-color: %s;', esc_attr($color)) : '';
?>

<span <?php echo get_block_wrapper_attributes(['class' => 'tech-badge']); ?>
      <?php echo $style ? 'style="' . $style . '"' : ''; ?>>
    <?php echo $label; ?>
</span>
```

### Setup Ambiente di Sviluppo Blocchi

```bash
# Creare un nuovo blocco con @wordpress/create-block
cd themes/developer-journal
npx @wordpress/create-block tech-badge --namespace=developer-journal

# Sviluppo con hot reload
cd tech-badge
npm start

# Build per produzione
npm run build
```

### Flusso Dati: Editor → Frontend

```
                    EDITOR (React)                    FRONTEND (PHP/HTML)
                    ══════════════                    ═══════════════════

  edit.js           ──→ Salvataggio ──→              render.php
  (componenti WPDS)     (attributi JSON              (get_block_wrapper_attributes)
                         nel post_content)

  setAttributes()   ──→ {"label":"React",  ──→       esc_html($attributes['label'])
                         "badgeColor":"#61dafb"}

  InspectorControls ──→ Salvato nel DB   ──→         Output HTML statico
  (sidebar editor)       come commento HTML           (no JavaScript necessario)
```

L'editor usa React e WPDS. Il frontend e puro HTML/CSS/PHP. I due mondi comunicano attraverso gli attributi JSON salvati nel database.

---

## 7. Strato 6: Interattivita (Interactivity API)

### Il Problema

I blocchi WordPress sono statici per default: il render PHP produce HTML, fine. Per aggiungere interattivita (filtri, accordion, lightbox, toggle) serviva JavaScript custom o React idratato.

L'**Interactivity API** (WordPress 6.5+) risolve questo con un approccio dichiarativo ispirato ad Alpine.js: direttive HTML che connettono stato e comportamento senza scrivere framework code.

### Concetti Chiave

```
Store                   Direttive HTML              Effetto
(stato + azioni)        (data-wp-*)                 (DOM reactivo)

state.isOpen ────→  data-wp-bind--hidden ────→  elemento mostrato/nascosto
actions.toggle ──→  data-wp-on--click    ────→  click cambia state.isOpen
```

### Esempio: Filtro Portfolio per Tecnologia

#### view.js (client-side store)

```javascript
import { store, getContext } from '@wordpress/interactivity';

store('developer-journal/portfolio-filter', {
    state: {
        get filteredProjects() {
            const { activeFilter } = getContext();
            if (activeFilter === 'all') return true;
            const { tech } = getContext();
            return tech.includes(activeFilter);
        }
    },
    actions: {
        setFilter() {
            const context = getContext();
            context.activeFilter = context.filterValue;
        }
    }
});
```

#### render.php (markup con direttive)

```php
<?php
$filters = ['all', 'wordpress', 'react', 'php', 'javascript'];
$projects = get_posts(['post_type' => 'progetto', 'numberposts' => -1]);
?>

<div data-wp-interactive="developer-journal/portfolio-filter"
     <?php echo get_block_wrapper_attributes(); ?>
     data-wp-context='{"activeFilter": "all"}'>

    <!-- Barra filtri -->
    <div class="filter-bar">
        <?php foreach ($filters as $filter) : ?>
            <button
                data-wp-context='{"filterValue": "<?php echo esc_attr($filter); ?>"}'
                data-wp-on--click="actions.setFilter"
                data-wp-class--active="state.isActiveFilter">
                <?php echo esc_html(ucfirst($filter)); ?>
            </button>
        <?php endforeach; ?>
    </div>

    <!-- Griglia progetti -->
    <div class="projects-grid">
        <?php foreach ($projects as $project) :
            $techs = wp_get_post_terms($project->ID, 'tecnologia', ['fields' => 'slugs']);
        ?>
            <article
                data-wp-context='{"tech": <?php echo wp_json_encode($techs); ?>}'
                data-wp-bind--hidden="!state.filteredProjects"
                class="project-card">
                <h3><?php echo esc_html($project->post_title); ?></h3>
                <div class="tech-tags">
                    <?php foreach ($techs as $tech) : ?>
                        <span class="tech-badge"><?php echo esc_html($tech); ?></span>
                    <?php endforeach; ?>
                </div>
            </article>
        <?php endforeach; ?>
    </div>
</div>
```

### Direttive Principali

| Direttiva | Scopo | Esempio |
|-----------|-------|---------|
| `data-wp-interactive` | Dichiara il namespace dello store | `data-wp-interactive="mio-plugin/filter"` |
| `data-wp-context` | Stato locale dell'elemento | `data-wp-context='{"isOpen": false}'` |
| `data-wp-bind--{attr}` | Binding reattivo su attributo HTML | `data-wp-bind--hidden="!state.isOpen"` |
| `data-wp-on--{event}` | Event listener dichiarativo | `data-wp-on--click="actions.toggle"` |
| `data-wp-class--{class}` | Toggle classe CSS | `data-wp-class--active="state.isActive"` |
| `data-wp-text` | Binding testo reattivo | `data-wp-text="state.count"` |
| `data-wp-each` | Iterazione su array | `data-wp-each="state.items"` |

### Interactivity API vs Alpine.js vs React

```
                    Interactivity API     Alpine.js          React (idratato)
                    ─────────────────     ─────────          ────────────────
Paradigma           Dichiarativo          Dichiarativo       Imperativo
Dove vive           HTML (direttive)      HTML (direttive)   JSX (componenti)
Bundle size         ~5 KB                 ~15 KB             ~40+ KB
Server rendering    PHP nativo            No (JS only)       Richiede SSR/hydration
Stato               Store + Context       x-data             useState/Redux
WordPress native    Si                    No (plugin)        No (custom setup)
Curva apprendimento Bassa                 Bassa              Alta
```

### Quando Usare Interactivity API

- **Si**: filtri, accordion, lightbox, toggle, tab, contatori, form dinamici
- **No**: applicazioni complesse (dashboard, editor WYSIWYG, real-time collaboration)

Per applicazioni complesse nell'admin, usa React direttamente con `@wordpress/element`.

---

## 8. Mappa Skill del Plugin

### Quale Skill per Quale Strato

Questa tabella mappa ogni strato del design system alla skill del plugin wordpress-manager che lo gestisce:

| Strato | Oggetto | Skill Plugin | Comando |
|--------|---------|--------------|---------|
| 1 - Token | Decisioni di design | `wpds` | — |
| 2 - theme.json | Configurazione | `wp-block-themes` | — |
| 3 - Blocchi Core | Templates e parts | `wp-block-themes` | — |
| 4 - Patterns | Composizioni | `wp-block-themes` | — |
| 5 - Blocchi Custom | Sviluppo React | `wp-block-development` | — |
| 6 - Interattivita | Client-side logic | `wp-interactivity-api` | — |
| — | Ambiente locale | `wp-local-env` | `/wp-start` |
| — | Contenuti | `wp-content` | — |
| — | Deploy | `wp-deploy` | `/wp-deploy` |

### Flusso di Lavoro Tipico

```
1. Concetto         →  Definire token (palette, font, spacing)
   Skill: wpds

2. Setup ambiente   →  Creare progetto con wp-env
   Skill: wp-local-env
   Comando: /wp-start

3. Compilazione     →  Scrivere theme.json con i token
   Skill: wp-block-themes

4. Struttura        →  Creare templates (index, single, page, archive)
   Skill: wp-block-themes

5. Composizione     →  Creare patterns (hero, card, CTA)
   Skill: wp-block-themes

6. Estensione       →  Sviluppare blocchi custom se necessario
   Skill: wp-block-development

7. Interazione      →  Aggiungere comportamenti con Interactivity API
   Skill: wp-interactivity-api

8. Contenuti        →  Popolare il sito con contenuti reali
   Skill: wp-content

9. Deploy           →  Pubblicare in produzione
   Skill: wp-deploy
   Comando: /wp-deploy
```

### Uso con Claude Code

**Linguaggio naturale per ogni strato:**

Strato 1-2 (Token + theme.json):
> "Crea un theme.json dark per blog developer con palette slate, font monospace per i titoli, content width 720px"

Strato 3 (Templates):
> "Crea il template single.html con data, titolo, categorie, contenuto e navigazione prev/next"

Strato 4 (Patterns):
> "Crea un pattern newsletter CTA con sfondo surface, titolo, descrizione e bottone accent"

Strato 5 (Blocchi Custom):
> "Crea un blocco custom tech-badge con attributi label e colore, usa @wordpress/create-block"

Strato 6 (Interactivity):
> "Aggiungi un filtro per tecnologia al portfolio usando l'Interactivity API"

Claude Code usera automaticamente la skill appropriata in base al contesto della richiesta.

---

## Riferimenti

### Skill del Plugin

| Skill | Strato | Quando usarla |
|-------|--------|---------------|
| `wpds` | 1, 5 | Design token, @wordpress/components, UI editor |
| `wp-block-themes` | 2, 3, 4 | theme.json, templates, parts, patterns |
| `wp-block-development` | 5 | Blocchi custom con @wordpress/create-block |
| `wp-interactivity-api` | 6 | Interattivita client-side dichiarativa |
| `wp-local-env` | — | Ambiente locale wp-env, Docker, WP-CLI |
| `wp-content` | — | Gestione post, pagine, tassonomie |
| `wp-deploy` | — | Deploy, staging, produzione |

### Risorse Esterne

- [Global Settings & Styles (theme.json)](https://developer.wordpress.org/themes/global-settings-and-styles/) — Schema ufficiale
- [Block Editor Handbook](https://developer.wordpress.org/block-editor/) — Sviluppo blocchi
- [Block Theme Handbook](https://developer.wordpress.org/themes/block-themes/) — Templates e patterns
- [@wordpress/create-block](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-create-block/) — Scaffolding blocchi
- [Interactivity API Reference](https://developer.wordpress.org/block-editor/reference-guides/interactivity-api/) — Direttive e store
- [@wordpress/components](https://developer.wordpress.org/block-editor/reference-guides/components/) — Catalogo WPDS
- [theme.json Living Reference](https://developer.wordpress.org/themes/global-settings-and-styles/settings/typography/) — Impostazioni per sezione

---

*Guida per il plugin [wordpress-manager](https://github.com/morrealev/wordpress-manager) v1.5.0+*
