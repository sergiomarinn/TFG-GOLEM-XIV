""" Practices users link """
from sqlmodel import Field, Enum, Column
from sqlalchemy.dialects.postgresql import JSONB
from .base import SQLModel
import uuid
import enum

class StatusEnum(str, enum.Enum):
    NOT_SUBMITTED = "not_submitted"
    SUBMITTED = "submitted"
    CORRECTING = "correcting"
    CORRECTED = "corrected"
    REJECTED = "rejected"

class PracticesUsersLink(SQLModel, table=True):
    user_niub: str = Field(foreign_key="user.niub", primary_key=True)
    practice_id: uuid.UUID = Field(foreign_key="practice.id", primary_key=True)
    status: StatusEnum = Field(default=StatusEnum.NOT_SUBMITTED, sa_column=Column(Enum(StatusEnum), nullable=False, server_default='NOT_SUBMITTED'))
    correction: dict | None = Field(default=None, sa_type=JSONB)