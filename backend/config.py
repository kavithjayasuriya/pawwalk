"""Application configuration loaded from environment variables.

The .env file is resolved relative to the backend/ directory so the app
works regardless of the current working directory.  Deployment-level
environment variables always take precedence over .env values.
"""

from pathlib import Path

from pydantic_settings import BaseSettings

_BACKEND_DIR = Path(__file__).resolve().parent


class Settings(BaseSettings):
    supabase_url: str
    supabase_publishable_key: str
    frontend_origin: str = "http://localhost:3000"

    model_config = {
        "env_file": str(_BACKEND_DIR / ".env"),
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }


settings = Settings()