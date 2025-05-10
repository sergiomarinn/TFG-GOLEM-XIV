from sqlmodel import Field, Column, Enum

from datetime import datetime
from sqlmodel import SQLModel
import uuid
import enum

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

class Practice(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    course_id: uuid.UUID | None = Field(default=None, foreign_key="course.id", ondelete="CASCADE")
    name: str
    description: str
    programming_language: ProgrammingLanguageEnum = Field(default=ProgrammingLanguageEnum.PYTHON, sa_column=Column(Enum(ProgrammingLanguageEnum), nullable=False, server_default='PYTHON'))
    due_date: datetime