#!/usr/bin/env bash
# Quick health + auth smoke test against a deployed API.
# Usage: ./scripts/smoke.sh https://your-railway-url.up.railway.app
set -u

API="${1:-}"
if [[ -z "${API}" ]]; then
  echo "Usage: $0 <api-base-url>"
  echo "Example: $0 https://ogp-api.up.railway.app"
  exit 1
fi

# Strip trailing slash and /api if user pasted either
API="${API%/}"
API="${API%/api}"

ok()   { printf "  \033[32m✓\033[0m %s\n" "$1"; }
fail() { printf "  \033[31m✗\033[0m %s\n" "$1"; failed=1; }
info() { printf "  \033[34mi\033[0m %s\n" "$1"; }

failed=0

echo ""
echo "Smoking $API ..."
echo ""

# 1. Health
echo "[1/4] /api/health"
code=$(curl -s -o /tmp/ogp-smoke.body -w "%{http_code}" "${API}/api/health")
if [[ "$code" == "200" ]]; then
  ok "200 OK ($(cat /tmp/ogp-smoke.body))"
else
  fail "$code (body: $(cat /tmp/ogp-smoke.body))"
fi
echo ""

# 2. Validation rejects bad login
echo "[2/4] /api/auth/client/login (rejects empty body)"
code=$(curl -s -o /tmp/ogp-smoke.body -w "%{http_code}" -X POST -H "Content-Type: application/json" -d '{}' "${API}/api/auth/client/login")
if [[ "$code" == "400" ]]; then
  ok "400 — validation working"
else
  fail "expected 400, got $code (body: $(cat /tmp/ogp-smoke.body | head -c 200))"
fi
echo ""

# 3. Auth rejects bad creds
echo "[3/4] /api/auth/client/login (rejects bad creds)"
code=$(curl -s -o /tmp/ogp-smoke.body -w "%{http_code}" -X POST -H "Content-Type: application/json" \
  -d '{"email":"nobody@example.com","password":"wrongwrongwrong"}' "${API}/api/auth/client/login")
if [[ "$code" == "401" ]]; then
  ok "401 — auth working"
else
  fail "expected 401, got $code (body: $(cat /tmp/ogp-smoke.body | head -c 200))"
fi
echo ""

# 4. Seed-account login (only works after pnpm db:seed)
echo "[4/4] /api/auth/client/login (seed account)"
code=$(curl -s -o /tmp/ogp-smoke.body -w "%{http_code}" -c /tmp/ogp-smoke.cookies -X POST -H "Content-Type: application/json" \
  -d '{"email":"riya.arjun@example.com","password":"client123"}' "${API}/api/auth/client/login")
if [[ "$code" == "200" ]]; then
  if grep -q '"accessToken"' /tmp/ogp-smoke.body; then
    ok "200 — got accessToken"
    if grep -q "refresh_token=" /tmp/ogp-smoke.cookies; then
      ok "refresh_token cookie set"
    else
      info "no refresh cookie — fine if Set-Cookie was stripped by proxy, but check"
    fi
  else
    fail "200 but no accessToken in body"
  fi
elif [[ "$code" == "401" ]]; then
  info "401 — seed not run yet. Run: pnpm --filter @ogp/db seed"
else
  fail "unexpected $code (body: $(cat /tmp/ogp-smoke.body | head -c 200))"
fi
echo ""

if [[ "$failed" == "1" ]]; then
  echo "Smoke FAILED"
  exit 1
fi
echo "Smoke OK"
