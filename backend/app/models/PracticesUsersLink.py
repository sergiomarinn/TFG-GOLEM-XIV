""" Practices users link """

from sqlmodel import Field
from .base import SQLModel
import uuid

class PracticesUsersLink(SQLModel, table=True):
    user_niub: str = Field(foreign_key="user.niub", primary_key=True)
    practice_id: uuid.UUID = Field(foreign_key="practice.id", primary_key=True)
    corrected: bool = Field(default=False)
