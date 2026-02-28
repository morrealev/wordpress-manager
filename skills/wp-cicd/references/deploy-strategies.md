# Deployment Strategies for WordPress

Strategies for deploying WordPress plugins, themes, and full sites via CI/CD pipelines. Each strategy balances risk, downtime, and complexity.

## Direct Push

Simplest strategy — deploy directly to the server.

```bash
# Via SSH
ssh deploy@server "cd /var/www/html/wp-content/plugins/my-plugin && git pull origin main"

# Via rsync
rsync -avz --delete --exclude='.git' --exclude='node_modules' ./ deploy@server:/path/to/plugin/
```

**Pros:** Simple, fast, no extra infrastructure.
**Cons:** No rollback, brief downtime during deploy, risk of partial deploy.
**Use when:** Development/staging, low-traffic sites.

## Blue-Green Deployment

Maintain two identical environments. Deploy to inactive, then swap.

```
1. Deploy to GREEN (inactive)
2. Run smoke tests on GREEN
3. Swap router: GREEN → active, BLUE → inactive
4. If issues: swap back instantly
```

WordPress implementation:
```bash
# Deploy to staging directory
rsync -avz ./ deploy@server:/var/www/green/wp-content/plugins/my-plugin/

# Run smoke tests
curl -f https://green.example.com/wp-json/ || exit 1

# Swap symlink
ssh deploy@server "ln -sfn /var/www/green /var/www/html"

# Flush caches
ssh deploy@server "cd /var/www/html && wp cache flush && wp rewrite flush"
```

**Pros:** Zero downtime, instant rollback.
**Cons:** Requires double infrastructure, database must be shared.
**Use when:** Production with uptime requirements.

## Rolling Deployment

Deploy one server at a time behind a load balancer.

```
1. Remove server-1 from load balancer
2. Deploy to server-1
3. Healthcheck server-1
4. Add server-1 back to load balancer
5. Repeat for server-2, server-3...
```

**Pros:** Zero downtime, gradual rollout.
**Cons:** Requires load balancer, mixed versions briefly.
**Use when:** Multi-server setups.

## Canary Deployment

Deploy to a small percentage of traffic first.

```
1. Deploy to canary server (5% traffic)
2. Monitor error rates and performance
3. If healthy: roll out to remaining 95%
4. If issues: route all traffic away from canary
```

**Pros:** Lowest risk, real-world validation.
**Cons:** Requires traffic routing infrastructure.
**Use when:** High-traffic production, risky changes.

## Manual Approval Gate

CI runs all tests, then waits for human approval before deploying.

GitHub Actions:
```yaml
deploy:
  needs: [test]
  environment: production  # Requires manual approval in GitHub settings
  steps:
    - run: ./deploy.sh
```

GitLab CI:
```yaml
deploy:
  when: manual
  environment:
    name: production
```

**Pros:** Human review before production.
**Cons:** Adds latency to deploy cycle.
**Use when:** Always recommended for production.

## WordPress-Specific Considerations

### Maintenance Mode

For deploys that change database schema or run migrations:

```bash
# Enable maintenance mode
ssh deploy@server "cd /var/www/html && wp maintenance-mode activate"

# Deploy
rsync -avz ./ deploy@server:/var/www/html/wp-content/plugins/my-plugin/

# Run migrations (if any)
ssh deploy@server "cd /var/www/html && wp plugin activate my-plugin"

# Disable maintenance mode
ssh deploy@server "cd /var/www/html && wp maintenance-mode deactivate"
```

### Post-Deploy Cache Flush

Always flush caches after deployment:

```bash
wp cache flush                    # Object cache
wp rewrite flush                  # Permalink rewrite rules
wp transient delete --all         # Transients
```

If using a caching plugin (WP Super Cache, W3 Total Cache):
```bash
wp w3-total-cache flush all       # W3TC
wp super-cache flush              # WP Super Cache
```

### Database Migrations

For plugins with custom tables:
```bash
# Before deploy: backup
wp db export pre-deploy-backup.sql

# After deploy: run activation hooks that create/update tables
wp plugin deactivate my-plugin && wp plugin activate my-plugin
```

## Choosing a Strategy

| Factor | Direct Push | Blue-Green | Rolling | Canary |
|--------|------------|------------|---------|--------|
| Downtime | Brief | Zero | Zero | Zero |
| Rollback speed | Slow | Instant | Medium | Fast |
| Infrastructure cost | Low | 2x | Same | Same + routing |
| Complexity | Low | Medium | High | High |
| Risk | High | Low | Medium | Low |

**Recommendation:** Start with Direct Push + Manual Approval for staging. Move to Blue-Green for production when uptime matters.
