---
name: wp-multilang-network
description: |
  This skill should be used when the user asks to "set up multilingual site",
  "multisite per language", "hreflang tags", "international SEO", "translate site
  network", "language-specific sub-sites", "multi-language WordPress", "localize
  content across sites", "content translation sync", "geo-targeting",
  or mentions orchestrating a WordPress Multisite network where each sub-site
  serves a different language or locale.
version: 1.0.0
---

## Overview

Multi-Language Network uses WordPress Multisite to create a coordinated network where each sub-site serves a different language or locale. Content is synchronized across sites via translation plugins or manual workflows, with hreflang tags ensuring search engines serve the correct language variant to users.

This skill orchestrates existing multisite MCP tools (10 tools), the `wp-i18n` skill for translation best practices, and multilingual plugin workflows (WPML, Polylang, MultilingualPress). No new tools are required.

## When to Use

- User needs international presence with 2+ languages
- "Set up Italian and Spanish versions of our site"
- "Add hreflang tags across our multisite network"
- "Translate content and keep translations in sync"
- "Set up language-specific sub-sites"
- "Configure international SEO for multiple languages"
- "Redirect users based on browser language"

## Multi-Language Network vs Single-Site Plugin

| Aspect | Multisite Network | Single-Site Plugin |
|--------|------------------|-------------------|
| Scalability | Excellent — independent sites per language | Good for 2–5 languages, complex beyond |
| SEO control | Full — separate sitemaps, robots.txt, GSC per site | Shared — one sitemap with hreflang |
| Content independence | Each site can have unique content | All content on one database |
| Maintenance overhead | Higher — plugins/themes per site (unless network-activated) | Lower — one site to maintain |
| Performance | Better — smaller DB per language | Can degrade with many languages |
| Domain flexibility | Subdomains, subdirectories, or separate domains | Subdirectories or query params |
| Plugin compatibility | Standard WP plugins work per-site | Must be compatible with multilingual plugin |

## Prerequisites

- WordPress Multisite enabled (reference: `wp-multisite` skill)
- WP-CLI access for network operations
- Multilingual plugin installed (WPML, Polylang, or MultilingualPress)
- DNS configured for subdomains or subdirectories

## Prerequisites / Detection

```bash
node skills/wp-multilang-network/scripts/multilang_inspect.mjs --cwd=/path/to/wordpress
```

The script checks Multisite status, multilingual plugins, sub-site count, language patterns in slugs, hreflang presence, and WPLANG configuration.

## Multi-Language Network Operations Decision Tree

1. **What multi-language task?**

   - "set up multisite per language" / "create language sites" / "network architecture"
     → **Network Architecture** — Read: `references/network-architecture.md`

   - "hreflang" / "language alternates" / "x-default" / "hreflang tags"
     → **Hreflang Configuration** — Read: `references/hreflang-config.md`

   - "translate content" / "sync content" / "keep translations in sync" / "translation workflow"
     → **Content Synchronization** — Read: `references/content-sync.md`

   - "language switcher" / "language detection" / "redirect by language" / "browser language"
     → **Language Routing** — Read: `references/language-routing.md`

   - "international SEO" / "geo-targeting" / "language sitemaps" / "search console per language"
     → **International SEO** — Read: `references/seo-international.md`

2. **Common workflow (new multi-language network):**
   1. Assess current network: `list_sites` + run `multilang_inspect.mjs`
   2. Create language sub-sites: `ms_create_site` per language (slug = ISO 639-1 code)
   3. Install and configure multilingual plugin network-wide
   4. Set up hreflang tags (mu-plugin or plugin)
   5. Establish content sync workflow (manual or plugin-assisted)
   6. Configure language routing and switcher widget
   7. Set up per-language XML sitemaps
   8. Verify with international SEO checklist

## Recommended Agent

`wp-site-manager` — handles multisite network operations, sub-site management, and cross-site coordination.

## Additional Resources

### Reference Files

| File | Description |
|------|-------------|
| **`references/network-architecture.md`** | Subdomain vs subdirectory vs domains, plugin comparison, naming conventions |
| **`references/hreflang-config.md`** | Hreflang format, mu-plugin auto-generation, validation, common mistakes |
| **`references/content-sync.md`** | WPML/Polylang/MultilingualPress workflows, translation status tracking |
| **`references/language-routing.md`** | Browser detection, geo-IP redirect, language switcher, cookie preference |
| **`references/seo-international.md`** | GSC per language, language sitemaps, schema localization, CDN per region |

### Related Skills

- `wp-multisite` — multisite network management (10 MCP tools)
- `wp-i18n` — internationalization and localization best practices
- `wp-headless` — headless frontend with i18n routing (Next.js i18n, Nuxt i18n)
- `wp-programmatic-seo` — scalable page generation (complement for multi-language SEO)
- `wp-content` — content management for each language sub-site
