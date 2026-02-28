# Guide WordPress per Tipologia di Sito

Ogni guida copre concept, setup, sviluppo e manutenzione per uno specifico tipo di sito WordPress. Pensate per due audience: utenti Claude Code (operativo) e sviluppatori WordPress (tecnico).

## Guide Disponibili

### Per Tipologia di Sito

| Tipologia | File | Stato | Descrizione |
|-----------|------|-------|-------------|
| **Blog** | [wp-blog.md](wp-blog.md) | Completa | Blog personale, aziendale, magazine |
| **Landing Page** | [wp-landing-page.md](wp-landing-page.md) | Completa | Pagina singola di conversione |
| **E-commerce** | [wp-ecommerce.md](wp-ecommerce.md) | Completa | Negozio online con WooCommerce |
| **Portfolio** | [wp-portfolio.md](wp-portfolio.md) | Completa | Vetrina lavori e progetti |

### Trasversali

| Guida | File | Stato | Descrizione |
|-------|------|-------|-------------|
| **Design System** | [wp-design-system.md](wp-design-system.md) | Completa | Da token a pixel: i 6 strati del design WordPress |

## Matrice Funzionalita per Tipologia

| Funzionalita | Blog | Landing | E-commerce | Portfolio |
|--------------|:----:|:-------:|:----------:|:---------:|
| Query loop (post) | ● | - | ○ | ○ |
| Pagine statiche | ○ | ● | ○ | ● |
| Navigazione multi-pagina | ● | - | ● | ● |
| Form contatti | ○ | ● | ○ | ● |
| Catalogo prodotti | - | - | ● | - |
| Galleria/grid | ○ | ○ | ● | ● |
| SEO contenuti | ● | ○ | ● | ○ |
| Commenti | ● | - | ○ | - |
| Newsletter | ○ | ● | ● | ○ |

● = essenziale | ○ = opzionale | - = non applicabile

## Struttura Comune

Ogni guida segue questa struttura:

1. **Panoramica** — cos'e, varianti, metriche
2. **Per l'Utente** — concept, setup locale, contenuti, gestione, SEO, manutenzione
3. **Per lo Sviluppatore** — architettura theme, theme.json, templates, patterns, plugin, workflow
4. **Checklist di Lancio** — verifica pre-go-live
5. **Riferimenti** — skill plugin e risorse esterne
