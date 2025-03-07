from sqlmodel import Field, Relationship

from datetime import date
from .base import SQLModel
from .PracticesUsersLink import PracticesUsersLink
from .user import User, UserOut
from .course import Course, CoursePublic

class PracticeBase(SQLModel):
    course_id: int
    name: str
    description: str
    programming_language: str
    due_date: date

class Practice(PracticeBase, table=True):
    id: int | None = Field(default=None, primary_key=True)
    users: list[User] = Relationship(back_populates="practices", link_model=PracticesUsersLink)
    course: Course = Relationship(back_populates="practices")

class PracticePublic(PracticeBase):
    id: int

class PracticePublicWithUsers(PracticeBase):
    id: int
    users: list[UserOut]

class PracticePublicWithCourse(PracticeBase):
    id: int
    course: CoursePublic