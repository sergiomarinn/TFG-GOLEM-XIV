from sqlmodel import Field, Relationship
from typing import List, Optional
from .base import SQLModel

class UserBase(SQLModel):
    niub: str = Field(primary_key=True)
    email: str = Field(index=True, nullable=False)
    name: str
    surnames: str
    is_student: bool = Field(default=True)
    is_teacher: bool = Field(default=False)
    is_admin: bool = Field(default=False)

class User(UserBase, table=True):
    id: int | None = Field(default=None, primary_key=True)
    hashed_password: str
    cursos: List["Cursos"] = Relationship(back_populates="usuarios", link_model="CursosUsuario")
    practicas: List["Practicas"] = Relationship(back_populates="usuarios", link_model="PracticasUsuario")

class UserCreate(UserBase):
    password: str

class UserCreateOpen(SQLModel):
    niub: str
    email: str
    password: str
    name: str
    surnames: str

class UserUpdate(UserBase):
    niub: Optional[str]
    email: Optional[str]
    name: Optional[str]
    surnames: Optional[str]

class UserUpdateMe(SQLModel):
    email: Optional[str]
    name: Optional[str]
    surnames: Optional[str]

class UserUpdatePassword(SQLModel):
    current_password: str
    new_password: str

class UserOut(UserBase):
    id: int

class UsersOut(SQLModel):
    data: list[UserOut]
    count: int


class Token(SQLModel):
    access_token: str
    token_type: str = "bearer"

class TokenPayload(SQLModel):
    sub: int | None = None

class NewPassword(SQLModel):
    token: str
    new_password: str