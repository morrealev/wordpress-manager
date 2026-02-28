# WordPress E-commerce — Guida Completa

**Tipologia:** E-commerce (negozio online con WooCommerce)
**Versione:** 1.0.0
**Ultima modifica:** 2026-02-28
**Skill correlate:** wp-block-themes, wp-local-env, wp-deploy, wp-performance, wp-plugin-development, wp-rest-api

---

## 1. Panoramica

### Cos'e un E-commerce WordPress

Un e-commerce WordPress e un negozio online costruito con WooCommerce, il plugin di commercio elettronico piu diffuso al mondo (68%+ market share tra le soluzioni e-commerce). WooCommerce trasforma WordPress in una piattaforma di vendita completa: catalogo prodotti, carrello, checkout, gestione ordini, spedizioni e pagamenti.

### Quando scegliere WooCommerce

- **Vendita prodotti fisici**: abbigliamento, food & beverage, artigianato
- **Prodotti digitali**: ebook, corsi, software, template
- **Servizi**: consulenze, prenotazioni, abbonamenti
- **Abbonamenti/subscription**: box mensili, SaaS, membership
- **Marketplace**: piattaforma multi-vendor

### Varianti business model

| Modello | Descrizione | Plugin aggiuntivo |
|---------|-------------|-------------------|
| **B2C** | Vendita diretta al consumatore | WooCommerce core |
| **B2B** | Vendita ad aziende (prezzi su richiesta, quantita minime) | B2BKing, WooCommerce B2B |
| **D2C** | Brand che vende senza intermediari | WooCommerce core |
| **Marketplace** | Multi-vendor, commissioni | Dokan, WCFM |
| **Subscription** | Abbonamenti ricorrenti | WooCommerce Subscriptions |

### Metriche chiave

| Metrica | Cosa misura | Benchmark |
|---------|-------------|-----------|
| Conversion Rate | % visitatori che acquistano | 1-3% (media e-commerce) |
| AOV (Average Order Value) | Valore medio dell'ordine | Varia per settore |
| Cart Abandonment Rate | % che abbandona il carrello | 65-75% (media) |
| CLV (Customer Lifetime Value) | Valore totale di un cliente | AOV x frequenza x durata |
| Revenue per Visitor | Fatturato per visitatore | Conversion Rate x AOV |
| Return Rate | % prodotti resi | < 10% (buono) |

---

## 2. Per l'Utente

Questa sezione copre la gestione operativa del negozio tramite Claude Code e il plugin wordpress-manager.

### 2.1 Concept e Pianificazione

**Definisci il modello di business prima di installare WooCommerce.**

1. **Catalogo**: quanti prodotti? Semplici o con varianti (taglia, colore)?
2. **Pricing**: prezzo fisso, scontato, per quantita, su richiesta?
3. **Spedizioni**: corriere (GLS, BRT, Poste), soglia gratuita, ritiro in sede?
4. **Pagamenti**: Stripe, PayPal, bonifico, contrassegno, Satispay?
5. **Tasse**: IVA italiana (22%, 10%, 4%), vendita in EU?
6. **Legale**: privacy policy, termini di vendita, diritto di recesso (14 giorni)

### 2.2 Setup Ambiente Locale

**Creare un negozio WordPress locale con wp-env + WooCommerce:**

```bash
# 1. Creare la directory del progetto
mkdir -p ~/projects/mio-shop
cd ~/projects/mio-shop

# 2. Creare .wp-env.json con WooCommerce
cat > .wp-env.json << 'EOF'
{
  "core": "WordPress/WordPress#master",
  "themes": ["./themes/shop-theme"],
  "plugins": [
    "https://downloads.wordpress.org/plugin/woocommerce.latest-stable.zip"
  ],
  "config": {
    "WP_DEBUG": true,
    "WP_DEBUG_LOG": true,
    "SCRIPT_DEBUG": true
  },
  "port": 8888
}
EOF

# 3. Creare la struttura del tema
mkdir -p themes/shop-theme/{templates,parts,patterns}

# 4. Avviare WordPress
npx wp-env start
```

**Con Claude Code (linguaggio naturale):**

> "Crea un nuovo progetto WordPress e-commerce con wp-env e WooCommerce, tema block con colori brand verdi, homepage con prodotti in evidenza"

**Credenziali default wp-env:** `admin` / `password` su `http://localhost:8888/wp-admin/`

#### Configurazione iniziale WooCommerce

```bash
# Impostare valuta e localizzazione
npx wp-env run cli wp option update woocommerce_currency EUR
npx wp-env run cli wp option update woocommerce_currency_pos left_space
npx wp-env run cli wp option update woocommerce_price_decimal_sep ","
npx wp-env run cli wp option update woocommerce_price_thousand_sep "."
npx wp-env run cli wp option update woocommerce_default_country "IT"

# Impostare le pagine WooCommerce
npx wp-env run cli wp wc tool run install_pages --user=1
```

### 2.3 Gestione Prodotti

#### Tipologie prodotto

| Tipo | Descrizione | Esempio |
|------|-------------|---------|
| **Semplice** | Un prodotto, un prezzo | Bottiglia singola |
| **Variabile** | Piu varianti (taglia, colore) | T-shirt S/M/L/XL |
| **Raggruppato** | Insieme di prodotti correlati | Kit degustazione |
| **Virtuale/Scaricabile** | Nessuna spedizione, download | Ebook, corso video |

#### Creare prodotti via WP-CLI

```bash
# Prodotto semplice
npx wp-env run cli wp wc product create \
  --name="Acqua di Cactus Poco Dolce" \
  --type=simple \
  --regular_price=3.50 \
  --description="Bevanda naturale a base di acqua di cactus siciliano. Zero calorie." \
  --short_description="Cactus water naturale, zero calorie" \
  --categories='[{"id": 1}]' \
  --manage_stock=true \
  --stock_quantity=100 \
  --weight="0.5" \
  --user=1

# Prodotto variabile (creare prima il prodotto padre, poi le varianti)
npx wp-env run cli wp wc product create \
  --name="T-Shirt DolceZero" \
  --type=variable \
  --description="T-shirt ufficiale del brand" \
  --attributes='[{"name":"Taglia","options":["S","M","L","XL"],"variation":true,"visible":true}]' \
  --user=1

# Elencare i prodotti
npx wp-env run cli wp wc product list --user=1 --fields=id,name,price,stock_quantity

# Aggiornare prezzo
npx wp-env run cli wp wc product update 12 --regular_price=4.00 --user=1
```

#### Categorie prodotto

```bash
# Creare categorie
npx wp-env run cli wp wc product_cat create --name="Bevande" --user=1
npx wp-env run cli wp wc product_cat create --name="Box e Kit" --user=1
npx wp-env run cli wp wc product_cat create --name="Accessori" --user=1

# Elencare categorie
npx wp-env run cli wp wc product_cat list --user=1
```

### 2.4 Ordini e Clienti

```bash
# Elencare ordini recenti
npx wp-env run cli wp wc order list --user=1 --fields=id,status,total,date_created

# Aggiornare stato ordine
npx wp-env run cli wp wc order update 15 --status=completed --user=1

# Elencare clienti
npx wp-env run cli wp wc customer list --user=1 --fields=id,email,first_name,orders_count

# Report vendite
npx wp-env run cli wp wc report sales --user=1 --period=month
```

### 2.5 Coupon e Promozioni

```bash
# Creare coupon sconto percentuale
npx wp-env run cli wp wc coupon create \
  --code="BENVENUTO10" \
  --discount_type=percent \
  --amount=10 \
  --individual_use=true \
  --usage_limit=1 \
  --usage_limit_per_user=1 \
  --user=1

# Creare coupon spedizione gratuita
npx wp-env run cli wp wc coupon create \
  --code="SPEDIZIONEGRATIS" \
  --discount_type=percent \
  --amount=0 \
  --free_shipping=true \
  --minimum_amount=30 \
  --user=1

# Elencare coupon
npx wp-env run cli wp wc coupon list --user=1
```

### 2.6 Tasse e Spedizioni

#### IVA italiana

```bash
# Abilitare tasse
npx wp-env run cli wp option update woocommerce_calc_taxes "yes"

# Prezzi IVA inclusa (standard B2C Italia)
npx wp-env run cli wp option update woocommerce_prices_include_tax "yes"
npx wp-env run cli wp option update woocommerce_tax_display_shop "incl"
npx wp-env run cli wp option update woocommerce_tax_display_cart "incl"

# Creare aliquote IVA
npx wp-env run cli wp wc tax create \
  --country=IT --rate=22 --name="IVA 22%" --priority=1 --class=standard --user=1

npx wp-env run cli wp wc tax create \
  --country=IT --rate=10 --name="IVA 10%" --priority=1 --class=reduced-rate --user=1

npx wp-env run cli wp wc tax create \
  --country=IT --rate=4 --name="IVA 4%" --priority=1 --class=zero-rate --user=1
```

#### Zone spedizione

```bash
# Creare zona Italia
npx wp-env run cli wp wc shipping_zone create --name="Italia" --user=1

# Aggiungere metodo tariffa fissa
npx wp-env run cli wp wc shipping_zone_method create 1 \
  --method_id=flat_rate --user=1

# Aggiungere spedizione gratuita (ordini > 50 EUR)
npx wp-env run cli wp wc shipping_zone_method create 1 \
  --method_id=free_shipping --user=1
```

### 2.7 Email Transazionali

```bash
# Verificare email configurate
npx wp-env run cli wp option get woocommerce_email_from_name
npx wp-env run cli wp option get woocommerce_email_from_address

# Personalizzare mittente
npx wp-env run cli wp option update woocommerce_email_from_name "Mio Shop"
npx wp-env run cli wp option update woocommerce_email_from_address "ordini@mioshop.it"
```

**Email automatiche WooCommerce:**

| Email | Destinatario | Trigger |
|-------|-------------|---------|
| Nuovo ordine | Admin | Ordine ricevuto |
| Ordine in lavorazione | Cliente | Pagamento confermato |
| Ordine completato | Cliente | Ordine spedito |
| Ordine rimborsato | Cliente | Rimborso emesso |
| Nuovo account | Cliente | Registrazione |
| Nota cliente | Cliente | Admin aggiunge nota |

**Importante**: installa WP Mail SMTP per garantire la deliverability delle email transazionali.

### 2.8 Gateway di Pagamento

| Gateway | Tipo | Commissione | Quando usarlo |
|---------|------|-------------|---------------|
| **Stripe** | Carta di credito | 1.4% + 0.25 EUR (EU) | Standard per e-commerce |
| **PayPal** | PayPal + carta | 2.9% + 0.35 EUR | Ampia diffusione |
| **Bonifico (BACS)** | Manuale | 0 | B2B, ordini grandi |
| **Contrassegno** | Alla consegna | 0 (+ supplemento) | Italia, fiducia |
| **Satispay** | Mobile payment | 0.20 EUR fisso | Italia, micro-pagamenti |

```bash
# Abilitare Stripe test mode
npx wp-env run cli wp option update woocommerce_stripe_settings \
  '{"enabled":"yes","testmode":"yes","test_publishable_key":"pk_test_xxx","test_secret_key":"sk_test_xxx"}' \
  --format=json --user=1
```

---

## 3. Per lo Sviluppatore

Questa sezione copre l'architettura tecnica e le best practice per sviluppare un block theme per e-commerce.

### 3.1 Architettura Theme

Un block theme WooCommerce-ready:

```
themes/shop-theme/
├── style.css                    # Header theme + dichiarazione WooCommerce support
├── theme.json                   # Design tokens e stili globali
├── functions.php                # WooCommerce support, font, hooks
├── templates/
│   ├── index.html               # Fallback
│   ├── front-page.html          # Homepage con prodotti in evidenza
│   ├── single-product.html      # Singolo prodotto (WooCommerce)
│   ├── archive-product.html     # Catalogo / shop page
│   ├── page-cart.html           # Carrello (opzionale)
│   ├── page-checkout.html       # Checkout (opzionale)
│   ├── page.html                # Pagina generica
│   └── 404.html                 # Pagina non trovata
├── parts/
│   ├── header.html              # Header con logo + nav + carrello
│   └── footer.html              # Footer con info aziendali
└── patterns/
    ├── product-showcase.php      # Prodotti in evidenza
    ├── category-grid.php         # Griglia categorie
    └── trust-badges.php          # Badge fiducia
```

#### functions.php — WooCommerce Support

```php
<?php
// Dichiarare supporto WooCommerce
function shop_theme_setup() {
    add_theme_support('woocommerce');
    add_theme_support('wc-product-gallery-zoom');
    add_theme_support('wc-product-gallery-lightbox');
    add_theme_support('wc-product-gallery-slider');
}
add_action('after_setup_theme', 'shop_theme_setup');
```

### 3.2 theme.json — Design Tokens per E-commerce

```json
{
  "$schema": "https://schemas.wp.org/wp/6.7/theme.json",
  "version": 3,
  "settings": {
    "color": {
      "palette": [
        { "slug": "base", "color": "#ffffff", "name": "Base" },
        { "slug": "contrast", "color": "#111827", "name": "Contrast" },
        { "slug": "accent", "color": "#2D5016", "name": "Accent (Brand)" },
        { "slug": "cta", "color": "#E85D04", "name": "CTA (Acquista)" },
        { "slug": "cta-hover", "color": "#d4520a", "name": "CTA Hover" },
        { "slug": "surface", "color": "#f3f4f6", "name": "Surface" },
        { "slug": "muted", "color": "#6b7280", "name": "Muted" },
        { "slug": "success", "color": "#22c55e", "name": "Success" },
        { "slug": "warning", "color": "#f59e0b", "name": "Warning" },
        { "slug": "error", "color": "#ef4444", "name": "Error" },
        { "slug": "sale", "color": "#ef4444", "name": "Sale Badge" },
        { "slug": "border", "color": "#e5e7eb", "name": "Border" }
      ],
      "defaultPalette": false
    },
    "typography": {
      "fontFamilies": [
        {
          "fontFamily": "'Inter', -apple-system, sans-serif",
          "slug": "body",
          "name": "Body"
        },
        {
          "fontFamily": "'DM Sans', 'Inter', sans-serif",
          "slug": "heading",
          "name": "Heading"
        }
      ],
      "fontSizes": [
        { "slug": "small", "size": "0.875rem" },
        { "slug": "medium", "size": "1rem" },
        { "slug": "large", "size": "1.25rem" },
        { "slug": "x-large", "size": "1.75rem" },
        { "slug": "xx-large", "size": "2.5rem" }
      ]
    },
    "layout": {
      "contentSize": "1100px",
      "wideSize": "1400px"
    }
  },
  "styles": {
    "elements": {
      "button": {
        "color": {
          "background": "var(--wp--preset--color--cta)",
          "text": "var(--wp--preset--color--base)"
        },
        "typography": { "fontWeight": "600" },
        "border": { "radius": "8px" },
        ":hover": {
          "color": { "background": "var(--wp--preset--color--cta-hover)" }
        }
      }
    }
  }
}
```

**Nota**: nell'e-commerce servono piu colori che in un blog — `success` per conferme, `error` per errori form, `sale` per badge sconto, `cta` separato dall'accent brand.

### 3.3 WooCommerce Blocks vs Shortcodes

WooCommerce offre due approcci per le pagine shop:

| Approccio | Pro | Contro |
|-----------|-----|--------|
| **Blocks** (moderno) | Editabile nell'editor, responsive, personalizzabile | Richiede WooCommerce 8.0+ |
| **Shortcodes** (legacy) | Compatibilita universale | Non editabile visualmente |

**Per block theme, usa sempre i blocks WooCommerce.**

Pagine chiave generate automaticamente:

```bash
# Verificare le pagine WooCommerce
npx wp-env run cli wp option get woocommerce_shop_page_id
npx wp-env run cli wp option get woocommerce_cart_page_id
npx wp-env run cli wp option get woocommerce_checkout_page_id
npx wp-env run cli wp option get woocommerce_myaccount_page_id
```

### 3.4 WooCommerce Hooks Essenziali

WooCommerce espone centinaia di action e filter hooks:

```php
<?php
// === PAGINA PRODOTTO ===

// Badge "Spedizione gratuita" sopra il titolo
add_action('woocommerce_single_product_summary', function() {
    global $product;
    if ($product->get_price() >= 50) {
        echo '<span class="free-shipping-badge">Spedizione gratuita</span>';
    }
}, 4);

// Tab custom nella pagina prodotto
add_filter('woocommerce_product_tabs', function($tabs) {
    $tabs['ingredienti'] = [
        'title'    => 'Ingredienti',
        'priority' => 15,
        'callback' => function() {
            global $product;
            $ingredienti = $product->get_meta('_ingredienti');
            if ($ingredienti) {
                echo '<h2>Ingredienti</h2>';
                echo '<p>' . esc_html($ingredienti) . '</p>';
            }
        }
    ];
    return $tabs;
});

// === CARRELLO ===

// Messaggio soglia spedizione gratuita
add_action('woocommerce_before_cart', function() {
    $soglia = 50;
    $totale = WC()->cart->get_subtotal();
    $mancante = $soglia - $totale;

    if ($mancante > 0) {
        wc_print_notice(
            sprintf('Aggiungi %s per la spedizione gratuita!', wc_price($mancante)),
            'notice'
        );
    } else {
        wc_print_notice('Hai la spedizione gratuita!', 'success');
    }
});

// === CHECKOUT ===

// Aggiungere campo Codice Fiscale (obbligatorio in Italia)
add_filter('woocommerce_checkout_fields', function($fields) {
    $fields['billing']['billing_codice_fiscale'] = [
        'type'        => 'text',
        'label'       => 'Codice Fiscale',
        'required'    => true,
        'priority'    => 35,
        'class'       => ['form-row-wide'],
        'placeholder' => 'RSSMRA80A01H501U',
    ];
    return $fields;
});

// Salvare il Codice Fiscale nell'ordine
add_action('woocommerce_checkout_update_order_meta', function($order_id) {
    if (!empty($_POST['billing_codice_fiscale'])) {
        update_post_meta($order_id, '_billing_codice_fiscale',
            sanitize_text_field($_POST['billing_codice_fiscale']));
    }
});
```

**Priorita hooks pagina prodotto:**

| Priorita | Elemento |
|----------|----------|
| 5 | Titolo |
| 10 | Prezzo |
| 20 | Excerpt |
| 25 | Rating |
| 30 | Add to cart |
| 40 | Meta (SKU, categorie) |

### 3.5 REST API per Headless Commerce

WooCommerce espone una REST API completa:

```bash
# Generare chiavi API
npx wp-env run cli wp wc api_key create \
  --user=1 --description="Headless Frontend" --permissions=read_write

# Elencare prodotti
curl -s "http://localhost:8888/wp-json/wc/v3/products" \
  -u "ck_xxxx:cs_xxxx" | jq '.[].name'

# Creare ordine via API
curl -X POST "http://localhost:8888/wp-json/wc/v3/orders" \
  -u "ck_xxxx:cs_xxxx" \
  -H "Content-Type: application/json" \
  -d '{
    "payment_method": "bacs",
    "billing": {
      "first_name": "Mario",
      "last_name": "Rossi",
      "email": "mario@example.com",
      "address_1": "Via Roma 1",
      "city": "Milano",
      "postcode": "20100",
      "country": "IT"
    },
    "line_items": [{"product_id": 12, "quantity": 2}]
  }'
```

**Endpoint principali:**

| Endpoint | Descrizione |
|----------|-------------|
| `/wc/v3/products` | Gestione prodotti |
| `/wc/v3/orders` | Gestione ordini |
| `/wc/v3/customers` | Gestione clienti |
| `/wc/v3/coupons` | Gestione coupon |
| `/wc/v3/reports/sales` | Report vendite |
| `/wc/store/cart` | Cart API frontend (no auth) |

**Store API vs WC REST API:** La Store API (`/wc/store/`) e pensata per il frontend (carrello, checkout) e non richiede autenticazione. La WC REST API (`/wc/v3/`) e per operazioni backend e richiede chiavi API.

### 3.6 Patterns

#### Pattern: Vetrina Prodotti in Evidenza

```php
<?php
/**
 * Title: Vetrina Prodotti in Evidenza
 * Slug: shop-theme/product-showcase
 * Categories: woocommerce
 */
?>
<!-- wp:group {"style":{"spacing":{"padding":{"top":"3rem","bottom":"3rem"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group" style="padding:3rem 0">
  <!-- wp:heading {"textAlign":"center","level":2} -->
  <h2 class="wp-block-heading has-text-align-center">I Nostri Bestseller</h2>
  <!-- /wp:heading -->
  <!-- wp:paragraph {"align":"center","textColor":"muted"} -->
  <p class="has-text-align-center has-muted-color has-text-color">Scopri i prodotti piu amati dai nostri clienti</p>
  <!-- /wp:paragraph -->
  <!-- wp:woocommerce/product-collection {"query":{"perPage":4,"featured":true},"displayLayout":{"type":"flex","columns":4}} -->
  <div class="wp-block-woocommerce-product-collection">
    <!-- wp:woocommerce/product-template -->
      <!-- wp:woocommerce/product-image {"imageSizing":"thumbnail","style":{"border":{"radius":"8px"}}} /-->
      <!-- wp:post-title {"textAlign":"center","isLink":true,"fontSize":"medium"} /-->
      <!-- wp:woocommerce/product-price {"textAlign":"center"} /-->
      <!-- wp:woocommerce/product-button {"textAlign":"center","text":"Aggiungi al carrello"} /-->
    <!-- /wp:woocommerce/product-template -->
  </div>
  <!-- /wp:woocommerce/product-collection -->
</div>
<!-- /wp:group -->
```

#### Pattern: Badge Fiducia

```php
<?php
/**
 * Title: Badge Fiducia
 * Slug: shop-theme/trust-badges
 * Categories: woocommerce
 */
?>
<!-- wp:group {"style":{"spacing":{"padding":{"top":"2rem","bottom":"2rem"}},"border":{"top":{"color":"var(--wp--preset--color--border)","width":"1px"},"bottom":{"color":"var(--wp--preset--color--border)","width":"1px"}}},"layout":{"type":"flex","flexWrap":"wrap","justifyContent":"center"}} -->
<div class="wp-block-group" style="border-top:1px solid var(--wp--preset--color--border);border-bottom:1px solid var(--wp--preset--color--border);padding:2rem">
  <!-- wp:group {"layout":{"type":"flex","orientation":"vertical","justifyContent":"center"}} -->
  <div class="wp-block-group">
    <!-- wp:paragraph {"align":"center","fontSize":"small"} -->
    <p class="has-text-align-center has-small-font-size"><strong>Pagamento Sicuro</strong><br>SSL 256-bit</p>
    <!-- /wp:paragraph -->
  </div>
  <!-- /wp:group -->
  <!-- wp:group {"layout":{"type":"flex","orientation":"vertical","justifyContent":"center"}} -->
  <div class="wp-block-group">
    <!-- wp:paragraph {"align":"center","fontSize":"small"} -->
    <p class="has-text-align-center has-small-font-size"><strong>Spedizione Gratuita</strong><br>Ordini sopra 50 EUR</p>
    <!-- /wp:paragraph -->
  </div>
  <!-- /wp:group -->
  <!-- wp:group {"layout":{"type":"flex","orientation":"vertical","justifyContent":"center"}} -->
  <div class="wp-block-group">
    <!-- wp:paragraph {"align":"center","fontSize":"small"} -->
    <p class="has-text-align-center has-small-font-size"><strong>Reso Facile</strong><br>30 giorni per ripensarci</p>
    <!-- /wp:paragraph -->
  </div>
  <!-- /wp:group -->
  <!-- wp:group {"layout":{"type":"flex","orientation":"vertical","justifyContent":"center"}} -->
  <div class="wp-block-group">
    <!-- wp:paragraph {"align":"center","fontSize":"small"} -->
    <p class="has-text-align-center has-small-font-size"><strong>4.8/5 Stelle</strong><br>500+ recensioni</p>
    <!-- /wp:paragraph -->
  </div>
  <!-- /wp:group -->
</div>
<!-- /wp:group -->
```

### 3.7 Performance per Catalogo Grande

Un catalogo con 1000+ prodotti richiede ottimizzazioni specifiche.

```bash
# Object Cache con Redis
npx wp-env run cli wp plugin install redis-cache --activate
npx wp-env run cli wp redis enable

# HPOS — High Performance Order Storage (WooCommerce 8.0+)
npx wp-env run cli wp option update woocommerce_custom_orders_table_enabled "yes"

# Ottimizzare dimensioni immagini prodotto
npx wp-env run cli wp option update woocommerce_single_image_width 800
npx wp-env run cli wp option update woocommerce_thumbnail_image_width 400
npx wp-env run cli wp media regenerate --yes
```

| Azione | Impatto | Priorita |
|--------|---------|----------|
| Object Cache (Redis/Memcached) | Altissimo | 1 |
| HPOS (High Performance Order Storage) | Alto | 2 |
| CDN per immagini prodotto | Alto | 3 |
| Lazy loading immagini | Medio | 4 |
| Lookup tables WooCommerce | Alto | 5 |
| Disabilitare widget pesanti | Basso | 6 |

---

## 4. Checklist di Lancio

### Prodotti e Catalogo
- [ ] Tutti i prodotti con titolo, descrizione, prezzo e immagini
- [ ] SKU univoci assegnati a ogni prodotto
- [ ] Categorie organizzate e assegnate
- [ ] Prodotti variabili con tutte le varianti configurate
- [ ] Inventario impostato (stock, low stock threshold)
- [ ] Peso e dimensioni per prodotti fisici
- [ ] Prodotti di test rimossi

### Pagamenti
- [ ] Almeno un gateway attivo e testato
- [ ] Ordine di test completato con successo (Stripe test mode)
- [ ] Bonifico bancario con IBAN e istruzioni
- [ ] Contrassegno configurato (se offerto)
- [ ] Pagina conferma ordine visibile e corretta

### Spedizioni
- [ ] Zone di spedizione configurate
- [ ] Tariffe corrette per ogni zona
- [ ] Soglia spedizione gratuita impostata
- [ ] Calcolo spedizione nel carrello funzionante

### Tasse e Fiscalita
- [ ] IVA abilitata con aliquote corrette (22%, 10%, 4%)
- [ ] Prezzi visualizzati IVA inclusa (B2C Italia)
- [ ] Plugin fatturazione elettronica configurato
- [ ] P.IVA e dati aziendali nel footer e nelle fatture

### Email
- [ ] WP Mail SMTP configurato
- [ ] Email nuovo ordine (admin) — testata
- [ ] Email ordine completato (cliente) — testata
- [ ] Email nuovo account (cliente) — testata
- [ ] Mittente personalizzato (non wordpress@)
- [ ] Template email con logo e colori brand

### Legale e GDPR
- [ ] Privacy Policy pubblicata e linkata
- [ ] Termini e Condizioni di vendita
- [ ] Cookie Policy con banner consenso
- [ ] Checkbox consenso privacy al checkout
- [ ] Diritto di recesso (14 giorni — D.Lgs. 206/2005)
- [ ] Dati aziendali completi: ragione sociale, P.IVA, sede legale, PEC

### Tecnico
- [ ] SSL attivo su tutto il sito
- [ ] Theme responsive su mobile/tablet/desktop
- [ ] Checkout mobile semplificato
- [ ] Favicon impostata
- [ ] Menu con link a Shop, Carrello, Account
- [ ] Redirect HTTP → HTTPS

### Performance
- [ ] Immagini prodotto ottimizzate (WebP)
- [ ] Object cache attivo
- [ ] Page cache attivo (non su carrello/checkout/account)
- [ ] Lighthouse > 80 su pagina shop e prodotto

### SEO
- [ ] Plugin SEO configurato
- [ ] Sitemap include prodotti e categorie
- [ ] Schema markup Product, Offer, Review
- [ ] Breadcrumb attivi
- [ ] Google Search Console e Merchant Center collegati

### Sicurezza
- [ ] Password admin forte
- [ ] Backup automatico configurato
- [ ] Plugin aggiornati
- [ ] PCI DSS: nessun dato carta memorizzato localmente

---

## 5. Riferimenti

### Skill del Plugin

| Skill | Quando usarla per e-commerce |
|-------|------------------------------|
| `wp-block-themes` | Sviluppo theme.json, templates shop, patterns |
| `wp-local-env` | Setup ambiente wp-env con WooCommerce |
| `wp-deploy` | Deploy in produzione con verifica pagamenti e SSL |
| `wp-performance` | Ottimizzazione catalogo, object cache, HPOS |
| `wp-plugin-development` | Custom product types, gateway, integrazioni |
| `wp-rest-api` | Headless commerce, integrazioni esterne, Store API |
| `wp-wpcli-and-ops` | Gestione prodotti, ordini, clienti via CLI |
| `wp-backup` | Backup database e file |
| `wp-audit` | Verifica sicurezza, SSL, GDPR compliance |
| `wp-content` | Gestione pagine legali, FAQ, contenuti shop |
| `wp-migrate` | Migrazione negozio tra ambienti |

### Plugin Consigliati

| Plugin | Scopo | Alternativa |
|--------|-------|-------------|
| **WooCommerce** | Core e-commerce | — |
| **WooCommerce Payments** | Gateway Stripe integrato | Stripe for WooCommerce |
| **WP Mail SMTP** | Email transazionali | FluentSMTP |
| **WooCommerce PDF Invoices** | Fatture PDF | Fattureincloud integration |
| **Yoast WooCommerce SEO** | SEO prodotti | Rank Math |
| **Complianz** | GDPR cookie banner | Iubenda, CookieYes |
| **UpdraftPlus** | Backup automatici | BackWPup |
| **Redis Object Cache** | Object cache | — |
| **ShortPixel** | Ottimizzazione immagini | Imagify |

### Risorse Esterne

- [WooCommerce Documentation](https://woocommerce.com/documentation/) — Documentazione ufficiale
- [WooCommerce REST API](https://woocommerce.github.io/woocommerce-rest-api-docs/) — Endpoint API
- [WooCommerce Hooks Reference](https://woocommerce.com/document/introduction-to-hooks-actions-and-filters/) — Action e filter hooks
- [WooCommerce Block Theme Guide](https://developer.woocommerce.com/docs/block-theme-development/) — Tema a blocchi
- [WP-CLI WooCommerce Commands](https://github.com/wp-cli/woocommerce-command) — Comandi CLI
- [Codice del Consumo (D.Lgs. 206/2005)](https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:2005-09-06;206) — Normativa e-commerce Italia

---

*Guida per il plugin [wordpress-manager](https://github.com/morrealev/wordpress-manager) v1.5.0+*
