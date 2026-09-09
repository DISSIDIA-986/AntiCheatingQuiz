#!/usr/bin/env bash
set -euo pipefail

npm ci --legacy-peer-deps --ignore-scripts --no-audit --no-fund
npm run db:local