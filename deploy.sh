#!/usr/bin/env bash
set -e

# ==========================================
# Deployment Configuration
# ==========================================
REMOTE_HOST="neayouk.kunapheap.com"
REMOTE_USER="ubuntu"
REMOTE_SERVER="${REMOTE_USER}@${REMOTE_HOST}"
SUDO_PASS="${SUDO_PASS:-********}"
for arg in "$@"; do
  [[ $prev == "--pass" ]] && SUDO_PASS="$arg"
  [[ $arg == --pass=* ]] && SUDO_PASS="${arg#*=}"
  prev="$arg"
done

# If password was not passed and default is empty or masked, prompt interactively
if [ -z "$SUDO_PASS" ] || [ "$SUDO_PASS" = "********" ]; then
  read -s -p "🔑 Enter sudo password for ${REMOTE_SERVER}: " SUDO_PASS
  echo ""
fi

# Remote Paths
REMOTE_APP_DIR="/home/ubuntu/neayouk"
REMOTE_API_DIR="${REMOTE_APP_DIR}/apps/api"
REMOTE_WEB_TEMP_DIR="/home/ubuntu/dist"
REMOTE_WWW_DIR="/var/www/neayouk"
REMOTE_ENV='export PNPM_HOME="$HOME/.local/share/pnpm"; export PATH="$PNPM_HOME:$PATH:/usr/local/bin"; [ -s "$HOME/.nvm/nvm.sh" ] && . "$HOME/.nvm/nvm.sh"'

# Local Paths (detect apps/ or app/ directory in monorepo)
LOCAL_API_DIR="apps/api"
[ ! -d "$LOCAL_API_DIR" ] && [ -d "app/api" ] && LOCAL_API_DIR="app/api"

LOCAL_WEB_DIR="apps/web"
[ ! -d "$LOCAL_WEB_DIR" ] && [ -d "app/web" ] && LOCAL_WEB_DIR="app/web"

echo "=========================================="
echo "🚀 Starting Deployment to ${REMOTE_HOST}"
echo "=========================================="

# # ------------------------------------------
# # Step 1: Build the project locally
# # ------------------------------------------
# echo "📦 Step 1: Running pnpm build..."
# pnpm build

# ------------------------------------------
# Step 2: Prepare remote directories
# ------------------------------------------
echo "📁 Step 2: Ensuring remote directories exist..."
ssh "${REMOTE_SERVER}" "mkdir -p ${REMOTE_API_DIR} ${REMOTE_APP_DIR}/app/api /home/ubuntu"

# ------------------------------------------
# Step 3: Copy API dist and dist-db via SCP
# ------------------------------------------
echo "📤 Step 3: Copying API dist and dist-db to ${REMOTE_SERVER}:${REMOTE_API_DIR}..."
scp -r "${LOCAL_API_DIR}/dist" "${LOCAL_API_DIR}/dist-db" "${REMOTE_SERVER}:${REMOTE_API_DIR}/"

# Also sync to app/api to satisfy any legacy scripts referencing app/api
ssh "${REMOTE_SERVER}" "cp -rf ${REMOTE_API_DIR}/dist ${REMOTE_API_DIR}/dist-db ${REMOTE_APP_DIR}/app/api/ 2>/dev/null || true"

# ------------------------------------------
# Step 4: Pull code and install dependencies on remote server
# ------------------------------------------
echo "📥 Step 4: Pulling latest code and installing dependencies on ${REMOTE_HOST}..."
ssh "${REMOTE_SERVER}" "bash -lc '${REMOTE_ENV}; cd ${REMOTE_APP_DIR} && git pull && pnpm install --prod'"

# ------------------------------------------
# Step 5: Copy Web dist via SCP
# ------------------------------------------
echo "📤 Step 5: Copying Web dist to ${REMOTE_SERVER}:${REMOTE_WEB_TEMP_DIR}..."
ssh "${REMOTE_SERVER}" "rm -rf ${REMOTE_WEB_TEMP_DIR}"
scp -r "${LOCAL_WEB_DIR}/dist" "${REMOTE_SERVER}:/home/ubuntu/"

# ------------------------------------------
# Step 6: SSH & Deploy Web dist to /var/www/neayouk with sudo
# ------------------------------------------
echo "🌐 Step 6: Deploying web files to ${REMOTE_WWW_DIR} with sudo..."
ssh "${REMOTE_SERVER}" "echo '${SUDO_PASS}' | sudo -S cp -rf ${REMOTE_WEB_TEMP_DIR}/. ${REMOTE_WWW_DIR}/"

# ------------------------------------------
# Step 7: Run database migrations
# ------------------------------------------
echo "🗄️ Step 7: Running database migrations on ${REMOTE_HOST}..."
ssh "${REMOTE_SERVER}" "bash -lc '${REMOTE_ENV}; cd ${REMOTE_API_DIR} && node dist-db/migrator.js up'"

# ------------------------------------------
# Step 8: Reload API via PM2
# ------------------------------------------
echo "🔄 Step 8: Reloading API via PM2..."
ssh "${REMOTE_SERVER}" "bash -lc '${REMOTE_ENV}; cd ${REMOTE_APP_DIR} && (pm2 reload ecosystem.config.cjs --env production || pm2 reload neayouk-api || true)'"

echo "=========================================="
echo "✅ Deployment completed successfully!"
echo "=========================================="
