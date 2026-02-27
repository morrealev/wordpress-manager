#!/bin/bash
# health-check.sh — WordPress site health check
# Tests REST API reachability, authentication, SSL validity, and Hostinger API status.
# Usage: ./health-check.sh [site-url] [username:app-password]
#        ./health-check.sh  (uses WP_SITES_CONFIG env var)

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

pass() { echo -e "  ${GREEN}PASS${NC} $1"; }
fail() { echo -e "  ${RED}FAIL${NC} $1"; }
warn() { echo -e "  ${YELLOW}WARN${NC} $1"; }

# Resolve site config
if [ $# -ge 1 ]; then
    SITE_URL="$1"
    # Ensure URL has https:// prefix
    if [[ ! "$SITE_URL" =~ ^https?:// ]]; then
        SITE_URL="https://$SITE_URL"
    fi
    CREDS="${2:-}"
elif [ -n "${WP_SITES_CONFIG:-}" ]; then
    SITE_URL=$(echo "$WP_SITES_CONFIG" | python3 -c "import json,sys; print(json.load(sys.stdin)[0]['url'])" 2>/dev/null)
    CREDS=$(echo "$WP_SITES_CONFIG" | python3 -c "import json,sys; c=json.load(sys.stdin)[0]; print(c['username']+':'+c['password'])" 2>/dev/null)
else
    echo "Usage: $0 [site-url] [username:app-password]"
    echo "  Or set WP_SITES_CONFIG environment variable"
    exit 1
fi

echo "=== WordPress Health Check ==="
echo "Site: $SITE_URL"
echo ""

# 1. HTTP reachability
echo "[1/5] Site Reachability"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$SITE_URL" 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ]; then
    pass "Site responds (HTTP $HTTP_CODE)"
elif [ "$HTTP_CODE" = "000" ]; then
    fail "Site unreachable (connection timeout/refused)"
else
    warn "Site responds with HTTP $HTTP_CODE"
fi

# 2. SSL Certificate
echo "[2/5] SSL Certificate"
SSL_EXPIRY=$(echo | openssl s_client -servername "${SITE_URL#https://}" -connect "${SITE_URL#https://}:443" 2>/dev/null | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)
if [ -n "$SSL_EXPIRY" ]; then
    EXPIRY_EPOCH=$(date -d "$SSL_EXPIRY" +%s 2>/dev/null || date -j -f "%b %d %T %Y %Z" "$SSL_EXPIRY" +%s 2>/dev/null || echo "0")
    NOW_EPOCH=$(date +%s)
    DAYS_LEFT=$(( (EXPIRY_EPOCH - NOW_EPOCH) / 86400 ))
    if [ "$DAYS_LEFT" -gt 30 ]; then
        pass "SSL valid ($DAYS_LEFT days remaining, expires: $SSL_EXPIRY)"
    elif [ "$DAYS_LEFT" -gt 0 ]; then
        warn "SSL expiring soon ($DAYS_LEFT days remaining)"
    else
        fail "SSL certificate expired!"
    fi
else
    fail "Could not retrieve SSL certificate"
fi

# 3. WordPress REST API
echo "[3/5] WordPress REST API"
API_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$SITE_URL/wp-json/wp/v2/" 2>/dev/null || echo "000")
if [ "$API_CODE" = "200" ]; then
    pass "REST API reachable (HTTP $API_CODE)"
else
    fail "REST API not reachable (HTTP $API_CODE)"
fi

# 4. Authentication
echo "[4/5] Authentication"
if [ -n "$CREDS" ]; then
    AUTH_RESP=$(curl -s --max-time 10 -u "$CREDS" "$SITE_URL/wp-json/wp/v2/users/me" 2>/dev/null)
    USER_ID=$(echo "$AUTH_RESP" | python3 -c "import json,sys; print(json.load(sys.stdin).get('id',''))" 2>/dev/null || echo "")
    if [ -n "$USER_ID" ] && [ "$USER_ID" != "" ]; then
        USER_NAME=$(echo "$AUTH_RESP" | python3 -c "import json,sys; print(json.load(sys.stdin).get('name','?'))" 2>/dev/null)
        pass "Authenticated as '$USER_NAME' (ID: $USER_ID)"
    else
        ERROR=$(echo "$AUTH_RESP" | python3 -c "import json,sys; print(json.load(sys.stdin).get('message','Unknown error'))" 2>/dev/null || echo "Parse error")
        fail "Authentication failed: $ERROR"
    fi
else
    warn "No credentials provided, skipping auth test"
fi

# 5. Hostinger API (if token available)
echo "[5/5] Hostinger API"
if [ -n "${HOSTINGER_API_TOKEN:-}" ]; then
    HAPI_RESP=$(curl -s --max-time 10 -H "Authorization: Bearer $HOSTINGER_API_TOKEN" "https://developers.hostinger.com/api/hosting/v1/websites" 2>/dev/null)
    HAPI_CODE=$(echo "$HAPI_RESP" | python3 -c "import json,sys; d=json.load(sys.stdin); print(len(d.get('data',d)) if isinstance(d,dict) and 'message' not in d else d.get('message','error'))" 2>/dev/null || echo "error")
    if [[ "$HAPI_CODE" =~ ^[0-9]+$ ]]; then
        pass "Hostinger API reachable ($HAPI_CODE sites found)"
    elif [ "$HAPI_CODE" = "Unauthenticated." ]; then
        fail "Hostinger API: Unauthenticated (token invalid or expired)"
    else
        warn "Hostinger API: HTTP $HAPI_CODE"
    fi
else
    warn "HOSTINGER_API_TOKEN not set, skipping Hostinger check"
fi

echo ""
echo "=== Health Check Complete ==="
