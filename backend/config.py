from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    openai_api_key: str

    # ElevenLabs — optional, used for voice clone; falls back to OpenAI TTS
    elevenlabs_api_key: str = ""
    elevenlabs_voice_id: str = ""

    # OpenAI TTS — used when ElevenLabs is not configured
    # Voices: alloy, echo, fable, onyx, nova, shimmer
    openai_tts_voice: str = "nova"

    # Simli.com — cloud-rendered animated face (no GPU required)
    simli_api_key: str = ""
    simli_face_id: str = ""

    chroma_path: str = "./data/chroma"
    db_path: str = "./data/conversations.db"

    host: str = "0.0.0.0"
    port: int = 8000
    frontend_url: str = "http://localhost:3000"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
