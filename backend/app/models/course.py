from sqlmodel import Field, Relationship

from .base import SQLModel
from .CoursesUsersLink import CoursesUsersLink
from .user import User, UserOut

class CourseBase(SQLModel):
    name: str
    course: str
    description: str

class Course(CourseBase, table=True):
    id: int | None = Field(default=None, primary_key=True)
    users: list[User] = Relationship(back_populates="courses", link_model=CoursesUsersLink)
    practices: list["Practices"] = Relationship(back_populates="course")

class CoursePublic(CourseBase):
    id: int

class CoursePublicWithUsersAndPractices(CourseBase):
    id: int
    users: list[UserOut]
    practices: list["PracticePublic"]

class CoursePublicWithUsers(CourseBase):
    id: int
    users: list[UserOut]

class CoursePublicWithPractices(CourseBase):
    id: int
    practices: list["PracticePublic"]

class CoursesOut(SQLModel):
    data: list[CoursePublic]
    count: int