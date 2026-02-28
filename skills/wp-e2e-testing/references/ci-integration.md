# CI Pipeline Integration for WordPress Tests

Use this file when setting up GitHub Actions (or similar CI) for WordPress test automation.

## GitHub Actions workflow

```yaml
# .github/workflows/tests.yml
name: Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  php-tests:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        php: ['8.1', '8.2', '8.3']
        wp: ['6.8', '6.9']
    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: root
          MYSQL_DATABASE: wordpress_test
        ports: ['3306:3306']
        options: >-
          --health-cmd="mysqladmin ping"
          --health-interval=10s
          --health-timeout=5s
          --health-retries=5

    steps:
      - uses: actions/checkout@v4

      - name: Setup PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: ${{ matrix.php }}
          extensions: mysqli
          coverage: xdebug

      - name: Cache Composer
        uses: actions/cache@v4
        with:
          path: vendor
          key: composer-${{ hashFiles('composer.lock') }}

      - name: Install dependencies
        run: composer install --no-interaction

      - name: Install WP test suite
        run: bash bin/install-wp-tests.sh wordpress_test root root 127.0.0.1 ${{ matrix.wp }}

      - name: Run PHPUnit
        run: vendor/bin/phpunit

  js-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Run Jest
        run: npx wp-scripts test-unit-js --ci --coverage

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install chromium --with-deps

      - name: Start wp-env
        run: npx wp-env start

      - name: Run Playwright tests
        run: npx wp-scripts test-playwright

      - name: Upload artifacts on failure
        uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-artifacts
          path: artifacts/
          retention-days: 7
```

## Caching strategies

```yaml
# Node modules
- uses: actions/cache@v4
  with:
    path: ~/.npm
    key: npm-${{ hashFiles('package-lock.json') }}

# Playwright browsers
- uses: actions/cache@v4
  with:
    path: ~/.cache/ms-playwright
    key: playwright-${{ hashFiles('package-lock.json') }}

# Docker images for wp-env
- uses: ScribeMD/docker-cache@0.5.0
  with:
    key: docker-${{ hashFiles('.wp-env.json') }}
```

## Parallel test execution

Split Playwright tests across multiple workers:

```yaml
e2e-tests:
  strategy:
    matrix:
      shard: [1, 2, 3]
  steps:
    # ...
    - run: npx playwright test --shard=${{ matrix.shard }}/3
```

## PHPUnit without wp-env (standalone)

For projects that don't use wp-env, the `install-wp-tests.sh` script sets up the WP test suite:

```bash
bash bin/install-wp-tests.sh wordpress_test root root 127.0.0.1 latest true
```

Arguments: `db_name db_user db_pass db_host wp_version skip_db_create`

## Conditional jobs

Run expensive E2E tests only when relevant files change:

```yaml
e2e-tests:
  if: |
    contains(github.event.pull_request.labels.*.name, 'e2e') ||
    github.ref == 'refs/heads/main'
```

## Best practices

- Run PHPUnit with matrix strategy for PHP/WP version coverage
- Cache aggressively (npm, Composer, Playwright browsers, Docker)
- Upload test artifacts (traces, screenshots) on failure for debugging
- Use `--ci` flag for Jest to disable interactive mode
- Set reasonable timeouts to catch hanging tests early
- Run lint/format checks as a separate job (fast fail)
