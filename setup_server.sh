#!/bin/bash
# Haitham AI Twin — Server Setup
# Usage:
#   OPENAI_API_KEY="sk-..." SIMLI_API_KEY="..." SIMLI_FACE_ID="..." \
#   bash <(curl -fsSL https://raw.githubusercontent.com/haitham196/twin/main/setup_server.sh)

set -e

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
log()  { echo -e "${GREEN}[+]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
err()  { echo -e "${RED}[x]${NC} $1"; exit 1; }

echo "============================================"
echo "   Haitham AI Twin — Server Setup"
echo "============================================"

# ── Keys: from env vars ───────────────────────────────────────────────────────
[ -z "$OPENAI_API_KEY" ] && err "OPENAI_API_KEY not set. Run: export OPENAI_API_KEY=sk-..."
[ -z "$SIMLI_API_KEY"  ] && err "SIMLI_API_KEY not set."
[ -z "$SIMLI_FACE_ID"  ] && err "SIMLI_FACE_ID not set."

SERVER_IP=$(curl -s --max-time 5 ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')
log "Server IP: $SERVER_IP"

# ── Ports ─────────────────────────────────────────────────────────────────────
for p in 3000 8000; do
  ss -tlnp 2>/dev/null | grep -q ":$p " && warn "Port $p already in use" || true
done

# ── Docker ────────────────────────────────────────────────────────────────────
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
  log "Docker OK: $(docker --version)"
fi
command -v git &>/dev/null || apt-get install -y git

# ── Clone / update ────────────────────────────────────────────────────────────
APP="/opt/twin"
BRANCH="claude/claude-md-docs-180dpr"
if [ -d "$APP/.git" ]; then
  log "Updating repo..."
  git -C "$APP" fetch origin "$BRANCH"
  git -C "$APP" checkout "$BRANCH"
  git -C "$APP" pull origin "$BRANCH"
else
  log "Cloning repo..."
  git clone -b "$BRANCH" https://github.com/haitham196/twin.git "$APP"
fi

# ── .env ──────────────────────────────────────────────────────────────────────
log "Writing .env..."
cat > "$APP/.env" << ENVEOF
OPENAI_API_KEY=${OPENAI_API_KEY}
SIMLI_API_KEY=${SIMLI_API_KEY}
SIMLI_FACE_ID=${SIMLI_FACE_ID}
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
NEXT_PUBLIC_SIMLI_API_KEY=${SIMLI_API_KEY}
NEXT_PUBLIC_SIMLI_FACE_ID=${SIMLI_FACE_ID}
ENVEOF
log ".env written."

# ── Build & run ───────────────────────────────────────────────────────────────
log "Building Docker images (3-5 min first time)..."
cd "$APP"
docker compose down 2>/dev/null || true
docker compose up --build -d
log "Containers started. Waiting 20s..."
sleep 20

# ── Ingest knowledge ──────────────────────────────────────────────────────────
log "Ingesting knowledge base..."
docker compose exec -T backend python backend/knowledge/ingest.py --dir knowledge_base/china_trip \
  || warn "Ingest failed — run later: cd /opt/twin && docker compose exec backend python backend/knowledge/ingest.py --dir knowledge_base/china_trip"

# ── Systemd ───────────────────────────────────────────────────────────────────
log "Setting up auto-start service..."
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
log "Auto-start enabled."

# ── Health check ──────────────────────────────────────────────────────────────
sleep 5
B=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health 2>/dev/null || echo 0)
F=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null || echo 0)

echo ""
echo "============================================"
[ "$B" = "200" ] && log "Backend  OK  :8000" || warn "Backend  HTTP $B  →  docker compose -f /opt/twin/docker-compose.yml logs backend"
[ "$F" = "200" ] && log "Frontend OK  :3000" || warn "Frontend HTTP $F  →  docker compose -f /opt/twin/docker-compose.yml logs frontend"
echo ""
echo "  Open: http://${SERVER_IP}:3000"
echo "============================================"
