from sqlmodel import Field, Relationship

from .base import SQLModel
from .CoursesUsersLink import CoursesUsersLink
from .user import User, UserPublic
import uuid

class CourseBase(SQLModel):
    name: str
    course: str
    description: str

class Course(CourseBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    users: list[User] = Relationship(back_populates="courses", link_model=CoursesUsersLink)
    practices: list["Practices"] = Relationship(back_populates="course")

class CourseCreate(CourseBase):
    pass

class CoursePublic(CourseBase):
    id: uuid.UUID

class CoursePublicWithUsersAndPractices(CourseBase):
    id: uuid.UUID
    users: list[UserPublic]
    practices: list["PracticePublic"]

class CoursePublicWithUsers(CourseBase):
    id: uuid.UUID
    users: list[UserPublic]

class CoursePublicWithPractices(CourseBase):
    id: uuid.UUID
    practices: list["PracticePublic"]

class CoursesOut(SQLModel):
    data: list[CoursePublic]
    count: int