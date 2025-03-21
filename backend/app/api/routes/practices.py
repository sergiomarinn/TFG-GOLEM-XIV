from io import BytesIO
import uuid
import aiofiles
from typing import Any

from fastapi import APIRouter, Depends, File, HTTPException, Response, UploadFile
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
from api.sender import Sender

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
        p_path = os.path.join(settings.PROFESSOR_FILES_PATH, course.course, course.name, practice.name)
        a_path = os.path.join(settings.STUDENT_FILES_PATH, course.course, course.name, practice.name)
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
    
    course = practice.course
    body = None
    if current_user.is_student:
        file_path = os.path.join(
            settings.STUDENT_FILES_PATH,
            course.course,
            course.name,
            practice.name,
            current_user.niub
        )

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
                "language": practice.language,
                "niub": current_user.niub,
                "course_id": str(course.id),
                "practice_id": str(practice.id)
            }

    else:
        file_path = os.path.join(
            settings.PROFESSOR_FILES_PATH,
            course.course,
            course.name,
            practice.name
        )

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
        send = Sender(body)
    
    return {"status": "success", "files": saved_files}

@router.get("/{practice_id}/download")
async def download_practice_file(session: SessionDep, practice_id: uuid.UUID, current_user: CurrentUser) -> Any:
    """
    Download practice files.
    """
    practice = crud.practice.get_practice(session=session, id=practice_id)
    if not practice:
        raise HTTPException(status_code=404, detail="Practice not found")
        
    if current_user not in practice.users:
        raise HTTPException(status_code=403, detail="User not in course")
    
    course = practice.course
    if current_user.is_student:
        file_path = os.path.join(
            settings.STUDENT_FILES_PATH,
            course.course,
            course.name,
            practice.name,
            current_user.niub
        )
    else:
        file_path = os.path.join(
            settings.PROFESSOR_FILES_PATH,
            course.course,
            course.name,
            practice.name
        )

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    files = []
    for file in os.listdir(file_path):
        files.append(file)
    
    return {"files": files}