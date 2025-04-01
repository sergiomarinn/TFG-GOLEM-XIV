from pydantic import EmailStr
from sqlmodel import Field, Relationship

from .base import SQLModel
from .CoursesUsersLink import CoursesUsersLink
from .PracticesUsersLink import PracticesUsersLink
import uuid

class UserBase(SQLModel):
    niub: str = Field(primary_key=True, min_length=12, max_length=12)
    email: str = Field(index=True, sa_column_kwargs={'unique': True})
    name: str = Field(max_length=255)
    surnames: str = Field(max_length=255)
    is_student: bool = Field(default=True)
    is_teacher: bool = Field(default=False)
    is_admin: bool = Field(default=False)

class User(UserBase, table=True):
    hashed_password: str
    courses: list["Course"] = Relationship(back_populates="users", link_model=CoursesUsersLink)
    practices: list["Practice"] = Relationship(back_populates="users", link_model=PracticesUsersLink)

class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=40)

class UserRegister(SQLModel):
    niub: str = Field(min_length=12, max_length=12)
    email: EmailStr = Field(max_length=255)
    password: str = Field(min_length=8, max_length=40)
    name: str = Field(max_length=255)
    surnames: str = Field(max_length=255)

class UserUpdate(UserBase):
    email: EmailStr | None
    password: str | None = Field(default=None, min_length=8, max_length=40)

class UserUpdateMe(SQLModel):
    email: EmailStr | None = Field(max_length=255)
    name: str | None = Field(max_length=255) 
    surnames: str | None = Field(max_length=255)

class UserUpdatePassword(SQLModel):
    current_password: str = Field(min_length=8, max_length=40)
    new_password: str = Field(min_length=8, max_length=40)

class UserPublic(UserBase):
    pass

class UsersPublic(SQLModel):
    data: list[UserPublic]
    count: int

class UserCoursesOut(SQLModel):
    data: list["CoursePublic"]
    count: int

class UserPracticesOut(SQLModel):
    data: list["PracticesPublic"]
    count: int

class UserPublicWithCoursesPractices(UserBase):
    courses: list["CoursePublic"] = []
    practices: list["PracticePublicWithCourse"] = []

class Message(SQLModel):
    message: str

class Token(SQLModel):
    access_token: str
    token_type: str = "bearer"

class TokenPayload(SQLModel):
    sub: str | None = None

class NewPassword(SQLModel):
    token: str
    new_password: str = Field(min_length=8, max_length=40)