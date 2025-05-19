import uuid
from typing import Any

from sqlmodel import Session, select

from app.models import Course, CourseCreate, CourseUpdate


def create_course(*, session: Session, course_create: CourseCreate) -> Course:
    db_obj = Course.model_validate(course_create)
    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    return db_obj


def update_course(*, session: Session, db_course: Course, course_in: CourseUpdate) -> Any:
    course_data = course_in.model_dump(exclude_unset=True)

    db_course.sqlmodel_update(course_data)
    session.add(db_course)
    session.commit()
    session.refresh(db_course)
    return db_course


def get_course(*, session: Session, id: uuid.UUID) -> Course | None:
    statement = select(Course).where(Course.id == id)
    course = session.exec(statement).first()
    return course


def get_course_by_name(*, session: Session, name: str) -> Course | None:
    statement = select(Course).where(Course.name == name)
    course = session.exec(statement).first()
    return course

def delete_course(*, session: Session, course: Course) -> Any:
    session.delete(course)
    session.commit()