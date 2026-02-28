# WordPress Manager - Guida Completa per Utenti e Amministratori

**Versione:** 1.7.1
**Ultimo aggiornamento:** 2026-02-28
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
            (119 tool)       (40 tool)         (~15 tool)
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
wordpress-manager/                          # v1.7.1
+-- .claude-plugin/plugin.json              # Manifest
+-- .mcp.json                               # Server MCP bundled
+-- LICENSE                                 # MIT + GPL-2.0-or-later
+-- CHANGELOG.md                            # Cronologia versioni
+-- agents/                                 # 8 agenti specializzati
|   +-- wp-site-manager.md                      # Orchestratore centrale
|   +-- wp-deployment-engineer.md               # Specialista deploy
|   +-- wp-content-strategist.md                # Contenuti e SEO
|   +-- wp-security-auditor.md                  # Audit sicurezza (read-only)
|   +-- wp-security-hardener.md                 # Hardening e incident response
|   +-- wp-performance-optimizer.md             # Performance e CWV
|   +-- wp-test-engineer.md                     # Testing (E2E, unit, integration)
|   +-- wp-accessibility-auditor.md             # WCAG 2.2 AA audit (read-only)
+-- commands/                               # 5 slash commands
|   +-- wp-status.md / wp-deploy.md / wp-audit.md / wp-backup.md / wp-setup.md
+-- skills/                                 # 24 skill totali
|   +-- [OPERATIVE - 5 skill]
|   +-- wp-deploy/                              # Procedure deploy
|   +-- wp-audit/                               # Checklist audit
|   +-- wp-content/                             # Template contenuti
|   +-- wp-migrate/                             # Procedure migrazione
|   +-- wp-backup/                              # Strategie backup
|   +-- [AMBIENTE LOCALE - 1 skill]
|   +-- wp-local-env/                           # Studio/LocalWP/wp-env
|   +-- [SVILUPPO - 13 skill da WordPress/agent-skills]
|   +-- wordpress-router/                       # Router unificato v4 (dev + local + ops)
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
+-- hooks/                                  # 6 hook di sicurezza
|   +-- hooks.json                              # 4 prompt + 2 command
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

Il plugin include **8 agenti** organizzati per area di competenza. Alcuni agenti lavorano in coppia (audit → fix).

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
| Ruolo | Creazione contenuti, SEO, gestione editoriale, contenuti multilingue |
| Attivazione | Creazione post, ottimizzazione SEO, gestione tassonomie |

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

**Skill correlata**: `wp-content`, `wp-i18n`

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

### Pattern di Collaborazione tra Agent

| Pattern | Flusso | Descrizione |
|---------|--------|-------------|
| **Audit → Fix** | `wp-security-auditor` → `wp-security-hardener` | L'auditor trova problemi, l'hardener implementa le correzioni |
| **Delegazione** | `wp-site-manager` → tutti gli altri | Il site manager delega a agent specializzati in base al task |

Il `wp-site-manager` puo delegare a tutti gli 8 agent specializzati:

| Task | Agent delegato |
|------|---------------|
| Deploy, migrazione | `wp-deployment-engineer` |
| Contenuti, SEO | `wp-content-strategist` |
| Audit sicurezza | `wp-security-auditor` |
| Hardening, incident response | `wp-security-hardener` |
| Performance, CWV | `wp-performance-optimizer` |
| Testing | `wp-test-engineer` |
| Accessibilita | `wp-accessibility-auditor` |

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

### Il Router Unificato

La skill `wordpress-router` (v4) e il punto d'ingresso per tutti i task WordPress. Classifica automaticamente il task in **tre categorie**: sviluppo, ambiente locale, operativo.

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

### Script di Rilevamento Automatico

Le skill includono 12 script Node.js (`.mjs`) che eseguono analisi automatica del progetto:

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
3. wordpress-router v4 → instrada a wp-block-development
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
| Tool disponibili | 40 |

**Categorie tool**:

| Categoria | Tool | Esempio |
|-----------|------|---------|
| Multi-site | 3 | `switch_site`, `list_sites`, `get_active_site` |
| Content | 8 | `list_content`, `create_content`, `find_content_by_url` |
| Taxonomies | 8 | `list_terms`, `create_term`, `assign_terms_to_content` |
| Plugins | 5 | `list_plugins`, `activate_plugin`, `deactivate_plugin` |
| Users | 5 | `list_users`, `create_user`, `update_user` |
| Comments | 5 | `list_comments`, `create_comment`, `delete_comment` |
| Media | 4 | `list_media`, `create_media`, `delete_media` |
| WP.org | 2 | `search_plugin_repository`, `get_plugin_details` |

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

### Scenario 12: Architettura Headless con Next.js

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

---

*Guida v1.7.1 - WordPress Manager Plugin per Claude Code*
*Ultimo aggiornamento: 2026-02-28*
