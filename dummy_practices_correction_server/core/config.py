""" Application configuration module """
import os
from typing import Annotated

from pydantic import (
    PostgresDsn,
    UrlConstraints,
    computed_field
)
from pydantic_core import MultiHostUrl, Url
from pydantic_settings import BaseSettings, SettingsConfigDict

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
    RPC_URL: str = "amqp://guest:guest@localhost:5672/%2f"

settings = Settings()