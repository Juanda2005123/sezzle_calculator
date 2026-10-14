#!/usr/bin/env bash
set -euo pipefail

# Configuration
BACKEND_URL="${BACKEND_URL:-http://localhost:8080}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:3000}"
MAX_WAIT_SECONDS=30

echo "=========================================================="
echo "    Sezzle Precision Calculator - Smoke Test Suite        "
echo "=========================================================="
echo "Backend URL:  ${BACKEND_URL}"
echo "Frontend URL: ${FRONTEND_URL}"
echo "Max Wait:     ${MAX_WAIT_SECONDS}s"
echo "----------------------------------------------------------"

# Step 1: Poll backend health check
echo -n "1. Polling backend health endpoint (${BACKEND_URL}/api/v1/health)... "
HEALTHY=0
for ((i=1; i<=MAX_WAIT_SECONDS; i++)); do
  HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${BACKEND_URL}/api/v1/health" || true)
  if [ "${HTTP_STATUS}" -eq 200 ]; then
    HEALTHY=1
    break
  fi
  sleep 1
done

if [ "${HEALTHY}" -eq 1 ]; then
  echo "OK (HTTP 200 in ${i}s)"
else
  echo "FAILED (Backend did not report healthy within ${MAX_WAIT_SECONDS}s)"
  exit 1
fi

# Step 2: Verify frontend serving static bundle
echo -n "2. Verifying frontend availability (${FRONTEND_URL})... "
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${FRONTEND_URL}" || true)
if [ "${FRONTEND_STATUS}" -eq 200 ]; then
  echo "OK (HTTP 200)"
else
  echo "FAILED (Frontend returned HTTP ${FRONTEND_STATUS}, expected 200)"
  exit 1
fi

# Step 3: Test precision addition (0.1 + 0.2 = 0.3) through frontend reverse proxy
echo -n "3. Testing 0.1 + 0.2 = 0.3 calculation via Nginx proxy (${FRONTEND_URL}/api/v1/calculate)... "
ADD_PAYLOAD='{"operation":"add","operand_a":0.1,"operand_b":0.2}'
ADD_RESPONSE=$(curl -s -X POST "${FRONTEND_URL}/api/v1/calculate" \
  -H "Content-Type: application/json" \
  -d "${ADD_PAYLOAD}" || true)

if echo "${ADD_RESPONSE}" | grep -q '"formatted":"0.3"'; then
  echo "OK (0.1 + 0.2 = 0.3 confirmed)"
else
  echo "FAILED"
  echo "Response was: ${ADD_RESPONSE}"
  exit 1
fi

# Step 4: Test 422 Unprocessable Entity error (division by zero)
echo -n "4. Testing division by zero error handling (42 / 0 -> 422 ERR_DIVISION_BY_ZERO)... "
DIV_PAYLOAD='{"operation":"divide","operand_a":42,"operand_b":0}'
DIV_HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "${FRONTEND_URL}/api/v1/calculate" \
  -H "Content-Type: application/json" \
  -d "${DIV_PAYLOAD}" || true)
DIV_BODY=$(curl -s -X POST "${FRONTEND_URL}/api/v1/calculate" \
  -H "Content-Type: application/json" \
  -d "${DIV_PAYLOAD}" || true)

if [ "${DIV_HTTP_STATUS}" -eq 422 ] && echo "${DIV_BODY}" | grep -q 'ERR_DIVISION_BY_ZERO'; then
  echo "OK (HTTP 422 and ERR_DIVISION_BY_ZERO verified)"
else
  echo "FAILED (HTTP: ${DIV_HTTP_STATUS}, Body: ${DIV_BODY})"
  exit 1
fi

echo "=========================================================="
echo "    ALL SMOKE TESTS PASSED CLEANLY (Zero Failures)        "
echo "=========================================================="
exit 0
