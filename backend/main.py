"""
Haitham AI Twin — FastAPI Backend

Phase 1: REST + WebSocket text chat with ChromaDB knowledge + ElevenLabs TTS.
Phase 2: Voice WebSocket — browser mic → Whisper STT → GPT-4o → ElevenLabs TTS.
Phase 3+: WebRTC camera vision, MediaPipe, LivePortrait / Simli.ai.
"""

import base64
import json
import sys
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

sys.path.insert(0, str(Path(__file__).parent.parent))

from backend.config import settings
from backend.conversation.context_builder import ContextBuilder
from backend.conversation.engine import ConversationEngine
from backend.memory.chroma_store import ChromaStore
from backend.memory.sqlite_store import SQLiteStore
from backend.tts.elevenlabs import text_to_speech
from backend.audio.stt import transcribe


# ── App state ──────────────────────────────────────────────────────────────

chroma: Optional[ChromaStore] = None
sqlite: Optional[SQLiteStore] = None
engine: Optional[ConversationEngine] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global chroma, sqlite, engine
    chroma = ChromaStore(settings.chroma_path)
    sqlite = SQLiteStore(settings.db_path)
    ctx = ContextBuilder(chroma, sqlite)
    engine = ConversationEngine(ctx, sqlite)
    yield


app = FastAPI(title="Haitham AI Twin", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Pydantic models ────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    message: str
    session_id: int
    user_name: str = "Unknown"


class RegisterUserRequest(BaseModel):
    name: str
    multi_user: bool = False
    extra_names: list[str] = []


# ── REST endpoints ─────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "ok", "twin": "Haitham AI"}


@app.post("/api/session/start")
async def start_session():
    session_id = sqlite.create_session()
    return {"session_id": session_id}


@app.post("/api/session/register-user")
async def register_user(req: RegisterUserRequest):
    existing = sqlite.get_user_by_name(req.name)
    if existing:
        sqlite.touch_user(existing["id"])
        user_id = existing["id"]
        returning = True
    else:
        user_id = sqlite.create_user(req.name)
        returning = False

    session_id = sqlite.create_session(user_id=user_id, multi_user=req.multi_user)
    return {"user_id": user_id, "session_id": session_id, "returning": returning, "name": req.name}


@app.post("/api/chat")
async def chat(req: ChatRequest):
    answer = await engine.respond(req.message, req.session_id, req.user_name)
    return {"response": answer}


@app.post("/api/chat/stream")
async def chat_stream(req: ChatRequest):
    async def event_generator():
        async for chunk in engine.respond_stream(req.message, req.session_id, req.user_name):
            yield f"data: {json.dumps({'chunk': chunk})}\n\n"
        yield "data: [DONE]\n\n"
    return StreamingResponse(event_generator(), media_type="text/event-stream")


@app.post("/api/tts")
async def tts(req: ChatRequest):
    audio_bytes = await text_to_speech(req.message)
    return {"audio_base64": base64.b64encode(audio_bytes).decode(), "format": "mp3"}


# ── Helpers ────────────────────────────────────────────────────────────────

def _register_or_touch(name: str) -> tuple[int, bool]:
    """Return (user_id, returning). Side-effects: creates or touches the user."""
    existing = sqlite.get_user_by_name(name)
    if existing:
        sqlite.touch_user(existing["id"])
        return existing["id"], True
    return sqlite.create_user(name), False


async def _stream_response(
    ws: WebSocket,
    text: str,
    session_id: int,
    user_name: str,
    include_audio: bool = False,
) -> str:
    """Stream GPT-4o response over WebSocket. Returns full text."""
    full: list[str] = []

    async for chunk in engine.respond_stream(text, session_id, user_name):
        full.append(chunk)
        await ws.send_text(json.dumps({"type": "chunk", "text": chunk}))

    full_text = "".join(full)

    # Build done payload
    done: dict = {"type": "done", "full": full_text}
    if include_audio:
        try:
            audio_bytes = await text_to_speech(full_text)
            if audio_bytes:
                done["audio_base64"] = base64.b64encode(audio_bytes).decode()
        except Exception:
            pass

    await ws.send_text(json.dumps(done))
    return full_text


# ── WebSocket: text chat ───────────────────────────────────────────────────

@app.websocket("/ws/chat")
async def ws_chat(websocket: WebSocket):
    """
    Text chat WebSocket.

    Client → Server (JSON):
      {"action": "set_user", "name": "Ahmed"}
      {"action": "chat", "message": "...", "tts": true}
      {"action": "voice", "audio_base64": "<base64 WebM>"}

    Server → Client (JSON):
      {"type": "state", "state": "thinking"|"speaking"|"idle"}
      {"type": "transcript", "text": "..."}        ← voice only
      {"type": "chunk", "text": "..."}             ← streaming token
      {"type": "done", "full": "...", "audio_base64": "..."}
      {"type": "user_recognized"|"user_registered", "name": "..."}
      {"type": "error", "message": "..."}
    """
    await websocket.accept()
    session_id = sqlite.create_session()
    user_name = "Unknown"

    try:
        while True:
            raw = await websocket.receive_text()
            msg = json.loads(raw)
            action = msg.get("action", "chat")

            # ── register user ──────────────────────────────────────────
            if action == "set_user":
                user_name = msg.get("name", "Unknown").strip() or "Unknown"
                _, returning = _register_or_touch(user_name)
                event = "user_recognized" if returning else "user_registered"
                await websocket.send_text(json.dumps({"type": event, "name": user_name}))

            # ── text chat ──────────────────────────────────────────────
            elif action == "chat":
                text = msg.get("message", "").strip()
                if not text:
                    continue
                want_tts = bool(msg.get("tts", False))
                await websocket.send_text(json.dumps({"type": "state", "state": "thinking"}))
                try:
                    await _stream_response(websocket, text, session_id, user_name, include_audio=want_tts)
                except Exception as exc:
                    await websocket.send_text(json.dumps({"type": "error", "message": str(exc)}))

            # ── voice chat ─────────────────────────────────────────────
            elif action == "voice":
                audio_b64 = msg.get("audio_base64", "")
                if not audio_b64:
                    continue

                await websocket.send_text(json.dumps({"type": "state", "state": "thinking"}))

                try:
                    audio_bytes = base64.b64decode(audio_b64)
                    transcript = await transcribe(audio_bytes)
                except Exception as exc:
                    await websocket.send_text(json.dumps({"type": "error", "message": str(exc)}))
                    continue

                if not transcript:
                    await websocket.send_text(json.dumps({"type": "state", "state": "idle"}))
                    continue

                await websocket.send_text(json.dumps({"type": "transcript", "text": transcript}))
                try:
                    await _stream_response(
                        websocket, transcript, session_id, user_name, include_audio=True
                    )
                except Exception as exc:
                    await websocket.send_text(json.dumps({"type": "error", "message": str(exc)}))

    except WebSocketDisconnect:
        pass


# ── Static assets (avatar photo served to frontend) ───────────────────────
_assets_dir = Path(__file__).parent.parent / "assets"
if _assets_dir.exists():
    app.mount("/api/assets", StaticFiles(directory=str(_assets_dir)), name="assets")
