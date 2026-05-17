from typing import Any, List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Fact Checker AI"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "changeme-override-in-env"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8
    # SQLite by default — no Postgres/Redis needed
    SQLALCHEMY_DATABASE_URI: str = "sqlite:///./factchecker.db"
    UPLOAD_DIR: str = "uploads"
    FIRST_SUPERUSER: str = "admin@factchecker.com"
    FIRST_SUPERUSER_PASSWORD: str = "admin123"
    SERPER_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    JINA_API_KEY: str = ""
    REALITY_DEFENDER_API_KEY: str = "rd_2852d3c04871bde0_b910fde9d9e2bb15adc77320226df0db"

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
