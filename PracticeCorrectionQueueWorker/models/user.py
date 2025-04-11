from sqlmodel import Field

from sqlmodel import SQLModel
from .PracticesUsersLink import PracticesUsersLink

class User(SQLModel, table=True):
    niub: str = Field(primary_key=True, min_length=12, max_length=12)
    email: str = Field(index=True, sa_column_kwargs={'unique': True})
    name: str = Field(max_length=255)
    surnames: str = Field(max_length=255)
    is_student: bool = Field(default=True)
    is_teacher: bool = Field(default=False)
    is_admin: bool = Field(default=False)
    hashed_password: str