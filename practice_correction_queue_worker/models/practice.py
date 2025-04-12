from sqlmodel import Field

from datetime import date
from sqlmodel import SQLModel
import uuid

class Practice(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    course_id: uuid.UUID | None = Field(default=None, foreign_key="course.id", ondelete="CASCADE")
    name: str
    description: str
    programming_language: str
    due_date: date