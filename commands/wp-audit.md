---
name: wp-audit
description: Run a comprehensive security, performance, and SEO audit on a WordPress site. Supports targeted or full audits.
---

# WordPress Site Audit

Run security, performance, and/or SEO audits on your WordPress sites.

## Usage

- `/wordpress-manager:wp-audit` — Full audit on active site
- `/wordpress-manager:wp-audit security` — Security audit only
- `/wordpress-manager:wp-audit performance` — Performance audit only
- `/wordpress-manager:wp-audit seo` — SEO audit only
- `/wordpress-manager:wp-audit full on <site>` — Full audit on specific site

## Process

1. **Parse scope**: Determine audit type (security / performance / seo / full) and target site
2. **Establish connectivity**: Verify site is reachable via `discover_content_types`
3. **Switch site** if needed: `switch_site` to the target
4. **Run audit phases** based on scope:
   - **Security**: Plugin vulnerabilities, user accounts, content integrity, DNS/SSL, hosting config
   - **Performance**: Plugin impact, caching, media optimization, Core Web Vitals, server config
   - **SEO**: Technical SEO, on-page sampling, structured data, content architecture
5. **Generate report**: Unified findings with severity levels and prioritized actions
6. **Present to user**: Summary table + detailed findings + action plan

## Output

The audit produces a structured report with:
- Overall health status (Critical / Warning / Good)
- Findings by severity (Critical → High → Medium → Low → Info)
- Prioritized action plan
- Quick wins section (< 1 hour effort)
- Detailed recommendations with specific steps
