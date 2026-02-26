#!/bin/bash
# pre-deploy-check.sh — Pre-deployment validation hook
# Ensures the target site is reachable and authenticated before deploy operations.
# Called as a PreToolUse command hook for deploy-related tools.
# Exit 0 = allow, Exit 2 = block with message

set -euo pipefail

# Resolve site URL from WP_SITES_CONFIG
if [ -z "${WP_SITES_CONFIG:-}" ]; then
    echo "WARN: WP_SITES_CONFIG not set, cannot validate target site"
    exit 0  # Allow — can't validate without config
fi

SITE_URL=$(echo "$WP_SITES_CONFIG" | python3 -c "import json,sys; print(json.load(sys.stdin)[0]['url'])" 2>/dev/null || echo "")
CREDS=$(echo "$WP_SITES_CONFIG" | python3 -c "import json,sys; c=json.load(sys.stdin)[0]; print(c['username']+':'+c['password'])" 2>/dev/null || echo "")

if [ -z "$SITE_URL" ]; then
    exit 0  # Can't determine site, allow operation
fi

# Check site reachable
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$SITE_URL" 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "000" ]; then
    echo "BLOCKED: Target site $SITE_URL is unreachable (connection timeout). Deploy aborted."
    exit 2
fi

# Check REST API
API_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$SITE_URL/wp-json/wp/v2/" 2>/dev/null || echo "000")
if [ "$API_CODE" != "200" ]; then
    echo "BLOCKED: WordPress REST API not available at $SITE_URL (HTTP $API_CODE). Deploy aborted."
    exit 2
fi

# Check authentication
if [ -n "$CREDS" ]; then
    AUTH_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 -u "$CREDS" "$SITE_URL/wp-json/wp/v2/users/me" 2>/dev/null || echo "000")
    if [ "$AUTH_CODE" != "200" ]; then
        echo "BLOCKED: Authentication failed for $SITE_URL (HTTP $AUTH_CODE). Check Application Password."
        exit 2
    fi
fi

# All checks passed
exit 0
