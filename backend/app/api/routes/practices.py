from io import BytesIO
import uuid
import aiofiles
import zipfile
from typing import Any

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
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
from app.models import (
    Message,
    Practice,
    PracticePublic,
    PracticeCreate,
    PracticeUpdate,
    PracticePublicWithCourse,
    PracticePublicWithUsers,
    PracticePublicWithUsersAndCourse,
    PracticePublicWithCorrection,
    PracticesPublic,
    PracticesPublicWithCorrection,
    PracticesUsersLink
)
import pandas as pd
import os
from app.services import sender

router = APIRouter()

@router.get("/", dependencies=[Depends(get_current_active_superuser)], response_model=PracticesPublic)
def read_practices(session: SessionDep, skip: int = 0, limit: int = 100) -> Any:
    """
    Retrieve practices.
    """
    count_statement = select(func.count()).select_from(Practice)
    count = session.exec(count_statement).one()

    statement = select(Practice).offset(skip).limit(limit)
    practices = session.exec(statement).all()

    return PracticesPublic(data=practices, count=count)

@router.get("/me", response_model=PracticesPublic)
def read_my_practices(session: SessionDep, current_user: CurrentUser, skip: int = 0, limit: int = 100) -> Any:
    """
    Retrieve practices of the current user.
    """
    count_statement = select(func.count()).select_from(Practice).where(Practice.users.contains(current_user))
    count = session.exec(count_statement).one()

    statement = select(Practice).where(Practice.users.contains(current_user)).offset(skip).limit(limit)
    practices = session.exec(statement).all()

    return PracticesPublic(data=practices, count=count)

@router.get("/me/corrected", response_model=PracticesPublicWithCorrection)
def read_my_corrected_practices(session: SessionDep, current_user: CurrentUser, skip: int = 0, limit: int = 100) -> Any:
    """
    Retrieve corrected practices of the current user.
    """
    count_statement = select(func.count()).select_from(Practice).join(PracticesUsersLink).where(
        PracticesUsersLink.user_niub == current_user.niub, 
        PracticesUsersLink.corrected == True
    )
    count = session.exec(count_statement).one()

    statement = select(Practice, PracticesUsersLink.correction).join(PracticesUsersLink).where(
        PracticesUsersLink.user_niub == current_user.niub,
        PracticesUsersLink.corrected == True
    ).offset(skip).limit(limit)
    practices = session.exec(statement).all()

    return PracticesPublic(data=practices, count=count)

@router.get("/me/uncorrected", response_model=PracticesPublic)
def read_my_uncorrected_practices(session: SessionDep, current_user: CurrentUser, skip: int = 0, limit: int = 100) -> Any:
    """
    Retrieve uncorrected practices of the current user.
    """
    count_statement = select(func.count()).select_from(Practice).join(PracticesUsersLink).where(
        PracticesUsersLink.user_niub == current_user.niub, 
        PracticesUsersLink.corrected == False
    )
    count = session.exec(count_statement).one()

    statement = select(Practice).join(PracticesUsersLink).where(
        PracticesUsersLink.user_niub == current_user.niub,
        PracticesUsersLink.corrected == False
    ).offset(skip).limit(limit)
    practices = session.exec(statement).all()

    return PracticesPublic(data=practices, count=count)

@router.get("/{practice_id}", response_model=PracticePublicWithUsersAndCourse)
def read_practice(practice_id: uuid.UUID, session: SessionDep, current_user: CurrentUser) -> Any:
    """
    Retrieve practice by ID.
    """
    practice = crud.practice.get_practice(session=session, id=practice_id)
    if current_user not in practice.course.users:
        raise HTTPException(status_code=403, detail="The user is not enrolled in the practice.")
    
    if not practice:
        raise HTTPException(status_code=404, detail="Practice not found")
    return practice

@router.get("/{practice_id}/users", response_model=PracticePublicWithUsers)
def read_practice_users(practice_id: uuid.UUID, session: SessionDep) -> Any:
    """
    Retrieve practice users.
    """
    practice = crud.practice.get_practice(session=session, id=practice_id)
    if not practice:
        raise HTTPException(status_code=404, detail="Practice not found")
    
    return practice

@router.get("/{practice_id}/course", response_model=PracticePublicWithCourse)
def read_practice_course(practice_id: uuid.UUID, session: SessionDep) -> Any:
    """
    Retrieve practice course.
    """
    practice = crud.practice.get_practice(session=session, id=practice_id)
    if not practice:
        raise HTTPException(status_code=404, detail="Practice not found")
    
    return practice

@router.post("/", dependencies=[Depends(get_current_teacher)], response_model=PracticePublic)
async def create_practice(*, session: SessionDep, practice_in: PracticeCreate, files: list[UploadFile] = File(None)) -> Any:
    """
    Create new practice.
    """
    course = crud.course.get_course(session=session, id=practice_in.course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    practice = crud.practice.get_practice_by_name(session=session, name=practice_in.name)
    if practice:
        raise HTTPException(status_code=400, detail="The practice already exists")
    
    practice = crud.practice.create_practice(session=session, practice_create=practice_in, course=course)

    try:
        p_path = os.path.join(settings.PROFESSOR_FILES_PATH, course.academic_year, course.name, practice.name)
        a_path = os.path.join(settings.STUDENT_FILES_PATH, course.academic_year, course.name, practice.name)
        os.makedirs(p_path, exist_ok=True)
        os.makedirs(a_path, exist_ok=True)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating directories: {str(e)}")
    
    for user in course.users:
        practice.users.append(user)

    session.add(practice)
    session.commit()

    if files:
        for file in files:
            file_path = os.path.join(p_path, file.filename)
            try:
                async with aiofiles.open(file_path, 'wb') as out_file:
                    chunk_size = 1024 * 1024  # 1MB
                    while content := await file.read(chunk_size):
                        await out_file.write(content)
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Error saving file {file.filename}: {str(e)}")


    return practice

@router.put("/{practice_id}", dependencies=[Depends(get_current_teacher)], response_model=PracticePublic)
def update_practice(session: SessionDep, practice_id: uuid.UUID, practice_in: PracticeUpdate) -> Any:
    """
    Update practice.
    """
    course = None
    if practice_in.course_id:
        course = crud.course.get_course(session=session, id=practice_in.course_id)
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
        
    practice = crud.practice.get_practice(session=session, id=practice_id)
    if not practice:
        raise HTTPException(status_code=404, detail="Practice not found")
    
    practice = crud.practice.update_practice(session=session, practice=practice, practice_update=practice_in, course=course)

    return practice

@router.delete("/{practice_id}", dependencies=[Depends(get_current_teacher)], response_model=Message)
def delete_practice(session: SessionDep, practice_id: uuid.UUID) -> Any:
    """
    Delete practice.
    """
    practice = crud.practice.get_practice(session=session, id=practice_id)
    if not practice:
        raise HTTPException(status_code=404, detail="Practice not found")
    
    crud.practice.remove_practice(session=session, id=practice_id)

    return Message(message="Practice deleted")

@router.post("/{practice_id}/upload")
async def upload_practice_file(session: SessionDep, practice_id: uuid.UUID, current_user: CurrentUser, files: list[UploadFile]) -> Any:
    """
    Upload practice files.
    """
    practice = crud.practice.get_practice(session=session, id=practice_id)
    if not practice:
        raise HTTPException(status_code=404, detail="Practice not found")
        
    if current_user not in practice.users:
        raise HTTPException(status_code=403, detail="User not in course")
    
    body = None
    if current_user.is_student:
        file_path = os.path.join(settings.STUDENT_FILES_PATH, practice.course.academic_year, practice.course.name, practice.name, current_user.niub)

        practice_user = session.exec(select(PracticesUsersLink)
            .where(
                PracticesUsersLink.user_niub == current_user.niub,
                PracticesUsersLink.practice_id == practice.id
            )
        ).first()
        
        if practice_user:
            practice_user.corrected = False
            session.add(practice_user)
            session.commit()
            session.refresh(practice_user)

        if settings.ENABLE_EXTERNAL_SERVICE:
            body = {
                "name": practice.name,
                "language": practice.programming_language,
                "niub": current_user.niub,
                "course_id": str(practice.course_id),
                "practice_id": str(practice.id)
            }

    else:
        file_path = os.path.join(settings.PROFESSOR_FILES_PATH, practice.course.academic_year, practice.course.name, practice.name)

    os.makedirs(file_path, exist_ok=True)

    if files:
        saved_files = []
        for file in files:
            try:
                async with aiofiles.open(file_path, 'wb') as out_file:
                    chunk_size = 1024 * 1024  # 1MB
                    while content := await file.read(chunk_size):
                        await out_file.write(content)
                    
                saved_files.append(file.filename)
                    
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Error saving file {file.filename}: {str(e)}")
        
    if body:
        sender.send_practice_data(body)
    
    return {"status": "success", "files": saved_files}

def add_files_to_zip(zip_file: zipfile.ZipFile, user_path: str, base_dir: str = "") -> None:
    """
    Add files from a directory to a ZIP file with relative paths.

    :param zip_file: The ZIP file object.
    :param user_path: The specific user directory path.
    :param base_dir: The base directory inside the ZIP file (optional).
    """
    # Check if directory exists
    if os.path.exists(user_path):
        for root, _, files in os.walk(user_path):
            for file in files:
                file_path = os.path.join(root, file)
                # Add file to zip
                rel_path = os.path.relpath(file_path, user_path)
                arcname = os.path.join(base_dir, rel_path) if base_dir else rel_path
                zip_file.write(file_path, arcname=arcname)

@router.get("/{practice_id}/download/me", response_class=StreamingResponse)
async def download_my_files(*, session: SessionDep, practice_id: uuid.UUID, current_user: CurrentUser) -> Any:
    """
    Download the current user's files for a specific practice.
    """
    # Get practice
    practice = crud.practice.get_practice(session=session, id=practice_id)
    if not practice:
        raise HTTPException(status_code=404, detail="Practice not found")
    
    # Check if user has access to the practice
    if current_user not in practice.users:
        raise HTTPException(status_code=403, detail="Access denied to this practice")
    
    # Determine the correct path based on user role
    if current_user.is_teacher:
        base_path = settings.PROFESSOR_FILES_PATH
    else:
        base_path = settings.STUDENT_FILES_PATH
    
    file_path = os.path.join(base_path, practice.course.academic_year, practice.course.name, practice.name)
    user_path = os.path.join(file_path, current_user.niub) if not current_user.is_teacher else file_path
    
    # Create ZIP in memory
    zip_io = BytesIO()
    with zipfile.ZipFile(zip_io, mode='w', compression=zipfile.ZIP_DEFLATED) as zip_file:
        add_files_to_zip(zip_file, user_path)
    
    # Reset file pointer
    zip_io.seek(0)
    
    # Create response with appropriate headers
    filename = f"{practice.name}_{"teacher" if current_user.is_teacher else "student"}_{current_user.niub}.zip"
    return StreamingResponse(
        zip_io,
        media_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/{practice_id}/download/all", dependencies=[Depends(get_current_teacher)], response_class=StreamingResponse)
async def download_all_files(*, session: SessionDep, practice_id: uuid.UUID, current_user: CurrentUser) -> Any:
    """
    Download all files for a practice. Only available to teachers.
    Creates a ZIP with subdirectories for each user.
    """
    
    # Get practice
    practice = crud.practice.get_practice(session=session, id=practice_id)
    if not practice:
        raise HTTPException(status_code=404, detail="Practice not found")
    
    # Check if teacher has access to the practice
    if current_user not in practice.users:
        raise HTTPException(status_code=403, detail="Access denied to this practice")
    
    # Base paths
    prof_base_path = os.path.join(settings.PROFESSOR_FILES_PATH, practice.course.academic_year, practice.course.name, practice.name)
    student_base_path = os.path.join(settings.STUDENT_FILES_PATH, practice.course.academic_year, practice.course.name, practice.name)
    
    # Create ZIP in memory
    zip_io = BytesIO()
    with zipfile.ZipFile(zip_io, mode='w', compression=zipfile.ZIP_DEFLATED) as zip_file:
        # Add professor files
        for user in practice.users:
            if not user.is_teacher:
                user_path = os.path.join(student_base_path, user.niub)
                base_dir = f"students/{user.niub}"
                # Add student files to zip
                add_files_to_zip(zip_file, user_path, base_dir)
        
        # Add teachers files to zip
        add_files_to_zip(zip_file, prof_base_path, "teachers")
    
    # Reset file pointer
    zip_io.seek(0)
    
    # Create response with appropriate headers
    filename = f"{practice.name}_all_submissions.zip"
    return StreamingResponse(
        zip_io,
        media_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/{practice_id}/download/{user_niub}", response_class=StreamingResponse)
async def download_user_files(*, session: SessionDep, practice_id: uuid.UUID, user_niub: str, current_user: CurrentUser) -> Any:
    """
    Download files for a specific user in a practice.
    Teachers can download any user's files. Students can only download their own.
    """
    # Get practice
    practice = crud.practice.get_practice(session=session, id=practice_id)
    if not practice:
        raise HTTPException(status_code=404, detail="Practice not found")
    
    # Check if current user has access to the practice
    if current_user not in practice.users:
        raise HTTPException(status_code=403, detail="Access denied to this practice")
    
    # Get target user
    target_user = crud.user.get_user_by_niub(session=session, niub=user_niub)
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Security check: Students can only download their own files
    if not current_user.is_teacher and current_user.niub != user_niub:
        raise HTTPException(status_code=403, detail="Access denied to this user's files")
    
    # Check if target user has access to the practice
    if target_user not in practice.users:
        raise HTTPException(status_code=404, detail="This user is not enrolled in this practice")
    
    # Determine the correct path
    if target_user.is_teacher:
        base_path = settings.PROFESSOR_FILES_PATH
    else:
        base_path = settings.STUDENT_FILES_PATH
    
    file_path = os.path.join(base_path, practice.course.academic_year, practice.course.name, practice.name)
    user_path = os.path.join(file_path, target_user.niub) if not current_user.is_teacher else file_path
    
    # Create ZIP in memory
    zip_io = BytesIO()
    with zipfile.ZipFile(zip_io, mode='w', compression=zipfile.ZIP_DEFLATED) as zip_file:
        add_files_to_zip(zip_file, user_path)
    
    # Reset file pointer
    zip_io.seek(0)
    
    # Create response with appropriate headers
    filename = f"{practice.name}_{"teacher" if target_user.is_teacher else "student"}_{target_user.niub}.zip"
    return StreamingResponse(
        zip_io,
        media_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )