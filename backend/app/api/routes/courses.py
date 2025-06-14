from datetime import datetime
from io import BytesIO
import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Response, UploadFile, logger
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import StreamingResponse
from sqlmodel import col, delete, func, select, desc, update

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
    CourseUpdate,
    CoursePublicWithUsersAndPractices,
    CoursePublicWithUsers,
    CoursePublicWithPractices,
    CoursesPublic,
    CoursesUsersLink,
    Practice,
    PracticesUsersLink,
    PracticePublic,
    StatusEnum,
    UserPublic
)
import pandas as pd
import os
import logging
from app.services import sftp_service
from app.utils import format_directory_name
import posixpath

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

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

@router.get("/search", response_model=CoursesPublic)
def search_courses(session: SessionDep, current_user: CurrentUser, skip: int = 0, limit: int = 100, search: str = None) -> Any:
    """
    Retrieve only student users with optional search functionality.
    """

    if not current_user.is_admin: 
        base_query = select(Course).where(Course.users.contains(current_user))
    else: 
        base_query = select(Course)
    
    if search:
        search_term = f"%{search}%"
        base_query = base_query.where(
            (Course.name.ilike(search_term)) |
            (Course.description.ilike(search_term))
        )
    
    count_query = select(func.count()).select_from(
        base_query.subquery()
    )
    count = session.exec(count_query).one()
    
    courses_query = base_query.offset(skip).limit(limit)
    courses = session.exec(courses_query).all()
    
    return CoursesPublic(data=courses, count=count)

def enrich_courses_with_practice_stats(session: SessionDep, user_niub: str, courses: list[Course]) -> list[CoursePublic]:
    result: list[CoursePublic] = []

    for course in courses:
        # Count total practices for this course
        total_practices_count = len(course.practices)

        # Count corrected practices for this user in this course
        # Practices are considered corrected if status is CORRECTED
        corrected_practices_count = session.exec(
            select(func.count())
            .select_from(Practice)
            .join(PracticesUsersLink, Practice.id == PracticesUsersLink.practice_id)
            .where(
                Practice.course_id == course.id,
                PracticesUsersLink.user_niub == user_niub,
                PracticesUsersLink.status == StatusEnum.CORRECTED
            )
        ).one()

        course_user = session.exec(select(CoursesUsersLink).where(
            CoursesUsersLink.user_niub == user_niub,
            CoursesUsersLink.course_id == course.id
        )).first()

        course_response = CoursePublic.model_validate(course)
        course_response.total_practices = total_practices_count
        course_response.corrected_practices = corrected_practices_count
        course_response.last_access = course_user.last_access if course_user else None

        result.append(course_response)

    return result

@router.get("/me", response_model=CoursesPublic)
def read_my_courses(session: SessionDep, current_user: CurrentUser, skip: int = 0, limit: int = 100) -> Any:
    """
    Retrieve courses of the current user.
    """
    if current_user.is_admin: count_statement = select(func.count()).select_from(Course)
    else: count_statement = select(func.count()).select_from(Course).where(Course.users.contains(current_user))
    count = session.exec(count_statement).one()

    if current_user.is_admin: 
        statement = select(Course).offset(skip).limit(limit)
    else: 
        statement = select(Course).where(Course.users.contains(current_user)).offset(skip).limit(limit)
    
    courses = session.exec(statement).all()
    enriched_courses = enrich_courses_with_practice_stats(session, current_user.niub, courses)

    return CoursesPublic(data=enriched_courses, count=count)

@router.get("/me/recent", response_model=CoursesPublic)
def read_my_recent_courses(session: SessionDep, current_user: CurrentUser, limit: int = 5) -> Any:
    """
    Retrieve the most recently accessed courses of the current user.
    Orders by last_access timestamp (newest first) and limits to the specified count.
    
    - By default, only returns courses with non-null last_access values.
    """

    statement = select(Course).join(CoursesUsersLink).where(
        CoursesUsersLink.user_niub == current_user.niub,
        CoursesUsersLink.last_access.is_not(None)
    ).order_by(desc(CoursesUsersLink.last_access)).limit(limit)
    
    courses = session.exec(statement).all()

    enriched_courses = enrich_courses_with_practice_stats(session, current_user.niub, courses)

    return CoursesPublic(data=enriched_courses, count=len(courses))

@router.get("/{course_id}", response_model=CoursePublicWithUsersAndPractices)
def read_course(course_id: uuid.UUID, session: SessionDep, current_user: CurrentUser) -> Any:
    """
    Retrieve course by ID.
    """
    course = crud.course.get_course(session=session, id=course_id)
    if current_user not in course.users and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="The user is not enrolled in the course.")
    
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    practices_public = []

    if current_user.is_admin and not current_user in course.users:
        practices = session.exec(select(Practice).where(Practice.course_id == course_id))
        practices_public = practices

    else:
        statement = select(Practice, PracticesUsersLink).join(PracticesUsersLink).where(
            PracticesUsersLink.user_niub == current_user.niub,
            PracticesUsersLink.practice_id == Practice.id,
            Practice.course_id == course_id
        )
        practices = session.exec(statement).all()

        for practice, link in practices:
            practice_data = PracticePublic(
                **practice.model_dump(),
                submission_date=link.submission_date,
                status=link.status,
                submission_file_name=link.submission_file_name
            )
            practices_public.append(practice_data)

    return CoursePublicWithUsersAndPractices(
        **course.model_dump(),
        users=course.users,
        practices=practices_public,
    )

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

@router.get("/{course_id}/teachers", response_model=list[UserPublic])
def read_course_teachers(course_id: uuid.UUID, session: SessionDep, current_user: CurrentUser) -> Any:
    """
    Retrieve teachers of the course by ID.
    """
    course = crud.course.get_course(session=session, id=course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    if current_user not in course.users and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="The user is not enrolled in the course.")
    
    teachers = [user for user in course.users if user.is_teacher]

    return teachers

@router.get("/{course_id}/practices", response_model=CoursePublicWithPractices)
def read_course_practices(course_id: uuid.UUID, session: SessionDep, current_user: CurrentUser) -> Any:
    """
    Retrieve practices of the course by ID.
    """
    course = crud.course.get_course(session=session, id=course_id)
    if current_user not in course.users and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="The user is not enrolled in the course.")
    
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    return course

@router.post("/", dependencies=[Depends(get_current_teacher)], response_model=CoursePublic)
async def create_course(*, session: SessionDep, course_in: CourseCreate, file: UploadFile, current_user: CurrentUser) -> Any:
    """
    Create new course.
    """
    _, extension = os.path.splitext(file.filename)
    try:
        if extension.lower() == ".csv":
            data = pd.read_csv(file.file)
        elif extension.lower() in [".xlsx", ".xls"]:
            contents = file.file.read()
            buffer = BytesIO(contents)
            data = pd.read_excel(buffer)
            buffer.close()
        else:
            raise HTTPException(status_code=500, detail="Solo se puede subir archivos csv o excel")
        
        # Check if "niub" column exists in the uploaded file
        if "niub" not in data.columns:
            raise HTTPException(status_code=400, detail="El archivo debe contener una columna llamada 'niub'")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error procesando archivo: {str(e)}")

    course = crud.course.get_course_by_name(session=session, name=course_in.name)
    if course and course.academic_year == course_in.academic_year:
        raise HTTPException(status_code=400, detail="The course already exists")
    
    def _mk_course_dir():
        with sftp_service.sftp_client() as sftp:
            p_path = posixpath.join(settings.PROFESSOR_FILES_PATH, course_in.academic_year, format_directory_name(course_in.name))
            a_path = posixpath.join(settings.STUDENT_FILES_PATH, course_in.academic_year, format_directory_name(course_in.name))
            try:
                sftp_service.mkdir_p(sftp, p_path)
                sftp_service.mkdir_p(sftp, a_path)
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Error creating directories on SFTP server: {str(e)}")
            
    try:
        await run_in_threadpool(_mk_course_dir)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"SFTP connection error: {str(e)}")
    
    course = crud.course.create_course(session=session, course_create=course_in)
    course.users.append(current_user) # Add teacher to course
    
    not_found_users = []
    for user_niub in data["niub"]:
        user = crud.user.get_user_by_niub(session=session, niub=user_niub)
        if user:
            course.users.append(user)
        else:
            not_found_users.append(user_niub)
        
    if not_found_users:
        course.pending_niubs = ",".join(not_found_users)
        logger.warning(f"Users not found: {not_found_users}")

    session.add(course)
    session.commit()
    
    return course
    
@router.post("/{course_id}/students/{niub}", dependencies=[Depends(get_current_teacher)], response_model=Message)
def add_student_by_niub(course_id: uuid.UUID, niub: str, session: SessionDep, current_user: CurrentUser) -> Any:
    """
    Add a student to a course using their NIUB.
    """
    course = crud.course.get_course(session=session, id=course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    if current_user not in course.users and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="You are not authorized to modify this course")
    
    user = crud.user.get_user_by_niub(session=session, niub=niub)
    if not user:
        raise HTTPException(status_code=404, detail=f"User with NIUB {niub} not found")
    
    if user in course.users:
        raise HTTPException(status_code=400, detail=f"User with NIUB {niub} is already enrolled in this course")
    
    if not user.is_student:
        raise HTTPException(status_code=400, detail=f"User with NIUB {niub} is not a student")
    
    course.users.append(user)

    for practice in course.practices:
        if user not in practice.users:
            practice.users.append(user)
            session.add(practice)
    
    session.add(course)
    session.commit()
    
    return Message(message=f"Student with NIUB {niub} successfully added to the course")

@router.put("/{course_id}", dependencies=[Depends(get_current_teacher)], response_model=CoursePublic)
async def update_course(course_id: uuid.UUID, course_in: CourseUpdate, session: SessionDep, current_user: CurrentUser) -> Any:
    """
    Update course.
    """
    course = crud.course.get_course(session=session, id=course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    if current_user not in course.users and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="The user is not enrolled in the course.")
    
    # Check if name or academic year is being changed
    name_changed = course_in.name and course_in.name != course.name
    academic_year_changed = course_in.academic_year and course_in.academic_year != course.academic_year
    
    old_course_name = course.name if name_changed else None
    old_academic_year = course.academic_year if academic_year_changed else None

    # If name or academic year changed, rename directories
    if name_changed or academic_year_changed:
        try:
            await sftp_service.rename_course_directories(
                old_course_name or course.name,
                course_in.name,
                course_in.academic_year,
                old_academic_year
            )
        except Exception as e:
            logger.error(f"Failed to rename course directories: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to rename course directories: {str(e)}")

    course = crud.course.update_course(session=session, db_course=course, course_in=course_in)
    return course

@router.patch("/me/{course_id}/access", response_model=Message)
def update_course_last_access(course_id: uuid.UUID, session: SessionDep, current_user: CurrentUser) -> Any:
    """
    Update the last access timestamp for a specific course of the current user.
    """
    course_user = select(CoursesUsersLink).where(
        CoursesUsersLink.course_id == course_id,
        CoursesUsersLink.user_niub == current_user.niub
    )
    course_user = session.exec(course_user).first()

    if not course_user:
        if current_user.is_admin: return Message(message="Last access not updated because you are admin")
        raise HTTPException(status_code=404, detail="Course not found or you don't have access to it")

    course_user.last_access = datetime.now()

    session.add(course_user)
    session.commit()
    session.refresh(course_user)
    
    return Message(message="Last access updated successfully")

@router.delete("/{course_id}", dependencies=[Depends(get_current_teacher)], response_model=Message)
async def delete_course(course_id: uuid.UUID, session: SessionDep, current_user: CurrentUser) -> Any:
    """
    Delete course.
    """
    course = crud.course.get_course(session=session, id=course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    if current_user not in course.users and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="The user is not enrolled in the course.")
    
    # Delete remote directories
    try:
        # Construct the paths for professor and student directories
        course_professor_path = posixpath.join(settings.PROFESSOR_FILES_PATH, course.academic_year, format_directory_name(course.name))
        course_student_path = posixpath.join(settings.STUDENT_FILES_PATH, course.academic_year, format_directory_name(course.name))
        
        # Remove professor and student directories
        await sftp_service.remove_recursive_diretory(course_professor_path)
        await sftp_service.remove_recursive_diretory(course_student_path)

    except Exception as e:
        # Log the error but continue with the database deletion
        logger.error(f"Error connecting to SFTP server: {str(e)}")
    
    crud.course.delete_course(session=session, course=course)
    
    return Message(message="Course deleted successfully")

@router.delete("/{course_id}/students/{niub}", dependencies=[Depends(get_current_teacher)], response_model=Message)
def delete_student_from_course(course_id: uuid.UUID, niub: str, session: SessionDep, current_user: CurrentUser) -> Any:
    """
    Remove a student from a course.
    """
    course = crud.course.get_course(session=session, id=course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    if current_user not in course.users and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="You are not authorized to modify this course")
    
    student = crud.user.get_user_by_niub(session=session, niub=niub)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    if student not in course.users:
        raise HTTPException(status_code=404, detail="Student is not enrolled in this course")
    
    if not student.is_student:
        raise HTTPException(status_code=400, detail="Only students can be removed from a course using this endpoint")
    
    for practice in course.practices:
        if student in practice.users:
            practice.users.remove(student)
    
    course.users.remove(student)

    session.add(student)
    session.commit()
    
    return Message(message=f"Student successfully removed from the course")

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