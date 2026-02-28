# GitHub Actions for WordPress

Complete workflow templates for WordPress plugin and theme CI/CD pipelines.

## Full Pipeline Template

```yaml
name: WordPress CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: shivammathur/setup-php@v2
        with:
          php-version: '8.2'
          tools: cs2pr, phpcs
      - name: Install PHPCS standards
        run: |
          composer global require --dev wp-coding-standards/wpcs:"^3.0"
          phpcs --config-set installed_paths $(composer global config home)/vendor/wp-coding-standards/wpcs
      - name: Run PHPCS
        run: phpcs --standard=WordPress --report=checkstyle . | cs2pr

  static-analysis:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: shivammathur/setup-php@v2
        with:
          php-version: '8.2'
      - name: Install dependencies
        run: composer install --no-interaction --prefer-dist
      - name: Run PHPStan
        run: vendor/bin/phpstan analyse --error-format=github

  test-php:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        php: ['7.4', '8.0', '8.2', '8.3']
        wp: ['latest']
        include:
          - php: '8.2'
            wp: 'nightly'
      fail-fast: false
    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: root
          MYSQL_DATABASE: wordpress_tests
        ports: ['3306:3306']
        options: >-
          --health-cmd="mysqladmin ping"
          --health-interval=10s
          --health-timeout=5s
          --health-retries=3
    steps:
      - uses: actions/checkout@v4
      - uses: shivammathur/setup-php@v2
        with:
          php-version: ${{ matrix.php }}
          extensions: mysqli
          coverage: xdebug
      - name: Install WP Test Suite
        run: bash bin/install-wp-tests.sh wordpress_tests root root 127.0.0.1 ${{ matrix.wp }}
      - name: Install dependencies
        run: composer install --no-interaction --prefer-dist
      - name: Run PHPUnit
        run: vendor/bin/phpunit --coverage-clover=coverage.xml
      - name: Upload coverage
        if: matrix.php == '8.2' && matrix.wp == 'latest'
        uses: codecov/codecov-action@v4
        with:
          file: coverage.xml

  test-e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - name: Install dependencies
        run: npm ci
      - name: Build
        run: npm run build
      - name: Start wp-env
        run: npx wp-env start
      - name: Install Playwright browsers
        run: npx playwright install chromium --with-deps
      - name: Run E2E tests
        run: npx playwright test
      - name: Upload artifacts
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7

  test-js:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - name: Install dependencies
        run: npm ci
      - name: Run Jest
        run: npx wp-scripts test-unit-js --coverage

  deploy:
    needs: [lint, static-analysis, test-php, test-e2e, test-js]
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4
      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.SSH_HOST }}
          username: ${{ secrets.SSH_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /var/www/html/wp-content/plugins/my-plugin
            git pull origin main
            composer install --no-dev --no-interaction
            wp cache flush
```

## Caching Strategies

```yaml
# Composer cache
- name: Get Composer cache dir
  id: composer-cache
  run: echo "dir=$(composer config cache-files-dir)" >> $GITHUB_OUTPUT
- uses: actions/cache@v4
  with:
    path: ${{ steps.composer-cache.outputs.dir }}
    key: ${{ runner.os }}-composer-${{ hashFiles('**/composer.lock') }}

# npm cache (handled by setup-node cache: 'npm')

# wp-env Docker image cache
- name: Cache Docker images
  uses: ScribeMD/docker-cache@0.5.0
  with:
    key: docker-${{ runner.os }}-${{ hashFiles('.wp-env.json') }}
```

## Required Status Checks

Configure in repository Settings > Branches > Branch protection:

1. Require status checks: `lint`, `static-analysis`, `test-php`, `test-e2e`
2. Require branches to be up to date
3. Require pull request reviews before merging

## Tips

- Use `concurrency` to cancel superseded runs on the same branch
- Use `fail-fast: false` in matrix to see all failures, not just the first
- Upload Playwright reports as artifacts for debugging
- Use GitHub Environments for deploy approval gates
- Cache Docker images for wp-env to speed up E2E jobs
