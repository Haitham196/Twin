from pydantic_settings import BaseSettings
from pathlib import Path


class Settings(BaseSettings):
    openai_api_key: str
    elevenlabs_api_key: str = ""
    elevenlabs_voice_id: str = ""

    chroma_path: str = "./data/chroma"
    db_path: str = "./data/conversations.db"

    wake_word: str = "haitham"
    face_proximity_threshold: float = 0.08
    liveportrait_model_path: str = "./models/liveportrait"

    host: str = "0.0.0.0"
    port: int = 8000
    frontend_url: str = "http://localhost:3000"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
