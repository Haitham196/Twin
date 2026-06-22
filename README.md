# Haitham AI Twin

> **Digital twin of Haitham** — Application Support Manager, Healthcare IT · 650 branches · China Medical AI Program 2025

An AI system that runs on a Linux server and lets any user open a browser (mobile or PC) to have a real-time voice + text conversation with an animated AI version of Haitham. The twin has deep knowledge of the 14-day China Medical AI training trip and Haitham's healthcare IT domain.

---

## What It Does

| Capability | How |
|---|---|
| **Talks like Haitham** | GPT-4o with Haitham's identity, communication style, and healthcare IT context |
| **Arabic & English** | Auto-detects language per message and replies in the same language |
| **Animated face** | Simli.com cloud-rendered face (no GPU) or canvas fallback |
| **Voice input** | Push-to-talk mic → Whisper STT → response |
| **TTS voice** | OpenAI TTS `tts-1` (nova, supports Arabic). Optional ElevenLabs voice clone |
| **Knowledge base** | ChromaDB RAG — China trip, healthcare IT, conversation memory |
| **Remembers conversations** | SQLite — all sessions and messages persisted |
| **Mobile friendly** | Responsive layout — phone, tablet, desktop |

---

## Architecture

```
Browser (mobile or PC)
   │  WebSocket  (text + voice)
   ▼
Backend — FastAPI  (port 8000)
   ├── GPT-4o          →  streaming response
   ├── ChromaDB        →  semantic search (top-3 chunks)
   ├── SQLite          →  conversation history (last 8 messages)
   ├── Whisper API     →  voice transcription
   └── OpenAI TTS      →  MP3 audio → base64 → browser

Frontend — Next.js  (port 3000)
   ├── AvatarFace.tsx      canvas animation (blink, drift, lip sync)
   ├── AvatarStream.tsx    Simli WebRTC video stream
   ├── VoiceButton.tsx     push-to-talk recording
   └── useWebSocket.ts     state machine (idle/listening/thinking/speaking)

Nginx  (port 443)  →  HTTPS reverse proxy
```

---

## Quick Deploy (Server)

```bash
OPENAI_API_KEY="sk-proj-..." \
SIMLI_API_KEY="your-simli-key" \
SIMLI_FACE_ID="your-face-id" \
bash <(curl -fsSL https://raw.githubusercontent.com/haitham196/twin/main/setup_server.sh)
```

The script installs Docker, clones the repo, creates `.env`, builds, starts containers, ingests the knowledge base, and sets up systemd auto-start.

---

## Local Development

### Backend
```bash
pip install -r requirements.txt
cp .env.example .env        # fill in your keys
uvicorn backend.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
cp .env.local.example .env.local   # fill in URLs
npm run dev                         # → http://localhost:3000
```

### Ingest knowledge base
```bash
python backend/knowledge/ingest.py --dir knowledge_base/china_trip
python backend/knowledge/ingest.py --dir knowledge_base
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `OPENAI_API_KEY` | ✅ | GPT-4o + Whisper + TTS |
| `SIMLI_API_KEY` | Optional | Simli.com animated face |
| `SIMLI_FACE_ID` | Optional | Face ID from Simli dashboard |
| `OPENAI_TTS_VOICE` | Optional | `nova` (default). Options: alloy/echo/fable/onyx/nova/shimmer |
| `ELEVENLABS_API_KEY` | Optional | Voice clone — better quality |
| `ELEVENLABS_VOICE_ID` | Optional | From ElevenLabs voice clone setup |

**Frontend build-time** (in `.env` for Docker, `.env.local` for dev):

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_WS_URL` | `wss://your-domain/ws/chat` |
| `NEXT_PUBLIC_API_URL` | `https://your-domain` |
| `NEXT_PUBLIC_SIMLI_API_KEY` | Same as `SIMLI_API_KEY` |
| `NEXT_PUBLIC_SIMLI_FACE_ID` | Same as `SIMLI_FACE_ID` |

---

## Adding Knowledge

Drop `.md` files into `knowledge_base/china_trip/` then run:

```bash
# Local
python backend/knowledge/ingest.py --dir knowledge_base/china_trip

# On server
docker compose -f /opt/twin/docker-compose.yml exec backend \
  python backend/knowledge/ingest.py --dir knowledge_base/china_trip
```

Knowledge is available immediately — no restart needed.

---

## Simli.com (Animated Face)

Simli renders your photo as a talking face using their cloud GPU — zero GPU needed on your server.

1. Sign up at [simli.com](https://simli.com)
2. Upload `assets/haitham.jpg` → copy the Face ID
3. Add `SIMLI_API_KEY` and `SIMLI_FACE_ID` to `.env`
4. **Requires HTTPS** (WebRTC browser requirement)

Without Simli, the canvas avatar (blink, head drift, lip sync ring) is used automatically.

---

## ElevenLabs Voice Clone (Optional)

For Haitham's real voice:

1. Record 1–3 min of natural speech (quiet room)
2. [elevenlabs.io](https://elevenlabs.io) → Voice Lab → Add Voice → Instant Voice Clone
3. Upload recording → copy `voice_id`
4. Add `ELEVENLABS_API_KEY` + `ELEVENLABS_VOICE_ID` to `.env`

Without ElevenLabs, OpenAI TTS (`nova`) is used — supports Arabic and English.

---

## Server Commands

```bash
# Live logs
docker compose -f /opt/twin/docker-compose.yml logs -f

# Restart backend
docker compose -f /opt/twin/docker-compose.yml restart backend

# Restart everything
systemctl restart twin

# Update to latest code
cd /opt/twin \
  && git pull origin claude/claude-md-docs-180dpr \
  && docker compose up --build -d

# Container status
docker compose -f /opt/twin/docker-compose.yml ps
```

---

## Phase Roadmap

| Phase | Status | Description |
|---|---|---|
| 1 | ✅ | Text chat · Canvas avatar · ChromaDB RAG · OpenAI TTS |
| 2 | ✅ | Voice input (Whisper) · Simli.ai face · Push-to-talk |
| 3 | Next | MediaPipe vision — presence, eye contact, gesture detection |
| 4 | Future | Cross-session memory — summaries stored in ChromaDB |
| 5 | Future | LivePortrait — swap Simli when GPU available (one file change) |
| 6 | Future | Agent tools — Freshservice, Teams, Outlook, SharePoint |

---

## Cost Estimate

| Component | Service | Monthly Cost |
|---|---|---|
| AI brain | OpenAI GPT-4o | ~$5–15 |
| Voice output | OpenAI TTS | ~$1–3 |
| Voice clone | ElevenLabs (optional) | Free / $5 |
| Animated face | Simli.com | Free (100 min) |
| Transcription | Whisper API | ~$0.006/min |
| Server | VPS | Varies |
| **Total** | | **~$10–25/month** |

---

## Project Structure

```
Twin/
├── backend/
│   ├── main.py                    # FastAPI — WebSocket chat + voice
│   ├── config.py                  # Pydantic settings from .env
│   ├── agent/system_prompt.py     # Haitham AI identity + build_prompt()
│   ├── conversation/
│   │   ├── engine.py              # GPT-4o turn handler + streaming
│   │   └── context_builder.py     # Prompt assembly (knowledge + history)
│   ├── memory/
│   │   ├── sqlite_store.py        # Users, sessions, messages CRUD
│   │   └── chroma_store.py        # ChromaDB semantic add + query
│   ├── knowledge/ingest.py        # CLI: chunk + embed markdown docs
│   ├── tts/elevenlabs.py          # TTS chain: ElevenLabs → OpenAI → silent
│   └── audio/
│       ├── stt.py                 # Whisper API transcription
│       └── vad.py                 # Voice activity detection
│
├── frontend/
│   ├── app/page.tsx               # Main UI — responsive layout
│   ├── components/
│   │   ├── AvatarFace.tsx         # Canvas avatar (offline fallback)
│   │   ├── AvatarStream.tsx       # Simli WebRTC video element
│   │   ├── VoiceButton.tsx        # Push-to-talk mic button
│   │   ├── ChatInput.tsx          # Text input + send
│   │   ├── StatusBadge.tsx        # Idle / Listening / Thinking / Speaking
│   │   ├── KnowledgePanel.tsx     # Sidebar topic chips
│   │   └── UserOnboarding.tsx     # First-visit name modal
│   └── hooks/
│       ├── useWebSocket.ts        # WS client + twin state machine
│       ├── useVoice.ts            # Mic recording (push-to-talk, WebM)
│       └── useSimli.ts            # Simli.com integration
│
├── knowledge_base/
│   ├── china_trip/                # 14-day China Medical AI program
│   │   ├── day01.md               # Zhongshan / Fudan — all 8 sessions
│   │   ├── fudan_university.md
│   │   ├── huawei.md
│   │   ├── united_imaging.md
│   │   ├── ai_endoscopy.md
│   │   ├── medical_foundation_models.md
│   │   └── cyber_resilience.md
│   └── haitham_profile.md
│
├── assets/haitham.jpg             # Photo for avatar (gitignored)
├── Dockerfile.backend
├── frontend/Dockerfile
├── docker-compose.yml
├── nginx.conf
├── setup_server.sh                # One-command deploy script
└── .env.example
```
