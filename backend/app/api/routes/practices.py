from datetime import datetime
import posixpath
import tempfile
import uuid
from typing import Any
import shutil

from fastapi import APIRouter, Depends, HTTPException, UploadFile, BackgroundTasks
from fastapi.responses import StreamingResponse
import paramiko
import zipstream
from sqlmodel import col, delete, func, select
import logging
logger = logging.getLogger("uvicorn")

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
    PracticesPublic,
    PracticesPublicWithCourse,
    PracticesPublicWithCorrection,
    PracticesUsersLink,
    PracticeFileInfo,
    StatusEnum
)
from app.utils import clean_filename, format_directory_name
import pandas as pd
import os
from app.services import practice_service
from app.services import sftp_service

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

@router.get("/search", response_model=PracticesPublic)
def search_courses(session: SessionDep, current_user: CurrentUser, skip: int = 0, limit: int = 100, search: str = None) -> Any:
    """
    Retrieve only student users with optional search functionality.
    """

    if not current_user.is_admin: 
        base_query = select(Practice).where(Practice.users.contains(current_user))
    else: 
        base_query = select(Practice)
    
    if search:
        search_term = f"%{search}%"
        base_query = base_query.where(
            (Practice.name.ilike(search_term)) |
            (Practice.description.ilike(search_term))
        )
    
    count_query = select(func.count()).select_from(
        base_query.subquery()
    )
    count = session.exec(count_query).one()
    
    practices_query = base_query.offset(skip).limit(limit)
    practices = session.exec(practices_query).all()
    
    return PracticesPublic(data=practices, count=count)

@router.get("/me", response_model=PracticesPublicWithCourse)
def read_my_practices(session: SessionDep, current_user: CurrentUser, skip: int = 0, limit: int = 100) -> Any:
    """
    Retrieve practices of the current user.
    """
    count_statement = select(func.count()).select_from(Practice).join(PracticesUsersLink).where(
        PracticesUsersLink.user_niub == current_user.niub
    )
    count = session.exec(count_statement).one()

    statement = select(Practice, PracticesUsersLink).join(PracticesUsersLink).where(
        PracticesUsersLink.user_niub == current_user.niub
    ).offset(skip).limit(limit)
    practices = session.exec(statement).all()

    practices_with_course = []
    for practice, link in practices:
        teacher = None
        for user in practice.users:
            if user.is_teacher:
                teacher = user
                break
        
        practice_data = PracticePublicWithCourse(
            **practice.model_dump(),
            submission_date=link.submission_date,
            status=link.status,
            submission_file_name=link.submission_file_name,
            course=practice.course,
            teacher=teacher
        )
        practices_with_course.append(practice_data)

    return PracticesPublicWithCourse(data=practices_with_course, count=count)

@router.get("/me/corrected", response_model=PracticesPublicWithCorrection)
def read_my_corrected_practices(session: SessionDep, current_user: CurrentUser, skip: int = 0, limit: int = 100) -> Any:
    """
    Retrieve corrected practices of the current user.
    """
    count_statement = select(func.count()).select_from(Practice).join(PracticesUsersLink).where(
        PracticesUsersLink.user_niub == current_user.niub, 
        PracticesUsersLink.status == StatusEnum.CORRECTED
    )
    count = session.exec(count_statement).one()

    statement = select(Practice, PracticesUsersLink.correction).join(PracticesUsersLink).where(
        PracticesUsersLink.user_niub == current_user.niub,
        PracticesUsersLink.status == StatusEnum.CORRECTED
    ).offset(skip).limit(limit)
    practices = session.exec(statement).all()

    return PracticesPublicWithCorrection(data=practices, count=count)

@router.get("/me/uncorrected", response_model=PracticesPublic)
def read_my_uncorrected_practices(session: SessionDep, current_user: CurrentUser, skip: int = 0, limit: int = 100) -> Any:
    """
    Retrieve uncorrected practices of the current user.
    """
    count_statement = select(func.count()).select_from(Practice).join(PracticesUsersLink).where(
        PracticesUsersLink.user_niub == current_user.niub, 
        PracticesUsersLink.status == StatusEnum.NOT_SUBMITTED
    )
    count = session.exec(count_statement).one()

    statement = select(Practice).join(PracticesUsersLink).where(
        PracticesUsersLink.user_niub == current_user.niub,
        PracticesUsersLink.status == StatusEnum.NOT_SUBMITTED
    ).offset(skip).limit(limit)
    practices = session.exec(statement).all()

    return PracticesPublic(data=practices, count=count)

@router.get("/{practice_id}", response_model=PracticePublicWithUsersAndCourse)
def read_practice(practice_id: uuid.UUID, session: SessionDep, current_user: CurrentUser) -> Any:
    """
    Retrieve practice by ID.
    """
    statement = select(Practice, PracticesUsersLink).join(PracticesUsersLink).where(
        PracticesUsersLink.user_niub == current_user.niub,
        PracticesUsersLink.practice_id == practice_id
    )
    practice, link = session.exec(statement).first()

    if not practice:
        raise HTTPException(status_code=404, detail="Practice not found")
    
    if current_user not in practice.course.users and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="The user is not enrolled in the practice.")
    
    teacher = None
    for user in practice.users:
        if user.is_teacher:
            teacher = user
            break

    return PracticePublicWithUsersAndCourse(
        **practice.model_dump(),
        submission_date=link.submission_date,
        status=link.status,
        submission_file_name=link.submission_file_name,
        correction=link.correction,
        users=practice.users,
        course=practice.course,
        teacher=teacher
    )

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

@router.get("/{practice_id}/submission-file-info", response_model=PracticeFileInfo)
def read_practice_file_info(practice_id: uuid.UUID, session: SessionDep, current_user: CurrentUser) -> Any:
    """
    Retrieve uploaded file info for a given practice.
    """
    query = select(Practice, PracticesUsersLink).join(
        PracticesUsersLink, 
        (PracticesUsersLink.practice_id == Practice.id) & 
        (PracticesUsersLink.user_niub == current_user.niub)
    ).where(Practice.id == practice_id)
    
    result = session.exec(query).first()
    
    if not result:
        raise HTTPException(status_code=404, detail="Practice or user-practice link not found")
    
    practice, practice_user = result
    
    if not practice_user.submission_file_name:
        raise HTTPException(status_code=404, detail="No file submitted for this practice")
    
    # Ruta base en SFTP
    if current_user.is_student:
        base_path = posixpath.join(settings.STUDENT_FILES_PATH, practice.course.academic_year, format_directory_name(practice.course.name), format_directory_name(practice.name), current_user.niub)
    elif current_user.is_teacher:
        base_path = posixpath.join(settings.PROFESSOR_FILES_PATH, practice.course.academic_year, format_directory_name(practice.course.name), format_directory_name(practice.name))
    else:
        raise HTTPException(status_code=403, detail="User role not allowed")

    remote_file_path = f"{base_path}/{clean_filename(practice_user.submission_file_name)}"

    # Comprobación en SFTP
    try:
        with sftp_service.sftp_client() as sftp:
            file_stat = sftp.stat(remote_file_path)
    except FileNotFoundError:
        raise HTTPException(status_code=204, detail="Submitted file not found on server")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error accessing SFTP: {str(e)}")

    return PracticeFileInfo(
        name=practice_user.submission_file_name,
        size=file_stat.st_size,
    )

@router.get("/{practice_id}/users/{niub}/submission-file-info", response_model=PracticeFileInfo)
def read_user_submission_file_info(practice_id: uuid.UUID, niub: str, session: SessionDep, current_user: CurrentUser) -> Any:
    """
    Retrieve uploaded file info for a specific user's submission to a given practice.
    """
    if current_user.is_student and current_user.niub != niub:
        raise HTTPException(status_code=403, detail="Students can only access their own submissions")

    query = select(Practice, PracticesUsersLink).join(
        PracticesUsersLink,
        (PracticesUsersLink.practice_id == Practice.id) &
        (PracticesUsersLink.user_niub == niub)
    ).where(Practice.id == practice_id)
    
    result = session.exec(query).first()

    if not result:
        raise HTTPException(status_code=404, detail="Practice or submission not found")

    practice, practice_user = result

    if not practice:
        raise HTTPException(status_code=404, detail="Practice not found")

    if not practice_user:
        raise HTTPException(status_code=403, detail="Access to this submission is not allowed")

    if current_user not in practice.users and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Teacher can only access to their own practices")

    if not practice_user.submission_file_name:
        raise HTTPException(status_code=204, detail="No file submitted for this practice")

    remote_path = posixpath.join(
        settings.STUDENT_FILES_PATH,
        practice.course.academic_year,
        format_directory_name(practice.course.name),
        format_directory_name(practice.name),
        niub,
        clean_filename(practice_user.submission_file_name)
    )

    try:
        with sftp_service.sftp_client() as sftp:
            file_stat = sftp.stat(remote_path)
    except FileNotFoundError:
        raise HTTPException(status_code=410, detail="Submitted file not found on server")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error accessing SFTP: {str(e)}")

    return PracticeFileInfo(
        name=practice_user.submission_file_name,
        size=file_stat.st_size
    )

@router.get("/{practice_id}/{user_niub}", dependencies=[Depends(get_current_teacher)], response_model=PracticePublic)
def read_practice_student(practice_id: uuid.UUID, user_niub: str, session: SessionDep, current_user: CurrentUser) -> Any:
    """
    Retrieve student practice by ID and NIUB.
    """
    statement = select(Practice, PracticesUsersLink).join(PracticesUsersLink).where(
        PracticesUsersLink.user_niub == user_niub,
        PracticesUsersLink.practice_id == practice_id
    )
    practice, link = session.exec(statement).first()

    if not practice:
        raise HTTPException(status_code=404, detail="Practice not found")
    
    if current_user not in practice.course.users and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="The user is not enrolled in the practice.")

    return PracticePublic(
        **practice.model_dump(),
        submission_date=link.submission_date,
        status=link.status,
        submission_file_name=link.submission_file_name,
        correction=link.correction
    )

@router.post("/", dependencies=[Depends(get_current_teacher)], response_model=PracticePublic)
async def create_practice(*, session: SessionDep, practice_in: PracticeCreate, files: list[UploadFile]) -> Any:
    """
    Create new practice.
    """
    course = crud.course.get_course(session=session, id=practice_in.course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    if any(p.name == practice_in.name for p in course.practices):
        raise HTTPException(status_code=400, detail="A practice with this name already exists in the course")
    
    try:
        with sftp_service.sftp_client() as sftp:
            p_path = posixpath.join(settings.PROFESSOR_FILES_PATH, course.academic_year, format_directory_name(course.name), format_directory_name(practice_in.name))
            a_path = posixpath.join(settings.STUDENT_FILES_PATH, course.academic_year, format_directory_name(course.name), format_directory_name(practice_in.name))

            try:
                sftp_service.mkdir_p(sftp, p_path)
                sftp_service.mkdir_p(sftp, a_path)
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Error creating directories: {str(e)}")
            
            practice = crud.practice.create_practice(session=session, practice_create=practice_in, course=course)

            for user in course.users:
                practice.users.append(user)

            session.add(practice)
            session.commit()

            if files:
                for file in files:
                    remote_file_path = posixpath.join(p_path, clean_filename(file.filename))
                    try:
                        await sftp_service.upload_file_sftp(sftp, file, remote_file_path)
                    except Exception as e:
                        raise HTTPException(status_code=500, detail=f"Error uploading file {file.filename}: {str(e)}")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"SFTP connection error or operation failed: {str(e)}")
    
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
    
    practice = crud.practice.update_practice(session=session, db_practice=practice, practice_in=practice_in, course=course)

    return practice

@router.delete("/{practice_id}", dependencies=[Depends(get_current_teacher)], response_model=Message)
def delete_practice(session: SessionDep, practice_id: uuid.UUID) -> Any:
    """
    Delete practice.
    """
    practice = crud.practice.get_practice(session=session, id=practice_id)
    if not practice:
        raise HTTPException(status_code=404, detail="Practice not found")

    # Delete remote directories
    try:
        with sftp_service.sftp_client() as sftp:
            # Construct the paths for professor and student directories
            professor_path = posixpath.join(settings.PROFESSOR_FILES_PATH, practice.course.academic_year, format_directory_name(practice.course.name), format_directory_name(practice.name))
            student_path = posixpath.join(settings.STUDENT_FILES_PATH, practice.course.academic_year, format_directory_name(practice.course.name), format_directory_name(practice.name))
            
            # Helper function to recursively remove a directory and its contents
            def rm_rf(sftp, path):
                try:
                    # Check if path exists
                    try:
                        sftp.stat(path)
                    except IOError:
                        # Path doesn't exist, nothing to do
                        return
                    
                    # List all files and directories in the current path
                    files = sftp.listdir(path)
                    
                    # First remove all files and subdirectories recursively
                    for f in files:
                        filepath = posixpath.join(path, f)
                        try:
                            # Check if it's a directory
                            sftp.stat(filepath).st_mode
                            # If we get here, it's a file or directory
                            try:
                                # Try to remove as file
                                sftp.remove(filepath)
                            except IOError:
                                # If not a file, it's a directory - remove recursively
                                rm_rf(sftp, filepath)
                        except IOError:
                            # Error stating the file, just try to remove it
                            try:
                                sftp.remove(filepath)
                            except IOError:
                                pass
                    
                    # Then remove the directory itself
                    sftp.rmdir(path)
                except Exception as e:
                    # Log the error but continue with the database deletion
                    logger.error(f"Error removing remote directory {path}: {str(e)}")
            
            # Remove professor and student directories
            rm_rf(sftp, professor_path)
            rm_rf(sftp, student_path)
            
    except Exception as e:
        # Log the error but continue with the database deletion
        logger.error(f"Error connecting to SFTP server: {str(e)}")
    
    crud.practice.delete_practice(session=session, practice=practice)

    return Message(message="Practice deleted")

@router.post("/{practice_id}/upload")
async def upload_practice_file(session: SessionDep, practice_id: uuid.UUID, current_user: CurrentUser, file: UploadFile) -> Any:
    """
    Upload practice files.
    """
    practice = crud.practice.get_practice(session=session, id=practice_id)
    if not practice:
        raise HTTPException(status_code=400, detail="Practice not found")
        
    if current_user not in practice.users:
        raise HTTPException(status_code=400, detail="User not in course")
    
    if not file:
        raise HTTPException(status_code=400, detail="No file uploaded")
    
    body = None
    try:
        with sftp_service.sftp_client() as sftp:
            if current_user.is_student:
                if not file.filename.lower().endswith(".zip"):
                    raise HTTPException(status_code=400, detail="Only ZIP files are allowed")

                dir_path = posixpath.join(settings.STUDENT_FILES_PATH, practice.course.academic_year, format_directory_name(practice.course.name), format_directory_name(practice.name), current_user.niub)
                sftp_service.mkdir_p(sftp, dir_path)

                practice_user = session.exec(
                    select(PracticesUsersLink)
                    .where(
                        PracticesUsersLink.user_niub == current_user.niub,
                        PracticesUsersLink.practice_id == practice.id
                    )
                ).first()

                # Si existe un archivo previo, eliminarlo antes de guardar el nuevo
                if practice_user and practice_user.submission_file_name:
                    previous_file_path = posixpath.join(dir_path, clean_filename(practice_user.submission_file_name))
                    try:
                        sftp.remove(previous_file_path)
                    except FileNotFoundError:
                        pass
                    except Exception as e:
                        logger.warning(f"Error removing previous file: {str(e)}")

                if practice_user:
                    practice_user.status = StatusEnum.SUBMITTED
                    practice_user.submission_date = datetime.now()
                    practice_user.submission_file_name = file.filename
                    session.add(practice_user)
                    session.commit()
                    session.refresh(practice_user)

                if settings.ENABLE_EXTERNAL_SERVICE:
                    body = {
                        "subject": format_directory_name(practice.course.name),
                        "year": practice.course.academic_year,
                        "task": format_directory_name(practice.name),
                        "task_id": str(practice.id),
                        "student_id": current_user.niub,
                        "language": practice.programming_language,
                        "student_dir": f"/{dir_path}",
                        "teacher_dir": f"/{settings.PROFESSOR_FILES_PATH}/{practice.course.academic_year}/{format_directory_name(practice.course.name)}/{format_directory_name(practice.name)}"
                    }

            else:
                dir_path = posixpath.join(settings.PROFESSOR_FILES_PATH, practice.course.academic_year, format_directory_name(practice.course.name), format_directory_name(practice.name))
                sftp_service.mkdir_p(sftp, dir_path)

            remote_file_path = f"{dir_path}/{clean_filename(file.filename)}"

            try:
                await sftp_service.upload_file_sftp(sftp, file, remote_file_path)
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Error uploading file: {str(e)}")

    except HTTPException:
        # Re-lanzar HTTPExceptions para que no se oculten
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error connecting or processing SFTP: {str(e)}")

    if body:
        try:
            practice_service.send_practice_data(body)
        except Exception as e:
            logger.error(f"Error sending practice data to external service: {str(e)}")

    return {
        "status": "success",
        "file": {
            "filename": file.filename,
            "content_type": file.content_type,
            "remote_path": remote_file_path,
            "submitted_at": datetime.now().isoformat()
        }
    }

@router.delete("/{practice_id}/submission/{user_niub}", dependencies=[Depends(get_current_teacher)], response_model=Message)
def delete_practice_submission(session: SessionDep, practice_id: uuid.UUID, user_niub: str) -> Any:
    """
    Delete a student's practice submission if the practice is in CORRECTING state.
    """
    result = session.exec(
        select(Practice, PracticesUsersLink).join(PracticesUsersLink).where(
            PracticesUsersLink.user_niub == user_niub,
            PracticesUsersLink.practice_id == practice_id
        )
    ).first()

    if not result:
        raise HTTPException(status_code=400, detail="Practice or user not found")
    
    practice, practice_user = result
    
    if practice_user.status == StatusEnum.CORRECTING:
        raise HTTPException(status_code=400, detail="Cannot delete submission that is in CORRECTING state")
    
    try:
        with sftp_service.sftp_client() as sftp:
            dir_path = posixpath.join(settings.STUDENT_FILES_PATH, practice.course.academic_year, format_directory_name(practice.course.name), format_directory_name(practice.name), user_niub)

            if practice_user and practice_user.submission_file_name:
                previous_file_path = posixpath.join(dir_path, clean_filename(practice_user.submission_file_name))
                try:
                    sftp.remove(previous_file_path)
                except FileNotFoundError:
                    pass
                except Exception as e:
                    logger.warning(f"Error removing previous file: {str(e)}")

            if practice_user:
                practice_user.status = StatusEnum.NOT_SUBMITTED
                practice_user.submission_date = None
                practice_user.submission_file_name = None
                practice_user.correction = None
                session.add(practice_user)
                session.commit()
                session.refresh(practice_user)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error connecting or processing SFTP: {str(e)}")

    return Message(message="Submission file deleted and status reset to NOT_SUBMITTED.")

def add_files_to_zip_from_sftp(zip_file: zipstream.ZipFile, sftp: paramiko.SFTPClient, remote_path: str, temp_dir: str, base_dir: str = "") -> None:
    """
    Add files from SFTP directory to a ZIP file with relative paths.

    :param zip_file: The ZIP file object.
    :param sftp: SFTP client.
    :param remote_path: The remote directory path on SFTP server.
    :param temp_dir: The temporary directory to use.
    :param base_dir: The base directory inside the ZIP file (optional).
    """
    try:
        _walk_remote_dir_and_add_to_zip(zip_file, sftp, remote_path, temp_dir, base_dir)
    except FileNotFoundError:
        pass

def _walk_remote_dir_and_add_to_zip(zip_file: zipstream.ZipFile, sftp: paramiko.SFTPClient, 
                                   remote_path: str, temp_dir: str, base_dir: str = "", current_dir: str = ""):
    """
    Recursively walk through remote directory and add files to zip.
    """
    try:
        remote_current_path = posixpath.join(remote_path, current_dir) if current_dir else remote_path
        items = sftp.listdir(remote_current_path)
        
        for item in items:
            item_path = posixpath.join(current_dir, item) if current_dir else item
            remote_item_path = posixpath.join(remote_path, item_path)
            
            try:
                # Check if it's a directory
                if sftp.stat(remote_item_path).st_mode & 0o40000:
                    # Recursive call for subdirectory
                    _walk_remote_dir_and_add_to_zip(zip_file, sftp, remote_path, temp_dir, base_dir, item_path)
                else:
                    # It's a file - download to temp directory
                    local_temp_path = os.path.join(temp_dir, item)
                    sftp.get(remote_item_path, local_temp_path)
                    
                    # Add to zip file with correct path structure
                    rel_path = item_path
                    arcname = posixpath.join(base_dir, rel_path) if base_dir else rel_path
                    zip_file.write(local_temp_path, arcname)
            except Exception as e:
                # Skip problematic files but continue processing
                print(f"Error processing {remote_item_path}: {str(e)}")
                continue
    except FileNotFoundError:
        # Skip directories that don't exist
        pass

@router.get("/{practice_id}/download/me", response_class=StreamingResponse)
async def download_my_files(*, session: SessionDep, practice_id: uuid.UUID, current_user: CurrentUser, background_tasks: BackgroundTasks) -> Any:
    """
    Download the current user's files for a specific practice from SFTP server.
    """
    # Get practice
    practice = crud.practice.get_practice(session=session, id=practice_id)
    if not practice:
        raise HTTPException(status_code=404, detail="Practice not found")
    
    # Check if user has access to the practice
    if current_user not in practice.users:
        raise HTTPException(status_code=403, detail="Access denied to this practice")
    
    base_path = settings.PROFESSOR_FILES_PATH if current_user.is_teacher else settings.STUDENT_FILES_PATH
    file_path = posixpath.join(base_path, practice.course.academic_year, format_directory_name(practice.course.name), format_directory_name(practice.name))
    user_path = posixpath.join(file_path, current_user.niub) if not current_user.is_teacher else file_path
    
    # Create a persistent temporary directory
    temp_dir = tempfile.mkdtemp()

    # Create zipstream
    z = zipstream.ZipFile(mode='w', compression=zipstream.ZIP_DEFLATED)
    
    try:
        # Use SFTP to get files
        with sftp_service.sftp_client() as sftp:
            # Add files to zip
            add_files_to_zip_from_sftp(z, sftp, user_path, temp_dir, "")
    
    except Exception as e:
        shutil.rmtree(temp_dir, ignore_errors=True)
        raise HTTPException(status_code=500, detail=f"Error connecting or processing SFTP: {str(e)}")
    
    # Schedule temp_dir cleanup after streaming completes
    background_tasks.add_task(lambda: shutil.rmtree(temp_dir, ignore_errors=True))
    
    # Create response with appropriate headers
    filename = f"{practice.name}_{'teacher' if current_user.is_teacher else 'student'}_{current_user.niub}.zip"
    return StreamingResponse(
        z,
        media_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
        background=background_tasks
    )

@router.get("/{practice_id}/download/all", dependencies=[Depends(get_current_teacher)], response_class=StreamingResponse)
async def download_all_files(*, session: SessionDep, practice_id: uuid.UUID, current_user: CurrentUser, background_tasks: BackgroundTasks) -> Any:
    """
    Download all files for a practice from SFTP server. Only available to teachers.
    Creates a ZIP with subdirectories for each user.
    """
    
    # Get practice
    practice = crud.practice.get_practice(session=session, id=practice_id)
    if not practice:
        raise HTTPException(status_code=404, detail="Practice not found")
    
    # Check if teacher has access to the practice
    if current_user not in practice.users and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Access denied to this practice")
    
    # Base paths
    prof_base_path = posixpath.join(settings.PROFESSOR_FILES_PATH, practice.course.academic_year, format_directory_name(practice.course.name), format_directory_name(practice.name))
    student_base_path = posixpath.join(settings.STUDENT_FILES_PATH, practice.course.academic_year, format_directory_name(practice.course.name), format_directory_name(practice.name))
    
    # Create a persistent temporary directory
    temp_dir = tempfile.mkdtemp()

    # Create zipstream
    z = zipstream.ZipFile(mode='w', compression=zipstream.ZIP_DEFLATED)
    
    # Use SFTP to get files
    try:
        with sftp_service.sftp_client() as sftp:
            for user in practice.users:
                if not user.is_teacher:
                    user_path = posixpath.join(student_base_path, user.niub)
                    base_dir = f"students/{user.niub}"
                    # Add student files to zip
                    add_files_to_zip_from_sftp(z, sftp, user_path, temp_dir, base_dir)
                
            # Add teachers files to zip
            add_files_to_zip_from_sftp(z, sftp, prof_base_path, temp_dir, "teachers")

    except Exception as e:
        shutil.rmtree(temp_dir, ignore_errors=True)
        raise HTTPException(status_code=500, detail=f"Error connecting or processing SFTP: {str(e)}")

    # Schedule temp_dir cleanup after streaming completes
    background_tasks.add_task(lambda: shutil.rmtree(temp_dir, ignore_errors=True))

    # Create response with appropriate headers
    filename = f"{practice.name}_all_submissions.zip"
    return StreamingResponse(
        z,
        media_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
        background=background_tasks
    )

@router.get("/{practice_id}/download/{user_niub}", response_class=StreamingResponse)
async def download_user_files(*, session: SessionDep, practice_id: uuid.UUID, user_niub: str, current_user: CurrentUser, background_tasks: BackgroundTasks) -> Any:
    """
    Download files for a specific user in a practice from SFTP server.
    Teachers can download any user's files. Students can only download their own.
    """
    # Get practice
    practice = crud.practice.get_practice(session=session, id=practice_id)
    if not practice:
        raise HTTPException(status_code=404, detail="Practice not found")
    
    # Check if current user has access to the practice
    if current_user not in practice.users and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Access denied to this practice")
    
    # Get target user
    target_user = crud.user.get_user_by_niub(session=session, niub=user_niub)
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Security check: Students can only download their own files
    if not current_user.is_teacher and current_user.niub != user_niub and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Access denied to this user's files")
    
    # Check if target user has access to the practice
    if target_user not in practice.users:
        raise HTTPException(status_code=404, detail="This user is not enrolled in this practice")
    
    base_path = settings.PROFESSOR_FILES_PATH if target_user.is_teacher else settings.STUDENT_FILES_PATH
    file_path = posixpath.join(base_path, practice.course.academic_year, format_directory_name(practice.course.name), format_directory_name(practice.name))
    user_path = posixpath.join(file_path, target_user.niub) if not target_user.is_teacher else file_path
    
    # Create a persistent temporary directory
    temp_dir = tempfile.mkdtemp()

    # Create zipstream
    z = zipstream.ZipFile(mode='w', compression=zipstream.ZIP_DEFLATED)
    
    try:
        # Use SFTP to get files
        with sftp_service.sftp_client() as sftp:
            # Add files to zip
            add_files_to_zip_from_sftp(z, sftp, user_path, temp_dir, "")
    
    except Exception as e:
        shutil.rmtree(temp_dir, ignore_errors=True)
        raise HTTPException(status_code=500, detail=f"Error connecting or processing SFTP: {str(e)}")

    background_tasks.add_task(lambda: shutil.rmtree(temp_dir, ignore_errors=True))
    
    # Create response with appropriate headers
    filename = f"{practice.name}_{'teacher' if target_user.is_teacher else 'student'}_{target_user.niub}.zip"
    return StreamingResponse(
        z,
        media_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
        background=background_tasks
    )

@router.post("/send-practice-data/{practice_id}/{niub}", dependencies=[Depends(get_current_teacher)], response_model=Message)
def send_practice_data(*, session: SessionDep, practice_id: str, niub: str) -> Any:
    """
    Send practice data for correction.
    """
    practice = crud.practice.get_practice(session=session, id=practice_id)
    if not practice:
        raise HTTPException(status_code=404, detail="Practice not found")
    
    practice_user = session.exec(select(PracticesUsersLink)
        .where(
            PracticesUsersLink.user_niub == niub,
            PracticesUsersLink.practice_id == practice_id
        )
    ).first()
    
    if practice_user:
        practice_user.status = StatusEnum.SUBMITTED
        session.add(practice_user)
        session.commit()
        session.refresh(practice_user)
    
    body = {
        "subject": format_directory_name(practice.course.name),
        "year": practice.course.academic_year,
        "task": format_directory_name(practice.name),
        "task_id": str(practice.id),
        "student_id": niub,
        "language": practice.programming_language,
        "student_dir": f"/{settings.STUDENT_FILES_PATH}/{practice.course.academic_year}/{format_directory_name(practice.course.name)}/{format_directory_name(practice.name)}/{niub}",
        "teacher_dir": f"/{settings.PROFESSOR_FILES_PATH}/{practice.course.academic_year}/{format_directory_name(practice.course.name)}/{format_directory_name(practice.name)}"
    }

    practice_service.send_practice_data(body)

    return Message(message="Practice data sent successfully")