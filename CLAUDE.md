# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Haitham AI Twin** — A real-time AI digital twin running on a Linux server. Users connect from any browser (mobile or PC); the browser streams camera + microphone to the server via WebRTC, and the server streams back an animated face video + cloned voice audio. The twin has deep knowledge of a 14-day China Medical AI training trip and the user's healthcare IT domain.

Current phase: **Phase 1** — Text chat + animated face + ChromaDB knowledge base + ElevenLabs TTS.

## Commands

### Backend (Python FastAPI)
```bash
# From project root
cd backend && pip install -r ../requirements.txt

# Start backend (from project root)
uvicorn backend.main:app --reload --port 8000

# Ingest knowledge base into ChromaDB
python backend/knowledge/ingest.py --dir knowledge_base/china_trip
python backend/knowledge/ingest.py --dir knowledge_base --collection healthcare_knowledge
```

### Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev        # → http://localhost:3000
npm run build      # production build
npx tsc --noEmit   # type check only
```

### Docker (Linux server deployment)
```bash
docker-compose up --build
# Requires .env file with API keys
```

## Architecture

```
Browser (any device)
  ↕ WebSocket  (Phase 1)
  ↕ WebRTC     (Phase 2+)

Backend (Python FastAPI — port 8000)
  ├── /ws/chat          WebSocket: streaming text chat
  ├── /api/chat         REST: single-turn chat
  ├── /api/tts          REST: ElevenLabs TTS → base64 audio
  └── /api/session/*    User registration + session management

Frontend (Next.js — port 3000)
  ├── AvatarFace.tsx    Canvas animation: blink, head drift, lip sync
  ├── UserOnboarding    First-connection name collection
  ├── KnowledgePanel    China trip category chips
  └── useWebSocket.ts   WS client, twinState machine
```

**Data flow per turn:**
1. User types → WebSocket → backend
2. `ContextBuilder` → ChromaDB top-3 chunks + SQLite last 8 messages
3. GPT-4o → streaming response chunks → WebSocket → frontend
4. Full response text → ElevenLabs API → MP3 → frontend AudioContext
5. Web Audio analyser reads RMS amplitude → AvatarFace lip sync

**Memory:**
- `SQLiteStore` (`data/conversations.db`): users, sessions, messages tables
- `ChromaStore` (`data/chroma/`): 3 collections — `china_knowledge`, `healthcare_knowledge`, `conversation_memory`

## Key Files

| File | Purpose |
|------|---------|
| `backend/main.py` | FastAPI app: routes, WebSocket handler, lifespan |
| `backend/agent/system_prompt.py` | Haitham AI identity + `build_prompt()` |
| `backend/conversation/engine.py` | GPT-4o turns, streaming, message persistence |
| `backend/conversation/context_builder.py` | Assembles system prompt with knowledge + history |
| `backend/memory/sqlite_store.py` | User/session/message CRUD |
| `backend/memory/chroma_store.py` | ChromaDB wrapper — add + semantic query |
| `backend/knowledge/ingest.py` | CLI to chunk and embed markdown docs |
| `backend/tts/elevenlabs.py` | ElevenLabs TTS — full and streaming |
| `backend/animation/idle_animator.py` | Idle animation params (blink, drift, glance) |
| `frontend/app/page.tsx` | Main UI: avatar + chat + sidebars |
| `frontend/components/AvatarFace.tsx` | Canvas-based photo animation |
| `frontend/hooks/useWebSocket.ts` | WS client, twinState management |

## Configuration

Copy `.env.example` to `.env` and fill in:
```
OPENAI_API_KEY=
ELEVENLABS_API_KEY=
ELEVENLABS_VOICE_ID=   # From ElevenLabs Instant Voice Clone
SIMLI_API_KEY=         # From simli.ai (no GPU needed — cloud renders your face)
SIMLI_FACE_ID=         # From simli.ai after uploading haitham.jpg
```

**No GPU on the server?** Use Simli.ai instead of LivePortrait. Simli runs on their cloud GPU;
you just stream audio → get back animated face video via WebRTC. Free tier: 100 min/month.
When you add a GPU later, swap in LivePortrait with one file change.

## Adding Knowledge

Drop `.md` or `.txt` files into `knowledge_base/china_trip/` then run:
```bash
python backend/knowledge/ingest.py --dir knowledge_base/china_trip
```
The twin picks up new knowledge immediately on the next query (no restart needed).

## Phase Roadmap

| Phase | Status | Description |
|-------|--------|-------------|
| 1 | ✅ Done | Text chat + canvas avatar + ChromaDB RAG + ElevenLabs TTS |
| 2 | Next | Simli.ai WebRTC: real animated face from photo (no GPU); voice input via Whisper |
| 3 | Future | MediaPipe vision: presence, eye contact, gesture detection |
| 4 | Future | SQLite cross-session memory + conversation summaries |
| 5 | Future | LivePortrait: replace Simli.ai when GPU available (one file change) |
| 6 | Future | Agent tools (Freshservice, Teams, Outlook, SharePoint) |

## To Make It More "You" (Twin Quality)

1. **Expand `knowledge_base/haitham_profile.md`** — add your projects, team, daily challenges, AI vision
2. **Add `knowledge_base/china_trip/` personal notes** — day-by-day observations in your words
3. **Voice recording tips** — record 1–3 min naturally explaining something at work (quiet room, no echo)
4. **Photo for Simli.ai** — front-facing, even lighting, plain background, 512×512+
