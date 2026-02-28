---
name: wp-audit
description: This skill should be used when the user asks to "audit my site", "security
  check", "site health check", "performance check", "SEO audit", "check my WordPress",
  "is my site secure", "why is my site slow", or mentions any form of WordPress site
  assessment. Orchestrates security, performance, and SEO audits.
version: 1.0.0
---

# WordPress Site Audit Skill

## Overview

Orchestrates comprehensive WordPress site audits across three dimensions: security, performance, and SEO. Can run targeted single-dimension audits or full assessments.

## When to Use

- User asks to audit, check, or assess their WordPress site
- User reports security concerns or suspicious activity
- User complains about slow site performance
- User wants to improve search engine rankings
- Before major deployments or migrations (pre-flight audit)

## Audit Scope Decision Tree

1. **What type of audit?**
   - "security" / "is my site hacked?" / "vulnerabilities" → **Security audit only**
   - "slow" / "performance" / "speed" / "PageSpeed" → **Performance audit only**
   - "SEO" / "search ranking" / "Google" / "sitemap" → **SEO audit only**
   - "full" / "audit" / "health check" / unspecified → **Full audit (all three)**

2. **Which site?**
   - Check `get_active_site` for current site
   - If user specifies a site, use `switch_site` first
   - If multiple sites requested, audit sequentially

## Full Audit Workflow

### Step 1: Establish Context
1. Verify site connectivity via `discover_content_types`
2. Confirm which site is being audited
3. Note hosting type (Hostinger / other) for relevant checks

### Step 2: Security Audit
Delegate to **wp-security-auditor** agent or follow `references/security-checklist.md`:
- Plugin vulnerability scan
- User account audit
- Content integrity check
- DNS/SSL verification
- Hosting configuration

### Step 3: Performance Audit
Delegate to **wp-performance-optimizer** agent or follow `references/performance-checklist.md`:
- Plugin impact analysis
- Caching assessment
- Media optimization check
- External performance test (PageSpeed)
- Server configuration

### Step 4: SEO Audit
Follow `references/seo-checklist.md`:
- Technical SEO (sitemap, robots.txt, canonical URLs)
- On-page SEO sampling (meta descriptions, headings, slugs)
- Content quality indicators
- Structured data verification
- Core Web Vitals (from performance phase)

### Step 5: Generate Report
Combine findings into a unified report with:
- Overall health score (Critical/Warning/Good)
- Prioritized action items across all dimensions
- Quick wins vs long-term improvements
- Estimated effort for each recommendation

## Report Template

```
# WordPress Site Audit — [site-name]
**Date:** [date] | **Scope:** [full/security/performance/seo]

## Overall Health: [CRITICAL/WARNING/GOOD]

| Dimension    | Score     | Critical | High | Medium | Low |
|-------------|-----------|----------|------|--------|-----|
| Security    | [status]  | X        | X    | X      | X   |
| Performance | [status]  | X        | X    | X      | X   |
| SEO         | [status]  | X        | X    | X      | X   |

## Priority Actions
1. [Most critical finding + fix]
2. [Second priority + fix]
3. [Third priority + fix]

## Detailed Findings
### Security
[findings...]

### Performance
[findings...]

### SEO
[findings...]

## Quick Wins (< 1 hour effort)
- [action 1]
- [action 2]
```

## Additional Resources

### Reference Files
- **`references/security-checklist.md`** - WordPress security audit checklist
- **`references/performance-checklist.md`** - Performance analysis checklist
- **`references/seo-checklist.md`** - SEO audit checklist

## Related skills

- `wp-security` — Deep security hardening, filesystem permissions, HTTP headers, incident response procedures
