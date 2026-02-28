# wp-env in CI

Running `@wordpress/env` (wp-env) in CI environments for E2E testing of WordPress plugins, themes, and blocks.

## How wp-env Works in CI

wp-env uses Docker Compose to spin up a WordPress instance with your plugin/theme mounted. In CI, this requires Docker access.

## GitHub Actions Setup

GitHub Actions runners have Docker pre-installed — wp-env works out of the box:

```yaml
- name: Start wp-env
  run: npx wp-env start

- name: Verify site is running
  run: curl -s http://localhost:8888 | head -5

- name: Run E2E tests
  run: npx playwright test
```

## GitLab CI Setup (Docker-in-Docker)

GitLab CI needs Docker-in-Docker service:

```yaml
e2e:
  image: node:20
  services:
    - name: docker:dind
      alias: docker
  variables:
    DOCKER_HOST: tcp://docker:2376
    DOCKER_TLS_CERTDIR: "/certs"
  script:
    - npx wp-env start
    - npx playwright test
```

## Bitbucket Pipelines Setup

Bitbucket requires the Docker service:

```yaml
- step:
    name: E2E
    services:
      - docker
    script:
      - npx wp-env start
      - npx playwright test
```

## Port Configuration

Default ports:
- **Development site**: `http://localhost:8888`
- **Test site**: `http://localhost:8889`
- **MySQL**: port `3306` (development), `3307` (tests)

If ports conflict in CI, override in `.wp-env.override.json`:

```json
{
  "port": 9999,
  "testsPort": 9998
}
```

## Healthcheck

Wait for wp-env to be fully ready before running tests:

```bash
# Simple healthcheck
npx wp-env start
timeout 60 bash -c 'until curl -s http://localhost:8888 > /dev/null 2>&1; do sleep 2; done'

# Or use wp-env run
npx wp-env run cli wp option get siteurl
```

## Plugin/Theme Mounting

wp-env reads `.wp-env.json` to determine what to mount:

```json
{
  "core": "WordPress/WordPress#6.7",
  "plugins": ["."],
  "themes": ["./themes/my-theme"],
  "phpVersion": "8.2",
  "config": {
    "WP_DEBUG": true,
    "SCRIPT_DEBUG": true
  }
}
```

In CI, the current directory (checkout root) is mounted automatically.

## Parallel Test Execution

Split Playwright tests across CI workers using sharding:

```yaml
# GitHub Actions matrix
strategy:
  matrix:
    shard: [1, 2, 3, 4]
steps:
  - run: npx wp-env start
  - run: npx playwright test --shard=${{ matrix.shard }}/4
```

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| `Cannot connect to Docker daemon` | Docker not available | Add Docker service (GitLab/Bitbucket) |
| `Port 8888 already in use` | Leftover container | `npx wp-env destroy` then `npx wp-env start` |
| `ECONNREFUSED` on test start | wp-env not ready | Add healthcheck wait loop |
| `Out of disk space` | Docker images fill CI disk | Clean up in `after_script` or use smaller base images |
| `Timeout waiting for MySQL` | MySQL slow to start | Increase healthcheck timeout or use `--wait-for-db` |
| `Permission denied` on mounted plugin | Docker user mismatch | Check `.wp-env.json` config or run `chmod` |

## Tips

- Always run `npm run build` before `npx wp-env start` so built assets are available
- Use `npx wp-env clean all` in CI cleanup to free disk space
- Cache Docker images when possible (GitHub: `ScribeMD/docker-cache`, GitLab: Docker layer caching)
- Use `npx wp-env run tests-cli wp db reset --yes` between test suites for clean state
- Keep `.wp-env.json` in version control, `.wp-env.override.json` in `.gitignore`
