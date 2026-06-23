#!/bin/bash
# Haitham AI Twin — Full Server Setup Script
# Run as root on the Linux server
# Usage: bash setup_server.sh

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

# ── 5. Copy haitham.jpg if available in current dir ──────────────────────────
if [ -f "$(dirname "$0")/haitham.jpg" ]; then
    cp "$(dirname "$0")/haitham.jpg" "$APP_DIR/assets/haitham.jpg"
    log "haitham.jpg copied."
elif [ -f "/tmp/haitham.jpg" ]; then
    cp /tmp/haitham.jpg "$APP_DIR/assets/haitham.jpg"
    log "haitham.jpg copied from /tmp."
else
    warn "haitham.jpg not found — will use text placeholder. Add it later at: $APP_DIR/assets/haitham.jpg"
fi

# ── 6. Create .env ────────────────────────────────────────────────────────────
if [ -f "$APP_DIR/.env" ]; then
    warn ".env already exists — skipping creation. Edit manually if needed: nano $APP_DIR/.env"
else
    log "Creating .env file..."
    echo ""
    echo "Enter your OpenAI API key (starts with sk-proj-):"
    read -r OPENAI_KEY
    [ -z "$OPENAI_KEY" ] && err "OpenAI key is required."

    SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || echo "162.35.161.123")
    NIPIO_DOMAIN="${SERVER_IP}.nip.io"

    echo "Enter your Simli API key (from simli.com dashboard, or press Enter to skip):"
    read -r SIMLI_API_KEY
    echo "Enter your Simli Face ID (or press Enter to skip):"
    read -r SIMLI_FACE_ID

    cat > "$APP_DIR/.env" << ENVEOF
# ── Required ─────────────────────────────────────────────────────────────────
OPENAI_API_KEY=${OPENAI_KEY}

# ── Simli.com ─────────────────────────────────────────────────────────────────
SIMLI_API_KEY=${SIMLI_API_KEY}
SIMLI_FACE_ID=${SIMLI_FACE_ID}

# ── TTS ────────────────────────────────────────────────────────────────────────
OPENAI_TTS_VOICE=nova

# ── ElevenLabs (optional) ─────────────────────────────────────────────────────
ELEVENLABS_API_KEY=
ELEVENLABS_VOICE_ID=

# ── Storage ───────────────────────────────────────────────────────────────────
CHROMA_PATH=./data/chroma
DB_PATH=./data/conversations.db

# ── Server ────────────────────────────────────────────────────────────────────
HOST=0.0.0.0
PORT=8000
FRONTEND_URL=https://${NIPIO_DOMAIN}

# ── Frontend URLs (used as Docker build args) ─────────────────────────────────
NEXT_PUBLIC_WS_URL=wss://${NIPIO_DOMAIN}/ws/chat
NEXT_PUBLIC_API_URL=https://${NIPIO_DOMAIN}
NEXT_PUBLIC_SIMLI_API_KEY=${SIMLI_API_KEY}
NEXT_PUBLIC_SIMLI_FACE_ID=${SIMLI_FACE_ID}
ENVEOF
    log ".env created."
fi

# ── 7. Build & start Docker ───────────────────────────────────────────────────
log "Building Docker images (this takes 3-5 minutes first time)..."
cd "$APP_DIR"
docker compose down 2>/dev/null || true
docker compose up --build -d

log "Waiting for services to start..."
sleep 8

# ── 8. Ingest knowledge base ──────────────────────────────────────────────────
log "Ingesting knowledge base into ChromaDB..."
docker compose exec -T backend python backend/knowledge/ingest.py --dir knowledge_base/china_trip || \
    warn "Knowledge ingest failed — run manually later: docker compose exec backend python backend/knowledge/ingest.py --dir knowledge_base/china_trip"

# ── 9. Create systemd service for auto-restart ────────────────────────────────
log "Creating systemd service: twin.service"
cat > /etc/systemd/system/twin.service << SVCEOF
[Unit]
Description=Haitham AI Twin
Requires=docker.service
After=docker.service network-online.target
Wants=network-online.target

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$APP_DIR
ExecStart=/usr/bin/docker compose up -d
ExecStop=/usr/bin/docker compose down
TimeoutStartSec=300

[Install]
WantedBy=multi-user.target
SVCEOF

systemctl daemon-reload
systemctl enable twin.service
log "Systemd service enabled (auto-starts on reboot)."

# ── 10. Health check ──────────────────────────────────────────────────────────
echo ""
echo "============================================"
echo "   Health Check"
echo "============================================"

sleep 5

BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health 2>/dev/null || echo "000")
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null || echo "000")

if [ "$BACKEND_STATUS" = "200" ]; then
    log "Backend  ✓  http://162.35.161.123:8000"
else
    warn "Backend returned HTTP $BACKEND_STATUS — check: docker compose logs backend"
fi

if [ "$FRONTEND_STATUS" = "200" ]; then
    log "Frontend ✓  http://162.35.161.123:3000"
else
    warn "Frontend returned HTTP $FRONTEND_STATUS — check: docker compose logs frontend"
fi

echo ""
echo "============================================"
echo "   DONE"
echo "============================================"
echo ""
echo "  Frontend:  http://162.35.161.123:3000"
echo "  Backend:   http://162.35.161.123:8000"
echo ""
echo "  Useful commands:"
echo "    docker compose logs -f          # live logs"
echo "    docker compose logs backend     # backend only"
echo "    docker compose restart backend  # restart backend"
echo "    systemctl restart twin          # restart everything"
echo ""
