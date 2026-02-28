# Quality Gates for WordPress CI/CD

Quality gates are automated checks that must pass before code can be merged or deployed. They enforce code quality standards and prevent regressions.

## PHPStan (Static Analysis)

### Baseline Strategy

Start with current error count as baseline, fail only on new errors:

```bash
# Generate baseline (first time)
vendor/bin/phpstan analyse --generate-baseline

# CI runs against baseline — only new errors fail
vendor/bin/phpstan analyse
```

Configuration (`phpstan.neon`):
```neon
includes:
    - phpstan-baseline.neon

parameters:
    level: 6
    paths:
        - src/
        - includes/
    excludePaths:
        - vendor/
        - node_modules/
```

### CI Integration

```yaml
# Fail if new PHPStan errors introduced
- name: PHPStan
  run: vendor/bin/phpstan analyse --error-format=github --no-progress
```

The `--error-format=github` flag annotates errors directly in the PR diff.

## PHPCS (Coding Standards)

### WordPress Coding Standards

```xml
<!-- phpcs.xml -->
<?xml version="1.0"?>
<ruleset name="My Plugin">
    <description>WordPress coding standards for my plugin.</description>

    <rule ref="WordPress"/>

    <file>./src</file>
    <file>./includes</file>

    <exclude-pattern>*/vendor/*</exclude-pattern>
    <exclude-pattern>*/node_modules/*</exclude-pattern>
    <exclude-pattern>*/build/*</exclude-pattern>

    <arg name="extensions" value="php"/>
    <arg value="sp"/>
</ruleset>
```

### CI Integration

```yaml
# Fail on any PHPCS violation
- name: PHPCS
  run: phpcs --standard=phpcs.xml --report=checkstyle . | cs2pr

# Or check only changed files
- name: PHPCS (changed files only)
  run: |
    CHANGED_FILES=$(git diff --name-only --diff-filter=ACMR HEAD~1 -- '*.php')
    if [ -n "$CHANGED_FILES" ]; then
      phpcs --standard=phpcs.xml $CHANGED_FILES
    fi
```

## Test Coverage Thresholds

### PHPUnit Coverage

```xml
<!-- phpunit.xml -->
<coverage>
    <report>
        <clover outputFile="coverage.xml"/>
    </report>
</coverage>
```

```yaml
# CI: fail if coverage below threshold
- name: Check coverage
  run: |
    vendor/bin/phpunit --coverage-clover=coverage.xml
    COVERAGE=$(php -r "
      \$xml = simplexml_load_file('coverage.xml');
      echo round(\$xml->project->metrics['coveredstatements'] / \$xml->project->metrics['statements'] * 100, 2);
    ")
    echo "Coverage: ${COVERAGE}%"
    if (( $(echo "$COVERAGE < 80" | bc -l) )); then
      echo "Coverage ${COVERAGE}% is below 80% threshold"
      exit 1
    fi
```

### Jest Coverage

```json
// jest.config.json
{
  "coverageThreshold": {
    "global": {
      "branches": 70,
      "functions": 80,
      "lines": 80,
      "statements": 80
    }
  }
}
```

```yaml
- name: Jest with coverage gate
  run: npx wp-scripts test-unit-js --coverage --coverageThreshold='{"global":{"lines":80}}'
```

## Playwright E2E Gates

### Failure Threshold

```yaml
# Fail pipeline on any E2E failure
- name: E2E Tests
  run: npx playwright test --reporter=github
```

### Screenshot Comparison

```typescript
// playwright.config.ts
export default defineConfig({
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01, // 1% tolerance
    },
  },
});
```

## Security Scanning

### Composer Audit

```yaml
- name: Security audit (PHP)
  run: composer audit --format=plain
```

### npm Audit

```yaml
- name: Security audit (JS)
  run: npm audit --audit-level=high
```

### Combined Gate

```yaml
- name: Security scan
  run: |
    composer audit --format=plain || AUDIT_FAIL=1
    npm audit --audit-level=high || AUDIT_FAIL=1
    if [ "$AUDIT_FAIL" = "1" ]; then
      echo "Security vulnerabilities found"
      exit 1
    fi
```

## Merge Blocking (GitHub)

Configure in Settings > Branches > Branch protection rules:

1. **Required status checks**: select `phpstan`, `phpcs`, `phpunit`, `e2e`, `jest`
2. **Require branches to be up to date**: ensures checks run on merged result
3. **Require pull request reviews**: at least 1 approval
4. **Do not allow bypassing**: applies to admins too

## Recommended Gate Configuration

| Gate | Threshold | Blocking | Notes |
|------|-----------|----------|-------|
| PHPStan | Level 6, baseline | Yes | No new errors allowed |
| PHPCS | WordPress standard | Yes | Zero violations |
| PHPUnit coverage | 80% lines | Yes | On changed files |
| Jest coverage | 80% lines | Yes | On changed files |
| Playwright | 0 failures | Yes | All E2E must pass |
| Composer audit | High severity | Yes | Block on known CVEs |
| npm audit | High severity | Yes | Block on known CVEs |

## Gradual Adoption

For existing projects without quality gates:

1. **Week 1**: Add PHPStan with baseline (zero new errors)
2. **Week 2**: Add PHPCS on changed files only
3. **Week 3**: Add test coverage threshold at current level
4. **Week 4**: Add security scanning
5. **Ongoing**: Ratchet up thresholds (reduce baseline, increase coverage)
