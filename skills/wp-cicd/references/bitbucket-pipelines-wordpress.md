# Bitbucket Pipelines for WordPress

Step-based pipeline configuration for WordPress projects hosted on Bitbucket.

## Full Pipeline Template

```yaml
image: php:8.2-cli

definitions:
  caches:
    composer: ~/.composer/cache
  services:
    mysql:
      image: mysql:8.0
      variables:
        MYSQL_ROOT_PASSWORD: root
        MYSQL_DATABASE: wordpress_tests
    docker:
      memory: 2048

pipelines:
  default:
    - parallel:
        - step:
            name: PHPCS Lint
            caches:
              - composer
            script:
              - apt-get update && apt-get install -y unzip git
              - curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer
              - composer global require --dev wp-coding-standards/wpcs:"^3.0"
              - composer global exec phpcs -- --config-set installed_paths $(composer global config home)/vendor/wp-coding-standards/wpcs
              - composer global exec phpcs -- --standard=WordPress .

        - step:
            name: PHPStan
            caches:
              - composer
            script:
              - apt-get update && apt-get install -y unzip git
              - curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer
              - composer install --no-interaction --prefer-dist
              - vendor/bin/phpstan analyse

    - parallel:
        - step:
            name: PHPUnit
            caches:
              - composer
            services:
              - mysql
            script:
              - apt-get update && apt-get install -y unzip git default-mysql-client
              - docker-php-ext-install mysqli
              - curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer
              - composer install --no-interaction --prefer-dist
              - bash bin/install-wp-tests.sh wordpress_tests root root 127.0.0.1 latest
              - vendor/bin/phpunit

        - step:
            name: Jest Unit Tests
            image: node:20
            caches:
              - node
            script:
              - npm ci
              - npx wp-scripts test-unit-js --coverage

    - step:
        name: E2E Tests
        image: node:20
        size: 2x
        services:
          - docker
        caches:
          - node
        script:
          - npm ci
          - npm run build
          - npx wp-env start
          - npx playwright install chromium --with-deps
          - npx playwright test
        artifacts:
          - playwright-report/**

  branches:
    main:
      - parallel:
          - step:
              name: PHPCS Lint
              caches:
                - composer
              script:
                - apt-get update && apt-get install -y unzip git
                - curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer
                - composer global require --dev wp-coding-standards/wpcs:"^3.0"
                - composer global exec phpcs -- --config-set installed_paths $(composer global config home)/vendor/wp-coding-standards/wpcs
                - composer global exec phpcs -- --standard=WordPress .
          - step:
              name: PHPStan
              caches:
                - composer
              script:
                - apt-get update && apt-get install -y unzip git
                - curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer
                - composer install --no-interaction --prefer-dist
                - vendor/bin/phpstan analyse
      - step:
          name: Deploy to Production
          deployment: production
          trigger: manual
          script:
            - pipe: atlassian/ssh-run:0.8.1
              variables:
                SSH_USER: $SSH_USER
                SERVER: $SSH_HOST
                COMMAND: |
                  cd /var/www/html/wp-content/plugins/my-plugin
                  git pull origin main
                  composer install --no-dev --no-interaction
                  wp cache flush
```

## Repository Variables

Set in Repository Settings > Pipelines > Repository variables:

| Variable | Secured |
|----------|---------|
| `SSH_USER` | No |
| `SSH_HOST` | No |
| `SSH_PRIVATE_KEY` | Yes |

## Tips

- Use `parallel` keyword for concurrent steps (lint + static analysis)
- Use `size: 2x` for memory-intensive steps like E2E with Docker
- Use `trigger: manual` for production deployment approval
- Use `deployment: production` to track deploy history
- Use Bitbucket Pipes for common tasks (SSH, S3, Slack notifications)
- Bitbucket has a 120-minute timeout per step — watch for slow E2E suites
