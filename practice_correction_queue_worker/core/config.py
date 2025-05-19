""" Application configuration module """
import os
import secrets
import warnings
from typing import Annotated, Any, Literal

from pydantic import (
    AnyUrl,
    BeforeValidator,
    EmailStr,
    HttpUrl,
    PostgresDsn,
    UrlConstraints,
    computed_field,
    model_validator,
)
from pydantic_core import MultiHostUrl, Url
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing_extensions import Self

# Define a Pydantic definition for SQLite
SQLiteDsn = Annotated[
        Url,
        UrlConstraints(
            host_required=False,
            allowed_schemes=[
                'sqlite',
            ],
        ),
    ]

def get_env_file() -> str:
    """
        Check default locations for .env configuration file
        :return: configuration file
    """
    top_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))), '.env')
    if os.path.exists('.env'):
        env_file = '.env'
    elif os.path.exists(top_path):
        env_file = top_path
    else:
        env_file = '.env'

    return env_file

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=get_env_file(), 
        env_ignore_empty=True, 
        extra="ignore"
    )
    
    PROJECT_NAME: str
    DB_ENGINE: str = "sqlite"
    DB_HOST: str = "localhost"
    DB_PORT: int = 5432
    DB_USER: str = "golem_xiv_db_user"
    DB_PASSWORD: str | None = None
    DB_NAME: str | None = None
    CLOUDAMQP_URL: str = "amqp://guest:guest@localhost:5672/%2f"
    # CLOUDAMQP_URL: str = "amqp://guest:guest@localhost:5672/"
    RPC_URL: str = "amqp://guest:guest@localhost:5672/%2f"

    @computed_field  # type: ignore[misc]
    @property
    def SQLALCHEMY_DATABASE_URI(self) -> PostgresDsn | SQLiteDsn:
        database_uri = None
        # Check database engine
        if self.DB_ENGINE == 'postgres':
            if self.DB_NAME is None:
                self.DB_NAME = 'golem_xiv_db'
            
            is_supabase = self.DB_HOST.endswith(".supabase.com")
            query = "sslmode=require" if is_supabase else None
            
            database_uri = MultiHostUrl.build(
                scheme="postgresql+asyncpg",
                username=self.DB_USER,
                password=self.DB_PASSWORD,
                host=self.DB_HOST,
                port=self.DB_PORT,
                path=self.DB_NAME,
                query=query
            )
        elif self.DB_ENGINE == 'sqlite':
            if self.DB_NAME is None:
                self.DB_NAME = os.path.join(os.path.dirname(get_env_file()), 'sd_db.sqlite')
            database_uri = MultiHostUrl.build(
                scheme="sqlite",
                host='',
                path=self.DB_NAME,
            )
        else:
            raise ValueError(f'Invalid database engine {self.DB_ENGINE}. Valid options are [sqlite, postgres]')
        return database_uri

settings = Settings()