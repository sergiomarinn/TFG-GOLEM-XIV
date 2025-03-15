from io import BytesIO
import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Response, UploadFile
from fastapi.responses import StreamingResponse
from sqlmodel import col, delete, func, select

from app import crud
from app.api.deps import (
    CurrentUser,
    SessionDep,
    get_current_active_superuser,
    get_current_teacher
)
from app.core.config import settings
from app.core.security import get_password_hash, verify_password
from app.models import (
    Message,
    Course,
    CoursePublic,
    CourseCreate,
    CoursePublicWithUsersAndPractices,
    CoursePublicWithUsers,
    CoursePublicWithPractices,
    CoursesPublic
)
import pandas as pd
import os

router = APIRouter()

@router.post("/", dependencies=[Depends(get_current_teacher)], response_model=CoursePublic)
def create_course(*, session: SessionDep, course_in: CourseCreate, file: UploadFile) -> Any:
    """
    Create new course.
    """
    course = crud.course.get_course_by_name(session=session, name=course_in.name)
    if course:
        raise HTTPException(status_code=400, detail="The course already exists")
    course = crud.course.create_course(session=session, course_create=course_in)

    filN, extension = os.path.splitext(file.filename)

    if extension.lower() == ".csv":
        data = pd.read_csv(file.file)
    elif extension.lower() in [".xlsx", ".xls"]:
        data = pd.read_excel(file.file.read())
    else:
        raise HTTPException(500, "Solo se puede subir archivos csv o excel")
    
    return course

@router.get("/", dependencies=[Depends(get_current_active_superuser)], response_model=CoursesPublic)
def read_courses(session: SessionDep, skip: int = 0, limit: int = 100) -> Any:
    """
    Retrieve courses.
    """
    count_statement = select(func.count()).select_from(Course)
    count = session.exec(count_statement).one()

    statement = select(Course).offset(skip).limit(limit)
    courses = session.exec(statement).all()

    return CoursesPublic(data=courses, count=count)

@router.get("/me", response_model=CoursesPublic)
def read_my_courses(session: SessionDep, current_user: CurrentUser, skip: int = 0, limit: int = 100) -> Any:
    """
    Retrieve courses of the current user.
    """
    count_statement = select(func.count()).select_from(Course).where(Course.users.contains(current_user))
    count = session.exec(count_statement).one()

    statement = select(Course).where(Course.users.contains(current_user)).offset(skip).limit(limit)
    courses = session.exec(statement).all()

    return CoursesPublic(data=courses, count=count)

@router.get("/{course_id}", response_model=CoursePublicWithUsersAndPractices)
def read_course(course_id: uuid.UUID, session: SessionDep, current_user: CurrentUser) -> Any:
    """
    Retrieve course by ID.
    """
    course = crud.course.get_course(session=session, id=course_id)
    if current_user not in course.users:
        raise HTTPException(status_code=403, detail="The user is not enrolled in the course.")
    
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return course

@router.get("/{course_id}/users", response_model=CoursePublicWithUsers)
def read_course_users(course_id: uuid.UUID, session: SessionDep, current_user: CurrentUser) -> Any:
    """
    Retrieve users of the course by ID.
    """
    course = crud.course.get_course(session=session, id=course_id)
    if current_user not in course.users:
        raise HTTPException(status_code=403, detail="The user is not enrolled in the course.")
    
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    return course

@router.get("/{course_id}/practices", response_model=CoursePublicWithPractices)
def read_course_practices(course_id: uuid.UUID, session: SessionDep, current_user: CurrentUser) -> Any:
    """
    Retrieve practices of the course by ID.
    """
    course = crud.course.get_course(session=session, id=course_id)
    if current_user not in course.users:
        raise HTTPException(status_code=403, detail="The user is not enrolled in the course.")
    
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    return course

@router.put("/{course_id}", dependencies=[Depends(get_current_teacher)], response_model=CoursePublic)
def update_course(
    course_id: uuid.UUID, course_in: CourseCreate, session: SessionDep, current_user: CurrentUser
) -> Any:
    """
    Update course.
    """
    course = crud.course.get_course(session=session, id=course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    if current_user not in course.users:
        raise HTTPException(status_code=403, detail="The user is not enrolled in the course.")
    course = crud.course.update_course(session=session, course=course, course_in=course_in)
    return course

@router.delete("/{course_id}", dependencies=[Depends(get_current_teacher)], response_model=Message)
def delete_course(course_id: uuid.UUID, session: SessionDep, current_user: CurrentUser) -> Any:
    """
    Delete course.
    """
    course = crud.course.get_course(session=session, id=course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    if current_user not in course.users:
        raise HTTPException(status_code=403, detail="The user is not enrolled in the course.")
    crud.course.delete_course(session=session, course=course)
    return Message(message="Course deleted successfully")

@router.get("/students-template/csv", dependencies=[Depends(get_current_teacher)])
def get_students_template_csv() -> Any:
    """
    Get template for students in CSV.
    """
    df = pd.DataFrame(columns=["niub", "nom", "cognoms"])

    return Response(
        content=df.to_csv(index=False),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=plantilla_alumnes.csv"},
    )

@router.get("/students-template/xlsx", dependencies=[Depends(get_current_teacher)])
def get_students_template_xlsx() -> Any:
    """
    Get template for students in XLSX.
    """
    df = pd.DataFrame(columns=["niub", "nom", "cognoms"])

    buffer = BytesIO()
    with pd.ExcelWriter(buffer, engine="xlsxwriter") as writer:
        df.to_excel(writer, index=False, sheet_name="Alumnes")

    buffer.seek(0)

    return Response(
        content=buffer.getvalue(),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=plantilla_alumnes.xlsx"},
    )