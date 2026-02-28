# GitLab CI for WordPress

Multi-stage pipeline configuration for WordPress plugin and theme projects on GitLab.

## Full Pipeline Template

```yaml
stages:
  - lint
  - test
  - build
  - deploy

variables:
  MYSQL_ROOT_PASSWORD: root
  MYSQL_DATABASE: wordpress_tests
  WP_VERSION: latest
  PHP_VERSION: "8.2"

# Cache Composer and npm dependencies
cache:
  paths:
    - vendor/
    - node_modules/
    - .npm/

# ---------------------------------------------------------------------------
# Lint stage
# ---------------------------------------------------------------------------

phpcs:
  stage: lint
  image: php:${PHP_VERSION}-cli
  before_script:
    - apt-get update && apt-get install -y unzip git
    - curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer
    - composer global require --dev wp-coding-standards/wpcs:"^3.0"
    - composer global exec phpcs -- --config-set installed_paths $(composer global config home)/vendor/wp-coding-standards/wpcs
  script:
    - composer global exec phpcs -- --standard=WordPress .
  allow_failure: false

# ---------------------------------------------------------------------------
# Test stage
# ---------------------------------------------------------------------------

phpstan:
  stage: test
  image: php:${PHP_VERSION}-cli
  before_script:
    - apt-get update && apt-get install -y unzip git
    - curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer
    - composer install --no-interaction --prefer-dist
  script:
    - vendor/bin/phpstan analyse

phpunit:
  stage: test
  image: php:${PHP_VERSION}-cli
  services:
    - name: mysql:8.0
      alias: mysql
  variables:
    MYSQL_HOST: mysql
  before_script:
    - apt-get update && apt-get install -y unzip git default-mysql-client
    - docker-php-ext-install mysqli
    - curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer
    - composer install --no-interaction --prefer-dist
    - bash bin/install-wp-tests.sh ${MYSQL_DATABASE} root ${MYSQL_ROOT_PASSWORD} mysql ${WP_VERSION}
  script:
    - vendor/bin/phpunit --coverage-text
  parallel:
    matrix:
      - PHP_VERSION: ['7.4', '8.0', '8.2', '8.3']

jest:
  stage: test
  image: node:20
  before_script:
    - npm ci --cache .npm --prefer-offline
  script:
    - npx wp-scripts test-unit-js --coverage

e2e:
  stage: test
  image: node:20
  services:
    - name: docker:dind
      alias: docker
  variables:
    DOCKER_HOST: tcp://docker:2376
    DOCKER_TLS_CERTDIR: "/certs"
  before_script:
    - npm ci --cache .npm --prefer-offline
    - npm run build
    - npx wp-env start
    - npx playwright install chromium --with-deps
  script:
    - npx playwright test
  artifacts:
    when: on_failure
    paths:
      - playwright-report/
    expire_in: 7 days

# ---------------------------------------------------------------------------
# Build stage
# ---------------------------------------------------------------------------

build:
  stage: build
  image: node:20
  before_script:
    - npm ci --cache .npm --prefer-offline
  script:
    - npm run build
  artifacts:
    paths:
      - build/
    expire_in: 1 hour
  only:
    - main
    - tags

# ---------------------------------------------------------------------------
# Deploy stage
# ---------------------------------------------------------------------------

deploy_staging:
  stage: deploy
  image: alpine:latest
  environment:
    name: staging
    url: https://staging.example.com
  before_script:
    - apk add --no-cache openssh-client rsync
    - eval $(ssh-agent -s)
    - echo "$SSH_PRIVATE_KEY" | ssh-add -
    - mkdir -p ~/.ssh && chmod 700 ~/.ssh
    - echo "$SSH_KNOWN_HOSTS" >> ~/.ssh/known_hosts
  script:
    - rsync -avz --delete --exclude='.git' ./ $SSH_USER@$SSH_HOST:/var/www/staging/wp-content/plugins/my-plugin/
    - ssh $SSH_USER@$SSH_HOST "cd /var/www/staging && wp cache flush"
  only:
    - develop
  dependencies:
    - build

deploy_production:
  stage: deploy
  image: alpine:latest
  environment:
    name: production
    url: https://example.com
  when: manual
  before_script:
    - apk add --no-cache openssh-client rsync
    - eval $(ssh-agent -s)
    - echo "$SSH_PRIVATE_KEY" | ssh-add -
    - mkdir -p ~/.ssh && chmod 700 ~/.ssh
    - echo "$SSH_KNOWN_HOSTS" >> ~/.ssh/known_hosts
  script:
    - rsync -avz --delete --exclude='.git' ./ $SSH_USER@$SSH_HOST:/var/www/html/wp-content/plugins/my-plugin/
    - ssh $SSH_USER@$SSH_HOST "cd /var/www/html && wp cache flush && wp rewrite flush"
  only:
    - main
  dependencies:
    - build
```

## GitLab CI/CD Variables

Set in Settings > CI/CD > Variables:

| Variable | Type | Protected | Masked |
|----------|------|-----------|--------|
| `SSH_PRIVATE_KEY` | Variable | Yes | Yes |
| `SSH_KNOWN_HOSTS` | Variable | Yes | No |
| `SSH_USER` | Variable | Yes | No |
| `SSH_HOST` | Variable | Yes | No |

## Tips

- Use `parallel: matrix` for PHP version matrix testing
- Use `when: manual` for production deploy (approval gate)
- Use `dependencies` to pass artifacts between stages
- Use Docker-in-Docker service for wp-env in E2E tests
- Set `allow_failure: true` on nightly WP version tests
