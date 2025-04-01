import uuid
from typing import Any

from sqlmodel import Session, select

from app.models import Practice, PracticeCreate, PracticeUpdate, Course

def create_practice(*, session: Session, practice_create: PracticeCreate, course: Course) -> Practice:
    db_obj = Practice.model_validate(practice_create)
    db_obj.course = course
    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    return db_obj


def update_practice(*, session: Session, db_practice: Practice, practice_in: PracticeUpdate, course: Course | None) -> Any:
    practice_data = practice_in.model_dump(exclude_unset=True)

    db_practice.sqlmodel_update(practice_data)
    if course:
        db_practice.course = course
        
    session.add(db_practice)
    session.commit()
    session.refresh(db_practice)
    return db_practice


def get_practice(*, session: Session, id: uuid.UUID) -> Practice | None:
    statement = select(Practice).where(Practice.id == id)
    practice = session.exec(statement).first()
    return practice


def get_practice_by_name(*, session: Session, name: str) -> Practice | None:
    statement = select(Practice).where(Practice.name == name)
    practice = session.exec(statement).first()
    return practice


def delete_practice(*, session: Session, practice: Practice) -> Any:
    session.delete(practice)
    session.commit()