#!/bin/bash
set -euo pipefail
API_BASE=${API_BASE:-http://localhost:4000}
USER_ID=tester-$(date +%s)

echo "[+] Acknowledging ethics for ${USER_ID}"
curl -s -X POST "$API_BASE/api/ethics/ack" -H 'Content-Type: application/json' -d "{\"userId\":\"$USER_ID\"}" > /dev/null

echo "[+] Fetching labs"
curl -s "$API_BASE/api/labs" | jq '.labs | length' >/dev/null 2>&1 || echo "Install jq for richer output"

echo "[+] Attempting to start web-sqli lab (expected to fail if ethics not accepted)"
resp=$(curl -s -X POST "$API_BASE/api/labs/web-sqli-1/start" -H 'Content-Type: application/json' -d "{\"userId\":\"$USER_ID\"}")
echo "$resp"
