#!/usr/bin/env bash
# ==============================================================================
# Viber Hub — Local Development Launcher
# ==============================================================================
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

cd "${ROOT_DIR}"

echo "======================================================================"
echo "  🚀 Starting Viber Messaging Hub Development Environment"
echo "======================================================================"

# 1. Check Node.js
if ! command -v node >/dev/null 2>&1; then
  echo "❌ Error: Node.js is required but not installed."
  exit 1
fi

NODE_VERSION=$(node -v)
echo "✓ Node.js detected: ${NODE_VERSION}"

# 2. Check & Initialize .env
if [ ! -f "${ROOT_DIR}/.env" ]; then
  echo "ℹ Creating default .env from .env.example..."
  cp "${ROOT_DIR}/.env.example" "${ROOT_DIR}/.env"
fi

# 3. Build workspaces if dist missing
if [ ! -d "${ROOT_DIR}/packages/shared/dist" ] || [ ! -d "${ROOT_DIR}/packages/validation/dist" ]; then
  echo "ℹ Compiling shared packages..."
  npm run build --workspace=@viberhub/shared
  npm run build --workspace=@viberhub/validation
fi

echo ""
echo "======================================================================"
echo "  🔑 Default Seed Credentials & Access Points"
echo "======================================================================"
echo "  • Web Dashboard:  http://localhost:3000"
echo "  • REST API:       http://localhost:4000/api/v1"
echo "  • API Health:     http://localhost:4000/healthz"
echo ""
echo "  Workspace Accounts (Seed Data):"
echo "    - Admin:     admin@viberhub.internal    / AdminSecretPass123!"
echo "    - Reviewer:  reviewer@viberhub.internal / ReviewerPass123!"
echo "    - Operator:  operator@viberhub.internal / OperatorPass123!"
echo "======================================================================"
echo ""

# 4. Launch Services
echo "Starting API service on port 4000 and Next.js Web on port 3000..."
npx concurrently -k -n "api,web" -c "cyan,magenta" \
  "npm run dev --workspace=@viberhub/api" \
  "npm run dev --workspace=@viberhub/web"
