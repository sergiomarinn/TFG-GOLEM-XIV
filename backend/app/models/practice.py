from sqlmodel import Field, Relationship

from datetime import date
from .base import SQLModel
from .PracticesUsersLink import PracticesUsersLink
from .user import User, UserPublic
from .course import Course, CoursePublic
import uuid

class PracticeBase(SQLModel):
    course_id: uuid.UUID | None = Field(default=None, foreign_key="course.id", ondelete="CASCADE")
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

class PracticeUpdate(SQLModel):
    course_id: uuid.UUID | None
    name: str | None
    description: str | None
    programming_language: str | None
    due_date: date | None

class PracticePublic(PracticeBase):
    id: uuid.UUID

class PracticePublicWithUsers(PracticeBase):
    id: uuid.UUID
    users: list[UserPublic]

class PracticePublicWithCourse(PracticeBase):
    id: uuid.UUID
    course: CoursePublic

class PracticePublicWithUsersAndCourse(PracticeBase):
    id: uuid.UUID
    users: list[UserPublic]
    course: CoursePublic

class PracticePublicWithCorrection(PracticeBase):
    id: uuid.UUID
    correction: dict | None

class PracticesPublic(SQLModel):
    data: list[PracticePublic]
    count: int

class PracticesPublicWithCorrection(SQLModel):
    data: list[PracticePublicWithCorrection]
    count: int