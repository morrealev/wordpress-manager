# Network Architecture

Use this file when designing the multi-language WordPress Multisite network — choosing between subdomains, subdirectories, or separate domains, selecting a multilingual plugin, and establishing site creation workflows.

## Architecture Patterns

| Pattern | Example | Pros | Cons |
|---------|---------|------|------|
| **Subdirectory** | `example.com/it/`, `example.com/de/` | Shares domain authority, easy SSL, one hosting | Less geographic signal, shared server resources |
| **Subdomain** | `it.example.com`, `de.example.com` | Separate GSC properties, clear language signal | SSL per subdomain, DNS configuration needed |
| **Separate domains** | `example.it`, `example.de` | Strongest geo-targeting signal, full independence | Multiple hosting/SSL/DNS, no shared authority |

### When to Choose Each

**Subdirectory (recommended for most):**
- Starting a multilingual site with shared content
- Budget-conscious (one hosting, one SSL)
- Want to inherit domain authority across languages
- 2–5 languages

**Subdomain:**
- Each language needs significant independence
- Different teams manage different languages
- Want separate Google Search Console properties
- 3–10 languages

**Separate domains:**
- Strong country-specific targeting needed (ccTLDs)
- Completely independent content per market
- Enterprise with per-country marketing teams
- Already owns country domains

## Sub-Site Creation Workflow

Using multisite MCP tools to create language sub-sites:

```bash
# 1. List existing sites
list_sites()

# 2. Create language sub-sites (one per language)
ms_create_site(domain="example.com", path="/it/", title="Example - Italiano")
ms_create_site(domain="example.com", path="/de/", title="Example - Deutsch")
ms_create_site(domain="example.com", path="/fr/", title="Example - Français")
ms_create_site(domain="example.com", path="/es/", title="Example - Español")

# 3. Verify all sites created
list_sites()
```

### Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Site slug/path | ISO 639-1 language code | `/it/`, `/de/`, `/fr/` |
| Site title | `{Brand} - {Language Name}` | "DolceZero - Italiano" |
| Admin email | Shared network admin email | `admin@example.com` |
| Language constant | WordPress locale code | `it_IT`, `de_DE`, `fr_FR` |

**For regional variants:**
- Use ISO 639-1 + country: `pt-br` (Brazilian Portuguese), `zh-cn` (Simplified Chinese)
- Path: `/pt-br/`, `/zh-cn/`

## Shared vs Independent Content

| Strategy | Description | Best For |
|----------|-------------|----------|
| **Shared + translated** | Same content structure, translated per language | Marketing sites, blogs |
| **Shared core + local** | Common pages translated, plus local-only content | E-commerce with local products |
| **Fully independent** | Each site has its own editorial calendar | News sites, regional publications |

## Network Plugin Management

### Network-Activated Plugins (shared across all sites)

Plugins that should be network-activated for consistency:
- Multilingual plugin (WPML, Polylang, MultilingualPress)
- SEO plugin (Yoast, Rank Math)
- Caching plugin (WP Super Cache, W3 Total Cache)
- Security plugin (Wordfence, Sucuri)

```bash
# Network-activate a plugin (WP-CLI)
wp plugin activate yoast-seo --network

# Or via MCP tool
ms_network_activate_plugin(plugin="wordpress-seo/wp-seo.php")
```

### Per-Site Plugins

Plugins that may differ per language site:
- Payment gateways (region-specific)
- Legal compliance (GDPR, cookie consent varies by country)
- Local directory integrations

## Multilingual Plugin Comparison

| Feature | WPML | Polylang | MultilingualPress |
|---------|------|----------|-------------------|
| **Architecture** | Single-site (can work with multisite) | Single-site (multisite add-on available) | Native multisite |
| **License** | Paid ($39–$159/yr) | Free core + paid add-ons | Paid (€199/yr) |
| **Translation management** | Built-in TM, XLIFF export | Manual or XLIFF | Content connections between sites |
| **String translation** | Yes (wpml-string-translation) | Polylang Pro | Via WordPress i18n |
| **WooCommerce support** | WPML WooCommerce Multilingual | WooCommerce Polylang | Native multisite WC |
| **Performance impact** | Medium (additional DB queries) | Low | Low (native multisite) |
| **Best for** | Single-site multilingual | Small sites, budget-friendly | Multisite-native workflows |

### Recommendation

For a **Multisite multi-language network**, prefer **MultilingualPress** (native multisite design) or **WPML** (most feature-rich). Polylang is best for single-site setups.

## Decision Checklist

1. How many languages are needed now and in 2 years? → 2–5 = subdirectory; 5+ = subdomain
2. Do language sites share content or are they independent? → Shared = translation plugin; Independent = just multisite
3. Is the team centralized or per-country? → Centralized = shared admin; Per-country = per-site admins
4. Is WooCommerce involved? → Yes = verify plugin WC compatibility
5. What's the budget for multilingual plugin licensing? → Free = Polylang; Paid = WPML or MultilingualPress
