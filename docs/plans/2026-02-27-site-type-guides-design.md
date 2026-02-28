# Design: Guide WordPress per Tipologia di Sito

**Data:** 2026-02-27
**Stato:** Approvato

## Obiettivo

Creare una serie di guide `.md` per ogni tipologia di sito WordPress (blog, landing page, ecommerce, portfolio). Ogni guida serve due audience: utente Claude Code (operativo) e sviluppatore WordPress (tecnico).

## Posizione

`docs/guides/` nel plugin wordpress-manager:

```
docs/guides/
├── INDEX.md                  # Indice e matrice tipologie
├── wp-blog.md                # Prima guida
├── wp-landing-page.md        # Futuro
├── wp-ecommerce.md           # Futuro
├── wp-portfolio.md           # Futuro
└── ...
```

## Struttura Standard (ogni guida)

1. **Panoramica** — cos'e, quando usarlo, varianti
2. **Per l'Utente** — concept, setup, contenuti, gestione, SEO, manutenzione
3. **Per lo Sviluppatore** — architettura, theme.json, templates, patterns, plugin, workflow
4. **Checklist di Lancio** — items raggruppati per area
5. **Riferimenti** — skill plugin, risorse WP.org

## Decisioni

- Approccio A (file separati) scelto per modularita
- Ogni guida e autocontenuta (~400-500 righe)
- Le skill del plugin possono linkare alla guida rilevante
- Lingua: italiano

## Roadmap

1. wp-blog.md (ora)
2. wp-landing-page.md
3. wp-ecommerce.md
4. wp-portfolio.md
