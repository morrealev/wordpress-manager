# WordPress Manager - Guida Completa per Utenti e Amministratori

**Versione:** 2.12.2
**Ultimo aggiornamento:** 2026-03-01
**Repository:** https://github.com/morrealev/wordpress-manager

---

## Indice

1. [Introduzione](#1-introduzione)
2. [Architettura del Plugin](#2-architettura-del-plugin)
3. [Installazione e Configurazione](#3-installazione-e-configurazione)
4. [Guida Rapida - Primi Passi](#4-guida-rapida---primi-passi)
5. [Comandi Slash - Riferimento Completo](#5-comandi-slash---riferimento-completo)
6. [Agenti Specializzati](#6-agenti-specializzati)
7. [Skills Operative - Gestione Siti Live](#7-skills-operative---gestione-siti-live)
8. [Skills di Sviluppo - Costruire Progetti WordPress](#8-skills-di-sviluppo---costruire-progetti-wordpress)
9. [Ambienti di Sviluppo Locali](#9-ambienti-di-sviluppo-locali)
10. [Hook di Sicurezza](#10-hook-di-sicurezza)
11. [MCP Server - Architettura Tecnica](#11-mcp-server---architettura-tecnica)
12. [Gestione Multi-Sito](#12-gestione-multi-sito)
13. [Scenari d'Uso Comuni](#13-scenari-duso-comuni)
14. [Amministrazione Avanzata](#14-amministrazione-avanzata)
15. [Troubleshooting](#15-troubleshooting)
16. [Glossario](#16-glossario)

---

## 1. Introduzione

### Cos'e il WordPress Manager

WordPress Manager e un plugin per **Claude Code** (la CLI ufficiale di Anthropic) che trasforma Claude in un amministratore WordPress completo. Invece di accedere manualmente alla dashboard WordPress, al pannello Hostinger e alla riga di comando SSH, puoi gestire tutto attraverso conversazioni in linguaggio naturale.

### Cosa puoi fare

- **Gestire contenuti**: creare, modificare, pubblicare post e pagine
- **Monitorare lo stato**: controllare salute del sito, SSL, plugin attivi
- **Effettuare deploy**: distribuire plugin, temi e siti statici in produzione
- **Eseguire audit**: sicurezza, performance e SEO con report strutturati
- **Gestire backup**: creare, verificare e ripristinare backup completi
- **Migrare siti**: trasferire WordPress tra hosting diversi
- **Amministrare infrastruttura**: DNS, domini, certificati SSL via Hostinger
- **Sviluppare blocchi Gutenberg**: creare e testare blocchi custom con block.json
- **Costruire temi a blocchi**: sviluppare block theme con theme.json, template e pattern
- **Creare plugin**: architettura plugin, hook, Settings API, REST endpoint
- **Analizzare codice**: static analysis con PHPStan, profiling con WP-CLI
- **Testare in sandbox**: WordPress Playground per ambienti disposable
- **Progettare UI WordPress**: componenti WPDS, design token, pattern
- **Testare progetti**: Playwright E2E, Jest unit, PHPUnit integration, CI/CD
- **Hardening sicurezza**: filesystem, HTTP headers, autenticazione, incident response
- **Audit accessibilita**: WCAG 2.2 AA, axe-core, pa11y, Lighthouse
- **Internazionalizzare**: PHP/JS gettext, .pot/.po/.mo workflow, RTL, WPML/Polylang
- **Architetture headless**: REST vs WPGraphQL, JWT auth, CORS, Next.js/Nuxt/Astro
- **Gestire WooCommerce**: prodotti, ordini, clienti, coupon, report vendite, configurazione store
- **Amministrare Multisite**: sub-site, network plugin, Super Admin, domain mapping
- **Configurare CI/CD**: GitHub Actions, GitLab CI, Bitbucket Pipelines, quality gates, deploy automatico
- **Monitorare siti**: uptime, performance baseline, security scanning, content integrity, alerting
- **Fleet monitoring**: monitorare tutti i siti configurati con report comparativi cross-site
- **Riproporre contenuti**: trasformare post WordPress in social media, email, newsletter multi-canale
- **Gestire webhook**: configurare notifiche outbound WordPress verso servizi esterni (Zapier, Slack, CDN)
- **SEO programmatico**: generare centinaia di pagine template da dati strutturati (city pages, product variants, directory)
- **Attribuzione contenuti-vendite**: misurare quale contenuto WordPress genera conversioni WooCommerce (UTM tracking, attribution models, ROI)
- **Rete multilingua**: orchestrare WordPress Multisite come network multilingua con hreflang, content sync e SEO internazionale
- **Distribuzione social/email**: distribuire contenuti su Mailchimp, Buffer e SendGrid con workflow multi-canale
- **Google Search Console**: monitorare keyword, indicizzazione, performance pagine e feedback SEO da GSC
- **Ottimizzazione contenuti AI**: headline scoring, readability analysis, SEO scoring, meta optimization, content freshness e bulk triage
- **Analytics unificata**: GA4, Plausible e Core Web Vitals in un unico punto di accesso, con dashboard, trend e confronto pagine
- **Smart alerting**: routing alerting basato su severity (info→Slack webhook, warning→Slack Bot con thread, critical→Slack + email) via Slack e SendGrid
- **Workflow automatizzati**: trigger basati su schedule (cron), hook WordPress e lifecycle contenuti con azioni multi-canale (Slack, email, webhook)
- **Pubblicare su LinkedIn**: postare contenuti nel feed, articoli long-form, analytics engagement (impressions, click, reaction)
- **Pubblicare su Twitter/X**: tweet singoli, thread multi-tweet, metriche interazioni, gestione tweet
- **Auto-transform contenuti**: convertire automaticamente post WordPress in tweet, thread, post LinkedIn, articoli LinkedIn, email snippet con template per piattaforma
- **Generare contenuti AI**: pipeline 7 step (brief → keyword research → outline → draft → SEO optimize → structured data → publish) con template e pattern
- **Gestire dati strutturati**: validare, iniettare e auditare Schema.org/JSON-LD (Article, Product, FAQ, HowTo, LocalBusiness, Event, Organization, BreadcrumbList)

### Requisiti

| Requisito | Dettaglio |
|-----------|---------- |
| Claude Code | CLI installata e autenticata |
| Node.js | >= 18.0 |
| WordPress | >= 5.0 con REST API abilitata (default) |
| Accesso admin | Per generare Application Password |
| Hostinger (opzionale) | API token per gestione infrastruttura |

---

## 2. Architettura del Plugin

### Schema Generale

```
                          Claude Code
                              |
                    wordpress-manager plugin
                    /         |         \
            Hostinger MCP    WP REST Bridge    WordPress.com MCP
            (119 tool)       (148 tool)        (~15 tool)
                |                |                    |
          Infrastruttura    Contenuti +          Siti hosted
          DNS, SSL, VPS     Plugin, Utenti       su WordPress.com
                |                |
            Hostinger API    WordPress REST API v2
                |                |
          hostinger.com     tuosito.com/wp-json/
```

### Componenti del Plugin

```
wordpress-manager/                          # v2.12.2
+-- .claude-plugin/plugin.json              # Manifest
+-- .mcp.json                               # Server MCP bundled
+-- LICENSE                                 # MIT + GPL-2.0-or-later
+-- CHANGELOG.md                            # Cronologia versioni
+-- agents/                                 # 12 agenti specializzati
|   +-- wp-site-manager.md                      # Orchestratore centrale
|   +-- wp-deployment-engineer.md               # Specialista deploy
|   +-- wp-content-strategist.md                # Contenuti, SEO, GSC feedback, AI optimization, content generation, structured data
|   +-- wp-security-auditor.md                  # Audit sicurezza (read-only)
|   +-- wp-security-hardener.md                 # Hardening e incident response
|   +-- wp-performance-optimizer.md             # Performance e CWV
|   +-- wp-test-engineer.md                     # Testing (E2E, unit, integration)
|   +-- wp-accessibility-auditor.md             # WCAG 2.2 AA audit (read-only)
|   +-- wp-ecommerce-manager.md                 # WooCommerce store management (v1.8.0)
|   +-- wp-cicd-engineer.md                     # CI/CD pipeline specialist (v2.0.0)
|   +-- wp-monitoring-agent.md                  # Site monitoring read-only (v2.1.0)
|   +-- wp-distribution-manager.md              # Multi-channel distribution + LinkedIn + Twitter/X (v2.10.0)
+-- commands/                               # 5 slash commands
|   +-- wp-status.md / wp-deploy.md / wp-audit.md / wp-backup.md / wp-setup.md
+-- skills/                                 # 43 skill totali
|   +-- [OPERATIVE - 5 skill]
|   +-- wp-deploy/                              # Procedure deploy
|   +-- wp-audit/                               # Checklist audit
|   +-- wp-content/                             # Template contenuti
|   +-- wp-migrate/                             # Procedure migrazione
|   +-- wp-backup/                              # Strategie backup
|   +-- [AMBIENTE LOCALE - 1 skill]
|   +-- wp-local-env/                           # Studio/LocalWP/wp-env
|   +-- [SVILUPPO - 13 skill da WordPress/agent-skills]
|   +-- wordpress-router/                       # Router unificato v18 (dev + local + ops + multisite + cicd + monitoring + webhooks + repurposing + pseo + attribution + multilang + distribution + gsc + content-optimization + analytics + alerting + workflows + linkedin + twitter + content-generation + structured-data)
|   +-- wp-project-triage/                      # Auto-detect tipo progetto
|   +-- wp-block-development/                   # Blocchi Gutenberg
|   +-- wp-block-themes/                        # Temi a blocchi
|   +-- wp-plugin-development/                  # Architettura plugin
|   +-- wp-rest-api/                            # Endpoint REST
|   +-- wp-interactivity-api/                   # Interactivity API
|   +-- wp-abilities-api/                       # Abilities API
|   +-- wp-wpcli-and-ops/                       # WP-CLI
|   +-- wp-phpstan/                             # Analisi statica
|   +-- wp-performance/                         # Profiling backend
|   +-- wp-playground/                          # Sandbox disposable
|   +-- wpds/                                   # WordPress Design System
|   +-- [SVILUPPO ESTESO - 5 skill]
|   +-- wp-e2e-testing/                         # Testing strategy e framework
|   +-- wp-security/                            # Security hardening e incident response
|   +-- wp-i18n/                                # Internazionalizzazione
|   +-- wp-accessibility/                       # WCAG 2.2 accessibilita
|   +-- wp-headless/                            # Architettura headless/decoupled
|   +-- [E-COMMERCE + INFRASTRUTTURA - 6 skill]
|   +-- wp-woocommerce/                         # WooCommerce store management (v1.8.0)
|   +-- wp-multisite/                           # Multisite network management (v1.9.0)
|   +-- wp-cicd/                                # CI/CD pipeline automation (v2.0.0)
|   +-- wp-monitoring/                          # Site monitoring, fleet monitoring e observability (v2.1.0-v2.2.0)
|   +-- wp-content-repurposing/                 # Content repurposing multi-canale (v2.2.0)
|   +-- wp-webhooks/                            # Webhook propagation e integrazioni (v2.2.0)
|   +-- [STRATEGIA + SEO INTERNAZIONALE - 3 skill]
|   +-- wp-programmatic-seo/                    # SEO programmatico scalabile (v2.3.0)
|   +-- wp-content-attribution/                 # Attribuzione content-to-commerce (v2.3.0)
|   +-- wp-multilang-network/                   # Rete multilingua su multisite (v2.3.0)
|   +-- [DISTRIBUZIONE + SEO AVANZATO - 3 skill]
|   +-- wp-social-email/                        # Distribuzione social/email multi-canale (v2.4.0)
|   +-- wp-search-console/                      # Google Search Console integration (v2.5.0)
|   +-- wp-content-optimization/                # AI content optimization e bulk triage (v2.6.0)
|   +-- [ANALYTICS + ALERTING + AUTOMAZIONE - 3 skill]
|   +-- wp-analytics/                           # GA4, Plausible, Core Web Vitals unificati (v2.7.0)
|   +-- wp-alerting/                            # Smart alerting severity-based via Slack/SendGrid (v2.8.0)
|   +-- wp-content-workflows/                   # Workflow triggers (schedule, lifecycle, hooks) con azioni multi-canale (v2.9.0)
|   +-- [DISTRIBUZIONE DIRETTA + CONTENT FACTORY - 4 skill]
|   +-- wp-linkedin/                            # LinkedIn direct posting e analytics (v2.10.0)
|   +-- wp-twitter/                             # Twitter/X direct posting e thread (v2.10.0)
|   +-- wp-structured-data/                     # Schema.org/JSON-LD validation e injection (v2.12.2)
|   +-- wp-content-generation/                  # AI content generation pipeline (v2.12.2)
+-- hooks/                                  # 12 hook di sicurezza
|   +-- hooks.json                              # 10 prompt + 2 command
|   +-- scripts/                                # Script per hook command-type
+-- scripts/                                # Utility
+-- servers/wp-rest-bridge/                 # MCP Server custom (TypeScript)
+-- docs/                                   # Documentazione
    +-- GUIDE.md                                # Questa guida
```

### Come Interagiscono i Componenti

1. **L'utente parla a Claude** in linguaggio naturale
2. **Claude attiva uno skill** se il contesto lo richiede (es. "fai un backup" -> skill wp-backup)
3. **Claude invoca un agent** per compiti complessi (es. audit sicurezza -> wp-security-auditor)
4. **L'agent usa i tool MCP** per interagire con WordPress e Hostinger
5. **Gli hook intercettano** operazioni pericolose e chiedono conferma
6. **Claude presenta i risultati** all'utente in formato strutturato

---

## 3. Installazione e Configurazione

### 3.1 Installazione del Plugin

Il plugin si installa come plugin locale di Claude Code:

```bash
# Clona il repository nella directory dei plugin locali
git clone https://github.com/morrealev/wordpress-manager.git \
  ~/.claude/plugins/local/wordpress-manager
```

### 3.2 Build del Server MCP

Il WP REST Bridge e un server TypeScript che va compilato:

```bash
cd ~/.claude/plugins/local/wordpress-manager/servers/wp-rest-bridge
npm install
npx tsc
```

Questo crea la directory `build/` con i file JavaScript compilati.

### 3.3 Abilitazione del Plugin

Aggiungi il plugin alla configurazione di Claude Code in `~/.claude/settings.json`:

```json
{
  "enabledPlugins": {
    "wordpress-manager@local": true
  }
}
```

### 3.4 Configurazione Credenziali

Crea o aggiorna il file `~/.claude/mcp-secrets.env`:

```bash
# --- Hostinger API (opzionale, per gestione infrastruttura) ---
export HOSTINGER_API_TOKEN="il-tuo-token-hostinger"

# --- WordPress Sites Config ---
# Array JSON con le credenziali di ogni sito WordPress
export WP_SITES_CONFIG='[
  {
    "id": "miosito",
    "url": "https://miosito.com",
    "username": "admin@miosito.com",
    "password": "xxxx xxxx xxxx xxxx"
  }
]'
export WP_DEFAULT_SITE="miosito"
```

Aggiungi al tuo `~/.bashrc` o `~/.zshrc`:

```bash
source ~/.claude/mcp-secrets.env
```

### 3.5 Generare una Application Password

Le Application Password sono il metodo di autenticazione raccomandato per la REST API di WordPress:

1. Accedi alla dashboard WordPress come amministratore
2. Vai su **Utenti > Profilo** (o **Users > Profile**)
3. Scorri fino a **Application Passwords**
4. Inserisci un nome (es. "Claude Code") e clicca **Aggiungi nuova password**
5. **Copia la password generata** - viene mostrata una sola volta
6. Il formato e tipo `xxxx xxxx xxxx xxxx xxxx xxxx` (6 gruppi di 4 caratteri)

> **Attenzione**: NON usare la password dell'account WordPress. Usa sempre una Application Password dedicata.

### 3.6 Generare un Token Hostinger API

Se il tuo sito e su Hostinger:

1. Accedi a [hostinger.com](https://www.hostinger.com)
2. Vai su **Account > API** oppure direttamente a [hostinger.com/my-api](https://www.hostinger.com/my-api)
3. Crea un nuovo token API
4. Copia il token e aggiungilo a `mcp-secrets.env`

### 3.7 Verifica Installazione

Esegui il health check per verificare che tutto funzioni:

```bash
source ~/.claude/mcp-secrets.env
bash ~/.claude/plugins/local/wordpress-manager/scripts/health-check.sh
```

Output atteso:

```
=== WordPress Health Check ===
Site: https://miosito.com

[1/5] Site Reachability
  PASS Site responds (HTTP 200)
[2/5] SSL Certificate
  PASS SSL valid (XX days remaining)
[3/5] WordPress REST API
  PASS REST API reachable (HTTP 200)
[4/5] Authentication
  PASS Authenticated as 'admin@miosito.com' (ID: 1)
[5/5] Hostinger API
  PASS Hostinger API reachable (HTTP 200)

=== Health Check Complete ===
```

---

## 4. Guida Rapida - Primi Passi

### Primo utilizzo

Dopo l'installazione, avvia una nuova sessione Claude Code e prova questi comandi:

**Controllare lo stato del sito:**
```
/wordpress-manager:wp-status
```

**Elencare i post recenti:**
```
Mostrami gli ultimi 5 post su miosito
```

**Verificare i plugin attivi:**
```
Quali plugin sono attivi sul mio sito WordPress?
```

### Frasario - Come Chiedere le Cose

WordPress Manager comprende richieste in linguaggio naturale. Ecco come formulare le richieste piu comuni:

| Cosa vuoi fare | Come chiederlo |
|----------------|----------------|
| Controllare lo stato | "Come sta il mio sito?" / "Status di opencactus" |
| Creare un post | "Crea un post su..." / "Scrivi un articolo su..." |
| Deploy un plugin | "Deploya il plugin X" / "Pusha il tema in produzione" |
| Audit sicurezza | "Fai un audit di sicurezza" / "Controlla la sicurezza del sito" |
| Audit performance | "Controlla le performance" / "Come va la velocita del sito?" |
| Audit SEO | "Analizza la SEO" / "Come e messa la SEO?" |
| Creare un backup | "Fai un backup" / "Backup del sito" |
| Ripristinare un backup | "Ripristina il backup" / "Restore dal backup di ieri" |
| Migrare un sito | "Migra il sito su Hostinger" / "Trasferisci il sito" |
| Aggiungere un nuovo sito | "Configura un nuovo sito WordPress" |
| Cambiare sito attivo | "Passa al sito bioinagro" / "Switch a opencactus" |
| Eseguire test | "Esegui i test" / "Lancia Playwright" / "Testa il plugin" |
| Hardening sicurezza | "Metti in sicurezza il sito" / "Hardening" |
| Audit accessibilita | "Controlla l'accessibilita" / "WCAG audit" |
| Internazionalizzare | "Internazionalizza il plugin" / "Traduci il tema" |
| Setup headless | "WordPress headless con Next.js" / "Configura WPGraphQL" |
| Gestire WooCommerce | "Mostra gli ordini" / "Crea un prodotto" / "Report vendite" |
| Amministrare Multisite | "Crea un sub-site" / "Network activate plugin" / "Super Admin" |
| Configurare CI/CD | "Setup GitHub Actions" / "CI per il mio plugin" / "Deploy automatico" |
| Monitorare il sito | "Monitora il sito" / "Health report" / "Setup uptime check" |
| Fleet monitoring | "Monitora tutti i siti" / "Fleet health" / "Cross-site comparison" |
| Riproporre contenuti | "Riproponi il post per social" / "Newsletter dal blog" / "Atomizza contenuto" |
| Gestire webhook | "Configura webhook" / "Notifica Zapier" / "WooCommerce webhook" |
| SEO programmatico | "Genera city pages" / "Template pages" / "Pagine da dati" / "Programmatic SEO" |
| Attribuzione contenuti | "Quale contenuto genera vendite?" / "UTM tracking" / "Content ROI" / "Revenue per post" |
| Rete multilingua | "Sito multilingua" / "Hreflang" / "International SEO" / "Sub-site per lingua" |
| Distribuzione social/email | "Distribuisci il post" / "Mailchimp campaign" / "Buffer schedule" / "SendGrid email" |
| Google Search Console | "Keyword tracking" / "Search analytics" / "Indicizzazione" / "GSC performance" |
| Ottimizzazione contenuti | "Ottimizza titoli" / "Headline score" / "Readability" / "Content triage" / "Quick wins" |
| Analytics unificata | "GA4 report" / "Plausible stats" / "Core Web Vitals" / "Traffic sources" / "Page performance" |
| Smart alerting | "Configura alert Slack" / "Notifica critiche" / "Severity routing" / "Alert su Slack" |
| Workflow automatizzati | "Crea trigger" / "Workflow cron" / "Automatizza notifiche" / "Content lifecycle trigger" |

---

## 5. Comandi Slash - Riferimento Completo

I comandi slash sono scorciatoie dirette per operazioni specifiche. Si invocano con il prefisso `/wordpress-manager:`.

### /wordpress-manager:wp-status

**Scopo**: Health check rapido del sito.

**Cosa controlla**:
- Raggiungibilita del sito (HTTP)
- Stato REST API
- Conteggio contenuti (post, pagine)
- Plugin attivi e conteggio
- Certificato SSL (giorni rimanenti)
- Stato Hostinger API (se configurato)

**Livelli di severita nell'output**:
- **CRITICAL**: Sito irraggiungibile, SSL scaduto, autenticazione fallita
- **WARNING**: SSL in scadenza < 30 giorni, Hostinger frozen, troppi plugin (> 20)
- **INFO**: Tutto funzionante

**Esempio d'uso**:
```
/wordpress-manager:wp-status
```

---

### /wordpress-manager:wp-deploy

**Scopo**: Deploy di plugin, temi o siti statici in produzione.

**Sintassi**:
```
/wordpress-manager:wp-deploy plugin <percorso> to <sito>
/wordpress-manager:wp-deploy theme <percorso> to <sito>
/wordpress-manager:wp-deploy static <percorso> to <sito>
```

**Processo**:
1. Verifica che i file locali esistano
2. Validazione sintattica (PHP lint per plugin/temi)
3. Controllo assenza credenziali hardcoded nei file
4. Conferma utente prima di procedere
5. Deploy via Hostinger MCP o SSH
6. Verifica post-deploy

**Metodi di deploy**:

| Hosting | Metodo | Tool utilizzati |
|---------|--------|----------------|
| Hostinger | Hostinger MCP | `hosting_deployWordpressPlugin`, `hosting_deployWordpressTheme` |
| Altro con SSH | SSH/SCP | Comandi bash via SSH |
| Importazione completa | Hostinger MCP | `hosting_importWordpressWebsite` |

---

### /wordpress-manager:wp-audit

**Scopo**: Audit approfondito del sito.

**Sintassi**:
```
/wordpress-manager:wp-audit                     # Audit completo
/wordpress-manager:wp-audit security            # Solo sicurezza
/wordpress-manager:wp-audit performance         # Solo performance
/wordpress-manager:wp-audit seo                 # Solo SEO
/wordpress-manager:wp-audit full on <sito>      # Completo su sito specifico
```

**Audit Sicurezza** (5 fasi):
1. Sicurezza plugin (versioni obsolete, vulnerabilita note)
2. Account utente (password deboli, ruoli eccessivi, utenti inattivi)
3. Integrita contenuti (commenti spam, link malevoli)
4. DNS/SSL (configurazione HTTPS, DNSSEC, email SPF/DKIM)
5. Configurazione hosting (permessi file, wp-config.php hardening)

**Audit Performance** (5 fasi):
1. Impatto plugin (plugin pesanti, conflitti)
2. Caching (page cache, object cache, CDN)
3. Media (immagini non ottimizzate, dimensioni eccessive)
4. Core Web Vitals (LCP < 2.5s, INP < 200ms, CLS < 0.1)
5. Configurazione server (PHP memory, max execution time)

**Audit SEO** (7 aree):
1. SEO tecnico (sitemap, robots.txt, canonical URL)
2. SEO on-page (title, meta description, headings)
3. Dati strutturati (Schema.org, Rich Snippets)
4. Velocita sito (impatto su ranking)
5. SEO locale (Google My Business, NAP)
6. Architettura contenuti (struttura URL, link interni)
7. Impostazioni WordPress specifiche (permalink, categorie)

**Output**: Report con findings classificati per severity (Critical > High > Medium > Low > Info), piano d'azione prioritizzato, sezione "quick wins" (azioni < 1 ora).

---

### /wordpress-manager:wp-backup

**Scopo**: Gestione backup del sito.

**Sintassi**:
```
/wordpress-manager:wp-backup create              # Backup sito attivo
/wordpress-manager:wp-backup create on <sito>    # Backup sito specifico
/wordpress-manager:wp-backup list                # Elenco backup disponibili
/wordpress-manager:wp-backup restore <id>        # Ripristino da backup
```

**Metodi di backup disponibili**:

| Metodo | Scope | Requisiti |
|--------|-------|-----------|
| SSH + mysqldump | Database + file completi | Accesso SSH al server |
| Hostinger snapshot | Snapshot VPS completo | Hosting VPS su Hostinger |
| API export | Solo contenuti (post, pagine, tassonomie) | Solo accesso REST API |

**Strategia di retention raccomandata**:

| Tipo | Frequenza | Conservazione |
|------|-----------|---------------|
| Database | Giornaliero | 7 giorni |
| File | Settimanale | 4 settimane |
| Full site | Mensile | 3 mesi |
| Pre-deploy | Prima di ogni deploy | Fino a verifica deploy |

> **Regola aurea**: Non cancellare mai un vecchio backup finche il nuovo non e stato verificato.

---

### /wordpress-manager:wp-setup

**Scopo**: Aggiungere un nuovo sito WordPress al plugin.

**Sintassi**:
```
/wordpress-manager:wp-setup                     # Wizard interattivo
/wordpress-manager:wp-setup https://miosito.com # Setup sito specifico
```

**Processo in 6 step**:

1. **Raccolta informazioni**: URL sito, ID breve, username, Application Password, hosting provider
2. **Configurazione credenziali**: Aggiunta a `WP_SITES_CONFIG` in `mcp-secrets.env`
3. **Verifica connettivita**: Test API REST, content types, autenticazione
4. **Configurazione Hostinger**: Se applicabile, verifica API token e capabilities
5. **Status check iniziale**: Baseline del sito (conteggi contenuti, plugin, ecc.)
6. **Report**: Riepilogo configurazione completata

**Prerequisiti** per l'utente:
- Accesso admin al WordPress per generare Application Password
- REST API abilitata (default dal WordPress 4.7)
- Se Hostinger: API token dal pannello

---

## 6. Agenti Specializzati

Gli agenti sono "personalita" specializzate di Claude che vengono attivate automaticamente in base al contesto della conversazione. Non devi invocarli manualmente - Claude sceglie l'agente giusto per il compito.

Il plugin include **12 agenti** organizzati per area di competenza. Alcuni agenti lavorano in coppia (audit → fix) o in modalita read-only (monitoraggio).

### wp-site-manager (Orchestratore)

| Proprieta | Valore |
|-----------|--------|
| Colore | Cyan |
| Ruolo | Coordinamento multi-sito, status monitoring, diagnostica |
| Attivazione | Status check, operazioni multi-sito, diagnostica generale |

**Capacita**:
- Gestione unificata di siti self-hosted e WordPress.com
- Monitoraggio salute sito (HTTP, SSL, API, Hostinger)
- Switching tra siti multipli
- Coordinamento tra tool Hostinger e WP REST Bridge

**Esempio attivazione**: "Come sta il mio sito?", "Passa al sito opencactus", "Elenca tutti i siti configurati"

---

### wp-deployment-engineer (Deploy)

| Proprieta | Valore |
|-----------|--------|
| Colore | Green |
| Ruolo | Pipeline di deployment sicure |
| Attivazione | Deploy plugin/temi, push in produzione, migrazione file |

**Workflow di deploy**:
1. Pre-flight: verifica file, syntax check PHP, scan credenziali
2. Backup: assicura rollback path
3. Deploy: Hostinger MCP, SSH, o export da ambiente locale
4. Post-deploy: verifica con WP REST Bridge (list_plugins, list_content), report

**4 metodi supportati**:
- **Hostinger MCP**: `hosting_deployWordpressPlugin`, `hosting_deployWordpressTheme`
- **SSH/SCP**: Upload e estrazione via comandi SSH
- **Full import**: `hosting_importWordpressWebsite` per migrazioni complete
- **Da ambiente locale**: Export da WordPress Studio, LocalWP o wp-env, poi deploy (vedi skill `wp-local-env`)

**Verifica post-deploy**: Usa i tool WP REST Bridge (`list_plugins`, `activate_plugin`, `list_content`) per verificare che il deploy sia andato a buon fine.

**Skill correlata**: `wp-deploy`, `wp-local-env`

---

### wp-content-strategist (Contenuti)

| Proprieta | Valore |
|-----------|--------|
| Colore | Magenta |
| Ruolo | Creazione contenuti, SEO, gestione editoriale, contenuti multilingue, GSC feedback, AI optimization, content generation, structured data |
| Attivazione | Creazione post, ottimizzazione SEO, gestione tassonomie, keyword tracking, content optimization, genera contenuto, structured data, Schema.org |

**Ciclo di vita contenuti**:
```
IDEAZIONE -> BOZZA -> REVISIONE -> OTTIMIZZAZIONE -> PUBBLICAZIONE -> MONITORAGGIO
```

**Capacita SEO**:
- Ottimizzazione title tag e meta description
- Gerarchia heading (H1 > H2 > H3)
- Internal linking con modello Pillar-Cluster
- Dati strutturati (Article, Product, FAQ)
- Analisi keyword density

**Contenuti multilingue**: Per contenuto tradotto o multilingue, si coordina con la skill `wp-i18n`. Per temi/plugin che generano contenuto traducibile, usa correttamente text domain e funzioni `__()`, `_e()`, `esc_html__()`.

**6 template disponibili**: Blog standard, Listicle, How-To Guide, Landing Page, About Page, Product Page

**Content repurposing** (v2.2.0): Trasforma contenuti WordPress in output multi-canale — social media post (Twitter/LinkedIn/Instagram/Facebook), email newsletter, drip sequence. Usa la skill `wp-content-repurposing` per template e regole per piattaforma.

**Programmatic SEO** (v2.3.0): Guida la generazione scalabile di pagine da dati strutturati — city pages, product variants, comparison pages, directory listings. Workflow: assess data source → design URL pattern → create CPT → build template → generate in bulk → configure ISR/SSG → submit sitemap. Usa la skill `wp-programmatic-seo`.

**SEO Feedback Loop** (v2.5.0): Integrazione con Google Search Console per feedback loop SEO. Workflow: pull GSC data (top queries, page performance) → identifica contenuti sotto-performanti → suggerisce ottimizzazioni basate su CTR, impressions, position → monitora risultati nel tempo. Usa la skill `wp-search-console` e i tool `gsc_*`.

**AI Content Optimization** (v2.6.0): Pipeline AI-driven in 5 step per ottimizzazione contenuti: headline scoring → readability analysis (Flesch-Kincaid) → SEO scoring → meta optimization → content freshness check. Include bulk triage per analisi rapida di tutti i contenuti con classificazione Quick Wins / Maintain / Deep Review / Outdated. Usa la skill `wp-content-optimization`.

**AI Content Generation** (v2.12.2): Pipeline completa 7 step per generare contenuti da zero: brief → keyword research (GSC se disponibile) → outline (4 pattern: standard, tutorial, listicle, FAQ) → draft (calibrato sulla voce del sito) → SEO optimize → structured data injection → publish as draft. Procedure-based, usa tool MCP esistenti (`wp/v2`, `gsc_*`, `sd_*`). Usa la skill `wp-content-generation`.

**Structured Data Management** (v2.12.2): Gestione completa Schema.org/JSON-LD con 3 tool MCP dedicati: `sd_validate` (validazione markup via URL o inline), `sd_inject` (iniezione JSON-LD nei post), `sd_list_schemas` (audit sitewide). 8 tipi supportati: Article, Product, FAQ, HowTo, LocalBusiness, Event, Organization, BreadcrumbList. Usa la skill `wp-structured-data`.

**Skill correlata**: `wp-content`, `wp-i18n`, `wp-content-repurposing`, `wp-programmatic-seo`, `wp-search-console`, `wp-content-optimization`, `wp-content-generation`, `wp-structured-data`

---

### wp-security-auditor (Sicurezza — Audit)

| Proprieta | Valore |
|-----------|--------|
| Colore | Red |
| Ruolo | Audit sicurezza (read-only, non modifica nulla) |
| Attivazione | "Controlla la sicurezza", "audit sicurezza", "scansiona vulnerabilita" |

**Pre-scan rapido**: Esegue `security_inspect.mjs` per una panoramica veloce (wp-config constants, permessi file, .htaccess, plugin di sicurezza).

**5 fasi di audit**:

| Fase | Cosa controlla |
|------|---------------|
| Plugin Security | Versioni obsolete, plugin abbandonati, vulnerabilita note |
| User Accounts | Password deboli, ruoli eccessivi, utenti admin superflui |
| Content Integrity | Commenti spam, iniezioni di link, contenuti sospetti |
| DNS/SSL | HTTPS forzato, HSTS, SPF/DKIM per email |
| Server Config | Permessi file, wp-config.php, .htaccess rules |

**Classificazione severity**:
- **CRITICAL**: Vulnerabilita attivamente sfruttabili
- **HIGH**: Rischi significativi che richiedono azione immediata
- **MEDIUM**: Problemi da risolvere nella prossima manutenzione
- **LOW**: Miglioramenti raccomandati
- **INFO**: Best practice e suggerimenti

**Handoff a remediation**: Questo agent fa solo audit. Per **implementare le correzioni**, delegare al `wp-security-hardener` agent. Per procedure di hardening dettagliate, consultare la skill `wp-security`.

**Skill correlata**: `wp-audit`, `wp-security`

---

### wp-security-hardener (Sicurezza — Hardening)

| Proprieta | Valore |
|-----------|--------|
| Colore | Red |
| Ruolo | Hardening sicurezza e incident response (implementa le correzioni) |
| Attivazione | "Metti in sicurezza il sito", "hardening", "incidente sicurezza", "sito compromesso" |

Complementa `wp-security-auditor`: l'auditor **trova** i problemi, l'hardener **li risolve**.

**6 aree di intervento**:

| Area | Azioni |
|------|--------|
| Filesystem Hardening | Permessi file, disabilita editor PHP, protegge wp-config.php |
| HTTP Security Headers | CSP, X-Frame-Options, HSTS, X-Content-Type-Options via .htaccess |
| Authentication Hardening | Limita tentativi login, disabilita XML-RPC, forza password forti |
| REST API Restriction | Disabilita REST per utenti non autenticati, namespace filtering |
| User Management | Rimozione utenti inattivi, downgrade ruoli eccessivi |
| Incident Response | 5 fasi: contenimento → investigazione → remediation → recovery → post-incident |

**Protocollo di handoff**: Riceve i findings dal `wp-security-auditor` e produce un report di remediation con ogni azione documentata.

**Regole di sicurezza**: SEMPRE backup prima di modifiche. Conferma ogni modifica con l'utente. Non tocca plugin attivi senza permesso. Documenta ogni cambiamento.

**Skill correlata**: `wp-security`

---

### wp-performance-optimizer (Performance)

| Proprieta | Valore |
|-----------|--------|
| Colore | Yellow |
| Ruolo | Ottimizzazione performance e Core Web Vitals |
| Attivazione | "Controlla la velocita", "performance", "Core Web Vitals" |

**Target Core Web Vitals**:

| Metrica | Target | Cosa misura |
|---------|--------|-------------|
| LCP (Largest Contentful Paint) | < 2.5s | Velocita caricamento elemento principale |
| INP (Interaction to Next Paint) | < 200ms | Reattivita alle interazioni utente |
| CLS (Cumulative Layout Shift) | < 0.1 | Stabilita visiva durante caricamento |

**Separazione MCP tool**: L'agent usa **WP REST Bridge** per dati a livello WordPress (plugin, contenuti, impostazioni) e **Hostinger MCP** per metriche a livello infrastruttura (risorse server, PHP memory, caching server-side).

**Plugin pesanti noti** (dall'audit):
- Elementor Pro, WPBakery, Divi (page builder)
- Wordfence, Sucuri (security con scanning pesante)
- WooCommerce (con molte estensioni)
- Jetpack (quando attivato completamente)

**Skill correlata**: `wp-performance` (profiling backend con WP-CLI doctor/profile), `wp-audit`

---

### wp-test-engineer (Testing)

| Proprieta | Valore |
|-----------|--------|
| Colore | Blue |
| Ruolo | Esecuzione test, setup infrastruttura test, debug failure |
| Attivazione | "Esegui i test", "Playwright", "Jest", "PHPUnit", "CI pipeline" |

**Framework supportati**:

| Framework | Tipo | Comando |
|-----------|------|---------|
| Playwright | E2E browser test | `npx playwright test` |
| Jest | Unit test JavaScript | `npx jest` |
| PHPUnit | Unit/integration test PHP | `./vendor/bin/phpunit` |

**Procedure**:
1. **Setup ambiente**: rileva framework via `test_inspect.mjs`, configura wp-env se necessario
2. **Esecuzione test**: lancia suite appropriata, cattura output
3. **Debug failure**: analizza output, screenshot Playwright, trace file
4. **Coverage**: genera report coverage, identifica gap
5. **CI Integration**: verifica/crea GitHub Actions workflow

**Report**: Risultati per suite, analisi failure, coverage gap, suggerimenti.

**Regole**: Non esegue test su produzione. Conferma prima di installare dipendenze. Non modifica test senza approvazione.

**Skill correlata**: `wp-e2e-testing`

---

### wp-accessibility-auditor (Accessibilita)

| Proprieta | Valore |
|-----------|--------|
| Colore | Purple |
| Ruolo | Audit WCAG 2.2 AA (read-only, non modifica codice) |
| Attivazione | "Audit accessibilita", "WCAG", "a11y check", "screen reader" |

**5 fasi di audit**:

| Fase | Cosa verifica |
|------|---------------|
| Automated Scan | axe-core/pa11y su URL target, Lighthouse a11y score |
| Code Review | ARIA usage, gerarchia heading, alt text, form labels, landmarks |
| Keyboard Navigation | Focus order, skip links, tab traps |
| Theme Compliance | Requisiti accessibility-ready di WordPress |
| Block Editor A11y | Output semantico dei blocchi Gutenberg |

**Report**: Matrice conformita WCAG, violazioni per severity, step di remediation per ogni issue.

**Regole**: Non modifica codice (solo audit). Produce raccomandazioni actionable con riferimenti WCAG specifici.

**Skill correlata**: `wp-accessibility`

---

### wp-ecommerce-manager (WooCommerce)

| Proprieta | Valore |
|-----------|--------|
| Colore | Orange |
| Ruolo | Gestione completa store WooCommerce |
| Attivazione | "Mostra gli ordini", "crea un prodotto", "report vendite", "coupon", "WooCommerce" |

**Capacita** (34 tool MCP via WP REST Bridge, namespace `wc/v3`):

| Area | Tool | Operazioni |
|------|------|-----------|
| Products | 7 | CRUD prodotti, categorie, variazioni |
| Orders | 6 | Lista ordini, aggiorna stato, note, rimborsi |
| Customers | 4 | Gestione clienti, profili, cronologia |
| Coupons | 4 | Creazione coupon, marketing promozioni |
| Reports | 5 | Vendite, top seller, totali ordini/prodotti/clienti |
| Settings | 4 | Gateway pagamento, zone spedizione, tasse, system status |
| Webhooks | 4 | Lista, crea, aggiorna, elimina webhook WooCommerce (v2.2.0) |

**Prerequisiti**: WooCommerce attivo + Consumer Key/Secret configurati in `WP_SITES_CONFIG` (generare da WooCommerce > Settings > Advanced > REST API).

**Content Attribution** (v2.3.0): Misura quale contenuto WordPress genera conversioni WooCommerce. Workflow: verifica WooCommerce + contenuti → check UTM tracking (guida setup mu-plugin) → pull sales data → pull content data → correla con attribution model → genera report con top converting content. Usa la skill `wp-content-attribution`.

**Skill correlata**: `wp-woocommerce`, `wp-webhooks`, `wp-content-attribution`

---

### wp-cicd-engineer (CI/CD)

| Proprieta | Valore |
|-----------|--------|
| Colore | Cyan |
| Ruolo | Setup, configurazione e debug pipeline CI/CD |
| Attivazione | "Setup GitHub Actions", "CI per il plugin", "pipeline fallisce", "deploy automatico" |

**3 piattaforme supportate**:

| Piattaforma | Config | Best for |
|-------------|--------|----------|
| GitHub Actions | `.github/workflows/*.yml` | Plugin open-source, GitHub repos |
| GitLab CI | `.gitlab-ci.yml` | Enterprise, self-hosted GitLab |
| Bitbucket Pipelines | `bitbucket-pipelines.yml` | Team Atlassian |

**Pipeline WordPress tipica**:
1. **Lint**: PHP syntax, PHPCS code style
2. **Static Analysis**: PHPStan livello 6+
3. **Unit Test**: PHPUnit con WordPress test suite
4. **E2E Test**: Playwright con wp-env in Docker
5. **Deploy**: SSH/rsync o Hostinger MCP con rollback automatico

**Detection**: `cicd_inspect.mjs` rileva piattaforma CI, quality tool, wp-env, e genera raccomandazioni.

**Skill correlata**: `wp-cicd`

---

### wp-monitoring-agent (Monitoring)

| Proprieta | Valore |
|-----------|--------|
| Colore | Teal |
| Ruolo | Monitoring continuo del sito (read-only, non modifica nulla) |
| Attivazione | "Monitora il sito", "health report", "uptime check", "performance trend", "security scan periodico", "fleet health", "monitora tutti i siti" |

**8 aree di monitoraggio + fleet**:

| Area | Cosa monitora |
|------|--------------|
| Uptime | HTTP status, response time, SSL expiry, WP-Cron |
| Performance | Core Web Vitals trend, TTFB, Lighthouse score |
| Security | Plugin vulnerabilita, file integrity, utenti anomali, malware patterns |
| Content | Modifiche non autorizzate, broken links, spam comments, media integrity |
| Alerting | Threshold P0-P3, notifiche email/Slack/webhook, escalation |
| Fleet (v2.2.0) | Cross-site health comparison, fleet-wide patterns, per-site breakdown |
| Analytics (v2.7.0) | GA4 report, Plausible stats, traffic sources, user demographics, conversion events |
| CWV Trend (v2.7.0) | Core Web Vitals trend analysis, field data, page comparison |
| Alert Dispatch (v2.8.0) | Severity-based routing: info→Slack webhook, warning→Slack Bot + thread, critical→Slack + email |

**Report disponibili**: Daily Health Summary, Weekly Performance, Monthly Security, Quarterly Trend, Executive Dashboard, Fleet Health Report (v2.2.0).

**Fleet monitoring** (v2.2.0): Itera su tutti i siti configurati (`list_sites` + `switch_site`), esegue le procedure di monitoring per ciascuno, aggrega i risultati in un report comparativo fleet con pattern cross-site (stessa vulnerabilita su piu siti, performance regression fleet-wide).

**Delegazione**: Quando rileva problemi, delega a agent specializzati:
- Sicurezza → `wp-security-auditor` + `wp-security-hardener`
- Performance → `wp-performance-optimizer`
- Contenuti → `wp-content-strategist`
- Deploy fix → `wp-deployment-engineer`

**Detection**: `monitoring_inspect.mjs` rileva setup monitoring esistente (uptime tools, Lighthouse CI, security plugins, logging config).

**Skill correlata**: `wp-monitoring`, `wp-analytics`, `wp-alerting`

---

### wp-distribution-manager (Distribuzione)

| Proprieta | Valore |
|-----------|--------|
| Colore | Indigo |
| Ruolo | Distribuzione multi-canale contenuti su Mailchimp, Buffer, SendGrid, LinkedIn e Twitter/X |
| Attivazione | "Distribuisci il post", "invia newsletter", "programma social", "email campaign", "Buffer schedule", "pubblica su LinkedIn", "pubblica tweet", "Twitter thread" |

**5 canali supportati**:

| Canale | Servizio | Tool prefix | Operazioni |
|--------|----------|-------------|-----------|
| Email Marketing | Mailchimp | `mc_*` | Liste, campagne, template, audience |
| Social Scheduling | Buffer | `buf_*` | Profili, post scheduling, analytics |
| Email Transazionale | SendGrid | `sg_*` | Template, invio, contatti, statistiche |
| LinkedIn Direct | LinkedIn API | `li_*` | Post feed, articoli long-form, analytics engagement (v2.10.0) |
| Twitter/X Direct | Twitter API v2 | `tw_*` | Tweet, thread, metriche, gestione tweet (v2.10.0) |

**Workflow distribuzione**:
1. Seleziona contenuto WordPress da distribuire (via `list_content`)
2. Detection con `distribution_inspect.mjs` (servizi configurati, credenziali)
3. Adatta contenuto per ogni canale (lunghezza, formato, CTA)
4. Auto-transform se disponibile: usa template pipeline per conversioni blog→tweet, blog→thread, blog→LinkedIn post (v2.11.0)
5. Programma o invia su canali selezionati
6. Report: conferma invio, link preview, metriche

**Prerequisiti**: Almeno un servizio configurato in `WP_SITES_CONFIG` (Mailchimp API key, Buffer access token, SendGrid API key, LinkedIn access token, o Twitter Bearer/OAuth tokens).

**Skill correlata**: `wp-social-email`, `wp-linkedin`, `wp-twitter`, `wp-content-repurposing`

---



| Pattern | Flusso | Descrizione |
|---------|--------|-------------|
| **Audit → Fix** | `wp-security-auditor` → `wp-security-hardener` | L'auditor trova problemi, l'hardener implementa le correzioni |
| **Monitor → Delegate** | `wp-monitoring-agent` → agent specializzati | Il monitoring rileva anomalie e delega agli agent competenti |
| **Delegazione** | `wp-site-manager` → tutti gli altri | Il site manager delega a agent specializzati in base al task |

Il `wp-site-manager` puo delegare a tutti i 12 agent specializzati:

| Task | Agent delegato |
|------|---------------|
| Deploy, migrazione | `wp-deployment-engineer` |
| Contenuti, SEO, AI optimization | `wp-content-strategist` |
| Audit sicurezza | `wp-security-auditor` |
| Hardening, incident response | `wp-security-hardener` |
| Performance, CWV | `wp-performance-optimizer` |
| Testing | `wp-test-engineer` |
| Accessibilita | `wp-accessibility-auditor` |
| WooCommerce, e-commerce | `wp-ecommerce-manager` |
| CI/CD pipeline | `wp-cicd-engineer` |
| Site monitoring e health reports | `wp-monitoring-agent` |
| Distribuzione social/email, LinkedIn, Twitter | `wp-distribution-manager` |

---

## 7. Skills Operative - Gestione Siti Live

Le skill sono "librerie di conoscenza" che Claude attiva automaticamente quando il contesto della conversazione corrisponde alla loro area. Non sono comandi - sono conoscenza specializzata che migliora le risposte.

### Panoramica Skills Operative (5)

| Skill | Si attiva quando... | Reference files inclusi |
|-------|---------------------|------------------------|
| wp-deploy | "deploy", "push to production", "deploya" | hostinger-deploy.md, ssh-deploy.md |
| wp-audit | "audit", "security check", "controlla sicurezza" | security-checklist.md, performance-checklist.md, seo-checklist.md |
| wp-content | "crea un post", "scrivi un articolo", "SEO" | content-templates.md, seo-optimization.md |
| wp-migrate | "migra il sito", "sposta su Hostinger", "trasferisci" | hostinger-migration.md, cross-platform.md |
| wp-backup | "backup", "crea un backup", "ripristina" | backup-strategies.md, restore-procedures.md |

### Come Funzionano

Quando dici "fai un backup del mio sito", Claude:
1. Riconosce il contesto -> attiva la skill `wp-backup`
2. Carica `SKILL.md` -> decision tree per scegliere il metodo
3. Consulta `references/backup-strategies.md` -> comandi specifici
4. Esegue il workflow guidato dalla skill

Le skill NON sostituiscono i comandi slash. I comandi sono entry point espliciti; le skill sono conoscenza di background che arricchisce qualsiasi conversazione correlata.

---

## 8. Skills di Sviluppo - Costruire Progetti WordPress

### Origine

Le skill di sviluppo provengono da due fonti:

- **13 skill community** integrate dal repository [WordPress/agent-skills](https://github.com/WordPress/agent-skills) (licenza GPL-2.0-or-later). Coprono blocchi, temi, plugin, endpoint REST, analisi statica, profiling e altro.
- **5 skill estese** (MIT) aggiunte in v1.6.0: testing, security, internazionalizzazione, accessibilita, headless.
- **6 skill e-commerce + infrastruttura** (MIT) aggiunte in v1.8.0-v2.2.0: WooCommerce, Multisite, CI/CD, Monitoring, Content Repurposing, Webhooks.
- **3 skill strategia + SEO internazionale** (MIT) aggiunte in v2.3.0: Programmatic SEO, Content-Commerce Attribution, Multi-Language Network.
- **3 skill distribuzione + SEO avanzato** (MIT) aggiunte in v2.4.0-v2.6.0: Social/Email Distribution, Google Search Console, AI Content Optimization.
- **3 skill analytics + alerting + automazione** (MIT) aggiunte in v2.7.0-v2.9.0: Analytics (GA4/Plausible/CWV), Smart Alerting (Slack/SendGrid severity routing), Automated Workflows (triggers + multi-channel actions).
- **4 skill distribuzione diretta + content factory** (MIT) aggiunte in v2.10.0-v2.12.2: LinkedIn Direct (posting + analytics), Twitter/X Direct (tweet + thread + metriche), Structured Data (Schema.org/JSON-LD), AI Content Generation (pipeline 7-step).

### Il Router Unificato

La skill `wordpress-router` (v18) e il punto d'ingresso per tutti i task WordPress. Classifica automaticamente il task in **ventuno categorie**: sviluppo, ambiente locale, operativo, multisite, CI/CD, monitoring, content repurposing, webhook, programmatic SEO, content attribution, multi-language network, social/email distribution, search console, content optimization, analytics, alerting, content workflows, LinkedIn, Twitter/X, content generation, structured data.

```
Utente: "Crea un blocco custom per la gallery"
  |
wordpress-router: TASK = sviluppo
  |
wp-project-triage: TIPO = wp-block-plugin
  |
wp-block-development: guida creazione blocco
```

```
Utente: "Deploya il plugin su opencactus"
  |
wordpress-router: TASK = operativo
  |
wp-deploy + wp-deployment-engineer: esegue deploy
```

```
Utente: "Configura il mio sito locale con WordPress Studio"
  |
wordpress-router: TASK = ambiente locale
  |
wp-local-env: guida setup e gestione
```

```
Utente: "Esegui i test E2E del mio plugin"
  |
wordpress-router: TASK = sviluppo (testing)
  |
wp-e2e-testing skill + wp-test-engineer agent
```

```
Utente: "Mostrami gli ordini WooCommerce di questa settimana"
  |
wordpress-router: TASK = operativo (e-commerce)
  |
wp-woocommerce skill + wp-ecommerce-manager agent
```

```
Utente: "Setup GitHub Actions per il mio plugin WordPress"
  |
wordpress-router: TASK = sviluppo (CI/CD)
  |
wp-cicd skill + wp-cicd-engineer agent
```

```
Utente: "Configura il monitoring del sito con alerting"
  |
wordpress-router: TASK = operativo (monitoring)
  |
wp-monitoring skill + wp-monitoring-agent agent
```

```
Utente: "Riproponi l'ultimo post del blog per i social media"
  |
wordpress-router: TASK = operativo (content repurposing)
  |
wp-content-repurposing skill + wp-content-strategist agent
```

```
Utente: "Configura un webhook WooCommerce per Zapier"
  |
wordpress-router: TASK = operativo (webhook)
  |
wp-webhooks skill + wp-site-manager agent
```

```
Utente: "Genera 200 city pages per il nostro servizio idraulico"
  |
wordpress-router: TASK = operativo (programmatic SEO)
  |
wp-programmatic-seo skill + wp-content-strategist agent
```

```
Utente: "Quali post del blog generano piu vendite WooCommerce?"
  |
wordpress-router: TASK = operativo (content attribution)
  |
wp-content-attribution skill + wp-ecommerce-manager agent
```

```
Utente: "Configura versioni italiano e spagnolo del nostro sito"
  |
wordpress-router: TASK = operativo (multi-language network)
  |
wp-multilang-network skill + wp-site-manager agent
```

```
Utente: "Distribuisci l'ultimo post via Mailchimp e Buffer"
  |
wordpress-router: TASK = operativo (social/email distribution)
  |
wp-social-email skill + wp-distribution-manager agent
```

```
Utente: "Quali keyword posizionano meglio il mio sito su Google?"
  |
wordpress-router: TASK = operativo (search console)
  |
wp-search-console skill + wp-content-strategist agent
```

```
Utente: "Analizza e ottimizza i titoli dei miei post per CTR"
  |
wordpress-router: TASK = operativo (content optimization)
  |
wp-content-optimization skill + wp-content-strategist agent
```

```
Utente: "Mostrami il report GA4 e le Core Web Vitals del mio sito"
  |
wordpress-router: TASK = operativo (analytics)
  |
wp-analytics skill + wp-monitoring-agent agent
```

```
Utente: "Configura un alert Slack quando il sito va giu"
  |
wordpress-router: TASK = operativo (alerting)
  |
wp-alerting skill + wp-monitoring-agent agent
```

```
Utente: "Crea un trigger che invia su Slack quando un post viene pubblicato"
  |
wordpress-router: TASK = operativo (content workflows)
  |
wp-content-workflows skill + wp-site-manager agent
```

### Panoramica Skills di Sviluppo — Community (13)

| Skill | Si attiva quando... | Risorse |
|-------|---------------------|---------|
| `wordpress-router` | Qualsiasi task WordPress (classifica e instrada) | decision-tree.md |
| `wp-project-triage` | Analisi automatica tipo progetto nella directory corrente | detect_wp_project.mjs, triage.schema.json |
| `wp-block-development` | "crea un blocco", "block.json", "registerBlockType" | 10 reference files, list_blocks.mjs |
| `wp-block-themes` | "theme.json", "crea un template", "pattern", "Global Styles" | 6 reference files, detect_block_themes.mjs |
| `wp-plugin-development` | "crea un plugin", "hook", "add_action", "Settings API" | 6 reference files, detect_plugins.mjs |
| `wp-rest-api` | "register_rest_route", "endpoint REST", "permission_callback" | 6 reference files |
| `wp-interactivity-api` | "data-wp-*", "Interactivity API", "viewScriptModule" | 3 reference files |
| `wp-abilities-api` | "wp_register_ability", "Abilities API", "capabilities" | 2 reference files |
| `wp-wpcli-and-ops` | "WP-CLI", "wp-cli.yml", "scaffold", "wp command" | 7 reference files, wpcli_inspect.mjs |
| `wp-phpstan` | "PHPStan", "analisi statica", "phpstan.neon" | 3 reference files, phpstan_inspect.mjs |
| `wp-performance` | "profiling", "wp profile", "wp doctor", "query lente" | 10 reference files, perf_inspect.mjs |
| `wp-playground` | "Playground", "sandbox", "blueprint", "test disposable" | 3 reference files |
| `wpds` | "Design System", "@wordpress/components", "design token" | wpds-mcp-setup.md (richiede WPDS MCP server) |

### Panoramica Skills di Sviluppo — Estese (5)

Aggiunte in v1.6.0, queste skill coprono aree avanzate dello sviluppo WordPress. Ogni skill ha un **agent dedicato** per l'esecuzione (indicato in tabella).

| Skill | Si attiva quando... | Risorse | Agent dedicato |
|-------|---------------------|---------|----------------|
| `wp-e2e-testing` | "testa il plugin", "Playwright", "Jest", "PHPUnit", "CI" | 7 reference files, test_inspect.mjs | `wp-test-engineer` |
| `wp-security` | "hardening", "metti in sicurezza", "incidente", "CSP" | 7 reference files, security_inspect.mjs | `wp-security-hardener` |
| `wp-i18n` | "traduci", "internazionalizza", "text domain", "RTL", "WPML" | 6 reference files, i18n_inspect.mjs | — |
| `wp-accessibility` | "accessibilita", "WCAG", "screen reader", "a11y" | 6 reference files | `wp-accessibility-auditor` |
| `wp-headless` | "headless", "decoupled", "WPGraphQL", "Next.js", "CORS" | 6 reference files, headless_inspect.mjs | — |

**Cross-reference bidirezionali**: Le skill con agent dedicato contengono una sezione "Recommended Agent", e gli agent contengono "Related Skills". Questo garantisce che Claude attivi sia la conoscenza (skill) che l'esecutore (agent) appropriati.

### Panoramica Skills E-Commerce + Infrastruttura (6)

Aggiunte in v1.8.0-v2.2.0, queste skill coprono e-commerce, multisite, CI/CD, monitoring, content repurposing e webhook.

| Skill | Si attiva quando... | Risorse | Agent dedicato |
|-------|---------------------|---------|----------------|
| `wp-woocommerce` | "prodotti", "ordini", "WooCommerce", "coupon", "report vendite" | 8 reference files, woocommerce_inspect.mjs | `wp-ecommerce-manager` |
| `wp-multisite` | "multisite", "sub-site", "network admin", "domain mapping" | 6 reference files, multisite_inspect.mjs | — |
| `wp-cicd` | "CI/CD", "GitHub Actions", "pipeline", "deploy automatico" | 7 reference files, cicd_inspect.mjs | `wp-cicd-engineer` |
| `wp-monitoring` | "monitora", "uptime", "health report", "alerting", "fleet health" | 7 reference files, monitoring_inspect.mjs | `wp-monitoring-agent` |
| `wp-content-repurposing` | "riproponi contenuto", "social dal blog", "newsletter dai post", "atomizza" | 4 reference files, repurposing_inspect.mjs | `wp-content-strategist` |
| `wp-webhooks` | "webhook", "notifica esterna", "Zapier", "WooCommerce webhook" | 5 reference files, webhook_inspect.mjs | `wp-site-manager` |

### Panoramica Skills Strategia + SEO Internazionale (3)

Aggiunte in v2.3.0, queste skill coprono SEO programmatico, attribuzione content-to-commerce e rete multilingua su Multisite.

| Skill | Si attiva quando... | Risorse | Agent dedicato |
|-------|---------------------|---------|----------------|
| `wp-programmatic-seo` | "template pages", "city pages", "programmatic SEO", "bulk page generation" | 5 reference files, programmatic_seo_inspect.mjs | `wp-content-strategist` |
| `wp-content-attribution` | "content ROI", "UTM tracking", "revenue per post", "quale contenuto genera vendite" | 5 reference files, attribution_inspect.mjs | `wp-ecommerce-manager` |
| `wp-multilang-network` | "multilingua", "hreflang", "international SEO", "sub-site per lingua", "translate site" | 5 reference files, multilang_inspect.mjs | `wp-site-manager` |

### Panoramica Skills Distribuzione + SEO Avanzato (3)

Aggiunte in v2.4.0-v2.6.0, queste skill coprono distribuzione multi-canale, Google Search Console e ottimizzazione contenuti AI-driven.

| Skill | Si attiva quando... | Risorse | Agent dedicato |
|-------|---------------------|---------|----------------|
| `wp-social-email` | "distribuisci", "Mailchimp", "Buffer", "SendGrid", "newsletter", "social schedule" | 6 reference files, distribution_inspect.mjs | `wp-distribution-manager` |
| `wp-search-console` | "Search Console", "keyword tracking", "indicizzazione", "GSC", "search analytics" | 5 reference files, search_console_inspect.mjs | `wp-content-strategist` |
| `wp-content-optimization` | "ottimizza titoli", "readability", "headline score", "content triage", "meta optimization" | 5 reference files, content_optimization_inspect.mjs | `wp-content-strategist` |

### Panoramica Skills Analytics + Alerting + Automazione (3)

Aggiunte in v2.7.0-v2.9.0, queste skill completano il layer Observability + Automation del WCOP (WordPress Content Operations Pipeline).

| Skill | Si attiva quando... | Risorse | Agent dedicato |
|-------|---------------------|---------|----------------|
| `wp-analytics` | "GA4 report", "Plausible stats", "Core Web Vitals", "traffic sources", "page performance", "conversion events" | 5 reference files, analytics_inspect.mjs | `wp-monitoring-agent` |
| `wp-alerting` | "alert Slack", "notifica critiche", "severity routing", "escalation", "alert email" | 4 reference files, alerting_inspect.mjs | `wp-monitoring-agent` |
| `wp-content-workflows` | "crea trigger", "workflow cron", "content lifecycle", "automatizza notifiche", "trigger schedule" | 5 reference files, workflow_inspect.mjs | `wp-site-manager` |

### Panoramica Skills Distribuzione Diretta + Content Factory (4)

Aggiunte in v2.10.0-v2.12.2, queste skill completano il WCOP portando il punteggio totale da 8.8/10 a 9.2/10 (Distribution 9/10, Content Factory 10/10).

| Skill | Si attiva quando... | Risorse | Agent dedicato |
|-------|---------------------|---------|----------------|
| `wp-linkedin` | "pubblica su LinkedIn", "LinkedIn post", "LinkedIn article", "B2B social", "LinkedIn analytics" | 3 reference files, linkedin_inspect.mjs | `wp-distribution-manager` |
| `wp-twitter` | "pubblica tweet", "Twitter thread", "tweet analytics", "Twitter/X", "crea thread" | 3 reference files, twitter_inspect.mjs | `wp-distribution-manager` |
| `wp-structured-data` | "structured data", "Schema.org", "JSON-LD", "rich snippet", "dati strutturati", "FAQ schema" | 3 reference files, schema_inspect.mjs | `wp-content-strategist` |
| `wp-content-generation` | "genera contenuto", "scrivi post AI", "content brief", "crea articolo", "draft post" | 3 reference files, content_gen_inspect.mjs | `wp-content-strategist` |

### Script di Rilevamento Automatico

Le skill includono 31 script Node.js (`.mjs`) che eseguono analisi automatica del progetto:

| Script | Cosa rileva |
|--------|-------------|
| `detect_wp_project.mjs` | Tipo progetto: plugin, theme, block theme, wp-core, gutenberg |
| `list_blocks.mjs` | Blocchi registrati nel progetto (block.json files) |
| `detect_block_themes.mjs` | Struttura block theme: theme.json, templates, patterns |
| `detect_plugins.mjs` | Plugin headers, hooks registrati, dipendenze |
| `perf_inspect.mjs` | WP-CLI availability, autoloaded options, object cache |
| `wpcli_inspect.mjs` | WP-CLI versione, comandi disponibili, configurazione |
| `phpstan_inspect.mjs` | Configurazione PHPStan, livello analisi, baseline |
| `detect_local_env.mjs` | Ambienti locali: Studio, LocalWP, wp-env (v1.5.0) |
| `test_inspect.mjs` | Framework test: Playwright, Jest, PHPUnit, wp-env, CI config (v1.6.0) |
| `security_inspect.mjs` | wp-config constants, permessi file, .htaccess, plugin sicurezza (v1.6.0) |
| `i18n_inspect.mjs` | Text domain, file .pot/.po/.mo, funzioni i18n PHP/JS (v1.6.0) |
| `headless_inspect.mjs` | WPGraphQL, CORS config, framework frontend (v1.6.0) |
| `woocommerce_inspect.mjs` | WooCommerce attivo, API keys, prodotti, ordini, gateway (v1.8.0) |
| `multisite_inspect.mjs` | Multisite abilitato, sub-sites, network plugins, Super Admin (v1.9.0) |
| `cicd_inspect.mjs` | Piattaforme CI, quality tools, wp-env, deploy config (v2.0.0) |
| `monitoring_inspect.mjs` | Uptime tools, Lighthouse CI, security plugins, logging config, fleet config (v2.1.0-v2.2.0) |
| `repurposing_inspect.mjs` | Social plugins, email plugins, content volume, repurposing readiness (v2.2.0) |
| `webhook_inspect.mjs` | WC webhooks, mu-plugin webhooks, webhook plugins, wp-config constants (v2.2.0) |
| `programmatic_seo_inspect.mjs` | Headless frontend, SEO plugin, content counts, CPT, WPGraphQL, readiness (v2.3.0) |
| `attribution_inspect.mjs` | WooCommerce, analytics plugin, UTM tracking, content/product volume, order meta (v2.3.0) |
| `multilang_inspect.mjs` | Multisite, multilingual plugin, language patterns, hreflang tags, WPLANG (v2.3.0) |
| `distribution_inspect.mjs` | Mailchimp, Buffer, SendGrid config, API keys, servizi attivi (v2.4.0) |
| `search_console_inspect.mjs` | GSC service account, siti verificati, sitemap, keyword data (v2.5.0) |
| `content_optimization_inspect.mjs` | Content volume, titoli, meta description, readability readiness (v2.6.0) |
| `analytics_inspect.mjs` | GA4 property ID, Plausible config, Google API key, analytics setup (v2.7.0) |
| `alerting_inspect.mjs` | Slack webhook/bot token, SendGrid config, monitoring setup, alert readiness (v2.8.0) |
| `workflow_inspect.mjs` | Action channel config, automation plugins, custom REST endpoints, WP-Cron, webhook config (v2.9.0) |
| `linkedin_inspect.mjs` | LinkedIn access token, profile info, API connectivity (v2.10.0) |
| `twitter_inspect.mjs` | Twitter Bearer token, OAuth tokens, API v2 connectivity (v2.10.0) |
| `schema_inspect.mjs` | SEO plugins (Yoast, Rank Math), existing JSON-LD in theme, Schema Pro (v2.12.2) |
| `content_gen_inspect.mjs` | REST access, GSC credentials, pipeline step availability (v2.12.2) |

### WordPress Playground — Ambienti Disposable

La skill `wp-playground` permette di creare istanze WordPress temporanee per testing:

```bash
# Spin-up rapido con mount automatico del plugin
cd mio-plugin/
npx @wp-playground/cli@latest server --auto-mount

# Esecuzione blueprint per setup riproducibile
npx @wp-playground/cli@latest run-blueprint --blueprint=test-setup.json

# Snapshot per condivisione o CI
npx @wp-playground/cli@latest build-snapshot --blueprint=setup.json --outfile=./site.zip
```

Requisiti: Node.js >= 20.18. Playground gira in WebAssembly con SQLite — **mai** puntare a dati di produzione.

### WordPress Design System (WPDS)

La skill `wpds` guida la costruzione di UI conformi al Design System di WordPress. Funziona al meglio con il **WPDS MCP server** che espone:

- `wpds://components` — catalogo componenti (Button, Modal, TextControl, ...)
- `wpds://design-tokens` — token di design (colori, spaziatura, tipografia)
- `wpds://pages` — documentazione e linee guida

Senza il server MCP, la skill usa conoscenza generale di `@wordpress/components` e `@wordpress/ui`.

### Workflow Tipico di Sviluppo

```
1. cd mio-progetto-wordpress/
2. Claude esegue wp-project-triage → rileva "wp-block-plugin"
3. wordpress-router v18 → instrada a wp-block-development
4. Claude guida la creazione con block.json, edit.js, save.js
5. wp-e2e-testing + wp-test-engineer → esegue test E2E con Playwright
6. wp-accessibility + wp-accessibility-auditor → verifica WCAG 2.2
7. wp-phpstan → analisi statica del codice
8. wp-i18n → internazionalizzazione se necessaria
9. wp-security + wp-security-hardener → hardening sicurezza
10. wp-deploy → deploy in produzione quando pronto
```

---

## 9. Ambienti di Sviluppo Locali

La skill `wp-local-env` fornisce gestione unificata degli ambienti di sviluppo WordPress locali.

### Strumenti Supportati

| Strumento | Tipo | Database | CLI | Quando Usarlo |
|-----------|------|----------|-----|---------------|
| **WordPress Studio** | WASM (Electron) | SQLite | `studio` CLI | Setup rapido, sviluppo leggero |
| **LocalWP** | Nativo (Electron) | MySQL | GUI only + WP-CLI bundled | Parita con produzione, multisite |
| **wp-env** | Docker | MySQL | `npx wp-env` | CI/CD, contribuzione WordPress core |

### Rilevamento Automatico

```
"Rileva i miei ambienti WordPress locali"
```

Il plugin esegue `detect_local_env.mjs` che:
1. Cerca WordPress Studio (`studio` CLI + `~/Studio/`)
2. Cerca LocalWP (`sites.json` + WP-CLI bundled)
3. Cerca wp-env (`.wp-env.json` + Docker)
4. Raccomanda lo strumento migliore per automazione

### Operazioni Comuni

```
"Crea un sito locale con WordPress Studio"
→ studio site create --path ~/Studio/mio-sito

"Elenca i plugin del mio sito LocalWP"
→ <wp-cli-bin> --path="~/Local Sites/mio-sito/app/public" plugin list

"Avvia wp-env con il mio plugin"
→ npx wp-env start

"Collega il mio plugin al sito locale (symlink)"
→ ln -s /path/to/plugin ~/Studio/mio-sito/wp-content/plugins/plugin

"Esporta il database locale per il deploy"
→ studio wp db export backup.sql --path=<sito>
```

### Reference Files

- `studio-adapter.md` — CLI Studio, percorsi, SQLite, limitazioni
- `localwp-adapter.md` — sites.json, binari bundled, MySQL, log
- `wpenv-adapter.md` — Docker, .wp-env.json, comandi
- `mcp-adapter-setup.md` — Configurazione MCP Adapter (STDIO + HTTP)

---

## 10. Hook di Sicurezza

Gli hook sono guardiani automatici che intercettano operazioni pericolose prima che vengano eseguite. Funzionano senza bisogno di attivarli manualmente.

### Hook Prompt-Based (Validazione LLM)

Questi hook chiedono a Claude di valutare se l'operazione e stata esplicitamente richiesta dall'utente:

| # | Operazione | Tool intercettato | Cosa fa |
|---|-----------|-------------------|---------|
| 1 | Cancellazione contenuti | `delete_content`, `delete_media`, `delete_user`, `delete_term` | Conferma che l'utente ha esplicitamente richiesto la cancellazione |
| 2 | Disattivazione plugin | `deactivate_plugin` | Conferma prima di disattivare (potrebbe rompere dipendenze) |
| 3 | Import WordPress | `hosting_importWordpressWebsite` | Conferma prima di SOVRASCRIVERE l'installazione esistente |
| 4 | Modifica DNS | `DNS_updateDNSRecordsV1`, `DNS_resetDNSRecordsV1` | Conferma prima di modificare i record DNS |
| 5 | Eliminazione webhook WC | `wc_delete_webhook` | Conferma prima di eliminare un webhook (le integrazioni esterne smetteranno di ricevere eventi) |
| 6 | Invio campagna Mailchimp | `mc_send_campaign` | Conferma prima di inviare una campagna email (azione irreversibile verso tutti i destinatari) |
| 7 | Invio email SendGrid | `sg_send_email` | Conferma prima di inviare email transazionali (azione irreversibile) |
| 8 | Eliminazione workflow trigger | `wf_delete_trigger` | Conferma prima di eliminare un trigger di automazione (ferma tutte le notifiche e azioni associate) |
| 9 | Eliminazione tweet | `tw_delete_tweet` | Conferma prima di eliminare un tweet (azione irreversibile) |
| 10 | Pubblicazione articolo LinkedIn | `li_create_article` | Conferma prima di pubblicare un articolo long-form su LinkedIn (visibile pubblicamente) |

### Hook Command-Based (Validazione Script)

Questi hook eseguono script bash per validazioni tecniche:

| # | Script | Tool intercettato | Cosa fa |
|---|--------|-------------------|---------|
| 5 | `pre-deploy-check.sh` | `hosting_deployWordpressPlugin`, `hosting_deployWordpressTheme`, `hosting_deployStaticWebsite` | Verifica che il sito sia raggiungibile e l'autenticazione funzioni prima del deploy |
| 6 | `backup-reminder.sh` | `hosting_importWordpressWebsite` | Stampa un reminder per creare un backup prima dell'import |

### Come Funzionano Insieme

Per un'operazione di import WordPress, la catena e:

```
Utente: "Importa il backup su opencactus"
  |
Hook #6 (backup-reminder.sh) -> Stampa reminder backup
  |
Hook #3 (prompt) -> Claude valuta: "L'utente ha chiesto esplicitamente questo import?"
  |
Se approvato -> Esecuzione hosting_importWordpressWebsite
```

> Gli hook prompt e command si complementano: lo script fa validazione **tecnica** (sito raggiungibile?), il prompt fa validazione **semantica** (l'utente intendeva davvero questo?).

---

## 11. MCP Server - Architettura Tecnica

### Cos'e MCP

MCP (Model Context Protocol) e il protocollo che permette a Claude di comunicare con servizi esterni attraverso "tool" - funzioni che Claude puo invocare per leggere dati, creare contenuti, o eseguire operazioni.

### I Tre Server MCP del Plugin

#### Hostinger MCP

| Proprieta | Dettaglio |
|-----------|---------- |
| Sorgente | `hostinger-api-mcp@latest` (npm) |
| Trasporto | stdio (JSON-RPC via stdin/stdout) |
| Autenticazione | `HOSTINGER_API_TOKEN` env var |
| Tool disponibili | 119 |

**Categorie tool**: Hosting, DNS, SSL, Email, VPS, Domini, Billing.

**Quando serve**: Gestione infrastruttura, deploy via Hostinger, gestione DNS, certificati SSL.

#### WP REST Bridge

| Proprieta | Dettaglio |
|-----------|---------- |
| Sorgente | Custom TypeScript server in `servers/wp-rest-bridge/` |
| Trasporto | stdio (JSON-RPC via stdin/stdout) |
| Autenticazione | `WP_SITES_CONFIG` JSON env var |
| Tool disponibili | 148 (44 WordPress + 34 WooCommerce + 10 Multisite + 18 Distribution + 8 GSC + 14 Analytics + 3 Alerting + 4 Workflows + 5 LinkedIn + 5 Twitter + 3 Schema) |

**Categorie tool WordPress** (`wp/v2`):

| Categoria | Tool | Esempio |
|-----------|------|---------|
| Multi-site | 3 | `switch_site`, `list_sites`, `get_active_site` |
| Content | 8 | `list_content`, `get_content`, `create_content`, `find_content_by_url` |
| Taxonomies | 8 | `list_terms`, `get_term`, `create_term`, `assign_terms_to_content` |
| Plugins | 6 | `list_plugins`, `get_plugin`, `activate_plugin`, `deactivate_plugin`, `create_plugin`, `delete_plugin` |
| Users | 6 | `list_users`, `get_user`, `get_me`, `create_user`, `update_user`, `delete_user` |
| Comments | 5 | `list_comments`, `get_comment`, `create_comment`, `update_comment`, `delete_comment` |
| Media | 5 | `list_media`, `get_media`, `create_media`, `edit_media`, `delete_media` |
| Search | 1 | `wp_search` |
| WP.org | 2 | `search_plugin_repository`, `get_plugin_details` |

**Categorie tool WooCommerce** (`wc/v3`, richiede Consumer Key/Secret):

| Categoria | Tool | Esempio |
|-----------|------|---------|
| Products | 7 | `wc_list_products`, `wc_create_product`, `wc_list_product_variations` |
| Orders | 6 | `wc_list_orders`, `wc_update_order_status`, `wc_create_refund` |
| Customers | 4 | `wc_list_customers`, `wc_get_customer`, `wc_update_customer` |
| Coupons | 4 | `wc_list_coupons`, `wc_create_coupon`, `wc_delete_coupon` |
| Reports | 5 | `wc_get_sales_report`, `wc_get_top_sellers`, `wc_get_orders_totals` |
| Settings | 4 | `wc_list_payment_gateways`, `wc_list_shipping_zones`, `wc_get_system_status` |
| Webhooks | 4 | `wc_list_webhooks`, `wc_create_webhook`, `wc_update_webhook`, `wc_delete_webhook` |

**Categorie tool Multisite** (`ms_` prefix, richiede `is_multisite: true` + SSH/WP-CLI):

| Categoria | Tool | Esempio |
|-----------|------|---------|
| Sub-sites | 4 | `ms_list_sites`, `ms_create_site`, `ms_activate_site`, `ms_deactivate_site` |
| Network Plugins | 3 | `ms_network_activate`, `ms_network_deactivate`, `ms_network_plugins` |
| Admin | 2 | `ms_list_super_admins`, `ms_network_settings` |
| DNS | 2 | `ms_domain_mapping`, `ms_site_url` |

**Categorie tool Distribution** (richiede API key per ciascun servizio):

| Categoria | Tool | Esempio |
|-----------|------|---------|
| Mailchimp | 7 | `mc_list_audiences`, `mc_create_campaign`, `mc_send_campaign`, `mc_get_campaign_report`, `mc_list_templates`, `mc_add_subscriber`, `mc_list_campaigns` |
| Buffer | 5 | `buf_list_profiles`, `buf_create_post`, `buf_list_scheduled`, `buf_get_analytics`, `buf_list_channels` |
| SendGrid | 6 | `sg_send_email`, `sg_list_templates`, `sg_create_template`, `sg_list_contacts`, `sg_add_contact`, `sg_get_stats` |

**Categorie tool Google Search Console** (`gsc_` prefix, richiede Service Account JSON):

| Categoria | Tool | Esempio |
|-----------|------|---------|
| Site Management | 2 | `gsc_list_sites`, `gsc_inspect_url` |
| Search Analytics | 3 | `gsc_search_analytics`, `gsc_top_queries`, `gsc_page_performance` |
| Sitemaps | 3 | `gsc_list_sitemaps`, `gsc_submit_sitemap`, `gsc_delete_sitemap` |

**Categorie tool Analytics** (richiede GA4 Property ID, Plausible API key, o Google API key):

| Categoria | Tool | Esempio |
|-----------|------|---------|
| GA4 | 6 | `ga4_run_report`, `ga4_get_realtime`, `ga4_top_pages`, `ga4_traffic_sources`, `ga4_user_demographics`, `ga4_conversion_events` |
| Plausible | 4 | `pl_get_stats`, `pl_get_timeseries`, `pl_get_breakdown`, `pl_get_realtime` |
| Core Web Vitals | 4 | `cwv_analyze_url`, `cwv_batch_analyze`, `cwv_get_field_data`, `cwv_compare_pages` |

**Categorie tool Alerting** (richiede Slack webhook URL o Bot Token):

| Categoria | Tool | Esempio |
|-----------|------|---------|
| Slack | 3 | `slack_send_alert` (webhook), `slack_send_message` (Bot Token + Block Kit), `slack_list_channels` |

**Categorie tool Workflows** (namespace `wp-manager/v1/workflows`):

| Categoria | Tool | Esempio |
|-----------|------|---------|
| Trigger Management | 4 | `wf_list_triggers`, `wf_create_trigger`, `wf_update_trigger`, `wf_delete_trigger` |

**Categorie tool LinkedIn** (`li_` prefix, richiede LinkedIn Access Token):

| Categoria | Tool | Esempio |
|-----------|------|---------|
| Profile | 1 | `li_get_profile` |
| Publishing | 2 | `li_create_post` (feed post), `li_create_article` (long-form article) |
| Analytics | 1 | `li_get_analytics` (impressions, clicks, engagement rate) |
| Listing | 1 | `li_list_posts` (recent user posts) |

**Categorie tool Twitter/X** (`tw_` prefix, richiede Twitter Bearer Token + OAuth):

| Categoria | Tool | Esempio |
|-----------|------|---------|
| Publishing | 2 | `tw_create_tweet` (single tweet), `tw_create_thread` (connected thread) |
| Analytics | 1 | `tw_get_metrics` (impressions, likes, retweets, quotes) |
| Listing | 1 | `tw_list_tweets` (recent user tweets) |
| Management | 1 | `tw_delete_tweet` |

**Categorie tool Structured Data** (`sd_` prefix, usa WordPress REST API):

| Categoria | Tool | Esempio |
|-----------|------|---------|
| Validation | 1 | `sd_validate` (URL fetch + inline markup, controlla @context/@type) |
| Injection | 1 | `sd_inject` (build JSON-LD, store in post meta `_schema_json_ld`) |
| Audit | 1 | `sd_list_schemas` (scan sitewide, count per @type) |

**Architettura multi-sito**: Il server mantiene una `Map<siteId, AxiosInstance>` dove ogni sito ha la propria istanza HTTP autenticata. Il cambio sito e istantaneo.

#### WordPress.com MCP

| Proprieta | Dettaglio |
|-----------|---------- |
| Sorgente | Integrazione built-in Claude Code |
| Autenticazione | OAuth WordPress.com (gestita da Claude Code) |
| Tool disponibili | ~15 |

**Quando serve**: Per siti ospitati su WordPress.com (non self-hosted).

---

## 12. Gestione Multi-Sito

### Configurazione

Aggiungi piu siti a `WP_SITES_CONFIG`:

```bash
export WP_SITES_CONFIG='[
  {
    "id": "opencactus",
    "url": "https://opencactus.com",
    "username": "admin@opencactus.com",
    "password": "xxxx xxxx xxxx xxxx"
  },
  {
    "id": "bioinagro",
    "url": "https://bioinagro.com",
    "username": "admin@bioinagro.com",
    "password": "yyyy yyyy yyyy yyyy"
  }
]'
export WP_DEFAULT_SITE="opencactus"
```

### Cambio Sito

```
"Passa al sito bioinagro"
"Switch to opencactus"
"Elenca i siti configurati"
```

Claude usa internamente `switch_site`, `list_sites` e `get_active_site` per gestire il cambio.

### Routing Automatico

Il wp-site-manager agent determina automaticamente quale set di tool usare:

| Tipo sito | Tool REST API | Tool Infrastruttura |
|-----------|--------------|---------------------|
| Self-hosted su Hostinger | WP REST Bridge | Hostinger MCP |
| Self-hosted altro | WP REST Bridge | (SSH via Bash) |
| WordPress.com hosted | WordPress.com MCP | WordPress.com MCP |

---

## 13. Scenari d'Uso Comuni

### Scenario 1: Check-up Mattutino del Sito

```
Tu: "Come sta opencactus oggi?"

Claude:
- Controlla raggiungibilita (HTTP 200)
- Verifica SSL (45 giorni rimanenti)
- Conta contenuti (15 post, 8 pagine)
- Elenca plugin attivi (12 attivi)
- Verifica Hostinger (API raggiungibile)
-> Report: tutto OK, nessun problema rilevato
```

### Scenario 2: Pubblicare un Articolo Ottimizzato SEO

```
Tu: "Scrivi e pubblica un articolo sulla bioeconomia del fico d'India in Sicilia"

Claude (attiva wp-content-strategist + skill wp-content):
1. Propone struttura (H1, H2, H3)
2. Scrive il contenuto con template blog standard
3. Ottimizza title tag e meta description
4. Suggerisce categorie e tag
5. Pubblica come bozza (draft)
6. Ti chiede conferma per pubblicare
```

### Scenario 3: Audit Completo Pre-Lancio

```
Tu: "/wordpress-manager:wp-audit full"

Claude (attiva security-auditor + performance-optimizer):
1. Fase sicurezza: scansiona plugin, utenti, SSL, DNS
2. Fase performance: analizza plugin pesanti, caching, media
3. Fase SEO: controlla sitemap, robots.txt, meta tag, struttura URL
-> Report unificato con severity, action plan, quick wins
```

### Scenario 4: Backup e Deploy Sicuro

```
Tu: "Devo aggiornare il tema. Fai un backup prima e poi deploya"

Claude (attiva deployment-engineer + skill wp-backup e wp-deploy):
1. Crea backup database via SSH (mysqldump)
2. Crea backup wp-content (tar)
3. Verifica integrita backup
4. Pre-flight check (sito raggiungibile, auth OK)
5. Deploy tema via Hostinger MCP
6. Verifica post-deploy
7. Conferma successo e mostra istruzioni rollback
```

### Scenario 5: Migrazione da Altro Hosting a Hostinger

```
Tu: "Migra il mio sito da SiteGround a Hostinger"

Claude (attiva skill wp-migrate):
1. Guida export database dal source (mysqldump via SSH)
2. Guida export file WordPress (tar via SSH)
3. Usa hosting_importWordpressWebsite su Hostinger
4. Esegue URL search-replace (wp-cli)
5. Verifica permessi file (755/644)
6. Guida aggiornamento DNS (A record -> nuovo IP)
7. Verifica SSL
```

### Scenario 6: Sviluppare un Blocco Gutenberg Custom

```
Tu: "Crea un blocco gallery per mostrare i prodotti con filtri per categoria"

Claude (attiva wordpress-router → wp-block-development):
1. Rileva il progetto (wp-project-triage → wp-block-plugin)
2. Crea la struttura: block.json, edit.js, save.js, style.scss
3. Configura attributi (columns, category, imageSize)
4. Implementa InspectorControls per le opzioni laterali
5. Implementa il render frontend con PHP
6. Testa in WordPress Playground (sandbox disposable)
7. Deploy quando pronto
```

### Scenario 7: Test E2E e CI Pipeline

```
Tu: "Esegui i test E2E del mio plugin e configura la CI"

Claude (attiva wp-test-engineer + skill wp-e2e-testing):
1. Rileva framework con test_inspect.mjs (Playwright trovato)
2. Setup wp-env se necessario (npx wp-env start)
3. Esegue Playwright test suite (npx playwright test)
4. Analizza failure: screenshot, trace file, output
5. Genera report coverage
6. Verifica/crea GitHub Actions workflow per CI
-> Report: risultati test, failure analysis, coverage gap
```

### Scenario 8: Audit Sicurezza e Hardening

```
Tu: "Controlla la sicurezza del sito e correggi i problemi trovati"

Claude (attiva wp-security-auditor → wp-security-hardener):
1. Fase audit (wp-security-auditor):
   - Pre-scan con security_inspect.mjs
   - 5 fasi: plugin, utenti, contenuti, DNS/SSL, server config
   - Genera report con severity classification
2. Handoff a hardener (wp-security-hardener):
   - Riceve findings dall'auditor
   - Implementa fix: permessi file, headers HTTP, auth hardening
   - Documenta ogni modifica
-> Report: findings + remediation completata
```

### Scenario 9: Audit Accessibilita WCAG

```
Tu: "Verifica l'accessibilita del mio tema WordPress"

Claude (attiva wp-accessibility-auditor + skill wp-accessibility):
1. Scan automatico: axe-core, pa11y, Lighthouse a11y score
2. Code review: ARIA patterns, heading hierarchy, form labels
3. Keyboard navigation: focus order, skip links, tab traps
4. Theme compliance: check requisiti accessibility-ready
5. Block editor: verifica output semantico blocchi
-> Report: matrice conformita WCAG 2.2, violazioni, remediation steps
```

### Scenario 10: Analisi Statica e Profiling

```
Tu: "Analizza il codice del mio plugin con PHPStan e controlla le performance"

Claude (attiva wp-phpstan + wp-performance + wp-performance-optimizer):
1. Rileva configurazione PHPStan (phpstan.neon o crea baseline)
2. Esegue analisi statica a livello 6
3. Segnala errori tipizzazione, chiamate deprecate, pattern non sicuri
4. Profila con wp profile stage → identifica hook lenti
5. Verifica autoloaded options e object cache
6. Report con fix prioritizzati
```

### Scenario 11: Internazionalizzazione Plugin

```
Tu: "Internazionalizza il mio plugin per supporto multilingue"

Claude (attiva skill wp-i18n):
1. Rileva text domain con i18n_inspect.mjs
2. Wrappa stringhe PHP con __(), _e(), esc_html__()
3. Wrappa stringhe JS con @wordpress/i18n
4. Genera .pot con wp i18n make-pot
5. Guida workflow .po/.mo per le traduzioni
6. Verifica supporto RTL se necessario
```

### Scenario 12: Gestione Store WooCommerce

```
Tu: "Mostrami gli ordini di questa settimana e crea un coupon sconto 20%"

Claude (attiva wp-ecommerce-manager + skill wp-woocommerce):
1. Lista ordini con wc_list_orders (filtro ultimi 7 giorni)
2. Mostra riepilogo: totale ordini, revenue, status breakdown
3. Crea coupon con wc_create_coupon (20% sconto, tipo percentuale)
4. Conferma codice coupon e condizioni d'uso
-> Report: ordini settimanali + coupon creato
```

### Scenario 13: Setup CI/CD per Plugin WordPress

```
Tu: "Configura GitHub Actions per il mio plugin con PHPStan e Playwright"

Claude (attiva wp-cicd-engineer + skill wp-cicd):
1. Detection con cicd_inspect.mjs (rileva PHPStan, Playwright, wp-env)
2. Genera workflow YAML con 4 stage: lint, phpstan, phpunit, playwright
3. Configura wp-env per E2E testing in Docker
4. Imposta quality gates (coverage > 80%, PHPStan level 6)
5. Aggiunge deploy stage condizionale (push to main)
-> File: .github/workflows/ci.yml creato e spiegato
```

### Scenario 14: Monitoring Continuo del Sito

```
Tu: "Configura il monitoring completo per opencactus.com"

Claude (attiva wp-monitoring-agent + skill wp-monitoring):
1. Detection con monitoring_inspect.mjs (rileva setup esistente)
2. Baseline: cattura CWV attuali, TTFB, plugin count, DB size
3. Uptime check: configura cron per HTTP probe ogni 5 minuti
4. Security: schedule settimanale per plugin audit e file integrity
5. Alerting: configura threshold P0-P3 con notifiche email/Slack
6. Report template: configura Daily Health Summary + Weekly Performance
-> Report: baseline stabilito, monitoring schedule configurato
```

### Scenario 15: Architettura Headless con Next.js

```
Tu: "Voglio usare WordPress come CMS headless con Next.js"

Claude (attiva skill wp-headless):
1. Analizza con headless_inspect.mjs (WPGraphQL? CORS config?)
2. Guida scelta: REST API vs WPGraphQL
3. Configura JWT authentication
4. Setup CORS per il dominio frontend
5. Integra Next.js con ISR (Incremental Static Regeneration)
6. Configura webhook per invalidazione cache
```

### Scenario 16: Fleet Monitoring Cross-Site

```
Tu: "Controlla la salute di tutti i miei siti WordPress"

Claude (attiva wp-monitoring-agent + skill wp-monitoring, Procedura 7):
1. list_sites per enumerare tutti i siti configurati
2. Per ogni sito: switch_site, poi uptime + performance + security + content check
3. Aggrega i risultati in tabella comparativa fleet
4. Identifica pattern cross-site (stessa vulnerabilita su piu siti, regressione simultanea)
5. Genera Fleet Health Report con breakdown per sito + summary fleet
-> Report: fleet health, anomalie, raccomandazioni prioritizzate
```

### Scenario 17: Content Repurposing Multi-Canale

```
Tu: "Trasforma l'ultimo post del blog in contenuti per social media e newsletter"

Claude (attiva wp-content-strategist + skill wp-content-repurposing):
1. Seleziona post piu recente via list_content
2. Estrae elementi chiave: headline, punti principali, quote, statistiche, CTA
3. Genera Twitter/X thread (280 char per tweet, hook + 3-5 punti + CTA)
4. Genera LinkedIn summary (angolo professionale, 1000 char)
5. Genera Instagram carousel (5-7 slide con takeaway visivi)
6. Genera newsletter digest (excerpt + CTA, subject line ottimizzata)
7. Presenta tutte le varianti per revisione
-> Output: 4+ formati pronti per distribuzione
```

### Scenario 18: Webhook WooCommerce per Zapier

```
Tu: "Configura un webhook WooCommerce per notificare Zapier quando arriva un nuovo ordine"

Claude (attiva skill wp-webhooks):
1. Verifica WooCommerce attivo con webhook_inspect.mjs
2. Crea webhook con wc_create_webhook:
   - topic: "order.created"
   - delivery_url: URL webhook Zapier dell'utente
   - secret: genera shared secret per HMAC-SHA256
3. Verifica webhook attivo con wc_list_webhooks
4. Spiega come verificare la signature nel receiver
-> Report: webhook configurato, URL delivery, istruzioni test
```

### Scenario 19: WordPress Multisite Network

```
Tu: "Crea un network multisite con 3 sub-site per i nostri brand"

Claude (attiva skill wp-multisite):
1. Detection con multisite_inspect.mjs (multisite gia abilitato?)
2. Se necessario, guida conversione single → multisite (wp-config.php + .htaccess)
3. Crea 3 sub-site con ms_create_site
4. Network-activate plugin comuni
5. Configura domain mapping per ogni sub-site
-> Report: network configurato con 3 sub-site attivi
```

### Scenario 20: SEO Programmatico — City Pages

```
Tu: "Genera 200 city pages per il nostro servizio idraulico con schema LocalBusiness"

Claude (attiva wp-content-strategist + skill wp-programmatic-seo):
1. Detection con programmatic_seo_inspect.mjs (headless frontend? SEO plugin? CPT?)
2. Progetta URL pattern: /idraulico/{citta} (es. /idraulico/roma, /idraulico/milano)
3. Crea CPT "location" in WordPress con campi: citta, regione, telefono, indirizzo
4. Definisce template pagina: H1 dinamico, meta description, contenuto localizzato
5. Genera 200 pagine in bulk via create_content MCP tool
6. Configura ISR su frontend headless (Next.js revalidate: 86400)
7. Genera sitemap XML e submette a Search Console
-> Report: 200 city pages create, sitemap generato, ISR configurato
```

### Scenario 21: Attribuzione Content-Commerce

```
Tu: "Quali post del blog generano piu vendite nel mio store WooCommerce?"

Claude (attiva wp-ecommerce-manager + skill wp-content-attribution):
1. Detection con attribution_inspect.mjs (WooCommerce? UTM tracking? Analytics?)
2. Se UTM tracking assente: guida installazione mu-plugin per cattura UTM → order meta
3. Pull dati vendite: wc_get_sales_report per ultimo trimestre
4. Pull dati contenuti: list_content per stesso periodo
5. Correla ordini con source UTM → identifica top converting content
6. Applica attribution model (last-touch default)
7. Calcola ROI per post: revenue attribuita / costo produzione contenuto
-> Report: top 10 post per revenue, CAC per tipo contenuto, raccomandazioni
```

### Scenario 22: Rete Multilingua su Multisite

```
Tu: "Configura versioni italiano e spagnolo del nostro sito WordPress"

Claude (attiva wp-site-manager + skill wp-multilang-network):
1. Detection con multilang_inspect.mjs (multisite? plugin multilingua?)
2. Se non multisite: guida conversione single → multisite
3. Crea sub-site "it" con ms_create_site (italiano, sito principale)
4. Crea sub-site "es" con ms_create_site (spagnolo)
5. Installa e configura plugin multilingua (Polylang/MultilingualPress)
6. Configura hreflang automatico via mu-plugin (slug-based matching)
7. Setup language switcher e routing per lingua
8. Verifica con checklist SEO internazionale (GSC properties, sitemaps per lingua)
-> Report: network multilingua configurato, hreflang attivo, SEO verificato
```

### Scenario 23: Distribuzione Multi-Canale con Mailchimp e Buffer

```
Tu: "Distribuisci l'ultimo post del blog via newsletter Mailchimp e programma sui social con Buffer"

Claude (attiva wp-distribution-manager + skill wp-social-email):
1. Detection con distribution_inspect.mjs (Mailchimp e Buffer configurati?)
2. Seleziona ultimo post via list_content
3. Estrae headline, excerpt, URL, immagine featured
4. Crea campagna Mailchimp: mc_create_campaign con template, audience, subject line
5. Conferma invio (hook mc_send_campaign) → mc_send_campaign
6. Programma social post: buf_create_post per ogni profilo Buffer (LinkedIn, Twitter)
7. Verifica scheduling: buf_list_scheduled
-> Report: campagna email inviata, 3 social post programmati, link preview
```

### Scenario 24: Keyword Tracking con Google Search Console

```
Tu: "Quali keyword posizionano meglio il mio sito e quali pagine devo ottimizzare?"

Claude (attiva wp-content-strategist + skill wp-search-console):
1. Detection con search_console_inspect.mjs (GSC configurato? siti verificati?)
2. Pull top queries: gsc_top_queries per ultimi 28 giorni
3. Pull page performance: gsc_page_performance per tutte le pagine
4. Identifica keyword ad alto impressions ma basso CTR (opportunita)
5. Identifica pagine in posizione 5-20 (quick wins per salire in top 3)
6. Verifica indicizzazione pagine chiave: gsc_inspect_url
7. Cross-reference con contenuti WordPress (list_content)
-> Report: top 20 keyword, pagine sotto-performanti, azioni SEO prioritizzate
```

### Scenario 25: AI Content Optimization e Bulk Triage

```
Tu: "Analizza tutti i post del blog e dimmi quali titoli migliorare e quali contenuti sono obsoleti"

Claude (attiva wp-content-strategist + skill wp-content-optimization):
1. Detection con content_optimization_inspect.mjs (volume contenuti, meta status)
2. Pull tutti i post via list_content
3. Bulk triage: classifica ogni post in Quick Wins / Maintain / Deep Review / Outdated
4. Per Quick Wins: headline scoring (power words, lunghezza, emotional trigger)
5. Readability analysis: Flesch-Kincaid score per ogni post
6. SEO scoring: keyword in title, meta description, heading structure
7. Content freshness: identifica post > 12 mesi senza aggiornamento
8. Genera piano di ottimizzazione prioritizzato con stime di impatto
-> Report: matrice triage, top 10 titoli da migliorare, 5 contenuti obsoleti, azioni immediate
```

### Scenario 26: Analytics Unificata con GA4 e Plausible

```
Tu: "Mostrami il report GA4, le top pages e le Core Web Vitals del mio sito"

Claude (attiva wp-monitoring-agent + skill wp-analytics):
1. Detection con analytics_inspect.mjs (GA4 configurato? Plausible? Google API key?)
2. GA4 report: ga4_run_report per sessioni, pageviews, bounce rate ultimi 28 giorni
3. Top pages: ga4_top_pages con traffic sources breakdown
4. Traffic sources: ga4_traffic_sources per organic vs direct vs referral vs social
5. Core Web Vitals: cwv_analyze_url per homepage + landing pages principali
6. CWV field data: cwv_get_field_data per dati reali degli utenti
7. Confronto pagine: cwv_compare_pages per identificare pagine lente
-> Report: dashboard analytics unificata, CWV score per pagina, raccomandazioni
```

### Scenario 27: Smart Alerting con Slack

```
Tu: "Configura alert Slack per quando il sito ha problemi critici"

Claude (attiva wp-monitoring-agent + skill wp-alerting):
1. Detection con alerting_inspect.mjs (Slack webhook? Bot token? SendGrid?)
2. Configura severity routing:
   - P3 (info): slack_send_alert via webhook (canale #wp-info)
   - P2 (warning): slack_send_message via Bot Token con thread per dettagli
   - P1/P0 (critical): Slack message + email via SendGrid ai responsabili
3. Imposta threshold per metriche chiave (response time > 3s, SSL < 14 giorni, errori 5xx)
4. Test alert: invia messaggio di test su canale Slack
-> Report: severity routing configurato, threshold impostati, test completato
```

### Scenario 28: Workflow Automatizzato per Content Lifecycle

```
Tu: "Crea un workflow che notifica su Slack quando un post viene pubblicato e invia un'email di recap settimanale"

Claude (attiva wp-site-manager + skill wp-content-workflows):
1. Detection con workflow_inspect.mjs (action channels, automation plugins, WP-Cron)
2. Crea trigger "hook": wf_create_trigger con hook "transition_post_status" (publish)
   - Azione: Slack notification con titolo, autore, link del post
3. Crea trigger "schedule": wf_create_trigger con cron "0 9 * * 1" (lunedi ore 9)
   - Azione: email recap settimanale con post pubblicati nell'ultima settimana
4. Verifica trigger attivi: wf_list_triggers
5. Test trigger manuale per verificare funzionamento
-> Report: 2 trigger configurati, Slack + email, prossima esecuzione cron
```

### Scenario 29: Pubblicare su LinkedIn dal Blog

```
Tu: "Pubblica l'ultimo post del blog su LinkedIn come post nel feed"

Claude (attiva wp-distribution-manager + skill wp-linkedin):
1. Detection con linkedin_inspect.mjs (access token configurato?)
2. Seleziona ultimo post via list_content
3. Estrae headline, key points, URL del post
4. Genera post LinkedIn (max 1300 char): hook + 3 insight + CTA + link
5. Pubblica con li_create_post
6. Recupera analytics con li_get_analytics (impressions, click, engagement)
-> Report: post pubblicato, link al post LinkedIn, metriche iniziali
```

### Scenario 30: Thread Twitter/X dal Blog

```
Tu: "Crea un thread Twitter dal mio ultimo articolo sul fico d'India"

Claude (attiva wp-distribution-manager + skill wp-twitter):
1. Detection con twitter_inspect.mjs (OAuth tokens configurati?)
2. Seleziona post via list_content (filtro keyword)
3. Estrae headline, H2 sections, key facts
4. Genera thread: hook tweet (280 char) + 3-5 tweet di contenuto (uno per H2) + CTA finale
5. Pubblica con tw_create_thread (connected tweets)
6. Recupera metriche con tw_get_metrics (impressions, like, retweet)
-> Report: thread pubblicato (N tweet), link al primo tweet, metriche
```

### Scenario 31: Generare Contenuto AI da Zero

```
Tu: "Scrivi un articolo sui benefici dell'acqua di cactus per l'idratazione"

Claude (attiva wp-content-strategist + skill wp-content-generation):
1. Brief: topic = acqua di cactus, audience = consumatori health-conscious, goal = informare, 1200-1500 parole
2. Keyword research: se GSC disponibile, gsc_query_analytics per keyword correlate; altrimenti suggerisce keyword semantiche
3. Outline: pattern "Standard Article" — intro + 4 H2 (benefici, scienza, vs alternative, come usare) + conclusione
4. Draft: scrive contenuto calibrato sulla voce del sito (analizza ultimi 5 post per tono)
5. SEO optimize: keyword in title/first paragraph/H2s, meta description, 2-3 internal links
6. Structured data: auto-detect Article schema, inject con sd_inject
7. Pubblica come bozza via create_content, presenta per revisione
-> Output: articolo completo con SEO + schema, pronto per approvazione
```

### Scenario 32: Audit e Injection Dati Strutturati

```
Tu: "Controlla quali pagine hanno dati strutturati e aggiungi FAQ schema ai post con domande"

Claude (attiva wp-content-strategist + skill wp-structured-data):
1. Audit esistente: sd_list_schemas per vedere tipi presenti (Article su 12 post, nessun FAQ)
2. Validazione: sd_validate su homepage e top 5 pagine per verificare markup corretto
3. Scan FAQ: list_content + analisi corpo per identificare pattern Q&A (H3 con "?")
4. Per ogni post con FAQ: genera FAQPage schema con mainEntity array
5. Injection: sd_inject per iniettare JSON-LD nei post identificati
6. Verifica: sd_validate su pagine modificate per confermare validita
-> Report: N post con FAQ schema aggiunto, validazione completata, prossimi step
```

---

## 14. Amministrazione Avanzata

### 14.1 Personalizzare gli Hook

Puoi modificare `hooks/hooks.json` per aggiungere o rimuovere hook. Struttura di un hook:

```json
{
  "matcher": "nome_tool|altro_tool",
  "hooks": [
    {
      "type": "prompt",
      "prompt": "Messaggio di validazione per Claude"
    },
    {
      "type": "command",
      "command": "bash ${CLAUDE_PLUGIN_ROOT}/hooks/scripts/mio-script.sh",
      "timeout": 15
    }
  ]
}
```

**Tipi di hook**:
- `prompt`: Claude valuta semanticamente se l'operazione e legittima
- `command`: Uno script bash esegue validazione tecnica (exit 0 = allow, exit 2 = block)

### 14.2 Aggiungere un Nuovo Sito Manualmente

Se preferisci non usare `/wordpress-manager:wp-setup`:

1. Genera Application Password sul nuovo sito WordPress
2. Modifica `~/.claude/mcp-secrets.env`:
   ```bash
   export WP_SITES_CONFIG='[
     {"id":"sito1","url":"https://sito1.com","username":"admin","password":"xxxx"},
     {"id":"nuovo-sito","url":"https://nuovo-sito.com","username":"admin","password":"yyyy"}
   ]'
   ```
3. Riavvia la sessione Claude Code (per ricaricare le variabili d'ambiente)
4. Verifica: `"Elenca i siti configurati"`

### 14.3 Script di Health Check Automatizzato

Puoi schedulare il health check con cron per monitoraggio proattivo:

```bash
# Aggiungi a crontab -e
# Health check ogni 6 ore, log su file
0 */6 * * * source ~/.claude/mcp-secrets.env && bash ~/.claude/plugins/local/wordpress-manager/scripts/health-check.sh >> /var/log/wp-health.log 2>&1
```

### 14.4 Aggiornare il Plugin

```bash
cd ~/.claude/plugins/local/wordpress-manager
git pull origin main

# Ricompila il server MCP se ci sono modifiche al TypeScript
cd servers/wp-rest-bridge
npm install
npx tsc
```

### 14.5 Disabilitare Temporaneamente il Plugin

In `~/.claude/settings.json`:

```json
{
  "enabledPlugins": {
    "wordpress-manager@local": false
  }
}
```

I server MCP non si avvieranno e i comandi non saranno disponibili fino alla riattivazione.

### 14.6 Sicurezza delle Credenziali

**Dove sono le credenziali**:
- `~/.claude/mcp-secrets.env` - File locale, NON nel repository
- Le variabili d'ambiente vengono iniettate da Claude Code al runtime

**Best practice**:
- Non committare mai `mcp-secrets.env` in git
- Ruota le Application Password periodicamente
- Usa una Application Password dedicata per Claude (non la password dell'account)
- Se un token viene compromesso, revocalo immediatamente dal pannello WordPress/Hostinger

### 14.7 Struttura dei Permessi File WordPress

Per riferimento, i permessi standard su Hostinger:

```
Directory:      755 (rwxr-xr-x)
File:           644 (rw-r--r--)
wp-config.php:  440 (r--r-----)
```

---

## 15. Troubleshooting

### Problemi di Connessione

**Problema**: "REST API non raggiungibile"

| Causa possibile | Soluzione |
|-----------------|----------|
| REST API disabilitata | Verifica in WordPress: Settings > Permalinks (re-salva) |
| Plugin di sicurezza blocca API | Controlla Wordfence/Sucuri/iThemes - whitelist `/wp-json/` |
| .htaccess corrotto | Verifica regole `.htaccess` per rewrite rules |
| Permalink non configurati | Imposta su "Post name" in Settings > Permalinks |

**Problema**: "Autenticazione fallita (HTTP 401)"

| Causa possibile | Soluzione |
|-----------------|----------|
| Application Password errata | Rigenera da Users > Profile > Application Passwords |
| Username errato | Usa l'email admin, non il display name |
| Plugin blocca auth | Controlla plugin di sicurezza (2FA, IP whitelist) |
| REST API Basic Auth non supportato | Installa plugin "Application Passwords" (incluso da WP 5.6) |

---

### Problemi Hostinger

**Problema**: "HTTP 530 - Site Frozen"

**Causa**: L'abbonamento Hostinger e scaduto o l'account e sospeso.

**Soluzione**:
1. Accedi a [hostinger.com](https://www.hostinger.com)
2. Controlla stato abbonamento in Billing
3. Rinnova o riattiva il piano
4. Rigenera API token se necessario

**Problema**: "HTTP 401 - Unauthorized" su Hostinger API

**Causa**: Token API scaduto o invalido.

**Soluzione**:
1. Vai a [hostinger.com/my-api](https://www.hostinger.com/my-api)
2. Genera un nuovo token
3. Aggiorna `HOSTINGER_API_TOKEN` in `mcp-secrets.env`
4. Riavvia la sessione Claude Code

---

### Problemi del Server MCP

**Problema**: "WP REST Bridge non si avvia"

```bash
# Verifica build
ls ~/.claude/plugins/local/wordpress-manager/servers/wp-rest-bridge/build/server.js

# Se manca, ricompila
cd ~/.claude/plugins/local/wordpress-manager/servers/wp-rest-bridge
npm install && npx tsc

# Verifica env vars
echo $WP_SITES_CONFIG | python3 -m json.tool
```

**Problema**: "Tool non disponibili nella sessione Claude Code"

| Causa | Soluzione |
|-------|----------|
| Plugin non abilitato | Verifica `"wordpress-manager@local": true` in settings.json |
| Server MCP non compilato | Esegui `npx tsc` in `servers/wp-rest-bridge/` |
| Variabili d'ambiente mancanti | Esegui `source ~/.claude/mcp-secrets.env` prima di avviare Claude |
| Sessione stale | Riavvia Claude Code per ricaricare i plugin |

---

### Problemi Post-Deploy

**Problema**: "Schermo bianco dopo deploy" (White Screen of Death)

1. Controlla `wp-content/debug.log` (se `WP_DEBUG` e attivo)
2. Causa comune: conflitto plugin -> rinomina la cartella del plugin appena deployato
3. Se tema: attiva un tema default (Twenty Twenty-Four) da database o WP-CLI

**Problema**: "URL sbagliati dopo migrazione"

1. Esegui search-replace con WP-CLI: `wp search-replace 'vecchio.com' 'nuovo.com' --all-tables`
2. Svuota tutte le cache (page cache, object cache, CDN)
3. Verifica `.htaccess` per regole corrette

---

### Diagnostica Rapida

Esegui il health check per una panoramica immediata:

```bash
source ~/.claude/mcp-secrets.env
bash ~/.claude/plugins/local/wordpress-manager/scripts/health-check.sh
```

Per validazione pre-operazione:

```bash
source ~/.claude/mcp-secrets.env
bash ~/.claude/plugins/local/wordpress-manager/scripts/validate-wp-operation.sh deploy
```

---

## 16. Glossario

| Termine | Definizione |
|---------|------------|
| **Application Password** | Password dedicata per accesso API, generata da WordPress (non e la password dell'account) |
| **Claude Code** | CLI ufficiale di Anthropic per interazione con Claude da terminale |
| **CWV (Core Web Vitals)** | Metriche Google per UX: LCP, INP, CLS |
| **Hook** | Guardiano che intercetta operazioni pericolose per chiedere conferma |
| **Hostinger MCP** | Server MCP che espone le API Hostinger come tool per Claude |
| **MCP** | Model Context Protocol - protocollo di comunicazione tra Claude e servizi esterni |
| **Plugin (Claude Code)** | Estensione che aggiunge agents, skills, commands e tool a Claude Code |
| **Plugin (WordPress)** | Estensione che aggiunge funzionalita a WordPress |
| **PreToolUse** | Evento hook che si attiva prima dell'esecuzione di un tool |
| **REST API** | Interfaccia HTTP di WordPress per gestione programmatica (wp-json/wp/v2/) |
| **Skill** | Libreria di conoscenza specializzata che Claude attiva automaticamente |
| **stdio** | Standard Input/Output - trasporto usato dai server MCP per comunicare con Claude |
| **WP REST Bridge** | Server MCP custom che traduce tool call Claude in chiamate WordPress REST API |
| **WP_SITES_CONFIG** | Variabile d'ambiente JSON con credenziali dei siti WordPress configurati |
| **Block Theme** | Tema WordPress basato su template HTML e theme.json (Full Site Editing) |
| **block.json** | Manifest di un blocco Gutenberg: nome, attributi, script, stili |
| **Blueprint** | File JSON che descrive la configurazione di un'istanza WordPress Playground |
| **Gutenberg** | Editor a blocchi di WordPress, progetto open-source per Full Site Editing |
| **Interactivity API** | API WordPress per interattivita lato client con direttive `data-wp-*` |
| **PHPStan** | Tool di analisi statica per PHP; la skill wp-phpstan lo configura per WordPress |
| **theme.json** | File di configurazione centrale per temi a blocchi (colori, font, layout, spacing) |
| **WordPress Playground** | Ambiente WordPress disposable che gira in WebAssembly con SQLite |
| **WPDS** | WordPress Design System — componenti UI, token di design e pattern per l'ecosistema WP |
| **WP-CLI** | Command-line interface per WordPress: gestione plugin, utenti, database da terminale |
| **axe-core** | Engine open-source per test automatici accessibilita web (usato da wp-accessibility-auditor) |
| **CORS** | Cross-Origin Resource Sharing — configurazione necessaria per architetture headless |
| **Handoff** | Passaggio strutturato di findings da un agent (auditor) a un altro (hardener) |
| **Incident Response** | Procedura in 5 fasi per gestire compromissioni di sicurezza WordPress |
| **ISR** | Incremental Static Regeneration — rigenerazione pagine statiche con dati freschi da WordPress |
| **pa11y** | Tool CLI per test automatici accessibilita web (alternativa ad axe-core) |
| **RTL** | Right-to-Left — supporto per lingue scritte da destra a sinistra (arabo, ebraico) |
| **WCAG** | Web Content Accessibility Guidelines — standard W3C per accessibilita web (target: 2.2 AA) |
| **WPGraphQL** | Plugin WordPress che espone un'API GraphQL come alternativa alla REST API |
| **WooCommerce** | Plugin e-commerce per WordPress; il WP REST Bridge espone 34 tool via namespace `wc/v3` |
| **Consumer Key/Secret** | Credenziali API WooCommerce per accesso REST (`wc/v3`), generate da WooCommerce > Settings > REST API |
| **Multisite** | Funzionalita WordPress per gestire una rete di siti da una singola installazione (Network Admin) |
| **Super Admin** | Ruolo utente WordPress con accesso a tutte le operazioni del network multisite |
| **Domain Mapping** | Associazione di un dominio custom a un sub-site del network multisite |
| **CI/CD** | Continuous Integration / Continuous Deployment — pipeline automatizzate per build, test e deploy |
| **GitHub Actions** | Piattaforma CI/CD integrata in GitHub, configurata via file YAML in `.github/workflows/` |
| **Quality Gate** | Soglia di qualita in una pipeline CI (es. PHPStan level 6, coverage > 80%) che blocca il deploy se non superata |
| **Monitoring** | Osservabilita continua del sito: uptime, performance trend, security scan, content integrity |
| **Baseline** | Snapshot iniziale delle metriche (CWV, TTFB, plugin count) usato come riferimento per trend analysis |
| **P0-P3** | Livelli di severity per alerting: P0 critico (sito down), P1 alto, P2 medio, P3 informativo |
| **TTFB** | Time To First Byte — tempo tra la richiesta HTTP e il primo byte di risposta dal server |
| **Fleet Monitoring** | Monitoraggio simultaneo di tutti i siti WordPress configurati con report comparativo cross-site |
| **Content Repurposing** | Trasformazione sistematica di contenuti WordPress in formati multi-canale (social, email, newsletter) |
| **Content Atomization** | Scomposizione di contenuti pillar in unita atomiche autonome (quote, statistiche, tip) per distribuzione |
| **Webhook** | Notifica HTTP outbound inviata automaticamente da WordPress quando si verifica un evento (es. ordine creato) |
| **HMAC-SHA256** | Algoritmo di firma usato per autenticare webhook — il receiver verifica l'integrita del payload |
| **mu-plugin** | Must-Use Plugin WordPress — plugin caricato automaticamente senza attivazione, usato per webhook core |
| **Programmatic SEO** | Generazione sistematica di pagine search-optimized da dati strutturati (city pages, product variants, directory) |
| **ISR (Incremental Static Regeneration)** | Rigenerazione incrementale di pagine statiche — aggiorna singole pagine senza rebuild completo |
| **SSG (Static Site Generation)** | Generazione statica di tutte le pagine al build time — massima performance, dati non real-time |
| **CPT (Custom Post Type)** | Tipo di contenuto personalizzato in WordPress, usato come data source per pagine programmatiche |
| **Content Attribution** | Misurazione di quale contenuto WordPress genera conversioni e-commerce (vendite WooCommerce) |
| **UTM Parameters** | Tag URL (utm_source, utm_medium, utm_campaign) per tracciare la provenienza del traffico |
| **First-Touch Attribution** | Modello che attribuisce il 100% del credito al primo contenuto con cui l'utente ha interagito |
| **Last-Touch Attribution** | Modello che attribuisce il 100% del credito all'ultimo contenuto prima dell'acquisto |
| **CAC (Customer Acquisition Cost)** | Costo di acquisizione cliente — quanto costa in contenuto acquisire un nuovo cliente |
| **LTV (Lifetime Value)** | Valore nel tempo di un cliente — revenue totale generata nel ciclo di vita |
| **Multi-Language Network** | Architettura WordPress Multisite dove ogni sub-site serve una lingua diversa |
| **hreflang** | Tag HTML che indica la lingua e la regione di una pagina, usato per SEO internazionale |
| **x-default** | Valore hreflang speciale che indica la pagina fallback per utenti senza match di lingua |
| **Content Sync** | Sincronizzazione di contenuti tra sub-site di lingua diversa in un network multilingua |
| **MultilingualPress** | Plugin WordPress nativo per multisite multilingua — connessioni tra contenuti cross-site |
| **WCOP** | WordPress Content Operations Pipeline — framework a 5 layer per la gestione completa dei contenuti WordPress (Content Factory, Quality Assurance, Distribution, Observability, Automation). Score attuale: 8.8/10 |
| **CTR (Click-Through Rate)** | Rapporto percentuale tra impressioni e click — metrica chiave in Google Search Console e email marketing |
| **Flesch-Kincaid** | Formula di leggibilita che stima il livello scolastico necessario per comprendere un testo — usata nell'AI content optimization |
| **Content Triage** | Classificazione rapida di tutti i contenuti in categorie di azione: Quick Wins, Maintain, Deep Review, Outdated |
| **Quick Wins** | Contenuti che richiedono piccole ottimizzazioni (titolo, meta description) per ottenere significativi miglioramenti di performance |
| **Service Account** | Account Google di servizio (JSON key) per accesso server-to-server a Google Search Console senza autenticazione interattiva |
| **Mailchimp** | Piattaforma di email marketing per newsletter e campagne — integrata via API con 7 tool MCP (prefix `mc_*`) |
| **Buffer** | Piattaforma di social media scheduling — integrata via API con 5 tool MCP (prefix `buf_*`) |
| **SendGrid** | Servizio di email transazionale e marketing — integrato via API con 6 tool MCP (prefix `sg_*`) |
| **GSC (Google Search Console)** | Strumento Google per monitorare presence del sito nei risultati di ricerca — integrato con 8 tool MCP (prefix `gsc_*`) |
| **GA4 (Google Analytics 4)** | Piattaforma di analytics web di Google — integrata via API con 6 tool MCP (prefix `ga4_*`) per report, realtime, traffic sources e conversioni |
| **Plausible Analytics** | Alternativa privacy-first a Google Analytics — integrata via API con 4 tool MCP (prefix `pl_*`) per stats, timeseries e breakdown |
| **CWV (Core Web Vitals)** | Metriche Google (LCP, INP, CLS) per UX — 4 tool MCP (prefix `cwv_*`) per analisi URL, batch, field data e confronto pagine |
| **Slack Webhook** | URL di callback per inviare messaggi a un canale Slack — usato per alert di severity info (P3) |
| **Slack Bot Token** | Token di autenticazione per Slack Bot API — permette messaggi formattati con Block Kit, thread e interazioni avanzate |
| **Severity Routing** | Pattern di alerting dove il livello di gravita (P0-P3) determina il canale di notifica (webhook, bot, email) |
| **Workflow Trigger** | Regola di automazione che esegue azioni (Slack, email, webhook) in risposta a eventi (schedule, hook WordPress, lifecycle contenuto) |
| **WP-Cron** | Sistema di scheduling di WordPress — usato per trigger workflow basati su cron expression (es. "ogni lunedi alle 9") |
| **Content Lifecycle Hook** | Hook WordPress legato al ciclo di vita dei contenuti (publish, update, trash) — usato come trigger per workflow automatizzati |
| **WCOP Score** | WordPress Content Operations Pipeline — score 0-10 su 5 layer: Content Factory, Quality Assurance, Distribution, Observability, Automation |

---

*Guida v2.12.2 — WordPress Manager Plugin per Claude Code*
*Ultimo aggiornamento: 2026-03-01*
*WCOP Score: 8.8/10 (Tier 4+5 complete)*
