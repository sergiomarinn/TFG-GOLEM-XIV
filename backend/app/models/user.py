from pydantic import EmailStr
from sqlmodel import Field, Relationship

from .base import SQLModel
from .CoursesUsersLink import CoursesUsersLink
from .PracticesUsersLink import PracticesUsersLink

class UserBase(SQLModel):
    niub: str = Field(primary_key=True)
    email: str = Field(index=True, sa_column_kwargs={'unique': True})
    name: str
    surnames: str
    is_student: bool = Field(default=True)
    is_teacher: bool = Field(default=False)
    is_admin: bool = Field(default=False)

class User(UserBase, table=True):
    hashed_password: str
    courses: list["Course"] = Relationship(back_populates="users", link_model=CoursesUsersLink)
    practices: list["Practice"] = Relationship(back_populates="users", link_model=PracticesUsersLink)

class UserCreate(UserBase):
    password: str

class UserCreateOpen(SQLModel):
    niub: str
    email: EmailStr
    password: str
    name: str
    surnames: str

class UserUpdate(UserBase):
    niub: str | None
    email: str | None
    name: str | None
    surnames: str | None

class UserUpdateMe(SQLModel):
    email: EmailStr | None
    name: str | None
    surnames: str | None

class UserUpdatePassword(SQLModel):
    current_password: str
    new_password: str

class UserOut(UserBase):
    id: int

class UsersOut(SQLModel):
    data: list[UserOut]
    count: int

class UserCoursesOut(SQLModel):
    data: list["CoursePublic"]
    count: int

class UserPracticesOut(SQLModel):
    data: list["PracticesPublic"]
    count: int

class UserCoursesPracticesOut(UserBase):
    courses: list["CoursePublic"]
    practices: list["PracticePublicWithCourse"]

class Token(SQLModel):
    access_token: str
    token_type: str = "bearer"

class TokenPayload(SQLModel):
    sub: int | None = None

class NewPassword(SQLModel):
    token: str
    new_password: str