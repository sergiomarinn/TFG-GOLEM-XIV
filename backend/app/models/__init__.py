from .base import SQLModel
from .user import *
from .course import *
from .practice import *
from .CoursesUsersLink import *
from .PracticesUsersLink import *

# Rebuild models for forward references (only needed on models that have forward references)
CoursePublicWithUsersAndPractices.model_rebuild()
CoursePublicWithPractices.model_rebuild()
UserCoursesOut.model_rebuild()
UserPracticesOut.model_rebuild()
UserPublicWithCoursesPractices.model_rebuild()