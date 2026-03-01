# Tier 3 WCOP — Social/Email Connectors, GSC Integration, AI Content Optimization

**Data:** 2026-03-01
**Stato:** Approvato
**Baseline:** v2.3.1 (33 skill, 11 agent, 85 MCP tools, 21 detection scripts, 162 reference files)
**Approccio:** Connector-First (Approccio A) — MCP tool TypeScript separati per ogni servizio

---

## Riepilogo Decisioni

| Decisione | Scelta |
|-----------|--------|
| Priorita | Tutti e 3 in ordine |
| Architettura connettori | MCP tool diretti (non webhook bridge) |
| Servizi v2.4.0 | Mailchimp + Buffer + SendGrid |
| GSC auth | OAuth2 via Service Account + googleapis npm |
| AI Content | Claude-native (zero API esterne) |
| Versioning | 3 minor release (v2.4.0, v2.5.0, v2.6.0) |

---

## Release Plan

| Release | Feature | Effort | Nuovi MCP Tool | Nuove Skill | Nuovi Agent |
|---------|---------|--------|----------------|-------------|-------------|
| v2.4.0 | Social/Email Connectors | Alto | +18 (7 MC + 5 Buf + 6 SG) | +1 | +1 |
| v2.5.0 | GSC Integration | Medio | +8 | +1 | 0 (agent update) |
| v2.6.0 | AI Content Optimization | Medio | 0 | +1 | 0 (agent update) |

### Conteggi a fine Tier 3

| Metrica | v2.3.1 (oggi) | v2.6.0 (target) | Delta |
|---------|---------------|-----------------|-------|
| Skills | 33 | 36 | +3 |
| Agents | 11 | 12 | +1 |
| MCP Tools | 85 | 111 | +26 |
| Detection scripts | 21 | 24 | +3 |
| Reference files | 162 | 178 | +16 |

---

## v2.4.0 — Social/Email Connectors

### Componenti

| Tipo | Nome | Descrizione |
|------|------|-------------|
| Skill | `wp-social-email` | Social publishing e email marketing da WordPress |
| Agent | `wp-distribution-manager` | Distribuzione contenuti multi-canale (color: indigo) |
| MCP Tools | 3 file TypeScript | 18 nuovi tool nel WP REST Bridge |
| Detection | `distribution_inspect.mjs` | Rileva configurazione Mailchimp/Buffer/SendGrid |

### MCP Tool — Mailchimp (7 tool)

| Tool | Descrizione | Endpoint |
|------|-------------|----------|
| `mc_list_audiences` | Lista audience/liste | GET /lists |
| `mc_get_audience_members` | Membri di un'audience | GET /lists/{id}/members |
| `mc_create_campaign` | Crea campagna email | POST /campaigns |
| `mc_update_campaign_content` | Imposta contenuto HTML | PUT /campaigns/{id}/content |
| `mc_send_campaign` | Invia campagna (safety gate) | POST /campaigns/{id}/actions/send |
| `mc_get_campaign_report` | Report performance campagna | GET /reports/{id} |
| `mc_add_subscriber` | Aggiungi subscriber a lista | POST /lists/{id}/members |

**Auth**: Mailchimp API key (formato `key-dc`) nel SiteConfig campo `mailchimp_api_key`.
**Base URL**: `https://{dc}.api.mailchimp.com/3.0/` dove `dc` e estratto dalla API key.

### MCP Tool — Buffer (5 tool)

| Tool | Descrizione | Endpoint |
|------|-------------|----------|
| `buf_list_profiles` | Lista profili social collegati | GET /profiles |
| `buf_create_update` | Schedula post su profilo | POST /updates/create |
| `buf_list_pending` | Post in coda per profilo | GET /profiles/{id}/updates/pending |
| `buf_list_sent` | Post inviati per profilo | GET /profiles/{id}/updates/sent |
| `buf_get_analytics` | Analytics per post | GET /updates/{id}/analytics |

**Auth**: Buffer access token nel SiteConfig campo `buffer_access_token`.
**Base URL**: `https://api.bufferapp.com/1/`

### MCP Tool — SendGrid (6 tool)

| Tool | Descrizione | Endpoint |
|------|-------------|----------|
| `sg_send_email` | Invia email transazionale (safety gate) | POST /mail/send |
| `sg_list_templates` | Lista template email | GET /templates |
| `sg_get_template` | Dettaglio template | GET /templates/{id} |
| `sg_list_contacts` | Lista contatti | GET /marketing/contacts |
| `sg_add_contacts` | Aggiungi contatti | PUT /marketing/contacts |
| `sg_get_stats` | Statistiche email | GET /stats |

**Auth**: SendGrid API key nel SiteConfig campo `sendgrid_api_key`.
**Base URL**: `https://api.sendgrid.com/v3/`

### SiteConfig Extension

```json
{
  "id": "mysite",
  "url": "https://mysite.com",
  "username": "admin",
  "password": "xxxx",
  "mailchimp_api_key": "abc123-us21",
  "buffer_access_token": "1/abc...",
  "sendgrid_api_key": "SG.xxx..."
}
```

Ogni gruppo di tool e disponibile solo se la relativa API key e configurata (pattern identico a WooCommerce `wc_consumer_key`).

### Skill Reference Files (6)

| File | Contenuto |
|------|-----------|
| `mailchimp-integration.md` | Audience management, campaign creation, automation workflows |
| `buffer-social-publishing.md` | Multi-profile scheduling, optimal posting times, analytics |
| `sendgrid-transactional.md` | Template email, event-driven sending, delivery tracking |
| `content-to-distribution.md` | Workflow: WP content -> format per canale -> publish/schedule |
| `audience-segmentation.md` | Segmentazione audience cross-tool (Mailchimp segments + WP tags) |
| `distribution-analytics.md` | KPI cross-channel: open rate, CTR, engagement rate, conversions |

### Agent `wp-distribution-manager`

- **Color**: indigo
- **Tools**: Read, Grep, Glob, Bash, WebFetch, WebSearch
- **Procedure**:
  1. Detect servizi configurati (`distribution_inspect.mjs`)
  2. Fetch contenuto WP via REST Bridge
  3. Format per canale target (social/email)
  4. Publish/schedule via MCP tool
  5. Track performance e report analytics
- **Safety**: conferma prima di `mc_send_campaign` e `sg_send_email`, preview contenuto prima di publish

### Safety Hooks (2 nuovi)

- `mc_send_campaign` -> PreToolUse prompt confirmation
- `sg_send_email` -> PreToolUse prompt confirmation

### Router v11

Nuove keyword in Step 2b:
```
"pubblica su social" / "schedula post" / "Buffer" / "campagna email" / "Mailchimp" /
"newsletter" / "SendGrid" / "email transazionale" / "distribuzione contenuti"
  -> wp-social-email skill + wp-distribution-manager agent
```

### Cross-references

- `wp-content-repurposing` -> "Per pubblicare il contenuto riproposto, usa `wp-social-email`"
- `wp-webhooks` -> "Per trigger event-driven verso email/social, combina `wp-webhooks` + `wp-social-email`"
- `wp-content` -> "Per distribuire contenuto dopo creazione, vedi `wp-social-email`"

---

## v2.5.0 — Google Search Console Integration

### Componenti

| Tipo | Nome | Descrizione |
|------|------|-------------|
| Skill | `wp-search-console` | SEO feedback loop: keyword tracking, indexing, performance analysis |
| Agent | — | Estensione di `wp-content-strategist` (SEO workflow) |
| MCP Tools | 1 file TypeScript | 8 nuovi tool nel WP REST Bridge |
| Detection | `search_console_inspect.mjs` | Rileva sitemap.xml, robots.txt, SEO plugins, GSC config |

### Autenticazione — OAuth2 via Service Account

GSC usa OAuth2. Implementazione via Service Account JSON key file.

Setup utente:
1. Crea progetto Google Cloud
2. Abilita Search Console API
3. Crea Service Account con chiave JSON
4. Aggiunge Service Account come utente in GSC
5. Configura path JSON key in SiteConfig

```json
{
  "id": "mysite",
  "gsc_service_account_key": "/path/to/service-account.json",
  "gsc_site_url": "sc-domain:mysite.com"
}
```

### Dipendenza npm

```
googleapis
```

Necessaria per autenticazione Service Account e chiamate GSC API.

### MCP Tools — Google Search Console (8 tool)

| Tool | Descrizione | GSC API |
|------|-------------|---------|
| `gsc_list_sites` | Lista siti verificati | GET sites |
| `gsc_search_analytics` | Query analytics (keyword, page, country, device) | POST searchAnalytics/query |
| `gsc_inspect_url` | Ispeziona stato indexing di un URL | POST urlInspection/index:inspect |
| `gsc_list_sitemaps` | Lista sitemap submesse | GET sitemaps |
| `gsc_submit_sitemap` | Submetti sitemap | PUT sitemaps/{feedpath} |
| `gsc_delete_sitemap` | Rimuovi sitemap (safety gate) | DELETE sitemaps/{feedpath} |
| `gsc_top_queries` | Top keyword per click/impressions (shortcut) | POST searchAnalytics/query (pre-filtered) |
| `gsc_page_performance` | Performance per singola pagina (shortcut) | POST searchAnalytics/query (page-filtered) |

### Skill Reference Files (5)

| File | Contenuto |
|------|-----------|
| `gsc-setup.md` | Setup Google Cloud project, Service Account, verifica sito |
| `keyword-tracking.md` | Monitoraggio keyword: top queries, trends, keyword cannibalization |
| `indexing-management.md` | URL inspection, indexing status, sitemap management |
| `content-seo-feedback.md` | Workflow: GSC data -> content optimization -> re-measure |
| `competitor-gap-analysis.md` | Identificare keyword gap confrontando GSC data con contenuto esistente |

### Agent Update: `wp-content-strategist`

Aggiunta sezione "SEO Feedback Loop":

```
Procedura: GSC-Driven Content Optimization
1. Fetch top queries da gsc_search_analytics (ultimi 28 giorni)
2. Identifica keyword ad alto impression/basso CTR (opportunita)
3. Fetch contenuto corrispondente via list_content
4. Analizza: titolo/meta description allineati alle query?
5. Suggerisci ottimizzazioni (title tag, meta description, H1)
6. Dopo ottimizzazione: ri-misura CTR dopo 2-4 settimane
```

### Cross-references

- `wp-programmatic-seo` -> "Per monitorare performance pagine generate, usa `wp-search-console`"
- `wp-content-attribution` -> "Per correlare keyword GSC con conversioni WooCommerce, combina `wp-search-console` + `wp-content-attribution`"
- `wp-monitoring` -> "Per trend SEO, aggiungi check GSC al monitoring periodico"

---

## v2.6.0 — AI Content Optimization

### Componenti

| Tipo | Nome | Descrizione |
|------|------|-------------|
| Skill | `wp-content-optimization` | Ottimizzazione contenuti AI-driven: headline, readability, SEO density |
| Agent | — | Estensione di `wp-content-strategist` (AI optimization workflow) |
| MCP Tools | 0 | Nessun nuovo tool — usa Claude + tool WP REST Bridge esistenti + GSC |
| Detection | `content_optimization_inspect.mjs` | Rileva volume contenuti, SEO plugins, readability plugins, content age |

### Filosofia: Claude-Native

Nessuna API esterna. L'agent usa le proprie capacita di analisi linguistica + dati quantitativi da GSC (v2.5.0) + metriche WooCommerce (wp-content-attribution). Chiude il loop WCOP.

### Procedure Agent (6)

| # | Procedura | Input | Output |
|---|-----------|-------|--------|
| 1 | Headline Analysis | Titolo + keyword target | Score 1-10, 3 alternative ottimizzate |
| 2 | Readability Analysis | Body contenuto | Flesch-Kincaid score, frasi troppo lunghe, suggerimenti |
| 3 | SEO Content Scoring | Body + keyword + GSC data | Keyword density, H2/H3 coverage, internal linking gaps |
| 4 | Meta Description Optimization | Current meta + GSC CTR data | Meta ottimizzata per CTR, A/B variant |
| 5 | Content Freshness Audit | Lista contenuti + publish date | Contenuti obsoleti, priorita aggiornamento |
| 6 | Bulk Content Triage | N contenuti + GSC data | Classifica: quick wins, needs rewrite, archive |

### Bulk Content Triage — Classificazione

| Categoria | Criteri | Azione |
|-----------|---------|--------|
| Quick Wins | Alto traffico + basso CTR, headline debole | Ottimizza title/meta |
| Needs Rewrite | >12 mesi, readability bassa, keyword off-target | Riscrittura |
| Performing | Alto traffico + alto CTR | Mantenere, refresh date |
| Archive | Zero traffico >6 mesi, nessuna keyword | Redirect 301 o noindex |

### Skill Reference Files (5)

| File | Contenuto |
|------|-----------|
| `headline-optimization.md` | Formule headline, power words, scoring criteria |
| `readability-analysis.md` | Flesch-Kincaid, sentence length, passive voice, jargon |
| `seo-content-scoring.md` | Keyword density, H-tag hierarchy, internal link analysis |
| `meta-optimization.md` | Title tag + meta description best practices, CTR optimization |
| `content-freshness.md` | Content decay, refresh strategies, evergreen vs temporal |

### Agent Update: `wp-content-strategist`

Aggiunta sezione "AI Content Optimization Workflow":

```
Procedura: Content Optimization Pipeline
1. Fetch lista contenuti pubblicati (list_content status=published)
2. Per ogni contenuto:
   a. Fetch GSC data se disponibile (gsc_page_performance)
   b. Analizza headline (Procedura 1)
   c. Analizza readability (Procedura 2)
   d. Score SEO (Procedura 3)
3. Genera Optimization Report ordinato per impatto potenziale
4. Per contenuti prioritari: suggerisci modifiche specifiche
5. Se approvato: applica con update_content via REST Bridge
```

### Workflow Completo WCOP

```
CREAZIONE -> DISTRIBUZIONE -> MONITORAGGIO -> OTTIMIZZAZIONE -> DISTRIBUZIONE
     |              |               |               |               |
wp-content   wp-social-email   wp-search-     wp-content-    wp-social-email
wp-content-  wp-distribution-  console        optimization   (re-distribute
strategist   manager           wp-monitoring  wp-content-     optimized)
                               wp-monitoring- strategist
                               agent
```

### Cross-references

- `wp-content` -> "Per ottimizzare contenuto esistente, vedi `wp-content-optimization`"
- `wp-search-console` -> "Per GSC data come input di ottimizzazione, vedi `wp-content-optimization`"
- `wp-content-attribution` -> "Per prioritizzare su contenuti ad alto ROI, combina entrambi"
- `wp-programmatic-seo` -> "Per ottimizzare template programmatiche, vedi `wp-content-optimization`"

---

## WCOP Score Proiezione

| Layer | v2.3.1 (oggi) | v2.6.0 (target) |
|-------|---------------|-----------------|
| 1 — Content Factory | 9/10 | 9/10 |
| 2 — Quality Assurance | 8/10 | 9/10 (AI optimization) |
| 3 — Distribution | 4/10 | **8/10** (Social/Email/GSC connectors) |
| 4 — Observability | 5/10 | **7/10** (GSC feedback loop + monitoring) |
| 5 — Automation | 4/10 | **7/10** (distribution pipeline + optimization pipeline) |
| **Totale** | **6/10** | **8/10** |

---

## Ordine di Implementazione

```
v2.4.0 — Social/Email Connectors
  1. Estensione types.ts (MailchimpConfig, BufferConfig, SendGridConfig)
  2. 3 file tool TypeScript (mailchimp.ts, buffer.ts, sendgrid.ts)
  3. Estensione wordpress.ts per client instances
  4. Detection script distribution_inspect.mjs
  5. Skill wp-social-email (SKILL.md + 6 reference files)
  6. Agent wp-distribution-manager.md
  7. Safety hooks (mc_send_campaign, sg_send_email)
  8. Router update v11 + cross-references
  9. Version bump + CHANGELOG
  10. Build, test, commit, publish npm + GitHub release

v2.5.0 — GSC Integration
  1. npm install googleapis in wp-rest-bridge
  2. Estensione types.ts (GSCConfig in SiteConfig)
  3. 1 file tool TypeScript (gsc.ts) con auth module
  4. Detection script search_console_inspect.mjs
  5. Skill wp-search-console (SKILL.md + 5 reference files)
  6. Agent update wp-content-strategist (SEO Feedback Loop)
  7. Router update v12 + cross-references
  8. Version bump + CHANGELOG
  9. Build, test, commit, publish npm + GitHub release

v2.6.0 — AI Content Optimization
  1. Detection script content_optimization_inspect.mjs
  2. Skill wp-content-optimization (SKILL.md + 5 reference files)
  3. Agent update wp-content-strategist (AI Optimization Workflow)
  4. Router update v13 + cross-references
  5. Version bump + CHANGELOG + GUIDE.md update
  6. Commit, publish npm + GitHub release
```

---

*Design Tier 3 WCOP v1.0 — wordpress-manager v2.3.1 -> v2.6.0 — 2026-03-01*
