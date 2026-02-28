# WordPress Blog — Guida Completa

**Tipologia:** Blog (personale, aziendale, magazine)
**Versione:** 1.0.0
**Ultima modifica:** 2026-02-27
**Skill correlate:** wp-block-themes, wp-local-env, wp-content, wp-deploy

---

## 1. Panoramica

### Cos'e un WordPress Blog

Un blog WordPress e un sito centrato sulla pubblicazione regolare di contenuti testuali (post), organizzati cronologicamente e classificati per categorie e tag. WordPress nasce come piattaforma blog ed e tuttora lo strumento piu potente per questo scopo.

### Quando scegliere un blog

- **Blog personale/developer journal**: pensieri, tutorial, note tecniche
- **Blog aziendale**: content marketing, thought leadership, SEO organico
- **Magazine/rivista online**: multi-autore, alto volume, categorie complesse
- **Blog + portfolio**: sezione articoli affiancata a una vetrina lavori

### Metriche chiave

| Metrica | Cosa misura | Tool |
|---------|-------------|------|
| Sessioni organiche | Traffico da ricerca | Google Search Console |
| Tempo medio sulla pagina | Qualita del contenuto | Google Analytics |
| Bounce rate | Pertinenza del contenuto | Google Analytics |
| Pagine per sessione | Engagement e interlinking | Google Analytics |
| Posizionamento keyword | Visibilita SEO | Rank tracker |

---

## 2. Per l'Utente

Questa sezione copre la gestione operativa del blog tramite Claude Code e il plugin wordpress-manager.

### 2.1 Concept e Pianificazione

**Definisci l'identita del blog prima di scrivere codice.**

1. **Nicchia**: scegli un argomento specifico (es. "WordPress development" non "tecnologia")
2. **Naming**: nome breve, memorizzabile, disponibile come dominio
3. **Tone of voice**: formale vs conversazionale, tecnico vs divulgativo
4. **Palette colori**:
   - Blog personale: toni scuri (developer) o neutri (minimalista)
   - Blog aziendale: colori brand, alta leggibilita
   - Magazine: contrasti forti, gerarchia visiva chiara
5. **Struttura pagine**:
   - Homepage (ultimi post o post in evidenza)
   - About (chi sei, perche scrivi)
   - Contatti
   - Archivio per categoria (opzionale)

### 2.2 Setup Ambiente Locale

**Creare un blog WordPress locale con wp-env:**

```bash
# 1. Creare la directory del progetto
mkdir -p ~/projects/mio-blog
cd ~/projects/mio-blog

# 2. Creare .wp-env.json
cat > .wp-env.json << 'EOF'
{
  "core": "WordPress/WordPress#master",
  "themes": ["./themes/mio-tema"],
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
mkdir -p themes/mio-tema/{templates,parts,patterns}

# 4. Avviare WordPress
npx wp-env start
```

**Con Claude Code (linguaggio naturale):**

> "Crea un nuovo progetto WordPress blog con wp-env, tema block dark con font monospace per i titoli, avvialo su localhost:8888"

Claude usera le skill `wp-local-env` e `wp-block-themes` per eseguire tutti i passi.

**Credenziali default wp-env:** `admin` / `password` su `http://localhost:8888/wp-admin/`

### 2.3 Struttura Contenuti

#### Tassonomia

Organizza i contenuti prima di scrivere:

| Elemento | Scopo | Esempio |
|----------|-------|---------|
| **Categorie** | Macro-argomenti (max 5-7) | Architecture, Debugging, Tools |
| **Tag** | Argomenti trasversali | javascript, wordpress, cli |
| **Formati** | Tipologia del post | How-to, Lista, Opinione, Case study |

**Regole pratiche:**
- Ogni post ha UNA categoria principale
- I tag sono opzionali, usali solo se ricorrenti (almeno 3 post per tag)
- Non creare categorie per un solo post

#### Piano Editoriale

Per un blog personale, 1-2 post a settimana e sostenibile. Per un blog aziendale, pianifica almeno un mese avanti.

```
Settimana 1: [How-to] Come configurare wp-env per sviluppo locale
Settimana 2: [Opinione] Perche i block theme sono il futuro
Settimana 3: [Lista] 5 plugin essenziali per ogni blog WordPress
Settimana 4: [Case study] Migrazione da tema classico a block theme
```

#### Formati dei Post

| Formato | Lunghezza | Quando usarlo |
|---------|-----------|---------------|
| How-to/tutorial | 1500-2500 parole | Insegnare un processo step-by-step |
| Lista (listicle) | 800-1500 parole | Raccogliere risorse o consigli |
| Opinione | 500-1000 parole | Prendere posizione su un tema |
| Case study | 1000-2000 parole | Raccontare un progetto reale |
| Quick tip | 300-500 parole | Condividere un trucco specifico |

### 2.4 Gestione Quotidiana

#### Creare un post via WP-CLI

```bash
# Creare un post pubblicato
npx wp-env run cli wp post create \
  --post_type=post \
  --post_status=publish \
  --post_title="Titolo del post" \
  --post_category=2 \
  --post_content='<!-- wp:paragraph -->
<p>Contenuto del post con markup Gutenberg.</p>
<!-- /wp:paragraph -->'

# Creare una bozza
npx wp-env run cli wp post create \
  --post_type=post \
  --post_status=draft \
  --post_title="Bozza articolo"

# Programmare un post futuro
npx wp-env run cli wp post create \
  --post_type=post \
  --post_status=future \
  --post_date="2026-03-15 09:00:00" \
  --post_title="Post programmato"
```

#### Gestire le revisioni

```bash
# Vedere le revisioni di un post
npx wp-env run cli wp post list --post_type=revision --post_parent=4

# Limitare il numero di revisioni (in wp-config.php)
npx wp-env run cli wp config set WP_POST_REVISIONS 5 --raw
```

#### Gestire i commenti

```bash
# Disabilitare commenti sui nuovi post
npx wp-env run cli wp option update default_comment_status closed

# Moderare commenti in attesa
npx wp-env run cli wp comment list --status=hold --fields=ID,comment_author,comment_content
```

### 2.5 SEO e Performance

#### Permalink

Usa la struttura `/%postname%/` — la migliore per SEO:

```bash
npx wp-env run cli wp rewrite structure '/%postname%/'
npx wp-env run cli wp rewrite flush --hard
```

#### Titoli e Meta

- **Title tag**: keyword principale + brand (es. "Come usare wp-env | Developer Journal")
- **Meta description**: 150-160 caratteri, include CTA implicita
- **Heading hierarchy**: un solo H1 (titolo post), H2 per sezioni, H3 per sotto-sezioni
- **URL slug**: breve, senza stop words (es. `/guida-wp-env/` non `/come-usare-wp-env-per-sviluppo-locale/`)

#### Sitemap e Indicizzazione

```bash
# Verifica che la sitemap sia attiva (richiede plugin SEO)
curl -s http://localhost:8888/wp-sitemap.xml | head -5

# WordPress 5.5+ genera sitemap native
# Per sitemap avanzate, installare Yoast SEO o Rank Math
```

#### Performance Essenziale

| Azione | Impatto | Come |
|--------|---------|------|
| Caching pagine | Alto | Plugin: WP Super Cache, W3 Total Cache |
| Lazy loading immagini | Medio | Nativo da WP 5.5 (attributo `loading="lazy"`) |
| Ottimizzazione immagini | Alto | Plugin: ShortPixel, Imagify |
| Minificazione CSS/JS | Medio | Plugin: Autoptimize |
| CDN | Alto (traffico alto) | Cloudflare (free tier) |

### 2.6 Manutenzione e Backup

#### Backup Database

```bash
# Export completo
npx wp-env run cli wp db export - > backup_$(date +%Y%m%d).sql

# Export solo contenuti (post, pagine, commenti)
npx wp-env run cli wp export --dir=/tmp --post_type=post,page
```

#### Aggiornamenti

```bash
# Verificare aggiornamenti disponibili
npx wp-env run cli wp core check-update
npx wp-env run cli wp plugin list --update=available
npx wp-env run cli wp theme list --update=available

# Aggiornare tutto
npx wp-env run cli wp core update
npx wp-env run cli wp plugin update --all
npx wp-env run cli wp theme update --all
```

#### Monitoraggio

```bash
# Stato generale del sito
npx wp-env run cli wp cli info
npx wp-env run cli wp option get siteurl
npx wp-env run cli wp option get blogname

# Controllo database
npx wp-env run cli wp db check
```

---

## 3. Per lo Sviluppatore

Questa sezione copre l'architettura tecnica e le best practice per sviluppare un block theme per blog.

### 3.1 Architettura Theme

Un block theme per blog necessita di questi template e parts:

```
themes/mio-blog-theme/
├── style.css                 # Header theme (metadata)
├── theme.json                # Design tokens e stili globali
├── functions.php             # Enqueue fonts, setup theme (opzionale)
├── templates/
│   ├── index.html            # Fallback + homepage (query loop)
│   ├── single.html           # Singolo post
│   ├── page.html             # Pagina statica
│   ├── archive.html          # Archivio per categoria/tag/data
│   ├── search.html           # Risultati ricerca
│   └── 404.html              # Pagina non trovata
├── parts/
│   ├── header.html           # Header con site title + navigazione
│   └── footer.html           # Footer con copyright + link
└── patterns/                 # Block patterns opzionali
    ├── hero-post.php
    └── newsletter-cta.php
```

**Template hierarchy per blog:**
La gerarchia dei template WordPress determina quale file viene usato:
- Post singolo: `single-{post_type}.html` → `single.html` → `index.html`
- Archivio categoria: `category-{slug}.html` → `category.html` → `archive.html` → `index.html`
- Pagina: `page-{slug}.html` → `page.html` → `index.html`

### 3.2 theme.json — Design Tokens

#### Palette per Blog

Un blog richiede alta leggibilita per testo lungo. Regole:

- **Contrasto**: minimo 7:1 per body text (WCAG AAA)
- **Colori limitati**: 5-7 colori massimo (base, contrast, accent, surface, muted, border)
- **Accent color**: usato per link e CTA, deve risaltare senza stancare

```json
{
  "settings": {
    "color": {
      "palette": [
        { "slug": "base", "color": "#0f172a", "name": "Base" },
        { "slug": "contrast", "color": "#f8fafc", "name": "Contrast" },
        { "slug": "accent", "color": "#6366f1", "name": "Accent" },
        { "slug": "surface", "color": "#1e293b", "name": "Surface" },
        { "slug": "muted", "color": "#94a3b8", "name": "Muted" }
      ]
    }
  }
}
```

#### Typography Scale per Long-Form

```json
{
  "settings": {
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
        { "slug": "small", "size": "0.875rem" },
        { "slug": "medium", "size": "1rem" },
        { "slug": "large", "size": "1.25rem" },
        { "slug": "x-large", "size": "1.75rem" },
        { "slug": "xx-large", "size": "2.5rem" }
      ]
    }
  }
}
```

**Nota:** `line-height: 1.7` per body text e ottimale per la lettura di articoli lunghi. Per i titoli, `1.2` mantiene compattezza.

#### Layout

```json
{
  "settings": {
    "layout": {
      "contentSize": "720px",
      "wideSize": "1100px"
    }
  }
}
```

- **720px content**: larghezza ottimale per leggibilita (65-75 caratteri per riga)
- **1100px wide**: per immagini, code block, tabelle che necessitano piu spazio

### 3.3 Templates e Parts

#### index.html — Homepage con Query Loop

Il template principale del blog usa il blocco `core/query` per elencare i post:

```html
<!-- wp:template-part {"slug":"header","area":"header"} /-->

<!-- wp:group {"tagName":"main","layout":{"type":"constrained"}} -->
<main class="wp-block-group">
  <!-- wp:query {"queryId":1,"query":{"perPage":10,"inherit":true}} -->
  <div class="wp-block-query">
    <!-- wp:post-template -->
      <!-- wp:post-date /-->
      <!-- wp:post-title {"isLink":true} /-->
      <!-- wp:post-excerpt {"moreText":"continua →"} /-->
    <!-- /wp:post-template -->

    <!-- wp:query-pagination -->
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

**`inherit: true`** fa si che WordPress usi la query principale della pagina, rispettando archivi e ricerche.

#### single.html — Post con Navigazione

Elementi chiave del template single:
- Data pubblicazione (`core/post-date`)
- Titolo (`core/post-title`)
- Categorie/tag (`core/post-terms`)
- Contenuto (`core/post-content`)
- Navigazione prev/next (`core/post-navigation-link`)

#### header.html — Navigazione

```html
<!-- wp:group {"layout":{"type":"flex","justifyContent":"space-between"}} -->
  <!-- wp:site-title /-->
  <!-- wp:navigation {"overlayMenu":"mobile"} -->
    <!-- wp:navigation-link {"label":"Home","url":"/"} /-->
    <!-- wp:navigation-link {"label":"About","url":"/about/"} /-->
  <!-- /wp:navigation -->
<!-- /wp:group -->
```

**`overlayMenu: "mobile"`** attiva automaticamente il menu hamburger su schermi piccoli.

### 3.4 Patterns e Blocchi Custom

#### Pattern: Newsletter CTA

```php
<?php
/**
 * Title: Newsletter CTA
 * Slug: mio-tema/newsletter-cta
 * Categories: call-to-action
 */
?>
<!-- wp:group {"backgroundColor":"surface","style":{"spacing":{"padding":{"top":"2rem","bottom":"2rem","left":"2rem","right":"2rem"}},"border":{"radius":"8px"}}} -->
<div class="wp-block-group has-surface-background-color has-background" style="border-radius:8px;padding:2rem">
  <!-- wp:heading {"level":3} -->
  <h3 class="wp-block-heading">Resta aggiornato</h3>
  <!-- /wp:heading -->
  <!-- wp:paragraph {"textColor":"muted"} -->
  <p class="has-muted-color has-text-color">Ricevi i nuovi post direttamente nella tua inbox. Niente spam, solo contenuti.</p>
  <!-- /wp:paragraph -->
</div>
<!-- /wp:group -->
```

Registra i pattern nella directory `patterns/` — WordPress li scopre automaticamente dal frontmatter PHP.

### 3.5 Plugin Consigliati

| Plugin | Scopo | Alternativa |
|--------|-------|-------------|
| **Yoast SEO** | SEO on-page, sitemap, schema | Rank Math (free, piu funzioni) |
| **WP Super Cache** | Caching pagine | W3 Total Cache |
| **Akismet** | Anti-spam commenti | Antispam Bee (GDPR-friendly) |
| **UpdraftPlus** | Backup automatici | BackWPup |
| **ShortPixel** | Ottimizzazione immagini | Imagify, EWWW |
| **Redirection** | Gestione redirect 301 | — |
| **WP Mail SMTP** | Delivery email affidabile | — |

**Per sviluppo locale**, i plugin si aggiungono in `.wp-env.json`:

```json
{
  "plugins": [
    "https://downloads.wordpress.org/plugin/wordpress-seo.latest-stable.zip"
  ]
}
```

### 3.6 Workflow di Sviluppo Locale

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
5. Ripeti
```

**Hot reload**: wp-env mappa la directory del tema tramite Docker volumes. Ogni modifica ai file e immediatamente visibile senza riavviare i container.

#### Comandi WP-CLI utili per sviluppo blog

```bash
# Generare post di test
npx wp-env run cli wp post generate --count=20 --post_type=post

# Rigenerare thumbnails dopo cambio dimensioni
npx wp-env run cli wp media regenerate --yes

# Importare contenuti demo (WordPress Theme Unit Test)
npx wp-env run cli wp import /path/to/theme-unit-test.xml --authors=create

# Resettare il sito (attenzione: cancella tutto)
npx wp-env clean all

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
npx wp-env run cli wp theme status developer-journal
```

---

## 4. Checklist di Lancio

### Contenuti
- [ ] Almeno 5 post pubblicati con contenuto di qualita
- [ ] Pagina About completa
- [ ] Pagina Contatti con form funzionante
- [ ] Categorie create e assegnate a ogni post
- [ ] Immagini in evidenza per ogni post (opzionale ma consigliato)

### Tecnico
- [ ] Theme attivo e verificato su mobile/tablet/desktop
- [ ] Permalink impostati su `/%postname%/`
- [ ] Titolo sito e tagline configurati
- [ ] Favicon/site icon impostata
- [ ] Menu di navigazione funzionante
- [ ] Template 404 personalizzato
- [ ] `functions.php` carica i font correttamente

### SEO
- [ ] Plugin SEO installato e configurato
- [ ] Sitemap XML accessibile (`/wp-sitemap.xml`)
- [ ] Meta description su pagine principali
- [ ] Google Search Console collegato (produzione)
- [ ] robots.txt non blocca il crawling

### Performance
- [ ] Immagini ottimizzate (WebP, dimensioni appropriate)
- [ ] Caching attivo (produzione)
- [ ] Nessun plugin inutile attivo
- [ ] Lighthouse score > 90 su mobile

### Sicurezza
- [ ] Password admin forte (non la default di wp-env)
- [ ] Plugin aggiornati all'ultima versione
- [ ] SSL attivo (produzione)
- [ ] Commenti spam protetti (Akismet o Antispam Bee)
- [ ] Backup automatico configurato

---

## 5. Riferimenti

### Skill del Plugin

| Skill | Quando usarla |
|-------|---------------|
| `wp-block-themes` | Sviluppo theme.json, templates, parts, patterns |
| `wp-local-env` | Setup e gestione ambiente wp-env |
| `wp-content` | Gestione contenuti, post, pagine |
| `wp-deploy` | Deploy in produzione |
| `wp-backup` | Backup e restore |
| `wp-performance` | Ottimizzazione performance |
| `wp-rest-api` | Integrazione API headless |

### Risorse Esterne

- [Block Theme Handbook](https://developer.wordpress.org/themes/block-themes/) — Documentazione ufficiale
- [theme.json Reference](https://developer.wordpress.org/themes/global-settings-and-styles/) — Schema completo
- [WordPress Template Hierarchy](https://developer.wordpress.org/themes/templates/template-hierarchy/) — Quale template viene usato
- [Block Editor Handbook](https://developer.wordpress.org/block-editor/) — Riferimento blocchi core
- [WP-CLI Commands](https://developer.wordpress.org/cli/commands/) — Tutti i comandi CLI

---

*Guida per il plugin [wordpress-manager](https://github.com/morrealev/wordpress-manager) v1.5.0+*
