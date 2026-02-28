# v1.9.0 Multisite — Design Document

**Data:** 2026-02-28
**Stato:** Approvato
**Baseline:** v1.8.0 (25 skill, 9 agent, 71 MCP tools, 13 detection scripts)

---

## Contesto

WordPress Multisite permette di gestire un network di siti da una singola installazione. Le REST API standard di WordPress NON espongono endpoint per operazioni multisite (creazione/eliminazione sub-siti, network activation, Super Admin management). Per questo motivo, i tool MCP usano **WP-CLI** come backend di esecuzione.

## Decisioni architetturali

| Decisione | Scelta | Motivazione |
|-----------|--------|-------------|
| Backend esecuzione | WP-CLI via child_process | WordPress REST API non ha endpoint multisite |
| Contesto esecuzione | Locale + SSH remoto | Copre sia ambienti dev che produzione |
| Approccio ibrido | REST dove disponibile, wp-cli per network-only | Minimizza dipendenza SSH, massima compatibilita |
| Agent | Estensione wp-site-manager (no nuovo agent) | Come da roadmap, multisite e gestione siti |
| Modulo wp-cli | Dedicato (wpcli.ts) | Riusabile per v2.0 CI/CD, DRY |

---

## Componenti

| Tipo | Nome | Descrizione |
|------|------|-------------|
| Modulo TS | `wpcli.ts` | Esecuzione wp-cli locale/SSH con auto-detection |
| MCP Tools | `multisite-sites.ts` (5) | CRUD sub-siti via wp-cli |
| MCP Tools | `multisite-network.ts` (5) | Network admin, misto REST + wp-cli |
| Skill | `wp-multisite` | SKILL.md + 6 reference files |
| Detection | `multisite_inspect.mjs` | Rileva multisite, sub-siti, domain mapping |
| Agent update | `wp-site-manager.md` | Nuova sezione Multisite Network Management |

---

## Architettura TypeScript

### SiteConfig estesa (`types.ts`)

Nuovi campi opzionali aggiunti a SiteConfig:

```typescript
// WP-CLI access (optional, for multisite and CLI operations)
wp_path?: string;        // Local WP installation path (e.g., ~/Studio/mysite, /var/www/wordpress)
ssh_host?: string;       // SSH hostname for remote wp-cli
ssh_user?: string;       // SSH username
ssh_key?: string;        // Path to SSH private key
ssh_port?: number;       // SSH port (default: 22)
is_multisite?: boolean;  // Flag: this site is a multisite network
```

### Nuovo tipo `WPNetworkSite`

```typescript
interface WPNetworkSite {
  blog_id: number;
  url: string;
  domain: string;
  path: string;
  registered: string;
  last_updated: string;
  public: boolean;
  archived: boolean;
  mature: boolean;
  spam: boolean;
  deleted: boolean;
}
```

### Nuovo modulo `wpcli.ts`

Funzioni esportate:

| Funzione | Firma | Scopo |
|----------|-------|-------|
| `executeWpCli` | `(command: string, siteId?: string) => Promise<string>` | Esegue wp-cli locale o SSH, restituisce stdout |
| `hasWpCli` | `(siteId?: string) => boolean` | Verifica se wp-cli e configurato |
| `isMultisite` | `(siteId?: string) => boolean` | Verifica flag is_multisite |

Logica `executeWpCli`:
1. Risolve siteId (default: activeSiteId)
2. Recupera SiteConfig
3. Se `wp_path` presente e NO `ssh_host` → locale: `cd {wp_path} && wp {command} --format=json`
4. Se `ssh_host` presente → SSH: `ssh -i {ssh_key} -p {ssh_port} {ssh_user}@{ssh_host} 'cd {wp_path} && wp {command} --format=json'`
5. Se nessuno configurato → throw Error con messaggio chiaro
6. Timeout: 30 secondi
7. Parse stdout, gestione stderr per errori

---

## MCP Tools (10 totali)

### `multisite-sites.ts` — 5 tool (tutti wp-cli)

| Tool | WP-CLI Command | Input | Output |
|------|---------------|-------|--------|
| `ms_list_sites` | `wp site list` | `site_id?` | Array WPNetworkSite |
| `ms_get_site` | `wp site list --blog_id={id}` | `blog_id, site_id?` | WPNetworkSite singolo |
| `ms_create_site` | `wp site create --slug --title --email` | `slug, title, email, site_id?` | blog_id creato |
| `ms_activate_site` | `wp site activate/deactivate {id}` | `blog_id, active: boolean, site_id?` | Conferma |
| `ms_delete_site` | `wp site delete {id} --yes` | `blog_id, confirm: true, site_id?` | Conferma |

### `multisite-network.ts` — 5 tool (misto REST + wp-cli)

| Tool | Metodo | Input | Output |
|------|--------|-------|--------|
| `ms_list_network_plugins` | REST `list_plugins` | `site_id?` | Plugin con flag network_active |
| `ms_network_activate_plugin` | wp-cli `wp plugin activate --network` | `plugin_slug, site_id?` | Conferma |
| `ms_network_deactivate_plugin` | wp-cli `wp plugin deactivate --network` | `plugin_slug, site_id?` | Conferma |
| `ms_list_super_admins` | wp-cli `wp super-admin list` | `site_id?` | Array username |
| `ms_get_network_settings` | wp-cli `wp network meta list 1` | `site_id?` | Network settings object |

### Safety gates

- Tutti i tool verificano `isMultisite(siteId)` — errore se non multisite
- `ms_delete_site` richiede `confirm: true` esplicito
- `ms_network_activate_plugin` e `ms_network_deactivate_plugin` loggano il plugin e il siteId
- Timeout 30s per ogni comando wp-cli

---

## Skill `wp-multisite`

### Struttura

```
skills/wp-multisite/
├── SKILL.md
├── references/
│   ├── network-setup.md
│   ├── site-management.md
│   ├── domain-mapping.md
│   ├── network-plugins.md
│   ├── user-roles.md
│   └── migration-multisite.md
└── scripts/
    └── multisite_inspect.mjs
```

### SKILL.md — Contenuto

- Trigger phrases: multisite, network, sub-site, domain mapping, super admin
- Prerequisites: wp-cli, is_multisite flag, wp_path/ssh_host configurati
- Decision tree: 10 tool ms_* con condizioni
- Reference file links

### Reference files (6)

| File | Contenuto |
|------|-----------|
| `network-setup.md` | Sub-directory vs sub-domain, wp-config.php constants, MULTISITE/SUBDOMAIN_INSTALL |
| `site-management.md` | CRUD sub-siti, bulk operations, template sites |
| `domain-mapping.md` | Domini custom per sub-siti, SSL, DNS CNAME, sunrise.php |
| `network-plugins.md` | Network-activated vs per-site, must-use plugins, conflict resolution |
| `user-roles.md` | Super Admin capabilities, site-level roles, add/remove super admin |
| `migration-multisite.md` | Single-site → multisite, multisite → single, database tables |

### Detection script `multisite_inspect.mjs`

Controlla:
1. `wp-config.php` per costanti `MULTISITE`, `SUBDOMAIN_INSTALL`, `DOMAIN_CURRENT_SITE`, `PATH_CURRENT_SITE`
2. `WP_SITES_CONFIG` env var per flag `is_multisite`
3. Presenza di `wp-content/sunrise.php` (domain mapping avanzato)
4. `.htaccess` per rewrite rules multisite (sub-directory pattern)

---

## Agent update: `wp-site-manager.md`

Nuova sezione **"## Multisite Network Management"** (~25 righe):

- Prerequisiti: verifica `is_multisite` e wp-cli
- Procedure: lista sub-siti, crea sub-sito, gestione plugin network, domain mapping
- Tool reference: 10 tool `ms_*`
- Safety: conferma prima di delete, verificare Super Admin

---

## Router `decision-tree.md` (v6)

Step 0 — aggiunta keyword "multisite" e "network" alla categoria operations.

Step 2b (operations) — nuova entry:
```
"multisite, network, sub-sito, sub-site, domain mapping, super admin, network activate"
  → wp-multisite skill + wp-site-manager agent
```

---

## Cross-references

| File | Aggiunta |
|------|----------|
| `wp-wpcli-and-ops/SKILL.md` | "Per operazioni multisite, vedi `wp-multisite` skill" |
| `wp-security/SKILL.md` | "Per Super Admin e capabilities multisite, vedi `wp-multisite` skill" |

---

## Config esempio

```json
[
  {
    "id": "mynetwork",
    "url": "https://network.example.com",
    "username": "superadmin",
    "password": "xxxx xxxx xxxx xxxx",
    "wp_path": "/var/www/wordpress",
    "ssh_host": "network.example.com",
    "ssh_user": "deploy",
    "ssh_key": "~/.ssh/id_rsa",
    "is_multisite": true
  },
  {
    "id": "local-multisite",
    "url": "http://multisite.local",
    "username": "admin",
    "password": "yyyy yyyy yyyy yyyy",
    "wp_path": "~/Studio/multisite",
    "is_multisite": true
  }
]
```

Primo sito: remoto via SSH. Secondo: locale senza SSH.

---

## Version bump

- `plugin.json` → v1.9.0, description aggiornata (26 skill, 9 agent)
- `package.json` → v1.9.0, keywords: +multisite, +network
- `CHANGELOG.md` → entry v1.9.0

---

## File da creare/modificare

| File | Azione | Note |
|------|--------|------|
| `servers/wp-rest-bridge/src/wpcli.ts` | **NUOVO** | Modulo WP-CLI execution |
| `servers/wp-rest-bridge/src/types.ts` | Modifica | +WPNetworkSite, +SiteConfig fields |
| `servers/wp-rest-bridge/src/tools/multisite-sites.ts` | **NUOVO** | 5 tool gestione sub-siti |
| `servers/wp-rest-bridge/src/tools/multisite-network.ts` | **NUOVO** | 5 tool network admin |
| `servers/wp-rest-bridge/src/tools/index.ts` | Modifica | Registrazione 10 nuovi tool |
| `skills/wp-multisite/SKILL.md` | **NUOVO** | Skill principale |
| `skills/wp-multisite/references/*.md` (6 file) | **NUOVO** | 6 reference files |
| `skills/wp-multisite/scripts/multisite_inspect.mjs` | **NUOVO** | Detection script |
| `agents/wp-site-manager.md` | Modifica | +sezione Multisite |
| `skills/wordpress-router/references/decision-tree.md` | Modifica | Router v6 |
| `skills/wp-wpcli-and-ops/SKILL.md` | Modifica | Cross-ref |
| `skills/wp-security/SKILL.md` | Modifica | Cross-ref |
| `.claude-plugin/plugin.json` | Modifica | Version bump |
| `package.json` | Modifica | Version bump |
| `CHANGELOG.md` | Modifica | Entry v1.9.0 |
