""" Application configuration module """
import base64
import binascii
from io import StringIO
import os
import posixpath
import secrets
import warnings
from typing import Annotated, Any, Literal

import paramiko
import paramiko.ssh_exception
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


def parse_cors(v: Any) -> list[str] | str:
    if isinstance(v, str) and not v.startswith("["):
        return [i.strip() for i in v.split(",")]
    elif isinstance(v, list | str):
        return v
    raise ValueError(v)

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
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = secrets.token_urlsafe(32)
    # 60 minutes * 24 hours * 8 days = 8 days
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8
    DOMAIN: str = "localhost"
    ENVIRONMENT: Literal["local", "staging", "production"] = "local"

    PROFESSOR_FILES_PATH: str = posixpath.join('uploads','corrections_files', 'teachers')
    STUDENT_FILES_PATH: str = posixpath.join('uploads', 'corrections_files', 'students')

    ENABLE_EXTERNAL_SERVICE: bool = False

    @computed_field  # type: ignore[misc]
    @property
    def server_host(self) -> str:
        # Use HTTPS for anything other than local development
        if self.ENVIRONMENT == "local":
            return f"http://{self.DOMAIN}"
        return f"https://{self.DOMAIN}"

    BACKEND_CORS_ORIGINS: Annotated[
        list[AnyUrl] | str, BeforeValidator(parse_cors)
    ] = []

    @computed_field  # type: ignore[prop-decorator]
    @property
    def all_cors_origins(self) -> list[str]:
        return [str(origin).rstrip("/") for origin in self.BACKEND_CORS_ORIGINS]
    
    PROJECT_NAME: str
    SENTRY_DSN: HttpUrl | None = None
    DB_ENGINE: str = "sqlite"
    DB_HOST: str = "localhost"
    DB_PORT: int = 5432
    DB_USER: str = "golem_xiv_db_user"
    DB_PASSWORD: str | None = None
    DB_NAME: str | None = None
    CLOUDAMQP_URL: str = "amqp://guest:guest@localhost:5672/%2f"
    # CLOUDAMQP_URL: str = "amqp://guest:guest@localhost:5672/"
    SFTP_HOST: str
    SFTP_PORT: int
    SFTP_USER: str
    SFTP_KEY: str

    @computed_field
    @property
    def sftp_pkey(self) -> paramiko.RSAKey:
        try:
            key_content = base64.b64decode(self.SFTP_KEY).decode('utf-8')
            
            key_file = StringIO(key_content)
            return paramiko.RSAKey.from_private_key(key_file)
            
        except binascii.Error as e:
            raise ValueError(f"Error decoding base64 SSH key: {str(e)}")
        except paramiko.ssh_exception.SSHException as e:
            raise ValueError(f"Error parsing SSH key: {str(e)}")
        except Exception as e:
            raise ValueError(f"Error loading SSH key: {str(e)}")

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
                scheme="postgresql+psycopg",
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

    SMTP_TLS: bool = True
    SMTP_SSL: bool = False
    SMTP_PORT: int = 587
    SMTP_HOST: str | None = None
    SMTP_USER: str | None = None
    SMTP_PASSWORD: str | None = None
    EMAILS_FROM_EMAIL: EmailStr | None = None
    EMAILS_FROM_NAME: EmailStr | None = None

    @model_validator(mode="after")
    def _set_default_emails_from(self) -> Self:
        if not self.EMAILS_FROM_NAME:
            self.EMAILS_FROM_NAME = self.PROJECT_NAME
        return self

    EMAIL_RESET_TOKEN_EXPIRE_HOURS: int = 48

    @computed_field  # type: ignore[misc]
    @property
    def emails_enabled(self) -> bool:
        return bool(self.SMTP_HOST and self.EMAILS_FROM_EMAIL)

    EMAIL_TEST_USER: EmailStr = "test@example.com"
    FIRST_SUPERUSER: EmailStr
    FIRST_SUPERUSER_PASSWORD: str
    USERS_OPEN_REGISTRATION: bool = True

    def _check_default_secret(self, var_name: str, value: str | None) -> None:
        if value == "changethis":
            message = (
                f'The value of {var_name} is "changethis", '
                "for security, please change it, at least for deployments."
            )
            if self.ENVIRONMENT == "local":
                warnings.warn(message, stacklevel=1)
            else:
                raise ValueError(message)

    @model_validator(mode="after")
    def _enforce_non_default_secrets(self) -> Self:
        self._check_default_secret("SECRET_KEY", self.SECRET_KEY)
        if self.DB_ENGINE != 'sqlite':
            self._check_default_secret("DB_PASSWORD", self.DB_PASSWORD)
        self._check_default_secret(
            "FIRST_SUPERUSER_PASSWORD", self.FIRST_SUPERUSER_PASSWORD
        )

        return self

settings = Settings()