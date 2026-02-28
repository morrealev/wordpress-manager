# WordPress Portfolio — Guida Completa

**Tipologia:** Portfolio (vetrina lavori, case study, progetti)
**Versione:** 1.0.0
**Ultima modifica:** 2026-02-28
**Skill correlate:** wp-block-themes, wp-local-env, wp-deploy, wp-block-development, wp-interactivity-api

---

## 1. Panoramica

### Cos'e un Portfolio WordPress

Un portfolio WordPress e un sito web centrato sulla presentazione visiva dei propri lavori e progetti. A differenza di un blog (contenuto testuale) o di un e-commerce (vendita prodotti), un portfolio mette al centro le immagini e i risultati, con il testo che funge da supporto narrativo.

### Quando usare un portfolio

- **Freelancer/developer**: mostrare progetti web, app, contributi open source
- **Designer**: presentare lavori grafici, branding, UI/UX
- **Fotografo**: gallerie fotografiche, shooting, reportage
- **Architetto/interior designer**: rendering, progetti completati
- **Agenzia**: case study per acquisire nuovi clienti

### Varianti

| Variante | Focus | Esempio |
|----------|-------|---------|
| **Fotografico** | Gallerie immersive, full-bleed | Fotografo matrimonialista |
| **Design/UI** | Mockup, process, before/after | UI/UX designer |
| **Sviluppo** | Codice, architettura, tech stack | Developer freelance |
| **Architettura** | Planimetrie, rendering 3D, foto | Studio architettura |
| **Multi-disciplinare** | Mix di tipologie | Agenzia creativa |

### Metriche chiave

| Metrica | Cosa misura | Tool |
|---------|-------------|------|
| Tempo sulla pagina progetto | Interesse per il lavoro | Google Analytics |
| CTR contatti | % che clicca su CTA contatto | Google Analytics |
| Pagine per sessione | Esplorazione del portfolio | Google Analytics |
| Download CV/PDF | Interesse professionale | Google Analytics |
| Bounce rate homepage | Prima impressione | Google Analytics |

---

## 2. Per l'Utente

Questa sezione copre la gestione operativa del portfolio tramite Claude Code e il plugin wordpress-manager.

### 2.1 Concept e Pianificazione

**Seleziona i lavori migliori, non tutti i lavori.**

1. **Selezione**: mostra 6-12 progetti migliori, non 50 mediocri
2. **Categorizzazione**: organizza per tipologia (web, brand, app) e tecnologia (React, WordPress, Figma)
3. **Case study**: per almeno 3 progetti, racconta la storia (sfida → soluzione → risultato)
4. **About page**: non e un CV — e una narrazione che crea connessione
5. **CTA**: ogni progetto deve portare a contatto o al progetto successivo

### 2.2 Setup Ambiente Locale

**Creare un portfolio WordPress locale con wp-env:**

```bash
# 1. Creare la directory del progetto
mkdir -p ~/projects/mio-portfolio
cd ~/projects/mio-portfolio

# 2. Creare .wp-env.json
cat > .wp-env.json << 'EOF'
{
  "core": "WordPress/WordPress#master",
  "themes": ["./themes/portfolio-theme"],
  "plugins": ["./plugins/portfolio-cpt"],
  "config": {
    "WP_DEBUG": true,
    "WP_DEBUG_LOG": true,
    "SCRIPT_DEBUG": true
  },
  "port": 8888
}
EOF

# 3. Creare la struttura
mkdir -p themes/portfolio-theme/{templates,parts,patterns,assets/css}
mkdir -p plugins/portfolio-cpt

# 4. Avviare WordPress
npx wp-env start
```

**Con Claude Code (linguaggio naturale):**

> "Crea un progetto WordPress portfolio con wp-env, tema minimale bianco con accent blu, custom post type 'progetto' con tassonomie tipo_progetto e tecnologia"

**Credenziali default wp-env:** `admin` / `password` su `http://localhost:8888/wp-admin/`

### 2.3 Struttura Contenuti

#### Tassonomie

| Elemento | Scopo | Esempio |
|----------|-------|---------|
| **Tipo progetto** (tassonomia gerarchica) | Macro-categorie | Web Design, Branding, App, Fotografia |
| **Tecnologia** (tassonomia flat) | Stack tecnico | React, WordPress, Figma, Photoshop |
| **Anno** | Ordine cronologico | Campo custom o data pubblicazione |

#### Struttura del Case Study

Ogni progetto dovrebbe seguire questa narrazione:

```
1. SFIDA
   "Il cliente aveva bisogno di..."

2. SOLUZIONE
   "Ho progettato/sviluppato..."

3. RISULTATO
   "Dopo il lancio, il traffico e aumentato del 40%..."
```

### 2.4 Gestione Quotidiana

```bash
# Creare un nuovo progetto
npx wp-env run cli wp post create \
  --post_type=progetto \
  --post_status=publish \
  --post_title="Redesign Sito Web Azienda XYZ"

# Creare tassonomie
npx wp-env run cli wp term create tipo_progetto "Web Design"
npx wp-env run cli wp term create tipo_progetto "Branding"
npx wp-env run cli wp term create tipo_progetto "App"
npx wp-env run cli wp term create tecnologia "React"
npx wp-env run cli wp term create tecnologia "WordPress"
npx wp-env run cli wp term create tecnologia "Figma"

# Assegnare tassonomia a un progetto
npx wp-env run cli wp term set 5 tipo_progetto "Web Design"
npx wp-env run cli wp term set 5 tecnologia "React" "WordPress"

# Elencare tutti i progetti
npx wp-env run cli wp post list --post_type=progetto --fields=ID,post_title,post_status

# Importare immagini
npx wp-env run cli wp media import https://picsum.photos/800/600 --title="Demo Project 1"

# Flush rewrite rules (dopo registrazione CPT)
npx wp-env run cli wp rewrite flush --hard
```

### 2.5 SEO per Portfolio

- **Title tag**: nome progetto + tipo + tuo nome (es. "Redesign Sito XYZ | Web Design | Mario Rossi")
- **Alt text**: descrittivo su OGNI immagine (critico per portfolio)
- **Schema markup**: `CreativeWork` per i progetti
- **Open Graph**: immagine del progetto per condivisione social
- **Slug**: `/progetti/redesign-sito-xyz/` — breve e descrittivo

```bash
npx wp-env run cli wp rewrite structure '/%postname%/'
npx wp-env run cli wp rewrite flush --hard
```

---

## 3. Per lo Sviluppatore

Questa sezione copre l'architettura tecnica per sviluppare un block theme per portfolio.

### 3.1 Custom Post Type e Tassonomie

Il portfolio richiede un CPT dedicato. Crea un plugin separato dal tema:

**plugins/portfolio-cpt/portfolio-cpt.php**

```php
<?php
/**
 * Plugin Name: Portfolio CPT
 * Description: Custom Post Type "Progetto" con tassonomie per portfolio.
 */

function portfolio_register_post_type() {
    register_post_type('progetto', [
        'labels' => [
            'name'          => 'Progetti',
            'singular_name' => 'Progetto',
            'add_new_item'  => 'Aggiungi Nuovo Progetto',
            'edit_item'     => 'Modifica Progetto',
            'view_item'     => 'Vedi Progetto',
        ],
        'public'       => true,
        'has_archive'  => true,
        'rewrite'      => ['slug' => 'progetti'],
        'show_in_rest' => true,
        'supports'     => ['title', 'editor', 'thumbnail', 'excerpt', 'custom-fields', 'page-attributes'],
        'menu_icon'    => 'dashicons-portfolio',
        'template'     => [
            ['core/paragraph', ['placeholder' => 'Descrivi la sfida del progetto...']],
        ],
    ]);
}
add_action('init', 'portfolio_register_post_type');

function portfolio_register_taxonomies() {
    register_taxonomy('tipo_progetto', 'progetto', [
        'labels' => [
            'name'          => 'Tipi di Progetto',
            'singular_name' => 'Tipo Progetto',
        ],
        'hierarchical'      => true,
        'public'            => true,
        'rewrite'           => ['slug' => 'tipo'],
        'show_in_rest'      => true,
        'show_admin_column' => true,
    ]);

    register_taxonomy('tecnologia', 'progetto', [
        'labels' => [
            'name'          => 'Tecnologie',
            'singular_name' => 'Tecnologia',
        ],
        'hierarchical'      => false,
        'public'            => true,
        'rewrite'           => ['slug' => 'tech'],
        'show_in_rest'      => true,
        'show_admin_column' => true,
    ]);
}
add_action('init', 'portfolio_register_taxonomies');
```

### 3.2 theme.json — Design Tokens per Portfolio

Un portfolio richiede colori neutri che non competano con i lavori presentati.

```json
{
  "$schema": "https://schemas.wp.org/wp/6.7/theme.json",
  "version": 3,
  "settings": {
    "color": {
      "palette": [
        { "slug": "base", "color": "#ffffff", "name": "Base" },
        { "slug": "contrast", "color": "#111111", "name": "Contrast" },
        { "slug": "accent", "color": "#2563eb", "name": "Accent" },
        { "slug": "surface", "color": "#f5f5f5", "name": "Surface" },
        { "slug": "muted", "color": "#737373", "name": "Muted" },
        { "slug": "border", "color": "#e5e5e5", "name": "Border" }
      ],
      "defaultPalette": false,
      "defaultGradients": false
    },
    "typography": {
      "fontFamilies": [
        {
          "fontFamily": "'Inter', -apple-system, sans-serif",
          "slug": "body",
          "name": "Body"
        },
        {
          "fontFamily": "'Instrument Sans', 'Inter', sans-serif",
          "slug": "heading",
          "name": "Heading"
        }
      ],
      "fontSizes": [
        { "slug": "small", "size": "0.875rem" },
        { "slug": "medium", "size": "1rem" },
        { "slug": "large", "size": "1.25rem" },
        { "slug": "x-large", "size": "2rem" },
        { "slug": "xx-large", "size": "3rem" },
        { "slug": "huge", "size": "4rem" }
      ]
    },
    "layout": {
      "contentSize": "1200px",
      "wideSize": "1400px"
    },
    "blocks": {
      "core/image": {
        "lightbox": {
          "enabled": true,
          "allowEditing": true
        }
      }
    }
  },
  "styles": {
    "elements": {
      "link": {
        "color": { "text": "var(--wp--preset--color--accent)" },
        ":hover": { "color": { "text": "var(--wp--preset--color--contrast)" } }
      },
      "heading": {
        "typography": {
          "fontFamily": "var(--wp--preset--font-family--heading)",
          "fontWeight": "600",
          "lineHeight": "1.1"
        }
      }
    },
    "blocks": {
      "core/image": {
        "border": { "radius": "4px" }
      }
    }
  }
}
```

**Nota**: il layout e piu largo (1200px) di un blog (720px) perche la griglia dei progetti ha bisogno di spazio. I colori sono neutri — i lavori devono essere gli unici elementi cromaticamente dominanti.

### 3.3 Templates

#### front-page.html — Homepage Showcase

```html
<!-- wp:template-part {"slug":"header","area":"header"} /-->

<!-- wp:group {"tagName":"main","layout":{"type":"constrained"}} -->
<main class="wp-block-group">

  <!-- Hero intro -->
  <!-- wp:group {"style":{"spacing":{"padding":{"top":"6rem","bottom":"4rem"}}}} -->
  <div class="wp-block-group" style="padding-top:6rem;padding-bottom:4rem">
    <!-- wp:heading {"level":1,"fontSize":"huge"} -->
    <h1 class="wp-block-heading has-huge-font-size">Design &amp; Sviluppo</h1>
    <!-- /wp:heading -->
    <!-- wp:paragraph {"textColor":"muted","fontSize":"large"} -->
    <p class="has-muted-color has-text-color has-large-font-size">Portfolio di lavori selezionati. Ogni progetto racconta una sfida risolta.</p>
    <!-- /wp:paragraph -->
  </div>
  <!-- /wp:group -->

  <!-- Griglia progetti -->
  <!-- wp:query {"queryId":1,"query":{"perPage":6,"postType":"progetto","orderby":"menu_order","order":"asc"}} -->
  <div class="wp-block-query">
    <!-- wp:post-template {"layout":{"type":"grid","columnCount":2}} -->
      <!-- wp:group {"style":{"spacing":{"blockGap":"0.75rem"}}} -->
      <div class="wp-block-group">
        <!-- wp:post-featured-image {"isLink":true,"aspectRatio":"4/3","style":{"border":{"radius":"4px"}}} /-->
        <!-- wp:post-title {"isLink":true,"fontSize":"large"} /-->
        <!-- wp:post-terms {"term":"tipo_progetto","textColor":"muted","fontSize":"small"} /-->
      </div>
      <!-- /wp:group -->
    <!-- /wp:post-template -->
  </div>
  <!-- /wp:query -->

  <!-- Link a tutti i progetti -->
  <!-- wp:group {"style":{"spacing":{"margin":{"top":"3rem"}}},"layout":{"type":"flex","justifyContent":"center"}} -->
  <div class="wp-block-group" style="margin-top:3rem">
    <!-- wp:paragraph -->
    <p><a href="/progetti/">Vedi tutti i progetti &rarr;</a></p>
    <!-- /wp:paragraph -->
  </div>
  <!-- /wp:group -->

</main>
<!-- /wp:group -->

<!-- wp:template-part {"slug":"footer","area":"footer"} /-->
```

#### archive-progetto.html — Archivio con Griglia

```html
<!-- wp:template-part {"slug":"header","area":"header"} /-->

<!-- wp:group {"tagName":"main","layout":{"type":"constrained"}} -->
<main class="wp-block-group">

  <!-- wp:query-title {"type":"archive","style":{"spacing":{"margin":{"top":"3rem","bottom":"2rem"}}}} /-->

  <!-- wp:query {"queryId":2,"query":{"perPage":12,"postType":"progetto","orderby":"menu_order","order":"asc","inherit":true}} -->
  <div class="wp-block-query">
    <!-- wp:post-template {"layout":{"type":"grid","columnCount":3}} -->
      <!-- wp:group {"style":{"spacing":{"blockGap":"0.5rem"}}} -->
      <div class="wp-block-group">
        <!-- wp:post-featured-image {"isLink":true,"aspectRatio":"4/3","style":{"border":{"radius":"4px"}}} /-->
        <!-- wp:post-title {"isLink":true,"fontSize":"medium"} /-->
        <!-- wp:post-terms {"term":"tipo_progetto","textColor":"muted","fontSize":"small"} /-->
      </div>
      <!-- /wp:group -->
    <!-- /wp:post-template -->

    <!-- wp:query-pagination {"layout":{"type":"flex","justifyContent":"center"}} -->
      <!-- wp:query-pagination-previous /-->
      <!-- wp:query-pagination-numbers /-->
      <!-- wp:query-pagination-next /-->
    <!-- /wp:query-pagination -->
  </div>
  <!-- /wp:query -->

</main>
<!-- /wp:group -->

<!-- wp:template-part {"slug":"footer","area":"footer"} /-->
```

#### single-progetto.html — Case Study

```html
<!-- wp:template-part {"slug":"header","area":"header"} /-->

<!-- wp:group {"tagName":"main","layout":{"type":"constrained"}} -->
<main class="wp-block-group">

  <!-- Header progetto -->
  <!-- wp:group {"style":{"spacing":{"padding":{"top":"4rem","bottom":"2rem"}}}} -->
  <div class="wp-block-group" style="padding-top:4rem;padding-bottom:2rem">
    <!-- wp:post-terms {"term":"tipo_progetto","textColor":"muted","fontSize":"small"} /-->
    <!-- wp:post-title {"level":1,"fontSize":"xx-large"} /-->
    <!-- wp:post-excerpt {"fontSize":"large","textColor":"muted"} /-->
  </div>
  <!-- /wp:group -->

  <!-- Immagine principale -->
  <!-- wp:post-featured-image {"aspectRatio":"16/9","style":{"border":{"radius":"8px"}}} /-->

  <!-- Meta progetto -->
  <!-- wp:group {"backgroundColor":"surface","style":{"spacing":{"padding":{"top":"1.5rem","bottom":"1.5rem","left":"2rem","right":"2rem"},"margin":{"top":"2rem","bottom":"2rem"}},"border":{"radius":"8px"}},"layout":{"type":"flex","justifyContent":"space-between","flexWrap":"wrap"}} -->
  <div class="wp-block-group has-surface-background-color has-background" style="border-radius:8px;padding:1.5rem 2rem;margin:2rem 0">
    <!-- wp:group {"style":{"spacing":{"blockGap":"0.25rem"}}} -->
    <div class="wp-block-group">
      <!-- wp:paragraph {"textColor":"muted","fontSize":"small"} -->
      <p class="has-muted-color has-text-color has-small-font-size"><strong>Tecnologie</strong></p>
      <!-- /wp:paragraph -->
      <!-- wp:post-terms {"term":"tecnologia","fontSize":"small"} /-->
    </div>
    <!-- /wp:group -->
  </div>
  <!-- /wp:group -->

  <!-- Contenuto case study -->
  <!-- wp:post-content {"layout":{"type":"constrained","contentSize":"720px"}} /-->

  <!-- CTA contatto -->
  <!-- wp:pattern {"slug":"portfolio-theme/contact-cta"} /-->

  <!-- Navigazione prev/next -->
  <!-- wp:group {"layout":{"type":"flex","justifyContent":"space-between"},"style":{"spacing":{"margin":{"top":"4rem"}}}} -->
  <div class="wp-block-group" style="margin-top:4rem">
    <!-- wp:post-navigation-link {"type":"previous","label":"Progetto precedente"} /-->
    <!-- wp:post-navigation-link {"label":"Progetto successivo"} /-->
  </div>
  <!-- /wp:group -->

</main>
<!-- /wp:group -->

<!-- wp:template-part {"slug":"footer","area":"footer"} /-->
```

### 3.4 Patterns

#### Pattern: Contact CTA

```php
<?php
/**
 * Title: Contact CTA
 * Slug: portfolio-theme/contact-cta
 * Categories: call-to-action, portfolio
 */
?>
<!-- wp:group {"backgroundColor":"surface","style":{"spacing":{"padding":{"top":"3rem","bottom":"3rem","left":"2rem","right":"2rem"},"margin":{"top":"4rem"}},"border":{"radius":"12px"}},"layout":{"type":"constrained","contentSize":"600px"}} -->
<div class="wp-block-group has-surface-background-color has-background" style="border-radius:12px;padding:3rem 2rem;margin-top:4rem">
  <!-- wp:heading {"textAlign":"center","level":3} -->
  <h3 class="wp-block-heading has-text-align-center">Hai un progetto simile?</h3>
  <!-- /wp:heading -->
  <!-- wp:paragraph {"align":"center","textColor":"muted"} -->
  <p class="has-text-align-center has-muted-color has-text-color">Mi piacerebbe saperne di piu. Raccontami la tua idea e troviamo insieme la soluzione migliore.</p>
  <!-- /wp:paragraph -->
  <!-- wp:buttons {"layout":{"type":"flex","justifyContent":"center"}} -->
  <div class="wp-block-buttons">
    <!-- wp:button {"backgroundColor":"accent","textColor":"base"} -->
    <div class="wp-block-button"><a class="wp-block-button__link has-base-color has-accent-background-color has-text-color has-background" href="/contatti/">Parliamone</a></div>
    <!-- /wp:button -->
  </div>
  <!-- /wp:buttons -->
</div>
<!-- /wp:group -->
```

#### Pattern: Tech Stack Badges

```php
<?php
/**
 * Title: Tech Stack Badges
 * Slug: portfolio-theme/tech-stack-badges
 * Categories: portfolio
 */
?>
<!-- wp:group {"layout":{"type":"flex","flexWrap":"wrap"},"style":{"spacing":{"blockGap":"0.5rem"}}} -->
<div class="wp-block-group">
  <!-- wp:group {"backgroundColor":"surface","style":{"spacing":{"padding":{"top":"0.35rem","bottom":"0.35rem","left":"0.75rem","right":"0.75rem"}},"border":{"radius":"100px"}}} -->
  <div class="wp-block-group has-surface-background-color has-background" style="border-radius:100px;padding:0.35rem 0.75rem">
    <!-- wp:paragraph {"fontSize":"small"} -->
    <p class="has-small-font-size">React</p>
    <!-- /wp:paragraph -->
  </div>
  <!-- /wp:group -->
  <!-- wp:group {"backgroundColor":"surface","style":{"spacing":{"padding":{"top":"0.35rem","bottom":"0.35rem","left":"0.75rem","right":"0.75rem"}},"border":{"radius":"100px"}}} -->
  <div class="wp-block-group has-surface-background-color has-background" style="border-radius:100px;padding:0.35rem 0.75rem">
    <!-- wp:paragraph {"fontSize":"small"} -->
    <p class="has-small-font-size">TypeScript</p>
    <!-- /wp:paragraph -->
  </div>
  <!-- /wp:group -->
  <!-- wp:group {"backgroundColor":"surface","style":{"spacing":{"padding":{"top":"0.35rem","bottom":"0.35rem","left":"0.75rem","right":"0.75rem"}},"border":{"radius":"100px"}}} -->
  <div class="wp-block-group has-surface-background-color has-background" style="border-radius:100px;padding:0.35rem 0.75rem">
    <!-- wp:paragraph {"fontSize":"small"} -->
    <p class="has-small-font-size">Figma</p>
    <!-- /wp:paragraph -->
  </div>
  <!-- /wp:group -->
</div>
<!-- /wp:group -->
```

### 3.5 Funzionalita Avanzate

#### Lightbox Nativo

WordPress 6.4+ include un lightbox nativo. Attivalo nel `theme.json`:

```json
{
  "settings": {
    "blocks": {
      "core/image": {
        "lightbox": {
          "enabled": true,
          "allowEditing": true
        }
      }
    }
  }
}
```

#### CSS Custom per Griglia

**assets/css/portfolio.css**

```css
/* Hover effect sulle immagini progetto */
.wp-block-query .wp-block-post-featured-image {
    overflow: hidden;
}

.wp-block-query .wp-block-post-featured-image img {
    transition: transform 0.4s ease, filter 0.4s ease;
    aspect-ratio: 4/3;
    object-fit: cover;
    width: 100%;
}

.wp-block-query .wp-block-post-featured-image:hover img {
    transform: scale(1.03);
    filter: brightness(0.95);
}

/* Grid responsive */
@media (max-width: 781px) {
    .wp-block-post-template.is-layout-grid {
        grid-template-columns: 1fr !important;
    }
}
```

Enqueue in `functions.php`:

```php
<?php
add_action('wp_enqueue_scripts', function() {
    wp_enqueue_style(
        'portfolio-custom',
        get_theme_file_uri('assets/css/portfolio.css'),
        [],
        filemtime(get_theme_file_path('assets/css/portfolio.css'))
    );
});
```

#### Performance Immagini

```php
<?php
// Dimensioni immagini ottimizzate per portfolio
add_action('after_setup_theme', function() {
    add_image_size('project-grid', 800, 600, true);
    add_image_size('project-hero', 1600, 900, true);
    add_image_size('project-full', 1920, 0, false);
});
```

### 3.6 Workflow di Sviluppo

```bash
# Generare progetti di test
for i in $(seq 1 8); do
  npx wp-env run cli wp post create \
    --post_type=progetto \
    --post_status=publish \
    --post_title="Progetto Demo $i"
done

# Verificare CPT registrato
npx wp-env run cli wp post-type list --fields=name,label,public

# Verificare tassonomie
npx wp-env run cli wp taxonomy list --fields=name,label,object_type

# Rigenerare thumbnails
npx wp-env run cli wp media regenerate --yes

# Debug
npx wp-env run cli cat /var/www/html/wp-content/debug.log
npx wp-env logs wordpress --watch
```

---

## 4. Checklist di Lancio

### Contenuti
- [ ] Almeno 6-8 progetti pubblicati con immagini di alta qualita
- [ ] Ogni progetto ha immagine in evidenza (obbligatorio)
- [ ] Case study completi per almeno 3 progetti (sfida, soluzione, risultato)
- [ ] Pagina Chi Sono scritta come narrazione, non come CV
- [ ] Pagina Contatti con form funzionante
- [ ] Tassonomie assegnate a ogni progetto
- [ ] Excerpt compilato per ogni progetto

### Tecnico
- [ ] Theme responsive su mobile/tablet/desktop
- [ ] Custom Post Type registrato e funzionante
- [ ] Permalink funzionanti per `/progetti/`, `/tipo/`, `/tech/`
- [ ] Griglia responsive: 1 colonna mobile, 2 tablet, 3 desktop
- [ ] Lightbox funzionante su gallerie
- [ ] Navigazione prev/next tra progetti
- [ ] Menu di navigazione funzionante su mobile
- [ ] Template 404 personalizzato
- [ ] Favicon impostata

### Immagini e Performance
- [ ] Tutte le immagini in formato WebP
- [ ] Dimensioni appropriate (non 4000px per thumbnail)
- [ ] Lazy loading attivo
- [ ] Aspect ratio consistente nella griglia (4:3 o 16:9)
- [ ] Lighthouse Performance > 90 su mobile
- [ ] Nessun CLS al caricamento immagini

### SEO
- [ ] Plugin SEO configurato
- [ ] Meta description su ogni progetto
- [ ] Alt text su tutte le immagini
- [ ] Sitemap XML accessibile
- [ ] Open Graph tags per condivisione social

### Conversione
- [ ] CTA contatti visibile in ogni pagina progetto
- [ ] Form contatti testato e funzionante
- [ ] Link a progetto live funzionanti
- [ ] Link social/professionali nel footer o Chi Sono

### Sicurezza
- [ ] Password admin forte
- [ ] Plugin aggiornati
- [ ] SSL attivo (produzione)
- [ ] Backup automatico configurato

---

## 5. Riferimenti

### Skill del Plugin

| Skill | Quando usarla |
|-------|---------------|
| `wp-block-themes` | Sviluppo theme.json, templates, parts, patterns |
| `wp-local-env` | Setup e gestione ambiente wp-env |
| `wp-deploy` | Deploy in produzione |
| `wp-block-development` | Sviluppo blocchi custom (meta fields dinamici) |
| `wp-interactivity-api` | Filtri client-side senza reload |
| `wp-performance` | Ottimizzazione immagini e caching |
| `wp-plugin-development` | Plugin CPT e tassonomie |
| `wp-rest-api` | API per integrazioni headless |
| `wp-wpcli-and-ops` | Comandi WP-CLI per gestione contenuti |
| `wp-backup` | Backup e restore |
| `wp-content` | Gestione contenuti |

### Risorse Esterne

- [Block Theme Handbook](https://developer.wordpress.org/themes/block-themes/) — Documentazione ufficiale
- [theme.json Reference](https://developer.wordpress.org/themes/global-settings-and-styles/) — Schema completo
- [Custom Post Types](https://developer.wordpress.org/plugins/post-types/) — Registrazione CPT
- [Custom Taxonomies](https://developer.wordpress.org/plugins/taxonomies/) — Registrazione tassonomie
- [Template Hierarchy](https://developer.wordpress.org/themes/templates/template-hierarchy/) — Quale template viene usato
- [Interactivity API](https://developer.wordpress.org/block-editor/reference-guides/interactivity-api/) — Interattivita lato client
- [Lightbox in WordPress](https://make.wordpress.org/core/2023/08/01/lightbox-in-wordpress/) — Lightbox nativo
- [WP-CLI Commands](https://developer.wordpress.org/cli/commands/) — Tutti i comandi CLI

---

*Guida per il plugin [wordpress-manager](https://github.com/morrealev/wordpress-manager) v1.5.0+*
