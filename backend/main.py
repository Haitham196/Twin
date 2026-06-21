"""
Haitham AI Twin — FastAPI Backend

Phase 1: REST + WebSocket chat with ChromaDB knowledge + ElevenLabs TTS.
Phase 2+: WebRTC via FastRTC, camera vision, real-time voice.
"""

import asyncio
import base64
import json
import os
import sys
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

# Ensure backend package is importable when running from project root
sys.path.insert(0, str(Path(__file__).parent.parent))

from backend.config import settings
from backend.conversation.context_builder import ContextBuilder
from backend.conversation.engine import ConversationEngine
from backend.memory.chroma_store import ChromaStore
from backend.memory.sqlite_store import SQLiteStore
from backend.tts.elevenlabs import text_to_speech


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


# ── Models ─────────────────────────────────────────────────────────────────

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
    return {
        "user_id": user_id,
        "session_id": session_id,
        "returning": returning,
        "name": req.name,
    }


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
    """Generate TTS audio from text and return as base64 MP3."""
    audio_bytes = await text_to_speech(req.message)
    audio_b64 = base64.b64encode(audio_bytes).decode()
    return {"audio_base64": audio_b64, "format": "mp3"}


# ── WebSocket chat (for Phase 1 real-time text) ────────────────────────────

@app.websocket("/ws/chat")
async def ws_chat(websocket: WebSocket):
    await websocket.accept()
    session_id = sqlite.create_session()
    user_name = "Unknown"

    try:
        while True:
            data = await websocket.receive_text()
            msg = json.loads(data)
            action = msg.get("action", "chat")

            if action == "set_user":
                user_name = msg.get("name", "Unknown")
                # Check if returning user
                existing = sqlite.get_user_by_name(user_name)
                if existing:
                    sqlite.touch_user(existing["id"])
                    await websocket.send_text(
                        json.dumps({"type": "user_recognized", "name": user_name})
                    )
                else:
                    sqlite.create_user(user_name)
                    await websocket.send_text(
                        json.dumps({"type": "user_registered", "name": user_name})
                    )
                continue

            if action == "chat":
                text = msg.get("message", "")
                # Stream response back chunk by chunk
                full = []
                async for chunk in engine.respond_stream(text, session_id, user_name):
                    full.append(chunk)
                    await websocket.send_text(
                        json.dumps({"type": "chunk", "text": chunk})
                    )
                full_text = "".join(full)
                await websocket.send_text(json.dumps({"type": "done", "full": full_text}))

    except WebSocketDisconnect:
        pass
