""" Courses users link """
from sqlmodel import Field
from .base import SQLModel
import uuid

class CoursesUsersLink(SQLModel, table=True):
    user_niub: str | None = Field(default=None, foreign_key="user.niub", primary_key=True)
    course_id: uuid.UUID | None = Field(default=None, foreign_key="course.id", primary_key=True)