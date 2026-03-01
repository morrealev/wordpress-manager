# Tier 4+5 WCOP — Observability Avanzata + Automation Avanzata

**Data:** 2026-03-01
**Stato:** Approvato
**Baseline:** v2.6.0 (36 skill, 12 agent, 111 MCP tools, 24 detection scripts, 178 reference files)
**Approccio:** A — Connector Grouping (analytics → alerting → workflows)

---

## Riepilogo Decisioni

| Decisione | Scelta |
|-----------|--------|
| Scope | Tier 4 (Observability) + Tier 5 (Automation) |
| Analytics | GA4 + Plausible (entrambi) |
| CWV | PageSpeed Insights API + CrUX API |
| Alerting | Slack + Email (riuso SendGrid esistente) |
| Workflows | Skill procedurale + MCP tool trigger (mu-plugin) |
| Versioning | 3 minor release (v2.7.0, v2.8.0, v2.9.0) |
| Raggruppamento | Connector Grouping (per tipo connettore/infrastruttura) |

---

## Release Plan

| Release | Feature | Nuovi MCP Tool | Nuove Skill | Agent Update |
|---------|---------|----------------|-------------|-------------|
| v2.7.0 | Analytics (GA4 + Plausible + CWV) | +14 (6 GA4 + 4 PL + 4 CWV) | +1 (wp-analytics) | wp-monitoring-agent |
| v2.8.0 | Smart Alerting (Slack + email pipeline) | +3 (Slack) | +1 (wp-alerting) | wp-monitoring-agent |
| v2.9.0 | Automated Workflows (templates + triggers) | +4 (wf_ triggers) | +1 (wp-content-workflows) | wp-site-manager |

### Conteggi a Fine Tier 4+5

| Metrica | v2.6.0 (oggi) | v2.9.0 (target) | Delta |
|---------|---------------|-----------------|-------|
| Skills | 36 | 39 | +3 |
| Agents | 12 | 12 | 0 (3 agent update) |
| MCP Tools | 111 | 132 | +21 |
| Detection scripts | 24 | 27 | +3 |
| Reference files | 178 | 192 | +14 |
| Safety hooks | 9 | 10 | +1 |
| Router | v13 | v16 | +3 |

---

## v2.7.0 — Analytics (GA4 + Plausible + CWV)

### Componenti

| Tipo | Nome | Descrizione |
|------|------|-------------|
| Skill | `wp-analytics` | Unified analytics: GA4, Plausible, Core Web Vitals |
| Agent | — | Estensione di `wp-monitoring-agent` (Analytics Monitoring + CWV) |
| MCP Tools | 3 file TypeScript | 14 nuovi tool nel WP REST Bridge |
| Detection | `analytics_inspect.mjs` | Rileva GA4/Plausible config, analytics plugins, PageSpeed API key |

### MCP Tool — Google Analytics 4 (6 tool)

| Tool | Descrizione | API |
|------|-------------|-----|
| `ga4_run_report` | Report custom (dimensions, metrics, date range) | POST v1beta runReport |
| `ga4_get_realtime` | Utenti attivi in tempo reale | POST v1beta runRealtimeReport |
| `ga4_top_pages` | Top pagine per pageviews (shortcut pre-filtrato) | POST v1beta runReport |
| `ga4_traffic_sources` | Traffico per source/medium (shortcut pre-filtrato) | POST v1beta runReport |
| `ga4_user_demographics` | Breakdown paese, device, browser (shortcut) | POST v1beta runReport |
| `ga4_conversion_events` | Eventi di conversione e tassi (shortcut) | POST v1beta runReport |

**Auth**: Google Analytics Data API v1beta via Service Account (stessa libreria `googleapis` di GSC).
**SiteConfig**: `ga4_property_id` (es. `"properties/123456789"`), `ga4_service_account_key` (puo riutilizzare stessa key di GSC).

### MCP Tool — Plausible Analytics (4 tool)

| Tool | Descrizione | Endpoint |
|------|-------------|----------|
| `pl_get_stats` | Statistiche aggregate (visitors, pageviews, bounce_rate, visit_duration) | GET /api/v1/stats/aggregate |
| `pl_get_timeseries` | Stats nel tempo (daily/hourly) | GET /api/v1/stats/timeseries |
| `pl_get_breakdown` | Breakdown per proprieta (page, source, country, device) | GET /api/v1/stats/breakdown |
| `pl_get_realtime` | Visitatori correnti | GET /api/v1/stats/realtime/visitors |

**Auth**: API key semplice (header `Authorization: Bearer <key>`).
**Base URL**: `https://plausible.io` (default) o self-hosted.
**SiteConfig**: `plausible_api_key`, `plausible_base_url` (opzionale).

### MCP Tool — Core Web Vitals (4 tool)

| Tool | Descrizione | API |
|------|-------------|-----|
| `cwv_analyze_url` | Analisi PageSpeed per singolo URL (LCP, INP, CLS, FCP, TTFB) | PageSpeed Insights API v5 |
| `cwv_batch_analyze` | Analisi batch delle top N pagine (da GA4/GSC data) | Loop su PageSpeed Insights |
| `cwv_get_field_data` | Dati CrUX reali (28 giorni aggregati) per origine/URL | Chrome UX Report API |
| `cwv_compare_pages` | Confronta CWV tra pagine e ranking priorita ottimizzazione | Multi-query + ranking |

**Auth**: Google API key semplice (no OAuth).
**SiteConfig**: `google_api_key` (API key per servizi Google pubblici).

### SiteConfig Extension

```json
{
  "id": "mysite",
  "ga4_property_id": "properties/123456789",
  "ga4_service_account_key": "/path/to/service-account.json",
  "plausible_api_key": "plausible-api-key...",
  "plausible_base_url": "https://plausible.io",
  "google_api_key": "AIza..."
}
```

Nota: `ga4_service_account_key` puo puntare allo stesso file di `gsc_service_account_key` se lo stesso Service Account ha accesso a GA4 e GSC.

### Skill Reference Files (5)

| File | Contenuto |
|------|-----------|
| `ga4-integration.md` | Setup GA4 Data API, Service Account condiviso con GSC, key metrics (sessions, users, conversions), custom report patterns |
| `plausible-setup.md` | Setup Plausible API, privacy benefits vs GA4, migrazione da GA4, self-hosted vs cloud |
| `cwv-monitoring.md` | Soglie CWV (Good: LCP<2.5s, INP<200ms, CLS<0.1), lab vs field data, PageSpeed vs CrUX |
| `analytics-dashboards.md` | Reporting cross-platform (GA4+Plausible+GSC), KPI unificati, template report |
| `traffic-attribution.md` | Source/medium analysis, correlazione GSC keyword → GA4 landing page, campaign UTM tracking |

### Agent Update: `wp-monitoring-agent`

Aggiunta sezione "Analytics Monitoring":

```
Procedura: Performance Dashboard
1. Fetch traffico GA4 (ga4_top_pages, ga4_traffic_sources) o Plausible (pl_get_stats, pl_get_breakdown)
2. Fetch CWV per top pages (cwv_batch_analyze)
3. Fetch keyword data GSC (gsc_top_queries)
4. Correla: pagine ad alto traffico con CWV Poor = priorita ottimizzazione
5. Genera Performance Dashboard Report
6. Se CWV Poor su pagine top → alert wp-performance-optimizer
```

### Cross-references

- `wp-search-console` → "Per correlare keyword GSC con traffico GA4, vedi `wp-analytics`"
- `wp-content-attribution` → "Per correlazione contenuto→conversione completa, combina `wp-analytics` + `wp-content-attribution`"
- `wp-content-optimization` → "Per prioritizzare ottimizzazione con dati CWV, combina `wp-analytics` + `wp-content-optimization`"

### Router v14

Nuove keyword in Step 0 operations:
```
Google Analytics, GA4, traffic analytics, pageviews, sessions, user analytics,
Plausible, privacy analytics, Core Web Vitals, CWV, LCP, INP, CLS, PageSpeed,
page speed, site speed, performance score
```

Nuovo entry in Step 2b:
```
- **Google Analytics / GA4 / Plausible / traffic analytics / pageviews / sessions / user analytics / Core Web Vitals / CWV / PageSpeed / site speed**
  → `wp-analytics` skill + `wp-monitoring-agent` agent
```

---

## v2.8.0 — Smart Alerting (Slack + Email + Monitoring Upgrade)

### Componenti

| Tipo | Nome | Descrizione |
|------|------|-------------|
| Skill | `wp-alerting` | Cross-cutting alerting: thresholds, escalation, reporting |
| Agent | — | Estensione di `wp-monitoring-agent` (Alert Dispatch) |
| MCP Tools | 1 file TypeScript | 3 nuovi tool nel WP REST Bridge |
| Detection | `alerting_inspect.mjs` | Rileva Slack config, SendGrid config, monitoring setup, wp-cron |

### MCP Tool — Slack (3 tool)

| Tool | Descrizione | Metodo |
|------|-------------|--------|
| `slack_send_alert` | Invia alert via incoming webhook (zero-config, solo URL) | POST incoming webhook |
| `slack_send_message` | Invia messaggio a canale specifico (formattato Block Kit) | Web API chat.postMessage |
| `slack_list_channels` | Lista canali disponibili nel workspace | Web API conversations.list |

**Auth dual-mode**:
- `slack_send_alert`: Incoming Webhook URL (basta generarlo da Slack, no OAuth)
- `slack_send_message` / `slack_list_channels`: Bot Token (`xoxb-...`)

**SiteConfig**: `slack_webhook_url` (per alerting base), `slack_bot_token` (opzionale, per messaggi avanzati).

### Alerting Pipeline (Procedure-Based)

L'alerting non usa "alert rules" come MCP tool (over-engineering). E una **procedura agent-driven**:

```
wp-monitoring-agent esegue check periodico
  → confronta con soglie (da reference files)
  → se soglia superata:
    → classifica severita (info/warning/critical/emergency)
    → route: Slack (slack_send_alert) + Email (sg_send_email)
    → log alert per reporting
```

Le soglie sono configurabili nei reference files e personalizzabili per sito.

### SiteConfig Extension

```json
{
  "id": "mysite",
  "slack_webhook_url": "https://hooks.slack.com/services/T.../B.../xxx",
  "slack_bot_token": "xoxb-..."
}
```

### Skill Reference Files (4)

| File | Contenuto |
|------|-----------|
| `slack-integration.md` | Setup webhook Slack, Bot Token, message formatting (Block Kit), canali consigliati (#alerts, #reports) |
| `alert-thresholds.md` | Soglie default: uptime (<99.5%), TTFB (>800ms), CWV (LCP>4s=critical), security (critical vuln=emergency), SEO (keyword drop >20%=warning) |
| `escalation-paths.md` | Livelli: info→Slack only, warning→Slack+email, critical→Slack+email+repeat, emergency→all channels immediate |
| `report-scheduling.md` | Template report settimanale (traffic + CWV + SEO + security), mensile (ROI + trends), delivery Slack+email |

### Agent Update: `wp-monitoring-agent`

Aggiunta sezione "Alert Dispatch":

```
Procedura: Alert Dispatch
1. Detect anomalia (da qualsiasi check: uptime, performance, security, SEO, content)
2. Classifica severita:
   - info: sotto soglia ma trend negativo
   - warning: soglia superata, non critico
   - critical: impatto utente immediato
   - emergency: sito down, security breach, data loss
3. Route:
   - info → log only (report settimanale)
   - warning → slack_send_alert
   - critical → slack_send_alert + sg_send_email
   - emergency → slack_send_alert + sg_send_email + repeat ogni 15min
4. Log alert per dashboard reporting
```

### Cross-references

- `wp-monitoring` → "Per configurare alert automatici, vedi `wp-alerting`"
- `wp-analytics` → "Per alert su drop traffico, combina `wp-analytics` + `wp-alerting`"
- `wp-search-console` → "Per alert su drop keyword, combina `wp-search-console` + `wp-alerting`"

### Router v15

Nuove keyword in Step 0 operations:
```
Slack alert, notification, alert threshold, escalation, monitoring alert,
email alert, report scheduling, weekly report, proactive monitoring
```

Nuovo entry in Step 2b:
```
- **Alert / notification / Slack / escalation / threshold / proactive monitoring / report scheduling**
  → `wp-alerting` skill + `wp-monitoring-agent` agent
```

---

## v2.9.0 — Automated Workflows (Templates + Event Triggers)

### Componenti

| Tipo | Nome | Descrizione |
|------|------|-------------|
| Skill | `wp-content-workflows` | Workflow templates + event-driven automation |
| Agent | — | Estensione di `wp-site-manager` (Workflow Automation) |
| MCP Tools | 1 file TypeScript | 4 nuovi tool nel WP REST Bridge |
| Detection | `workflow_inspect.mjs` | Rileva mu-plugin triggers, configured triggers, wp-cron |

### Workflow Templates (4)

| Template | Trigger | Procedura |
|----------|---------|-----------|
| **Launch Sequence** | Nuovo contenuto pronto | 1. Optimize (headline+meta via wp-content-optimization) → 2. Publish (update_content status=publish) → 3. Distribute (Buffer schedule + Mailchimp campaign) → 4. Monitor (24h: GSC indexing + GA4 traffic) |
| **Refresh Cycle** | Contenuto stale (>6 mesi) | 1. Triage (bulk triage → quick wins) → 2. Update (riscrittura/ottimizzazione) → 3. Re-distribute (social re-share + email highlight) → 4. Measure (GSC CTR dopo 2-4 settimane) |
| **Seasonal Campaign** | Calendario (evento, festivita) | 1. Plan (calendario + brief) → 2. Create (contenuti per canale) → 3. Schedule (Buffer + Mailchimp scheduling) → 4. Execute (publish dates) → 5. Report (analytics cross-channel) |
| **SEO Sprint** | Gap keyword rilevato | 1. Audit (GSC data → gap analysis) → 2. Prioritize (quick wins first) → 3. Optimize (batch headline+meta+content) → 4. Submit (gsc_submit_sitemap) → 5. Track (GSC CTR 4 settimane) |

Ogni template referenzia le skill e i tool esatti da usare in ogni step, creando un flusso end-to-end che attraversa l'intero stack WCOP.

### MCP Tool — Event Triggers (4 tool)

Meccanismo: **mu-plugin WordPress** (`wcop-event-triggers.php`) che legge una configurazione JSON e registra action hook → webhook outbound.

| Tool | Descrizione | Azione |
|------|-------------|--------|
| `wf_list_triggers` | Lista trigger event configurati | Legge config mu-plugin via REST API |
| `wf_create_trigger` | Registra nuovo trigger (hook → webhook URL + payload) | Scrive config mu-plugin |
| `wf_update_trigger` | Aggiorna configurazione trigger esistente | Modifica config mu-plugin |
| `wf_delete_trigger` | Rimuovi trigger (safety gate) | Rimuove da config mu-plugin |

**WordPress Hooks supportati** (documentati in reference file):
- `wp_publish_post` — contenuto pubblicato
- `woocommerce_order_status_completed` — ordine completato
- `wp_update_post` — contenuto aggiornato
- `delete_post` — contenuto eliminato
- Custom hooks tramite `do_action()`

**Configurazione trigger (JSON):**
```json
{
  "triggers": [
    {
      "id": "auto-distribute-new-post",
      "hook": "wp_publish_post",
      "webhook_url": "https://hooks.slack.com/...",
      "payload_template": "new_post",
      "active": true
    }
  ]
}
```

**Safety hook:** `wf_delete_trigger` → PreToolUse prompt confirmation.

### SiteConfig

Nessuna estensione SiteConfig necessaria — la configurazione trigger vive nel mu-plugin WordPress (gestita via MCP tool).

### Skill Reference Files (5)

| File | Contenuto |
|------|-----------|
| `launch-sequence.md` | Procedura completa: pre-publish checks, publish, distribute, 24h monitor. Checklist per ogni step con tool esatti |
| `refresh-cycle.md` | Triage decision tree (freshness score), update strategies, re-distribution timing |
| `seasonal-campaign.md` | Timeline campagna (8-4-2-1 settimane prima), asset creation, scheduling cross-channel, reporting KPI |
| `seo-sprint.md` | Sprint 2 settimane: audit day 1-2, optimize day 3-8, submit day 9, track day 10-14. Metriche success |
| `mu-plugin-triggers.md` | Architettura mu-plugin `wcop-event-triggers.php`, installazione, hook registry, payload templates, troubleshooting |

### Agent Update: `wp-site-manager`

Aggiunta sezione "Workflow Automation":

```
Procedura: Workflow Orchestration
1. Identifica workflow appropriato (launch/refresh/seasonal/seo-sprint)
2. Verifica prerequisiti (servizi configurati, contenuto pronto)
3. Esegui step sequenziali delegando ad agent specializzati:
   - Optimize → wp-content-strategist (wp-content-optimization)
   - Distribute → wp-distribution-manager (wp-social-email)
   - Monitor → wp-monitoring-agent (wp-analytics, wp-search-console)
   - Alert → wp-monitoring-agent (wp-alerting)
4. Report finale con metriche per step
```

### Cross-references

- `wp-content` → "Per automatizzare il ciclo di vita contenuto, vedi `wp-content-workflows`"
- `wp-social-email` → "Per distribuzione automatica post-publish, vedi `wp-content-workflows` (Launch Sequence)"
- `wp-webhooks` → "Per event triggers WordPress avanzati, vedi `wp-content-workflows` (mu-plugin triggers)"
- `wp-content-optimization` → "Per ottimizzazione pre-publish automatica, vedi `wp-content-workflows` (Launch Sequence step 1)"

### Router v16

Nuove keyword in Step 0 operations:
```
workflow, launch sequence, content refresh, seasonal campaign, SEO sprint,
automate content, event trigger, auto-publish, auto-distribute, content pipeline,
mu-plugin trigger, automated workflow
```

Nuovo entry in Step 2b:
```
- **Workflow / launch sequence / content refresh / seasonal campaign / SEO sprint / automate content / event trigger / content pipeline**
  → `wp-content-workflows` skill + `wp-site-manager` agent
```

---

## WCOP Score Proiezione

| Layer | v2.6.0 | v2.9.0 (target) | Miglioramento |
|-------|--------|-----------------|---------------|
| 1 — Content Factory | 9/10 | 9/10 | Invariato |
| 2 — Quality Assurance | 9/10 | 9/10 | Invariato |
| 3 — Distribution | 8/10 | 8/10 | Invariato (Tier 6) |
| 4 — Observability | 7/10 | **9/10** | +GA4+Plausible+CWV+Slack alerting |
| 5 — Automation | 7/10 | **9/10** | +Workflow templates+event triggers |
| **Totale** | **8/10** | **8.8/10** | +0.8 |

---

## Ordine di Implementazione

```
v2.7.0 — Analytics (GA4 + Plausible + CWV)
  1. Estensione types.ts (GA4Config, PlausibleConfig, CWVConfig)
  2. Estensione SiteConfig in wordpress.ts
  3. File tool ga4.ts (6 tool, googleapis)
  4. File tool plausible.ts (4 tool, axios)
  5. File tool cwv.ts (4 tool, axios per PageSpeed + googleapis per CrUX)
  6. Register tools in index.ts e build
  7. Detection script analytics_inspect.mjs
  8. Skill wp-analytics (SKILL.md + 5 reference files)
  9. Agent update wp-monitoring-agent (Analytics Monitoring + CWV)
  10. Router v14 + cross-references
  11. Version bump + CHANGELOG
  12. Build, commit, publish npm + GitHub release

v2.8.0 — Smart Alerting (Slack + Email)
  1. Estensione types.ts (SlackConfig)
  2. Estensione SiteConfig in wordpress.ts
  3. File tool slack.ts (3 tool)
  4. Register tools in index.ts e build
  5. Detection script alerting_inspect.mjs
  6. Skill wp-alerting (SKILL.md + 4 reference files)
  7. Agent update wp-monitoring-agent (Alert Dispatch)
  8. Router v15 + cross-references
  9. Version bump + CHANGELOG
  10. Build, commit, publish npm + GitHub release

v2.9.0 — Automated Workflows (Templates + Event Triggers)
  1. File tool workflows.ts (4 tool wf_*)
  2. Register tools in index.ts e build
  3. Safety hook per wf_delete_trigger
  4. Detection script workflow_inspect.mjs
  5. Skill wp-content-workflows (SKILL.md + 5 reference files)
  6. Agent update wp-site-manager (Workflow Automation)
  7. Router v16 + cross-references
  8. Version bump + CHANGELOG + GUIDE.md update
  9. Build, commit, publish npm + GitHub release
```

---

*Design Tier 4+5 WCOP v1.0 — wordpress-manager v2.6.0 → v2.9.0 — 2026-03-01*
