# Assessment: Integrazione WordPress Studio + LocalWP

**Data**: 2026-02-27
**Versione plugin**: 1.4.0
**Stato**: Approccio A approvato — design doc in `2026-02-27-local-env-design.md`

---

## 1. Contesto

Il plugin wordpress-manager v1.4.0 copre sviluppo (13 skill) e operazioni (5 skill + 5 agent + 2 MCP server) su siti WordPress remoti e sandbox effimeri (Playground). Manca un layer per **ambienti locali persistenti** — il gap critico tra "scrivo codice" e "lo testo/deploy".

WordPress Studio (by Automattic) e LocalWP (by WP Engine) sono i due strumenti principali per sviluppo WordPress locale. Questo assessment analizza le superfici di integrazione, i workflow tipici, e propone tre approcci architetturali.

---

## 2. Gap Analysis — Plugin attuale

### Cosa il plugin GIA copre

| Area | Copertura |
|------|-----------|
| Sviluppo codice WP | 13 skill (blocchi, temi, plugin, REST, PHPStan, Interactivity API...) |
| Operazioni siti remoti | 5 skill + 5 agent + 2 MCP server (Hostinger + WP REST Bridge) |
| Sandbox effimeri | `wp-playground` (WASM, @wp-playground/cli) |
| Routing intelligente | `wordpress-router` + decision tree v2 |

### Gap identificati

| Gap | Dettaglio |
|-----|-----------|
| **Ambiente locale persistente** | Nessuna skill gestisce siti locali permanenti (non effimeri come Playground) |
| **Discovery siti locali** | Non esiste detection di Studio (`~/Studio/`, CLI `studio`) o LocalWP (`~/Local Sites/`, `sites.json`) |
| **WP-CLI locale** | La skill `wp-wpcli-and-ops` assume WP-CLI disponibile ma non sa come invocarlo via `studio wp` o i binari bundled di LocalWP |
| **Ciclo dev completo** | Manca: scaffold progetto -> sviluppo locale -> test -> deploy (il deploy c'e, ma parte dal codice, non dall'ambiente locale) |
| **MCP Adapter** | WordPress 6.9 ha il plugin MCP Adapter (STDIO + HTTP) — non integrato |
| **Studio MCP Server** | Automattic pubblica un MCP server per Studio — non integrato |
| **Database locale** | Nessun supporto per SQLite (Studio) o MySQL socket (LocalWP) |

---

## 3. WordPress Studio — Superficie di integrazione

### Architettura interna

- **Runtime**: Electron + WASM (PHP compilato in WebAssembly)
- **Database**: SQLite (file: `wp-content/database/.ht.sqlite`)
- **Web server**: Nessuno (WASM serve direttamente)
- **Porte**: Da 8881 in su (sequenziali)
- **Storage siti**: `~/Studio/<nome-sito>/`
- **Config app**: `~/.config/WordPressStudio/` (Linux)

### Punti di integrazione

| Punto | Metodo | Automazione possibile |
|-------|--------|----------------------|
| **Studio CLI** | `studio site create/start/stop/list/delete` | Ciclo di vita siti completo |
| **WP-CLI via Studio** | `studio wp <comando> --path=<sito>` | Tutto WP-CLI, senza installare WP-CLI |
| **REST API** | `http://localhost:888x/wp-json/` | CRUD contenuti, plugin, temi |
| **SQLite diretto** | `sqlite3 wp-content/database/.ht.sqlite` | Query raw, bulk ops |
| **Filesystem** | `~/Studio/<sito>/wp-content/` | Sviluppo tema/plugin, symlink |
| **Studio MCP Server** | `wordpress-agent-skills/studio-mcp/` (Node.js) | AI agent site management |
| **MCP Adapter plugin** | `studio wp mcp-adapter serve` (STDIO) | WordPress 6.9+ come MCP server |
| **Preview API** | `studio preview create/update/delete` | Deploy temporaneo su WordPress.com |

### Punti di forza

- CLI v2 eccellente, completamente scriptabile
- MCP ecosystem maturo (Studio MCP + MCP Adapter + WordPress.com MCP)
- Setup in secondi, risorse minime
- Integrazione nativa con WordPress.com per preview/deploy
- Symlink workflow per multi-site testing

### Limitazioni

- No multisite
- No Xdebug nativo
- SQLite incompatibile con alcuni plugin complessi (WooCommerce)
- No estensioni PHP native (solo quelle compilate in WASM)
- Linux: richiede build da source

---

## 4. LocalWP — Superficie di integrazione

### Architettura interna

- **Runtime**: Electron + Lightning Stack (processi nativi OS)
- **Web server**: NGINX o Apache (selezionabile per sito)
- **PHP**: PHP-FPM nativo (versioni multiple bundled: 7.4 - 8.3)
- **Database**: MySQL/MariaDB nativo (credenziali default: root/root, db: local)
- **Porte**: Da 10000+ (incrementali: HTTP, HTTPS, MySQL)
- **Storage siti**: `~/Local Sites/<nome-sito>/app/public/`
- **Config siti**: `~/.config/Local/sites.json` (Linux)
- **Binari**: `~/.config/Local/lightning-services/{php,mysql,nginx,wp-cli}-*/`

### Punti di integrazione

| Punto | Metodo | Automazione possibile |
|-------|--------|----------------------|
| **Site Discovery** | Parse `~/.config/Local/sites.json` | Scoperta automatica siti, porte, versioni |
| **WP-CLI** | Binario bundled `wp-cli-*/bin/wp --path=` | Tutto WP-CLI (richiede MySQL attivo) |
| **REST API** | `http://<nome>.local/wp-json/` o `http://127.0.0.1:<porta>/wp-json/` | CRUD completo |
| **MySQL diretto** | Socket `~/.config/Local/run/<id>/mysql/mysqld.sock` o TCP | Query, export, import |
| **Filesystem** | `~/Local Sites/<nome>/app/public/wp-content/` | Sviluppo tema/plugin, symlink |
| **Logs** | `~/Local Sites/<nome>/logs/{nginx,php,mysql}/` | Debug, monitoring |
| **Blueprints** | `~/.config/Local/blueprints/` | Template siti riutilizzabili |
| **MCP Adapter** | `wp mcp-adapter serve --path=<root>` (STDIO) | WordPress 6.9+ come MCP server |
| **Live Links** | GUI only (ngrok-like) | Non automabile direttamente |

### Punti di forza

- Production parity completa (MySQL, PHP nativo, NGINX/Apache)
- Multisite supportato
- Xdebug + VS Code (add-on)
- MailHog per email testing
- Ecosystem add-on esteso
- Pacchetti Linux ufficiali (.deb/.rpm)

### Limitazioni

- **No CLI ufficiale** — solo GUI + "Open Site Shell"
- Automazione richiede parsing `sites.json` + PATH setup per binari interni
- Setup piu lento (minuti vs secondi)
- Risorse pesanti (processi nativi multipli per sito)
- No MCP server dedicato (solo MCP Adapter generico)
- Live Links solo da GUI

---

## 5. Confronto decisionale

| Criterio | WordPress Studio | LocalWP | Vincitore per plugin |
|----------|-----------------|---------|---------------------|
| **CLI automation** | Eccellente (`studio` CLI v2) | Assente (solo binari interni) | Studio |
| **MCP ecosystem** | Studio MCP Server + MCP Adapter | Solo MCP Adapter (generico) | Studio |
| **Production parity** | Bassa (SQLite, WASM PHP) | Alta (MySQL, PHP nativo, NGINX) | LocalWP |
| **WooCommerce dev** | Fragile (SQLite compat issues) | Completo | LocalWP |
| **Multisite** | Non supportato | Supportato | LocalWP |
| **Xdebug** | Non disponibile | Supportato (add-on) | LocalWP |
| **Setup speed** | Secondi | Minuti | Studio |
| **Risorse sistema** | Leggero (~100MB) | Pesante (multi-processo) | Studio |
| **Email testing** | Non disponibile | MailHog integrato | LocalWP |
| **Linux support** | Build da source | Pacchetti .deb/.rpm | LocalWP |
| **Preview/share** | `studio preview` (WordPress.com) | Live Links (GUI) | Studio |
| **Symbiosi con plugin** | Forte (stesso ecosystem Automattic) | Moderata (parsing richiesto) | Studio |

**Sintesi**: Studio vince per automazione e leggerezza. LocalWP vince per fedelta all'ambiente di produzione.

---

## 6. Workflow tipici mappati

### Comandi concreti per tool

| Workflow | WordPress Studio | LocalWP |
|----------|-----------------|---------|
| **Crea sito** | `studio site create --path ~/Studio/test` | GUI -> New Site (no CLI) |
| **Scaffold tema** | `studio wp scaffold theme mytheme` | `wp scaffold theme mytheme --path=~/Local\ Sites/test/app/public` |
| **Scaffold blocco** | `studio wp scaffold block myblock --plugin=myplugin` | (stesso via wp-cli bundled) |
| **Installa plugin** | `studio wp plugin install woocommerce --activate` | (stesso via wp-cli bundled) |
| **Test PHP version** | `studio site set --php-version=8.2` | GUI -> Site Settings -> PHP Version |
| **Export DB** | `studio wp db export backup.sql` | (stesso via wp-cli bundled) |
| **Import contenuti** | `studio wp import content.xml --authors=create` | (stesso via wp-cli bundled) |
| **Preview sharing** | `studio preview create` | Live Links (GUI only) |
| **Debug PHP** | `studio wp eval 'error_log("test");'` | Xdebug + VS Code (add-on) |
| **Deploy a produzione** | Locale -> `wp-deploy` skill (esistente) | Locale -> `wp-deploy` skill (esistente) |

### Workflow completo: Sviluppo Block Theme

```
1. Crea sito locale          studio site create / LocalWP GUI
2. Scaffold tema              wp scaffold theme / npx create-block-theme
3. Sviluppa in editor         VS Code + symlink wp-content/themes/
4. Testa nel browser          localhost:8881 / mysite.local
5. Test PHP versions          studio site set --php / LocalWP settings
6. PHPStan analisi            wp-phpstan skill (esistente)
7. Preview condivisa          studio preview / Live Links
8. Deploy                     wp-deploy skill (esistente)
```

### Workflow completo: Sviluppo Plugin con Gutenberg Block

```
1. Crea sito locale          studio site create / LocalWP GUI
2. Scaffold plugin            wp scaffold plugin myplugin
3. Scaffold blocco            npx @wordpress/create-block@latest
4. Dev con hot reload         npm start (wp-scripts)
5. Unit test                  npm test / phpunit
6. PHPStan                    wp-phpstan skill (esistente)
7. Build produzione           npm run build
8. Deploy                     wp-deploy skill (esistente)
```

---

## 7. Tre approcci architetturali

### Approccio A: "Local Environment Abstraction Layer"

Un layer di astrazione unificato che rileva automaticamente Studio, LocalWP, o wp-env e espone un'interfaccia comune.

```
                   ┌──────────────────────────┐
                   │    wordpress-router       │
                   │  (decision tree v3)       │
                   └─────────┬────────────────┘
                             │
                   ┌─────────▼────────────────┐
                   │  wp-local-env (NUOVA)     │
                   │  Detection + Abstraction  │
                   └─────────┬────────────────┘
                    ┌────────┼────────┐
               ┌────▼──┐ ┌──▼───┐ ┌──▼────┐
               │Studio │ │Local │ │wp-env │
               │adapter│ │adapter│ │adapter│
               └───────┘ └──────┘ └───────┘
```

**Nuovi componenti**:
- 1 skill: `wp-local-env` (detection, lifecycle, unified API)
- 1 script detection: `detect_local_env.mjs` (trova Studio/LocalWP/wp-env)
- 3 adapter sections in SKILL.md (Studio CLI, LocalWP sites.json, wp-env)
- Aggiornamento router decision tree -> v3
- Opzionale: integrazione Studio MCP Server in `.mcp.json`

**Pro**: Massima flessibilita, futuro-proof, un solo workflow per l'utente.
**Contro**: Complessita di implementazione alta, 3 adapter da documentare.

**Effort stimato**: ~v1.5.0 (major feature)

### Approccio B: "Studio-First con fallback LocalWP"

Focus su Studio (CLI eccellente, MCP server Automattic), con detection passiva di LocalWP.

```
                   ┌─────────────────────┐
                   │  wp-local-dev (NUOVA)│
                   │  Studio-first        │
                   └─────────┬───────────┘
                    ┌────────┼────────┐
               ┌────▼──────┐    ┌────▼──────┐
               │Studio CLI │    │LocalWP    │
               │(primario) │    │(discovery)│
               └───────────┘    └───────────┘
```

**Nuovi componenti**:
- 1 skill: `wp-local-dev` (focalizzata su Studio, con sezione LocalWP)
- 1 script: `detect_local_env.mjs`
- Integrazione `.mcp.json` con Studio MCP Server (disabled by default)
- Aggiornamento router v3

**Pro**: Piu semplice, Studio ha la migliore superficie CLI per automazione.
**Contro**: Utenti LocalWP hanno esperienza di seconda classe.

**Effort stimato**: ~v1.5.0 (medium feature)

### Approccio C: "Workflow Skills" (per tipo di attivita)

Skill separate per workflow tipico, ognuna con istruzioni specifiche per ogni tool.

```
  ┌───────────────┐  ┌──────────────┐  ┌───────────────┐
  │wp-local-theme │  │wp-local-plugin│ │wp-local-test  │
  │  development  │  │  development  │ │  & debug      │
  └───────┬───────┘  └──────┬───────┘ └───────┬───────┘
          │                  │                  │
    Istruzioni per:    Istruzioni per:   Istruzioni per:
    - Studio           - Studio          - Studio
    - LocalWP          - LocalWP         - LocalWP
    - wp-env           - wp-env          - wp-env
```

**Nuovi componenti**:
- 3+ skill workflow-based
- 1 script detection condiviso
- Nessun adapter layer

**Pro**: Ogni skill e self-contained, facile da capire.
**Contro**: Duplicazione istruzioni, manutenzione difficile.

**Effort stimato**: ~v1.5.0 (medium feature, ma manutenzione alta)

---

## 8. Integrazione MCP proposta

### Opzione 1: Studio MCP Server (Automattic)

```json
{
  "studio-mcp": {
    "command": "node",
    "args": ["<path-to>/wordpress-agent-skills/studio-mcp/dist/index.js"],
    "disabled": true
  }
}
```

### Opzione 2: MCP Adapter Plugin (WordPress 6.9+, per qualsiasi sito locale)

```json
{
  "wp-local-mcp": {
    "command": "studio",
    "args": ["wp", "mcp-adapter", "serve", "--server=mcp-adapter-default-server", "--user=admin", "--path=<site>"],
    "disabled": true
  }
}
```

### Opzione 3: wp-rest-bridge esistente puntato a localhost

Il `wp-rest-bridge` MCP server gia presente nel plugin puo gia connettersi a siti locali configurando `WP_SITES_CONFIG` con URL `http://localhost:8881` e Application Password locale.

---

## 9. Raccomandazione

**Approccio A** e il piu robusto e futuro-proof.
**Approccio B** e il miglior compromesso effort/valore — Studio ha la CLI migliore e l'ecosistema MCP piu maturo.
**Approccio C** e il piu semplice da iniziare ma scala male.

La decisione dipende da:
- Se l'utente usa prevalentemente Studio -> Approccio B
- Se deve supportare team con tool diversi -> Approccio A
- Se vuole partire veloce e iterare -> Approccio C

---

*Assessment generato il 2026-02-27 per wordpress-manager v1.4.0*
