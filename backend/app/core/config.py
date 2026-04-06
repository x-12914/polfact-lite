from typing import Any, List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "PolFact Lite"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "changeme-override-in-env"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8
    # SQLite by default — no Postgres/Redis needed
    SQLALCHEMY_DATABASE_URI: str = "sqlite:///./polfact.db"
    UPLOAD_DIR: str = "uploads"
    FIRST_SUPERUSER: str = "admin@polfact.com"
    FIRST_SUPERUSER_PASSWORD: str = "admin123"
    SERPER_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    SIGHTENGINE_API_USER: str = "1977380819"
    SIGHTENGINE_API_SECRET: str = "VYKTRrxnbDiCMEKdyqEA9DddaY9cSAtF"

    BACKEND_CORS_ORIGINS: Union[str, List[str]] = ""

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Any) -> List[str]:
        if not v:
            return []
        if isinstance(v, list):
            return [str(origin) for origin in v]
        if isinstance(v, str):
            return [i.strip() for i in v.split(",") if i.strip()]
        return []

    model_config = SettingsConfigDict(
        case_sensitive=True,
        env_file=".env",
        extra="ignore"
    )


settings = Settings()
