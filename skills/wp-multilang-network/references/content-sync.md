# Content Synchronization

Use this file when establishing content translation and synchronization workflows across a WordPress Multisite network — plugin-specific workflows, manual sync procedures, and translation status tracking.

## Synchronization Strategies

| Strategy | Description | Effort | Best For |
|----------|-------------|--------|----------|
| **Manual** | Create content independently per site | High ongoing | Fully independent content |
| **Semi-automatic** | Create on primary, replicate structure, translate manually | Medium | Shared structure, unique translations |
| **Fully automatic** | Plugin syncs content, human reviews translation | Low ongoing | High-volume, similar content |

## WPML Network Mode

WPML can operate across multisite with the "WPML for Multisite" add-on:

### Setup

1. Network-activate WPML on all sites
2. Configure primary language per site (each site = one language)
3. Enable translation management across network

### Workflow

```
1. Create content on primary site (e.g., English)
2. WPML sends content to translation queue
3. Translator works via WPML Translation Management or XLIFF export
4. Translated content auto-publishes on target language site
5. WPML maintains content connections (post ID mapping)
```

### Key WPML Functions

```php
// Get translation of a post on another site
$translated_id = apply_filters('wpml_object_id', $post_id, 'post', false, 'it');

// Get all translations of current post
$translations = apply_filters('wpml_active_languages', null);
```

## Polylang for Multisite

Polylang's multisite extension assigns one language per sub-site:

### Setup

1. Install Polylang Pro + Polylang for Multisite
2. Assign language to each sub-site in Network Admin → Sites → Polylang
3. Configure which content types are translatable

### Workflow

```
1. Create post on primary site
2. Polylang shows "Translate" button for each target language
3. Click creates a linked draft on the target language site
4. Translator fills in translation
5. Publish triggers hreflang auto-generation
```

### Polylang API

```php
// Get translation link
$translation_id = pll_get_post($post_id, 'it');

// Get language of current post
$language = pll_get_post_language($post_id);

// Set translation relationship
pll_set_post_language($post_id, 'it');
```

## MultilingualPress

MultilingualPress is built specifically for WordPress Multisite:

### Setup

1. Install and network-activate MultilingualPress
2. Go to Network Admin → MultilingualPress → set language per site
3. Define content relationships between sites

### Workflow

```
1. Create content on any site in the network
2. In the editor, MultilingualPress shows "Translation" metabox
3. Select target sites and either:
   a. Copy content (for later manual translation)
   b. Link existing content on target site
4. MultilingualPress maintains bidirectional content connections
5. Hreflang tags generated automatically from connections
```

### Advantages for Multisite

- Native multisite architecture (no complex DB tables like WPML)
- Each site has its own standard WP database tables
- Content connections stored as post meta (lightweight)
- Works with standard WordPress REST API per-site

## Manual Sync Workflow

When no multilingual plugin is used, sync content manually via MCP tools:

```bash
# 1. Create content on primary site
switch_site(site_id=1)  # Switch to English site
create_content(type="post", title="Cactus Water Benefits", slug="cactus-water-benefits",
  content="...", status="publish")

# 2. Replicate structure on Italian site
switch_site(site_id=2)  # Switch to Italian site
create_content(type="post", title="Benefici dell'Acqua di Cactus", slug="cactus-water-benefits",
  content="[Italian translation]", status="draft")

# 3. Replicate on German site
switch_site(site_id=3)  # Switch to German site
create_content(type="post", title="Vorteile von Kaktuswasser", slug="cactus-water-benefits",
  content="[German translation]", status="draft")

# 4. Switch back to primary
switch_site(site_id=1)
```

**Important:** Keep the **slug identical** across all language sites for hreflang matching (the mu-plugin matches by slug).

## Translation Status Tracking

Track the translation state of each content piece:

| Status | Meaning | Visual Indicator |
|--------|---------|-----------------|
| `untranslated` | No translation exists on target site | Red dot |
| `draft` | Translation created but not reviewed | Yellow dot |
| `pending_review` | Translation complete, awaiting review | Orange dot |
| `published` | Translation live and approved | Green dot |
| `outdated` | Source content updated after translation | Blue dot with warning |

### Custom Meta for Tracking

```php
// On the primary site post, track translation status
update_post_meta($post_id, '_translation_status_it', 'published');
update_post_meta($post_id, '_translation_status_de', 'draft');
update_post_meta($post_id, '_translation_status_fr', 'untranslated');

// When source is updated, mark translations as outdated
add_action('post_updated', function ($post_id) {
    $languages = ['it', 'de', 'fr', 'es'];
    foreach ($languages as $lang) {
        $current = get_post_meta($post_id, "_translation_status_{$lang}", true);
        if ($current === 'published') {
            update_post_meta($post_id, "_translation_status_{$lang}", 'outdated');
        }
    }
});
```

## Media Library Sharing

By default, each multisite sub-site has its own media library. Options for sharing:

| Approach | Plugin | Description |
|----------|--------|-------------|
| **Network Media Library** | Network Media Library plugin | Shared library accessible from all sites |
| **Global Media** | Network Shared Media plugin | Central media site, others embed |
| **Manual upload** | None | Upload same images per site (wasteful but independent) |

**Recommendation:** Use Network Media Library for brand assets (logo, product images) that are identical across languages. Allow per-site uploads for language-specific images (localized banners, team photos).

## Decision Checklist

1. Which sync strategy: manual, semi-automatic, or fully automatic? → Match to team size and budget
2. Is a multilingual plugin chosen and installed? → MultilingualPress for multisite-native; WPML for feature-rich
3. Are content connections established between sites? → Verify via plugin admin or custom meta
4. Do translated pages use matching slugs for hreflang? → Audit sample pages
5. Is translation status tracked? → Custom meta or plugin dashboard
6. Is the media library shared or per-site? → Shared for brand assets, per-site for localized content
