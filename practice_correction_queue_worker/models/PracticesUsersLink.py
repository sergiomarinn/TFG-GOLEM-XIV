from sqlmodel import Field, Column, Enum

from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import SQLModel
import uuid
import enum
from datetime import datetime

class StatusEnum(str, enum.Enum):
    NOT_SUBMITTED = "not_submitted"
    SUBMITTED = "submitted"
    CORRECTING = "correcting"
    CORRECTED = "corrected"
    REJECTED = "rejected"

class PracticesUsersLink(SQLModel, table=True):
    user_niub: str = Field(foreign_key="user.niub", primary_key=True)
    practice_id: uuid.UUID = Field(foreign_key="practice.id", primary_key=True)
    submission_date: datetime | None = Field(default=None)
    status: StatusEnum = Field(default=StatusEnum.NOT_SUBMITTED, sa_column=Column(Enum(StatusEnum), nullable=False, server_default='NOT_SUBMITTED'))
    submission_file_name: str | None = Field(default=None)
    correction: dict | None = Field(default=None, sa_type=JSONB)

