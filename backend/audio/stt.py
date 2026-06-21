"""
Speech-to-text via OpenAI Whisper API.
Accepts WebM, MP3, WAV, or any format Whisper supports.
"""
import httpx
from backend.config import settings


async def transcribe(audio_bytes: bytes, filename: str = "audio.webm", language: str = "en") -> str:
    """Transcribe audio bytes to text. Returns empty string on failure."""
    if not audio_bytes:
        return ""

    url = "https://api.openai.com/v1/audio/transcriptions"
    headers = {"Authorization": f"Bearer {settings.openai_api_key}"}

    async with httpx.AsyncClient(timeout=60) as client:
        response = await client.post(
            url,
            headers=headers,
            files={"file": (filename, audio_bytes, "audio/webm")},
            data={"model": "whisper-1", "language": language},
        )
        response.raise_for_status()
        return response.json().get("text", "").strip()
