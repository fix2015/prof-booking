from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Application
    APP_ENV: str = "development"
    APP_SECRET_KEY: str
    APP_DEBUG: bool = False
    APP_ALLOWED_ORIGINS: str = "http://localhost:5173"

    @property
    def ALLOWED_ORIGINS(self) -> List[str]:
        return [o.strip() for o in self.APP_ALLOWED_ORIGINS.split(",")]

    # Database
    DATABASE_URL: str

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # JWT
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # Stripe
    STRIPE_SECRET_KEY: str = ""
    STRIPE_PUBLISHABLE_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""

    # Twilio
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_FROM_NUMBER: str = ""

    # Email
    SMTP_HOST: str = "localhost"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    EMAIL_FROM: str = "noreply@nailsalonplatform.com"
    EMAIL_FROM_NAME: str = "NailSalon Platform"

    # AWS S3
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_S3_BUCKET: str = "gport"
    AWS_S3_REGION: str = "eu-central-1"

    @property
    def S3_BASE_URL(self) -> str:
        return f"https://{self.AWS_S3_BUCKET}.s3.{self.AWS_S3_REGION}.amazonaws.com"

    # Seed
    FIRST_ADMIN_EMAIL: str = "admin@nailsalonplatform.com"
    FIRST_ADMIN_PASSWORD: str = "admin"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
