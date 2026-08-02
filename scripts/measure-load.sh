#!/usr/bin/env bash
set -euo pipefail

URL="${1:-http://localhost:5173/}"
E2E_URL="${URL%/}/?e2e=1"

echo "Measuring load for: $URL"
html_time=$(curl -w "%{time_total}" -o /dev/null -s "$URL")
echo "html_total: ${html_time}s"

echo "Measuring e2e mode: $E2E_URL"
e2e_time=$(curl -w "%{time_total}" -o /dev/null -s "$E2E_URL")
echo "e2e_html_total: ${e2e_time}s"

echo "e2e_ready: load page then check document.documentElement.dataset.e2eReady"
echo "browser_tip: run 'npm run dev:e2e' (disables HMR) before agent-browser navigate"
