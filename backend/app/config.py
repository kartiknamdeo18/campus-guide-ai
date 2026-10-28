import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    PROJECT_NAME: str = "CampusGuide AI Backend"
    VERSION: str = "1.0.0"
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMMA_MODEL: str = os.getenv("GEMMA_MODEL", "gemini-3.8-flash")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./campusguide.db")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "campusguide-default-supersecret-key-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    ALLOWED_ORIGINS: list = [
        origin.strip()
        for origin in os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000").split(",")
    ]

settings = Settings()
