# WordPress Landing Page — Guida Completa

**Tipologia:** Landing Page (conversione, lead generation, lancio prodotto)
**Versione:** 1.0.0
**Ultima modifica:** 2026-02-28
**Skill correlate:** wp-block-themes, wp-local-env, wp-deploy, wp-performance

---

## 1. Panoramica

### Cos'e una Landing Page

Una landing page e una pagina web progettata con un unico obiettivo: convertire il visitatore in un'azione specifica (iscrizione, acquisto, download, contatto). A differenza delle pagine tradizionali, una landing page elimina le distrazioni — navigazione ridotta, nessun link esterno, tutto focalizzato sulla conversione.

### Quando usare una landing page

- **Lancio prodotto**: presentare un nuovo prodotto con pre-order o waitlist
- **Lead generation**: raccogliere email in cambio di un lead magnet (ebook, webinar, free trial)
- **Campagna marketing**: destinazione per ads (Google Ads, Meta Ads, newsletter)
- **Evento**: iscrizione a webinar, conferenza, workshop
- **Coming soon**: raccogliere interesse prima del lancio ufficiale

### Varianti comuni

| Variante | Obiettivo | CTA tipico |
|----------|-----------|------------|
| **Squeeze page** | Raccogliere email | "Scarica gratis" |
| **Sales page** | Vendere un prodotto | "Acquista ora" |
| **Click-through** | Portare al checkout | "Inizia la prova gratuita" |
| **Webinar** | Iscrizione evento | "Prenota il tuo posto" |
| **Coming soon** | Raccogliere interesse | "Avvisami al lancio" |

### Metriche chiave

| Metrica | Cosa misura | Benchmark |
|---------|-------------|-----------|
| Conversion Rate | % visitatori che completano la CTA | 2-5% (media), 10%+ (ottimizzata) |
| Bounce Rate | % che abbandona senza interagire | < 40% (buono) |
| Time on Page | Tempo medio sulla pagina | > 1 min (buono) |
| CPA (Cost per Acquisition) | Costo per conversione da ads | Varia per settore |
| CTR (Click-Through Rate) | % click su CTA | > 3% (buono) |
| Form Completion Rate | % che completa il form | > 25% (buono) |

---

## 2. Per l'Utente

Questa sezione copre la gestione operativa della landing page tramite Claude Code e il plugin wordpress-manager.

### 2.1 Concept e Pianificazione

**Definisci l'obiettivo prima di progettare la pagina.**

1. **Un solo obiettivo**: ogni landing page ha UNA sola CTA. Non due, non tre. Una.
2. **Target audience**: chi arriva su questa pagina? Da dove? (ads, email, social)
3. **Value proposition**: perche il visitatore dovrebbe agire? Cosa ottiene?
4. **Urgenza**: perche agire ORA? (offerta limitata, posti limitati, scadenza)
5. **Social proof**: perche fidarsi? (testimonianze, numeri, loghi clienti)

### 2.2 Setup Ambiente Locale

**Creare una landing page WordPress locale con wp-env:**

```bash
# 1. Creare la directory del progetto
mkdir -p ~/projects/mia-landing
cd ~/projects/mia-landing

# 2. Creare .wp-env.json
cat > .wp-env.json << 'EOF'
{
  "core": "WordPress/WordPress#master",
  "themes": ["./themes/landing-theme"],
  "plugins": [],
  "config": {
    "WP_DEBUG": true,
    "WP_DEBUG_LOG": true,
    "SCRIPT_DEBUG": true
  },
  "port": 8888
}
EOF

# 3. Creare la struttura del tema
mkdir -p themes/landing-theme/{templates,parts,patterns}

# 4. Avviare WordPress
npx wp-env start

# 5. Impostare homepage statica
npx wp-env run cli wp post create \
  --post_type=page \
  --post_status=publish \
  --post_title="Landing Page"

npx wp-env run cli wp option update show_on_front page
npx wp-env run cli wp option update page_on_front 2
```

**Con Claude Code (linguaggio naturale):**

> "Crea un nuovo progetto WordPress landing page con wp-env, tema minimalista con CTA arancione su sfondo scuro, homepage statica"

**Credenziali default wp-env:** `admin` / `password` su `http://localhost:8888/wp-admin/`

### 2.3 Anatomia della Landing Page

Una landing page efficace segue questa struttura dall'alto verso il basso:

```
┌─────────────────────────────────────┐
│  HEADER MINIMALE (logo, no nav)     │
├─────────────────────────────────────┤
│                                     │
│  HERO                               │
│  - Headline (value proposition)     │
│  - Sub-headline (beneficio chiave)  │
│  - CTA primario (bottone)           │
│  - Immagine/video prodotto          │
│                                     │
├─────────────────────────────────────┤
│  SOCIAL PROOF                       │
│  - Loghi clienti / Media mentions   │
│  - "Usato da 10.000+ persone"       │
├─────────────────────────────────────┤
│  BENEFICI (3-4 punti)               │
│  - Icona + titolo + descrizione     │
│  - Focus sul risultato, non feature │
├─────────────────────────────────────┤
│  COME FUNZIONA (3 step)             │
│  - Step 1 → Step 2 → Step 3        │
├─────────────────────────────────────┤
│  TESTIMONIANZE                      │
│  - Foto + nome + ruolo + quote      │
├─────────────────────────────────────┤
│  PRICING / OFFERTA                  │
│  - Prezzo barrato / sconto          │
│  - Cosa include                     │
├─────────────────────────────────────┤
│  FAQ                                │
│  - Risposte alle obiezioni comuni   │
├─────────────────────────────────────┤
│  CTA FINALE                         │
│  - Ripetizione del CTA primario     │
│  - Urgenza / garanzia               │
├─────────────────────────────────────┤
│  FOOTER MINIMALE                    │
│  - Privacy policy, termini, P.IVA   │
└─────────────────────────────────────┘
```

#### Above the Fold

I primi 600px della pagina (visibili senza scroll) sono critici:
- Headline chiara e immediata (max 10 parole)
- Sub-headline che espande il beneficio (max 20 parole)
- CTA visibile e contrastato
- Immagine del prodotto/risultato

#### Testo dei CTA

| CTA debole | CTA forte |
|------------|-----------|
| "Invia" | "Scarica la guida gratuita" |
| "Clicca qui" | "Inizia la prova di 14 giorni" |
| "Submit" | "Prenota il tuo posto" |
| "Registrati" | "Crea il tuo account gratuito" |

**Regola**: il testo del CTA deve completare la frase "Voglio..."

### 2.4 SEO per Landing Page

Le landing page hanno esigenze SEO diverse da un blog:

```bash
# Permalink pulito
npx wp-env run cli wp rewrite structure '/%postname%/'
npx wp-env run cli wp rewrite flush --hard

# Impostare titolo e tagline
npx wp-env run cli wp option update blogname "Nome Brand"
npx wp-env run cli wp option update blogdescription ""
```

- **Title tag**: keyword + beneficio (es. "Software Gestionale | Prova Gratuita 14 Giorni")
- **Meta description**: 150-160 caratteri con CTA implicita
- **Un solo H1**: la headline principale
- **URL slug**: breve e descrittivo (es. `/prova-gratuita/`)
- **Canonical**: impostare per evitare duplicati (varianti A/B)

### 2.5 Performance = Conversione

Ogni secondo di caricamento in piu riduce le conversioni del 7%.

| Azione | Impatto | Come |
|--------|---------|------|
| Ottimizzazione immagini | Alto | WebP, dimensioni appropriate, lazy loading |
| Minificazione CSS/JS | Medio | Autoptimize o plugin simile |
| CDN | Alto | Cloudflare (free tier) |
| Hosting veloce | Alto | LiteSpeed, Nginx, non shared hosting |
| Preload font | Medio | `<link rel="preload">` per font custom |
| Critical CSS inline | Alto | Solo CSS above-the-fold inline |

**Target Core Web Vitals:**
- LCP (Largest Contentful Paint): < 2.5s
- FID (First Input Delay): < 100ms
- CLS (Cumulative Layout Shift): < 0.1

---

## 3. Per lo Sviluppatore

Questa sezione copre l'architettura tecnica e le best practice per sviluppare un block theme per landing page.

### 3.1 Architettura Theme

Una landing page richiede un template dedicato senza la navigazione standard:

```
themes/landing-theme/
├── style.css                 # Header theme (metadata)
├── theme.json                # Design tokens e stili globali
├── functions.php             # Enqueue fonts, setup theme
├── templates/
│   ├── index.html            # Fallback
│   ├── front-page.html       # Homepage statica (landing)
│   ├── page.html             # Pagina generica
│   ├── page-landing.html     # Template custom senza nav
│   └── 404.html              # Pagina non trovata
├── parts/
│   ├── header.html           # Header standard (per pagine non-landing)
│   ├── header-minimal.html   # Header minimale (solo logo)
│   └── footer-minimal.html   # Footer legale minimale
└── patterns/
    ├── hero-landing.php
    ├── social-proof.php
    ├── benefits.php
    ├── testimonials.php
    ├── pricing-table.php
    ├── faq-accordion.php
    └── cta-final.php
```

### 3.2 theme.json — Design Tokens per Conversione

#### Palette CTA-Focused

```json
{
  "$schema": "https://schemas.wp.org/wp/6.7/theme.json",
  "version": 3,
  "settings": {
    "color": {
      "palette": [
        { "slug": "base", "color": "#0a0a0a", "name": "Base" },
        { "slug": "contrast", "color": "#ffffff", "name": "Contrast" },
        { "slug": "accent", "color": "#f97316", "name": "Accent (CTA)" },
        { "slug": "accent-hover", "color": "#ea580c", "name": "Accent Hover" },
        { "slug": "surface", "color": "#171717", "name": "Surface" },
        { "slug": "muted", "color": "#a3a3a3", "name": "Muted" },
        { "slug": "success", "color": "#22c55e", "name": "Success" }
      ],
      "defaultPalette": false,
      "defaultGradients": false
    }
  }
}
```

**Nota**: il colore CTA (`accent`) deve avere il massimo contrasto visivo rispetto al resto della pagina. Arancione su sfondo scuro e una combinazione ad alta conversione.

#### Typography Persuasiva

```json
{
  "settings": {
    "typography": {
      "fontFamilies": [
        {
          "fontFamily": "'Inter', -apple-system, sans-serif",
          "slug": "body",
          "name": "Body"
        },
        {
          "fontFamily": "'Cal Sans', 'Inter', sans-serif",
          "slug": "heading",
          "name": "Heading"
        }
      ],
      "fontSizes": [
        { "slug": "small", "size": "0.875rem" },
        { "slug": "medium", "size": "1rem" },
        { "slug": "large", "size": "1.25rem" },
        { "slug": "x-large", "size": "clamp(1.5rem, 3vw, 2rem)" },
        { "slug": "xx-large", "size": "clamp(2rem, 5vw, 3.5rem)" },
        { "slug": "hero", "size": "clamp(2.5rem, 6vw, 4.5rem)" }
      ]
    }
  }
}
```

**`clamp()`** per il hero: il titolo si scala fluidamente da mobile (2.5rem) a desktop (4.5rem) senza media queries.

#### Layout e Stili Globali

```json
{
  "settings": {
    "layout": {
      "contentSize": "800px",
      "wideSize": "1200px"
    }
  },
  "styles": {
    "elements": {
      "button": {
        "color": {
          "background": "var(--wp--preset--color--accent)",
          "text": "var(--wp--preset--color--contrast)"
        },
        "typography": {
          "fontWeight": "600",
          "fontSize": "var(--wp--preset--font-size--large)"
        },
        "border": {
          "radius": "8px"
        },
        "spacing": {
          "padding": {
            "top": "1rem",
            "bottom": "1rem",
            "left": "2rem",
            "right": "2rem"
          }
        },
        ":hover": {
          "color": {
            "background": "var(--wp--preset--color--accent-hover)"
          }
        }
      },
      "heading": {
        "typography": {
          "fontFamily": "var(--wp--preset--font-family--heading)",
          "fontWeight": "700",
          "lineHeight": "1.1"
        }
      }
    },
    "blocks": {
      "core/button": {
        "variations": {
          "outline": {
            "border": {
              "color": "var(--wp--preset--color--accent)",
              "width": "2px"
            },
            "color": {
              "text": "var(--wp--preset--color--accent)",
              "background": "transparent"
            }
          }
        }
      }
    }
  }
}
```

### 3.3 Templates

#### page-landing.html — Template senza navigazione

```html
<!-- wp:template-part {"slug":"header-minimal","area":"header"} /-->

<!-- wp:group {"tagName":"main","layout":{"type":"constrained"}} -->
<main class="wp-block-group">
  <!-- wp:post-content {"layout":{"type":"constrained"}} /-->
</main>
<!-- /wp:group -->

<!-- wp:template-part {"slug":"footer-minimal","area":"footer"} /-->
```

#### parts/header-minimal.html — Solo logo

```html
<!-- wp:group {"style":{"spacing":{"padding":{"top":"1rem","bottom":"1rem"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group" style="padding-top:1rem;padding-bottom:1rem">
  <!-- wp:group {"layout":{"type":"flex","justifyContent":"center"}} -->
  <div class="wp-block-group">
    <!-- wp:site-logo {"width":120} /-->
  </div>
  <!-- /wp:group -->
</div>
<!-- /wp:group -->
```

#### parts/footer-minimal.html — Footer legale

```html
<!-- wp:group {"backgroundColor":"surface","style":{"spacing":{"padding":{"top":"2rem","bottom":"2rem"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group has-surface-background-color has-background" style="padding-top:2rem;padding-bottom:2rem">
  <!-- wp:paragraph {"align":"center","textColor":"muted","fontSize":"small"} -->
  <p class="has-text-align-center has-muted-color has-text-color has-small-font-size">
    <a href="/privacy-policy/">Privacy Policy</a> | <a href="/termini/">Termini e Condizioni</a>
  </p>
  <!-- /wp:paragraph -->
  <!-- wp:paragraph {"align":"center","textColor":"muted","fontSize":"small"} -->
  <p class="has-text-align-center has-muted-color has-text-color has-small-font-size">
    Nome Azienda S.r.l. — P.IVA 00000000000
  </p>
  <!-- /wp:paragraph -->
</div>
<!-- /wp:group -->
```

### 3.4 Patterns

#### Pattern: Hero Landing

```php
<?php
/**
 * Title: Hero Landing
 * Slug: landing-theme/hero-landing
 * Categories: featured, landing
 * Keywords: hero, landing, CTA
 */
?>
<!-- wp:group {"align":"full","backgroundColor":"base","style":{"spacing":{"padding":{"top":"6rem","bottom":"6rem","left":"2rem","right":"2rem"}}},"layout":{"type":"constrained","contentSize":"800px"}} -->
<div class="wp-block-group alignfull has-base-background-color has-background" style="padding:6rem 2rem">
  <!-- wp:heading {"textAlign":"center","level":1,"fontSize":"hero","textColor":"contrast"} -->
  <h1 class="wp-block-heading has-text-align-center has-contrast-color has-text-color has-hero-font-size">Headline con la tua value proposition</h1>
  <!-- /wp:heading -->
  <!-- wp:paragraph {"align":"center","textColor":"muted","fontSize":"large"} -->
  <p class="has-text-align-center has-muted-color has-text-color has-large-font-size">Una frase che espande il beneficio principale e motiva il visitatore ad agire adesso.</p>
  <!-- /wp:paragraph -->
  <!-- wp:buttons {"layout":{"type":"flex","justifyContent":"center"}} -->
  <div class="wp-block-buttons">
    <!-- wp:button {"fontSize":"large"} -->
    <div class="wp-block-button has-custom-font-size has-large-font-size"><a class="wp-block-button__link wp-element-button">Inizia la prova gratuita</a></div>
    <!-- /wp:button -->
  </div>
  <!-- /wp:buttons -->
  <!-- wp:paragraph {"align":"center","textColor":"muted","fontSize":"small"} -->
  <p class="has-text-align-center has-muted-color has-text-color has-small-font-size">Nessuna carta di credito richiesta. Cancella quando vuoi.</p>
  <!-- /wp:paragraph -->
</div>
<!-- /wp:group -->
```

#### Pattern: Social Proof

```php
<?php
/**
 * Title: Social Proof Bar
 * Slug: landing-theme/social-proof
 * Categories: landing
 * Keywords: social proof, loghi, trust
 */
?>
<!-- wp:group {"style":{"spacing":{"padding":{"top":"2rem","bottom":"2rem"}},"border":{"top":{"color":"var(--wp--preset--color--surface)","width":"1px"},"bottom":{"color":"var(--wp--preset--color--surface)","width":"1px"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group" style="border-top:1px solid var(--wp--preset--color--surface);border-bottom:1px solid var(--wp--preset--color--surface);padding:2rem">
  <!-- wp:paragraph {"align":"center","textColor":"muted","fontSize":"small"} -->
  <p class="has-text-align-center has-muted-color has-text-color has-small-font-size"><strong>Scelto da oltre 10.000 professionisti</strong></p>
  <!-- /wp:paragraph -->
  <!-- wp:group {"layout":{"type":"flex","justifyContent":"center","flexWrap":"wrap"}} -->
  <div class="wp-block-group">
    <!-- wp:paragraph {"textColor":"muted"} -->
    <p class="has-muted-color has-text-color">Logo 1</p>
    <!-- /wp:paragraph -->
    <!-- wp:paragraph {"textColor":"muted"} -->
    <p class="has-muted-color has-text-color">Logo 2</p>
    <!-- /wp:paragraph -->
    <!-- wp:paragraph {"textColor":"muted"} -->
    <p class="has-muted-color has-text-color">Logo 3</p>
    <!-- /wp:paragraph -->
    <!-- wp:paragraph {"textColor":"muted"} -->
    <p class="has-muted-color has-text-color">Logo 4</p>
    <!-- /wp:paragraph -->
  </div>
  <!-- /wp:group -->
</div>
<!-- /wp:group -->
```

#### Pattern: Testimonials

```php
<?php
/**
 * Title: Testimonianze
 * Slug: landing-theme/testimonials
 * Categories: landing, testimonials
 * Keywords: testimonials, recensioni, social proof
 */
?>
<!-- wp:group {"style":{"spacing":{"padding":{"top":"4rem","bottom":"4rem"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group" style="padding:4rem 0">
  <!-- wp:heading {"textAlign":"center","level":2} -->
  <h2 class="wp-block-heading has-text-align-center">Cosa dicono i nostri clienti</h2>
  <!-- /wp:heading -->
  <!-- wp:columns {"isStackedOnMobile":true,"style":{"spacing":{"blockGap":{"left":"2rem"}}}} -->
  <div class="wp-block-columns is-stacked-on-mobile">
    <!-- wp:column {"backgroundColor":"surface","style":{"spacing":{"padding":{"top":"2rem","bottom":"2rem","left":"1.5rem","right":"1.5rem"}},"border":{"radius":"12px"}}} -->
    <div class="wp-block-column has-surface-background-color has-background" style="border-radius:12px;padding:2rem 1.5rem">
      <!-- wp:paragraph {"fontSize":"large"} -->
      <p class="has-large-font-size">"Risultato incredibile. Ho raddoppiato le conversioni in due settimane."</p>
      <!-- /wp:paragraph -->
      <!-- wp:paragraph {"textColor":"muted","fontSize":"small"} -->
      <p class="has-muted-color has-text-color has-small-font-size"><strong>Mario Rossi</strong> — CEO, Azienda Srl</p>
      <!-- /wp:paragraph -->
    </div>
    <!-- /wp:column -->
    <!-- wp:column {"backgroundColor":"surface","style":{"spacing":{"padding":{"top":"2rem","bottom":"2rem","left":"1.5rem","right":"1.5rem"}},"border":{"radius":"12px"}}} -->
    <div class="wp-block-column has-surface-background-color has-background" style="border-radius:12px;padding:2rem 1.5rem">
      <!-- wp:paragraph {"fontSize":"large"} -->
      <p class="has-large-font-size">"Semplice da usare, risultati misurabili dal primo giorno."</p>
      <!-- /wp:paragraph -->
      <!-- wp:paragraph {"textColor":"muted","fontSize":"small"} -->
      <p class="has-muted-color has-text-color has-small-font-size"><strong>Laura Bianchi</strong> — Marketing Manager, Brand SpA</p>
      <!-- /wp:paragraph -->
    </div>
    <!-- /wp:column -->
  </div>
  <!-- /wp:columns -->
</div>
<!-- /wp:group -->
```

#### Pattern: FAQ Accordion

```php
<?php
/**
 * Title: FAQ Accordion
 * Slug: landing-theme/faq-accordion
 * Categories: landing, faq
 * Keywords: faq, domande, accordion
 */
?>
<!-- wp:group {"style":{"spacing":{"padding":{"top":"4rem","bottom":"4rem"}}},"layout":{"type":"constrained","contentSize":"700px"}} -->
<div class="wp-block-group" style="padding:4rem 0">
  <!-- wp:heading {"textAlign":"center","level":2} -->
  <h2 class="wp-block-heading has-text-align-center">Domande frequenti</h2>
  <!-- /wp:heading -->
  <!-- wp:details -->
  <details class="wp-block-details">
    <summary>Come funziona la prova gratuita?</summary>
    <!-- wp:paragraph {"textColor":"muted"} -->
    <p class="has-muted-color has-text-color">Hai 14 giorni per provare tutte le funzionalita senza limiti. Non serve carta di credito. Se non ti convince, non paghi nulla.</p>
    <!-- /wp:paragraph -->
  </details>
  <!-- /wp:details -->
  <!-- wp:details -->
  <details class="wp-block-details">
    <summary>Posso cancellare in qualsiasi momento?</summary>
    <!-- wp:paragraph {"textColor":"muted"} -->
    <p class="has-muted-color has-text-color">Si, puoi cancellare con un click dalle impostazioni del tuo account. Nessun vincolo contrattuale.</p>
    <!-- /wp:paragraph -->
  </details>
  <!-- /wp:details -->
  <!-- wp:details -->
  <details class="wp-block-details">
    <summary>Offrite supporto in italiano?</summary>
    <!-- wp:paragraph {"textColor":"muted"} -->
    <p class="has-muted-color has-text-color">Certo! Il nostro team di supporto risponde in italiano via email e chat dal lunedi al venerdi, 9-18.</p>
    <!-- /wp:paragraph -->
  </details>
  <!-- /wp:details -->
</div>
<!-- /wp:group -->
```

#### Pattern: CTA Finale

```php
<?php
/**
 * Title: CTA Finale
 * Slug: landing-theme/cta-final
 * Categories: landing, call-to-action
 * Keywords: CTA, conversione, finale
 */
?>
<!-- wp:group {"align":"full","backgroundColor":"surface","style":{"spacing":{"padding":{"top":"5rem","bottom":"5rem","left":"2rem","right":"2rem"}}},"layout":{"type":"constrained","contentSize":"600px"}} -->
<div class="wp-block-group alignfull has-surface-background-color has-background" style="padding:5rem 2rem">
  <!-- wp:heading {"textAlign":"center","level":2,"fontSize":"xx-large"} -->
  <h2 class="wp-block-heading has-text-align-center has-xx-large-font-size">Pronto a iniziare?</h2>
  <!-- /wp:heading -->
  <!-- wp:paragraph {"align":"center","textColor":"muted","fontSize":"large"} -->
  <p class="has-text-align-center has-muted-color has-text-color has-large-font-size">Unisciti a migliaia di professionisti che hanno gia scelto noi.</p>
  <!-- /wp:paragraph -->
  <!-- wp:buttons {"layout":{"type":"flex","justifyContent":"center"}} -->
  <div class="wp-block-buttons">
    <!-- wp:button {"fontSize":"large"} -->
    <div class="wp-block-button has-custom-font-size has-large-font-size"><a class="wp-block-button__link wp-element-button">Inizia la prova gratuita</a></div>
    <!-- /wp:button -->
  </div>
  <!-- /wp:buttons -->
  <!-- wp:paragraph {"align":"center","textColor":"muted","fontSize":"small"} -->
  <p class="has-text-align-center has-muted-color has-text-color has-small-font-size">14 giorni gratis. Nessuna carta richiesta. Cancella quando vuoi.</p>
  <!-- /wp:paragraph -->
</div>
<!-- /wp:group -->
```

### 3.5 Plugin Consigliati

| Plugin | Scopo | Alternativa |
|--------|-------|-------------|
| **WPForms Lite** | Form contatti/lead gen | Contact Form 7, Fluent Forms |
| **MonsterInsights** | Google Analytics integrato | Site Kit by Google |
| **Yoast SEO** | SEO on-page, meta | Rank Math |
| **WP Super Cache** | Caching pagine | W3 Total Cache, LiteSpeed Cache |
| **ShortPixel** | Ottimizzazione immagini | Imagify, EWWW |
| **Complianz** | GDPR cookie banner | Iubenda, CookieYes |
| **Perfmatters** | Performance fine-tuning | Asset CleanUp |

### 3.6 Workflow di Sviluppo

#### Ciclo di sviluppo

```
1. Modifica file theme (templates, theme.json, patterns)
       ↓
2. Salva — wp-env monta i file in tempo reale
       ↓
3. Ricarica browser su localhost:8888
       ↓
4. Verifica nel Site Editor (wp-admin/site-editor.php)
       ↓
5. Testa responsive (mobile, tablet, desktop)
       ↓
6. Verifica CTA visibilita e contrasto
       ↓
7. Ripeti
```

#### Comandi WP-CLI utili

```bash
# Creare pagine di supporto
npx wp-env run cli wp post create \
  --post_type=page \
  --post_status=publish \
  --post_title="Privacy Policy"

npx wp-env run cli wp post create \
  --post_type=page \
  --post_status=publish \
  --post_title="Termini e Condizioni"

# Impostare homepage statica
npx wp-env run cli wp option update show_on_front page
npx wp-env run cli wp option update page_on_front 2

# Fermare e riavviare
npx wp-env stop
npx wp-env start
```

#### Debug

```bash
# Leggere il log di debug
npx wp-env run cli cat /var/www/html/wp-content/debug.log

# Controllare errori PHP
npx wp-env logs wordpress --watch

# Verificare che il tema sia valido
npx wp-env run cli wp theme status landing-theme
```

---

## 4. Checklist di Lancio

### Conversione
- [ ] CTA primario visibile above the fold
- [ ] Un solo obiettivo per pagina (una sola CTA)
- [ ] Testo CTA orientato all'azione ("Inizia", "Scarica", "Prenota")
- [ ] Form con meno campi possibili (solo quelli essenziali)
- [ ] Social proof presente (testimonianze, numeri, loghi)
- [ ] FAQ che rispondono alle obiezioni piu comuni
- [ ] Senso di urgenza o scarsita (se appropriato)

### Contenuto
- [ ] Headline chiara e immediata (< 10 parole)
- [ ] Sub-headline che espande il beneficio
- [ ] Benefici focalizzati sul risultato, non sulle feature
- [ ] Testimonianze reali con nome e ruolo
- [ ] Nessun errore grammaticale o di formattazione

### Tecnico
- [ ] Navigazione minimale o assente
- [ ] Template responsive: mobile, tablet, desktop
- [ ] Form funzionante e testato (invio + email di conferma)
- [ ] Favicon/site icon impostata
- [ ] Redirect HTTP → HTTPS attivo
- [ ] Template 404 personalizzato

### SEO
- [ ] Title tag con keyword + beneficio
- [ ] Meta description con CTA implicita
- [ ] Un solo H1 (headline principale)
- [ ] URL slug breve e descrittivo
- [ ] Canonical URL impostato
- [ ] robots.txt non blocca la pagina

### Performance
- [ ] LCP < 2.5 secondi
- [ ] CLS < 0.1
- [ ] Immagini ottimizzate (WebP, dimensioni appropriate)
- [ ] Lazy loading per immagini below the fold
- [ ] Lighthouse Performance > 90 su mobile
- [ ] Nessun plugin inutile attivo

### Analytics e Tracking
- [ ] Google Analytics/Tag Manager configurato
- [ ] Evento di conversione tracciato (form submit, click CTA)
- [ ] UTM parameters gestiti (per campagne ads)
- [ ] Facebook Pixel / altri pixel installati (se ads)
- [ ] Heatmap tool attivo (Hotjar, Microsoft Clarity — opzionale)

---

## 5. Riferimenti

### Skill del Plugin

| Skill | Quando usarla |
|-------|---------------|
| `wp-block-themes` | Sviluppo theme.json, templates, parts, patterns |
| `wp-local-env` | Setup e gestione ambiente wp-env |
| `wp-deploy` | Deploy in produzione |
| `wp-performance` | Ottimizzazione performance e Core Web Vitals |
| `wp-backup` | Backup e restore |
| `wp-audit` | Verifica sicurezza e compliance |
| `wp-content` | Gestione contenuti pagine |
| `wp-interactivity-api` | Interattivita (form validazione, countdown timer) |
| `wp-block-development` | Blocchi custom per funzionalita specifiche |

### Risorse Esterne

- [Block Theme Handbook](https://developer.wordpress.org/themes/block-themes/) — Documentazione ufficiale
- [theme.json Reference](https://developer.wordpress.org/themes/global-settings-and-styles/) — Schema completo
- [WordPress Template Hierarchy](https://developer.wordpress.org/themes/templates/template-hierarchy/) — Quale template viene usato
- [Core Web Vitals](https://web.dev/vitals/) — Metriche performance Google
- [Landing Page Best Practices](https://unbounce.com/landing-page-articles/landing-page-best-practices/) — Guida conversion optimization
- [WP-CLI Commands](https://developer.wordpress.org/cli/commands/) — Tutti i comandi CLI
- [GDPR Compliance for WordPress](https://developer.wordpress.org/apis/privacy/) — Privacy API WordPress

---

*Guida per il plugin [wordpress-manager](https://github.com/morrealev/wordpress-manager) v1.5.0+*
