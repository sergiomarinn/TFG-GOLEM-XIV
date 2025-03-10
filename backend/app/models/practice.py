from sqlmodel import Field, Relationship

from datetime import date
from .base import SQLModel
from .PracticesUsersLink import PracticesUsersLink
from .user import User, UserPublic
from .course import Course, CoursePublic
import uuid

class PracticeBase(SQLModel):
    course_id: int
    name: str
    description: str
    programming_language: str
    due_date: date

class Practice(PracticeBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    users: list[User] = Relationship(back_populates="practices", link_model=PracticesUsersLink)
    course: Course = Relationship(back_populates="practices")

class PracticeCreate(PracticeBase):
    pass

class PracticePublic(PracticeBase):
    id: uuid.UUID

class PracticePublicWithUsers(PracticeBase):
    id: uuid.UUID
    users: list[UserPublic]

class PracticePublicWithCourse(PracticeBase):
    id: uuid.UUID
    course: CoursePublic

class PracticesOut(SQLModel):
    data: list[PracticePublic]
    count: int