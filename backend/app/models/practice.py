import enum
from sqlmodel import Field, Relationship, Enum, Column
from pydantic import model_validator

from datetime import datetime
from .base import SQLModel
from .PracticesUsersLink import PracticesUsersLink, StatusEnum
from .user import User, UserPublic
import uuid
import json

from .course import Course, CoursePublic

class ProgrammingLanguageEnum(str, enum.Enum):
    PYTHON = "python"
    JAVA = "java"
    C = "c"
    C_PLUS_PLUS = "c++"
    JAVASCRIPT = "javascript"
    TYPESCRIPT = "typescript"
    KOTLIN = "kotlin"
    HTML = "html"
    CSS = "css"
    R = "r"

class PracticeBase(SQLModel):
    course_id: uuid.UUID | None = Field(default=None, foreign_key="course.id", ondelete="CASCADE")
    name: str
    description: str
    programming_language: ProgrammingLanguageEnum = Field(default=ProgrammingLanguageEnum.PYTHON, sa_column=Column(Enum(ProgrammingLanguageEnum), nullable=False, server_default='PYTHON'))
    due_date: datetime

class Practice(PracticeBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    users: list[User] = Relationship(back_populates="practices", link_model=PracticesUsersLink)
    course: Course = Relationship(back_populates="practices")

class PracticeCreate(PracticeBase):
    # This validator ensures that if the input is a JSON string, it gets parsed and converted to the appropriate model instance (mostly in form-data request)
    @model_validator(mode='before')
    @classmethod
    def validate_to_json(cls, value):
        # If the input is a string, try to load it as a JSON object
        if isinstance(value, str):
            return cls(**json.loads(value)) # Convert the JSON string to a dict and assign it to the model
        return value

class PracticeUpdate(SQLModel):
    course_id: uuid.UUID | None
    name: str | None
    description: str | None
    programming_language: ProgrammingLanguageEnum | None
    due_date: datetime | None

class PracticePublic(PracticeBase):
    id: uuid.UUID
    submission_date: datetime | None = None
    status: StatusEnum | None = None
    submission_file_name: str | None = None

class PracticePublicWithUsers(PracticeBase):
    id: uuid.UUID
    users: list[UserPublic] = []

class PracticePublicWithCourse(PracticePublic):
    course: CoursePublic | None

class PracticePublicWithUsersAndCourse(PracticePublic):
    users: list[UserPublic] = []
    course: CoursePublic | None
    correction: dict | None

class PracticePublicWithCorrection(PracticePublic):
    correction: dict | None

class PracticesPublic(SQLModel):
    data: list[PracticePublic]
    count: int

class PracticesPublicWithCourse(SQLModel):
    data: list[PracticePublicWithCourse]
    count: int

class PracticesPublicWithCorrection(SQLModel):
    data: list[PracticePublicWithCorrection]
    count: int