from sqlmodel import Field, Relationship, Enum, Column
from pydantic import model_validator
from sqlalchemy.ext.hybrid import hybrid_property
from typing import ClassVar

from .base import SQLModel
from .CoursesUsersLink import CoursesUsersLink
from .user import User, UserPublic
import uuid
import json
import enum

class ColorEnum(str, enum.Enum):
    DEFAULT = "default"
    RED = "red"
    GREEN = "green"
    BLUE = "blue"
    LIME = "lime"
    ORANGE = "orange"
    PURPLE = "purple"
    PINK = "pink"
    CYAN = "cyan"
    INDIGO = "indigo"

class SemesterEnum(str, enum.Enum):
    TARDOR = "tardor"
    PRIMAVERA = "primavera"

class CourseBase(SQLModel):
    name: str
    academic_year: str
    semester: SemesterEnum = Field(default=SemesterEnum.TARDOR, sa_column=Column(Enum(SemesterEnum), nullable=False, server_default='TARDOR'))
    description: str
    color: ColorEnum = Field(default=ColorEnum.DEFAULT, sa_column=Column(Enum(ColorEnum), nullable=False, server_default='DEFAULT'))

class Course(CourseBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    users: list[User] = Relationship(back_populates="courses", link_model=CoursesUsersLink)
    practices: list["Practice"] = Relationship(back_populates="course", cascade_delete=True)
    students_number: ClassVar[hybrid_property]
    
    @hybrid_property
    def students_number(self) -> int:
        return sum(user.is_student for user in self.users if hasattr(user, "is_student"))

class CourseCreate(CourseBase):
    # This validator ensures that if the input is a JSON string, it gets parsed and converted to the appropriate model instance (mostly in form-data request)
    @model_validator(mode='before')
    @classmethod
    def validate_to_json(cls, value):
        # If the input is a string, try to load it as a JSON object
        if isinstance(value, str):
            return cls(**json.loads(value)) # Convert the JSON string to a dict and assign it to the model
        return value

class CourseUpdate(SQLModel):
    name: str | None
    academic_year: str | None
    semester: SemesterEnum | None
    description: str | None
    color: ColorEnum | None

class CoursePublic(CourseBase):
    id: uuid.UUID
    corrected_practices: int = 0
    total_practices: int = 0
    students_number: int

class CoursePublicWithUsersAndPractices(CourseBase):
    id: uuid.UUID
    users: list[UserPublic] = []
    practices: list["PracticePublic"] = []

class CoursePublicWithUsers(CourseBase):
    id: uuid.UUID
    users: list[UserPublic] = []

class CoursePublicWithPractices(CourseBase):
    id: uuid.UUID
    practices: list["PracticePublic"] = []

class CoursesPublic(SQLModel):
    data: list[CoursePublic]
    count: int