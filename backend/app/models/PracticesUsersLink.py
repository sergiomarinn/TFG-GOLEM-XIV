""" Practices users link """

from sqlmodel import Field
from .base import SQLModel

class PracticesUsersLink(SQLModel, table=True):
    user_niub: str = Field(foreign_key="user.niub", primary_key=True)
    practice_id: int = Field(foreign_key="practice.id", primary_key=True)
    corrected: bool = Field(default=False)
