"""
Text-to-Speech module.

Priority:
  1. ElevenLabs (if ELEVENLABS_API_KEY + ELEVENLABS_VOICE_ID are set) — best voice quality
  2. OpenAI TTS  (if OPENAI_API_KEY is set)                            — good quality, no extra account
  3. Silent      (returns empty bytes)                                  — graceful fallback
"""
import httpx
from backend.config import settings


async def text_to_speech(text: str) -> bytes:
    """Return MP3 audio bytes for the given text. Never raises — returns b'' on failure."""
    if not text.strip():
        return b""

    # ── ElevenLabs (preferred when voice clone is set up) ──────────────────
    if settings.elevenlabs_api_key and settings.elevenlabs_voice_id:
        try:
            return await _elevenlabs(text)
        except Exception:
            pass  # fall through to OpenAI

    # ── OpenAI TTS (works with the same API key as GPT-4o) ─────────────────
    if settings.openai_api_key:
        try:
            return await _openai_tts(text)
        except Exception:
            pass

    return b""


async def _elevenlabs(text: str) -> bytes:
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{settings.elevenlabs_voice_id}"
    headers = {"xi-api-key": settings.elevenlabs_api_key, "Content-Type": "application/json"}
    payload = {
        "text": text,
        "model_id": "eleven_multilingual_v2",
        "voice_settings": {
            "stability": 0.5,
            "similarity_boost": 0.75,
            "style": 0.0,
            "use_speaker_boost": True,
        },
    }
    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.post(url, headers=headers, json=payload)
        r.raise_for_status()
        return r.content


async def _openai_tts(text: str) -> bytes:
    """OpenAI TTS — supports Arabic + English, uses tts-1 model."""
    url = "https://api.openai.com/v1/audio/speech"
    headers = {
        "Authorization": f"Bearer {settings.openai_api_key}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": "tts-1",
        "input": text,
        "voice": settings.openai_tts_voice,   # alloy / echo / fable / onyx / nova / shimmer
        "response_format": "mp3",
    }
    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.post(url, headers=headers, json=payload)
        r.raise_for_status()
        return r.content
