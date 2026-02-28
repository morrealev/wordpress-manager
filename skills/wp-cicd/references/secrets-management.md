# Secrets Management in CI/CD

Secure handling of credentials, API tokens, and SSH keys across CI platforms for WordPress deployments.

## Principles

1. **Never commit secrets** to version control — not even encrypted
2. **Inject at runtime** via CI platform's secret storage
3. **Least privilege** — each secret has minimum required permissions
4. **Rotate regularly** — especially after team changes
5. **Mask in logs** — prevent accidental exposure in CI output

## Platform-Specific Secret Storage

### GitHub Actions

```yaml
# Repository Settings > Secrets and variables > Actions

# Using secrets in workflow
steps:
  - name: Deploy
    env:
      SSH_KEY: ${{ secrets.SSH_PRIVATE_KEY }}
      WP_PASSWORD: ${{ secrets.WP_APPLICATION_PASSWORD }}
    run: ./deploy.sh
```

| Secret Type | Where to Set | Protected |
|-------------|-------------|-----------|
| Repo secrets | Settings > Secrets > Repository secrets | All branches |
| Environment secrets | Settings > Environments > {env} > Secrets | By environment |
| Dependabot secrets | Settings > Secrets > Dependabot secrets | Dependabot PRs only |

### GitLab CI

```yaml
# Settings > CI/CD > Variables

variables:
  SSH_USER: $SSH_USER  # CI variable, not hardcoded

# Using in script
script:
  - ssh $SSH_USER@$SSH_HOST "wp plugin activate my-plugin"
```

Variable options:
- **Protected**: only available on protected branches/tags
- **Masked**: hidden in job logs
- **File type**: written to a temp file (good for SSH keys)

### Bitbucket Pipelines

```yaml
# Repository Settings > Pipelines > Repository variables

script:
  - ssh $SSH_USER@$SSH_HOST "wp cache flush"
```

Variable options:
- **Secured**: encrypted, not visible after creation

## WordPress-Specific Secrets

### Application Password

For WP REST API access from CI:

```bash
# Generate via wp-cli
wp user application-password create admin "CI Pipeline" --porcelain

# Use in CI
curl -u admin:XXXX-XXXX-XXXX-XXXX https://example.com/wp-json/wp/v2/posts
```

Store as `WP_APPLICATION_PASSWORD` in CI secrets.

### WP_SITES_CONFIG

For wp-rest-bridge multi-site configuration:

```bash
# Set as CI secret (JSON string)
WP_SITES_CONFIG='[{"id":"prod","url":"https://example.com","username":"admin","password":"xxxx"}]'
```

Store as `WP_SITES_CONFIG` in CI secrets.

### Hostinger API Token

For Hostinger MCP deployment:

```bash
HOSTINGER_API_TOKEN=your-token-here
```

Store as `HOSTINGER_API_TOKEN` in CI secrets.

### WooCommerce API Keys

For WooCommerce REST API:

```bash
WC_CONSUMER_KEY=ck_xxxx
WC_CONSUMER_SECRET=cs_xxxx
```

Store each as separate CI secrets.

## SSH Key Deployment

### Generate a Deploy Key

```bash
# Generate key pair (no passphrase for CI)
ssh-keygen -t ed25519 -C "ci-deploy@github" -f deploy_key -N ""

# Add public key to server
ssh-copy-id -i deploy_key.pub deploy@server

# Add private key to CI secrets as SSH_PRIVATE_KEY
```

### Using SSH Key in GitHub Actions

```yaml
- name: Setup SSH
  run: |
    mkdir -p ~/.ssh
    echo "${{ secrets.SSH_PRIVATE_KEY }}" > ~/.ssh/deploy_key
    chmod 600 ~/.ssh/deploy_key
    ssh-keyscan -H ${{ secrets.SSH_HOST }} >> ~/.ssh/known_hosts

- name: Deploy
  run: ssh -i ~/.ssh/deploy_key deploy@${{ secrets.SSH_HOST }} "cd /var/www && git pull"
```

### Using SSH Key in GitLab CI

```yaml
before_script:
  - eval $(ssh-agent -s)
  - echo "$SSH_PRIVATE_KEY" | ssh-add -
  - mkdir -p ~/.ssh && chmod 700 ~/.ssh
  - echo "$SSH_KNOWN_HOSTS" >> ~/.ssh/known_hosts
```

## .env File Handling

```bash
# .gitignore — ALWAYS exclude
.env
.env.local
.env.production

# In CI, create .env from secrets
- name: Create .env
  run: |
    echo "WP_SITE_URL=${{ secrets.WP_SITE_URL }}" > .env
    echo "DB_HOST=${{ secrets.DB_HOST }}" >> .env
```

## Security Checklist

- [ ] All secrets stored in CI platform, never in code
- [ ] SSH keys use Ed25519 or RSA 4096-bit
- [ ] Deploy keys have read-only access where possible
- [ ] Secrets are scoped to environments (staging vs production)
- [ ] CI logs are reviewed for accidental secret exposure
- [ ] Secrets are rotated after team member departures
- [ ] `.env` files are in `.gitignore`
- [ ] Application Passwords have descriptive names for audit trail
