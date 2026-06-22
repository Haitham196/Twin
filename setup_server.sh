#!/bin/bash
# Haitham AI Twin — Full Server Setup Script
# Run as root on the Linux server
# Usage: curl -fsSL https://raw.githubusercontent.com/haitham196/twin/main/setup_server.sh | bash

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()  { echo -e "${GREEN}[+]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
err()  { echo -e "${RED}[x]${NC} $1"; exit 1; }

echo "============================================"
echo "   Haitham AI Twin — Server Setup"
echo "============================================"
echo ""

# ── 1. Check ports ────────────────────────────────────────────────────────────
log "Checking ports 3000 and 8000..."
if ss -tlnp | grep -q ':3000 '; then
    warn "Port 3000 is already in use:"
    ss -tlnp | grep ':3000 '
    read -p "Continue anyway? (y/N) " yn
    [[ "$yn" != "y" ]] && err "Aborted."
fi
if ss -tlnp | grep -q ':8000 '; then
    warn "Port 8000 is already in use:"
    ss -tlnp | grep ':8000 '
    read -p "Continue anyway? (y/N) " yn
    [[ "$yn" != "y" ]] && err "Aborted."
fi
log "Ports look good."

# ── 2. Install Docker if missing ──────────────────────────────────────────────
if ! command -v docker &>/dev/null; then
    log "Installing Docker..."
    apt-get update -qq
    apt-get install -y ca-certificates curl gnupg
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
        https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
        > /etc/apt/sources.list.d/docker.list
    apt-get update -qq
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    log "Docker installed."
else
    log "Docker already installed: $(docker --version)"
fi

# ── 3. Install git if missing ─────────────────────────────────────────────────
if ! command -v git &>/dev/null; then
    log "Installing git..."
    apt-get install -y git
fi

# ── 4. Clone or update the repo ───────────────────────────────────────────────
APP_DIR="/opt/twin"
REPO_URL="https://github.com/haitham196/twin.git"
BRANCH="claude/claude-md-docs-180dpr"

if [ -d "$APP_DIR/.git" ]; then
    log "Repo already cloned — pulling latest..."
    cd "$APP_DIR"
    git fetch origin "$BRANCH"
    git checkout "$BRANCH"
    git pull origin "$BRANCH"
else
    log "Cloning repo to $APP_DIR..."
    git clone --branch "$BRANCH" "$REPO_URL" "$APP_DIR"
    cd "$APP_DIR"
fi

# ── 5. Copy haitham.jpg if available ─────────────────────────────────────────
if [ -f "/tmp/haitham.jpg" ]; then
    cp /tmp/haitham.jpg "$APP_DIR/assets/haitham.jpg"
    log "haitham.jpg copied."
else
    warn "haitham.jpg not found — avatar will show placeholder. Add it later: $APP_DIR/assets/haitham.jpg"
fi

# ── 6. Create .env ────────────────────────────────────────────────────────────
if [ -f "$APP_DIR/.env" ]; then
    warn ".env already exists — skipping. Edit if needed: nano $APP_DIR/.env"
else
    log "Creating .env — please enter your API keys:"
    echo ""
    read -rp "OpenAI API key (sk-proj-...): " OPENAI_KEY
    [ -z "$OPENAI_KEY" ] && err "OpenAI key is required."
    read -rp "Simli API key: " SIMLI_KEY
    read -rp "Simli Face ID: " SIMLI_FACE

    SERVER_IP=$(curl -s --max-time 5 ifconfig.me 2>/dev/null || echo "162.35.161.123")

    cat > "$APP_DIR/.env" << ENVEOF
OPENAI_API_KEY=${OPENAI_KEY}
SIMLI_API_KEY=${SIMLI_KEY}
SIMLI_FACE_ID=${SIMLI_FACE}
OPENAI_TTS_VOICE=nova
ELEVENLABS_API_KEY=
ELEVENLABS_VOICE_ID=
CHROMA_PATH=./data/chroma
DB_PATH=./data/conversations.db
HOST=0.0.0.0
PORT=8000
FRONTEND_URL=http://${SERVER_IP}:3000
NEXT_PUBLIC_WS_URL=ws://${SERVER_IP}:8000/ws/chat
NEXT_PUBLIC_API_URL=http://${SERVER_IP}:8000
NEXT_PUBLIC_SIMLI_API_KEY=${SIMLI_KEY}
NEXT_PUBLIC_SIMLI_FACE_ID=${SIMLI_FACE}
ENVEOF
    log ".env created."
fi

# ── 7. Build & run ────────────────────────────────────────────────────────────
log "Building Docker images (3-5 min first time)..."
cd "$APP_DIR"
docker compose down 2>/dev/null || true
docker compose up --build -d

log "Waiting for services to start..."
sleep 15

# ── 8. Ingest knowledge base ──────────────────────────────────────────────────
log "Ingesting knowledge base..."
docker compose exec -T backend python backend/knowledge/ingest.py --dir knowledge_base/china_trip \
    || warn "Ingest failed — run later: cd /opt/twin && docker compose exec backend python backend/knowledge/ingest.py --dir knowledge_base/china_trip"

# ── 9. Systemd auto-start ─────────────────────────────────────────────────────
log "Setting up systemd service..."
cat > /etc/systemd/system/twin.service << 'SVCEOF'
[Unit]
Description=Haitham AI Twin
Requires=docker.service
After=docker.service network-online.target

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/twin
ExecStart=/usr/bin/docker compose up -d
ExecStop=/usr/bin/docker compose down
TimeoutStartSec=300

[Install]
WantedBy=multi-user.target
SVCEOF
systemctl daemon-reload && systemctl enable twin.service
log "Auto-start on reboot: enabled."

# ── 10. Health check ──────────────────────────────────────────────────────────
sleep 5
B=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health 2>/dev/null || echo 0)
F=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null || echo 0)

echo ""
echo "============================================"
[ "$B" = "200" ] && log "Backend  ✓  :8000" || warn "Backend HTTP $B — check: docker compose logs backend"
[ "$F" = "200" ] && log "Frontend ✓  :3000" || warn "Frontend HTTP $F — check: docker compose logs frontend"
echo ""
SERVER_IP=$(curl -s --max-time 5 ifconfig.me 2>/dev/null || echo "162.35.161.123")
echo "  Open: http://${SERVER_IP}:3000"
echo "============================================"
echo ""
echo "  Useful commands:"
echo "    docker compose -f /opt/twin/docker-compose.yml logs -f"
echo "    systemctl restart twin"
echo ""
