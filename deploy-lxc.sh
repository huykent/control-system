#!/bin/bash
# ==============================================
# LAN Control System — LXC + Docker Deploy Script
# Deploy on Proxmox LXC container
# ==============================================

set -e

# --- Configuration ---
REPO_URL="${REPO_URL:-https://github.com/YOUR_USER/control-system.git}"
APP_DIR="/opt/lan-control"
CONTAINER_NAME="lan-control"

echo "=============================================="
echo " LAN Control System — Docker Deploy"
echo "=============================================="

# --- Step 1: Ensure Docker is installed ---
if ! command -v docker &> /dev/null; then
    echo "[1/5] Installing Docker..."
    apt-get update -qq
    apt-get install -y -qq ca-certificates curl gnupg lsb-release
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    apt-get update -qq
    apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-compose-plugin
    systemctl enable docker
    systemctl start docker
    echo "[1/5] Docker installed ✓"
else
    echo "[1/5] Docker already installed ✓"
fi

# --- Step 2: Clone or update repo ---
if [ -d "$APP_DIR" ]; then
    echo "[2/5] Updating existing installation..."
    cd "$APP_DIR"
    git pull origin main 2>/dev/null || git pull origin master 2>/dev/null || true
else
    echo "[2/5] Cloning repository..."
    git clone "$REPO_URL" "$APP_DIR"
    cd "$APP_DIR"
fi

# --- Step 3: Create data directory for SQLite ---
echo "[3/5] Setting up data directory..."
mkdir -p "$APP_DIR/data"

# Copy existing database if it exists
if [ -f "$APP_DIR/database/app.db" ] && [ ! -f "$APP_DIR/data/app.db" ]; then
    cp "$APP_DIR/database/app.db" "$APP_DIR/data/app.db"
    echo "  → Copied existing database to data volume"
fi

# --- Step 4: Build and start ---
echo "[4/5] Building Docker image (this may take a few minutes)..."
docker compose build --no-cache

echo "[5/5] Starting container..."
docker compose up -d

# --- Done ---
echo ""
echo "=============================================="
echo " ✓ LAN Control System is running!"
echo "=============================================="
echo ""
echo " URL:        http://$(hostname -I | awk '{print $1}'):3000"
echo " Container:  $CONTAINER_NAME"
echo " Logs:       docker compose logs -f"
echo " Stop:       docker compose down"
echo " Restart:    docker compose restart"
echo ""
echo " Resource limits: 256MB RAM, 0.5 CPU"
echo "=============================================="

# --- Health check ---
echo ""
echo "Waiting for health check..."
sleep 5
if curl -sf http://localhost:3000/health > /dev/null 2>&1; then
    echo "✓ Health check passed!"
else
    echo "⚠ Health check pending — container may still be starting."
    echo "  Run: docker compose logs -f"
fi
