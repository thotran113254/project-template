#!/usr/bin/env bash
set -euo pipefail

# ─── Project Setup Script ───
# Usage: bash setup.sh [app-name]
# Initializes the project: copies .env, generates JWT secrets, installs deps, starts services

APP_NAME="${1:-my-app}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=== Setting up project: $APP_NAME ==="

# 1. Copy .env if not exists
if [ ! -f "$SCRIPT_DIR/.env" ]; then
  cp "$SCRIPT_DIR/.env.example" "$SCRIPT_DIR/.env"
  echo "[1/6] Created .env from .env.example"

  # Update APP_NAME in .env
  sed -i "s/^APP_NAME=.*/APP_NAME=$APP_NAME/" "$SCRIPT_DIR/.env"

  # Generate random JWT secrets
  ACCESS_SECRET=$(openssl rand -base64 48 | tr -d '\n/+=' | head -c 48)
  REFRESH_SECRET=$(openssl rand -base64 48 | tr -d '\n/+=' | head -c 48)
  sed -i "s|^JWT_ACCESS_SECRET=.*|JWT_ACCESS_SECRET=$ACCESS_SECRET|" "$SCRIPT_DIR/.env"
  sed -i "s|^JWT_REFRESH_SECRET=.*|JWT_REFRESH_SECRET=$REFRESH_SECRET|" "$SCRIPT_DIR/.env"
  echo "  Generated random JWT secrets"
else
  echo "[1/6] .env already exists, skipping"
fi

# 2. Install dependencies
echo "[2/6] Installing dependencies..."
cd "$SCRIPT_DIR"
pnpm install

# 3. Start Docker containers
echo "[3/6] Starting Docker containers..."
docker compose up -d

# 4. Wait for PostgreSQL to be ready
echo "[4/6] Waiting for PostgreSQL..."
for i in $(seq 1 30); do
  if docker compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1; then
    echo "  PostgreSQL is ready"
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo "  ERROR: PostgreSQL did not become ready in time"
    exit 1
  fi
  sleep 1
done

# 5. Push database schema
echo "[5/6] Pushing database schema..."
pnpm db:push

# 6. Seed database
echo "[6/6] Seeding database..."
pnpm db:seed

echo ""
echo "=== Setup complete! ==="
echo ""
echo "Start development:"
echo "  pnpm dev"
echo ""
echo "Access:"
echo "  API: http://localhost:${API_PORT:-3001}"
echo "  Web: http://localhost:5173"
echo ""
echo "Default users:"
echo "  admin@example.com / Admin123!"
echo "  user@example.com  / User123!"
