#!/bin/bash
# validate-wp-operation.sh — Pre-flight validation for WordPress operations
# Checks that a site is reachable and authenticated before proceeding.
# Returns exit code 0 (safe to proceed) or 1 (abort).
# Usage: ./validate-wp-operation.sh <operation> [site-url]
#
# Operations: deploy, delete, import, dns-change, plugin-deactivate, backup, migrate
# Used by command-type hooks and manual pre-flight checks.

set -euo pipefail

OPERATION="${1:-unknown}"
SITE_URL="${2:-}"

# Resolve site URL from config if not provided
if [ -z "$SITE_URL" ] && [ -n "${WP_SITES_CONFIG:-}" ]; then
    SITE_URL=$(echo "$WP_SITES_CONFIG" | python3 -c "import json,sys; print(json.load(sys.stdin)[0]['url'])" 2>/dev/null || echo "")
fi

if [ -z "$SITE_URL" ]; then
    echo "ERROR: No site URL provided and WP_SITES_CONFIG not set"
    exit 1
fi

ERRORS=0

check() {
    local label="$1"
    local result="$2"
    if [ "$result" = "ok" ]; then
        echo "  [OK] $label"
    else
        echo "  [FAIL] $label: $result"
        ERRORS=$((ERRORS + 1))
    fi
}

echo "Pre-flight check: $OPERATION on $SITE_URL"
echo "---"

# Always check: site reachable
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$SITE_URL" 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ]; then
    check "Site reachable" "ok"
else
    check "Site reachable" "HTTP $HTTP_CODE"
fi

# Always check: REST API available
API_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$SITE_URL/wp-json/wp/v2/" 2>/dev/null || echo "000")
if [ "$API_CODE" = "200" ]; then
    check "REST API available" "ok"
else
    check "REST API available" "HTTP $API_CODE"
fi

# Operation-specific checks
case "$OPERATION" in
    deploy|import|migrate)
        # Check authentication (needed for write operations)
        if [ -n "${WP_SITES_CONFIG:-}" ]; then
            CREDS=$(echo "$WP_SITES_CONFIG" | python3 -c "import json,sys; c=json.load(sys.stdin)[0]; print(c['username']+':'+c['password'])" 2>/dev/null || echo "")
            if [ -n "$CREDS" ]; then
                AUTH_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 -u "$CREDS" "$SITE_URL/wp-json/wp/v2/users/me" 2>/dev/null || echo "000")
                if [ "$AUTH_CODE" = "200" ]; then
                    check "Authentication" "ok"
                else
                    check "Authentication" "HTTP $AUTH_CODE"
                fi
            else
                check "Authentication" "Could not parse credentials"
            fi
        else
            check "Authentication" "WP_SITES_CONFIG not set"
        fi
        ;;
    dns-change)
        # Check Hostinger API
        if [ -n "${HOSTINGER_API_TOKEN:-}" ]; then
            HAPI_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 -H "Authorization: Bearer $HOSTINGER_API_TOKEN" "https://api.hostinger.com/api/dns/v1/zones" 2>/dev/null || echo "000")
            if [ "$HAPI_CODE" = "200" ]; then
                check "Hostinger API" "ok"
            elif [ "$HAPI_CODE" = "530" ]; then
                check "Hostinger API" "Site Frozen (HTTP 530)"
            else
                check "Hostinger API" "HTTP $HAPI_CODE"
            fi
        else
            check "Hostinger API" "HOSTINGER_API_TOKEN not set"
        fi
        ;;
    delete|plugin-deactivate)
        # Lighter check — just confirm auth works
        if [ -n "${WP_SITES_CONFIG:-}" ]; then
            CREDS=$(echo "$WP_SITES_CONFIG" | python3 -c "import json,sys; c=json.load(sys.stdin)[0]; print(c['username']+':'+c['password'])" 2>/dev/null || echo "")
            if [ -n "$CREDS" ]; then
                AUTH_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 -u "$CREDS" "$SITE_URL/wp-json/wp/v2/users/me" 2>/dev/null || echo "000")
                if [ "$AUTH_CODE" = "200" ]; then
                    check "Authentication" "ok"
                else
                    check "Authentication" "HTTP $AUTH_CODE"
                fi
            fi
        fi
        ;;
esac

echo "---"
if [ "$ERRORS" -gt 0 ]; then
    echo "RESULT: $ERRORS check(s) failed — operation NOT safe to proceed"
    exit 1
else
    echo "RESULT: All checks passed — safe to proceed"
    exit 0
fi
