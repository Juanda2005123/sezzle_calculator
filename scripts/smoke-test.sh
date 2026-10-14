#!/usr/bin/env bash
set -euo pipefail

echo "=== Running Sezzle Calculator Smoke Tests ==="

# Backend decimal smoke check
echo "1. Checking Go backend decimal calculation..."
cd backend
SMOKE_CHECK=1 go run ./cmd/api
cd ..

# Frontend smoke check
echo "2. Checking Frontend build & test..."
cd frontend
npm run test -- --run
npm run build
cd ..

echo "=== All Smoke Tests Passed Successfully ==="
