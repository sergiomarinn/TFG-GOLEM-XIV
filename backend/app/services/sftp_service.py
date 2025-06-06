import posixpath
from app.models import Course, Practice, PracticesUsersLink, PracticeFileInfo
from app.utils import clean_filename, format_directory_name
import paramiko
from fastapi import UploadFile
from app.core.config import settings
from contextlib import contextmanager
from fastapi.concurrency import run_in_threadpool

@contextmanager
def sftp_client():
    transport = paramiko.Transport((settings.SFTP_HOST, settings.SFTP_PORT))
    transport.connect(username=settings.SFTP_USER, pkey=settings.sftp_pkey)
    sftp = paramiko.SFTPClient.from_transport(transport)
    try:
        yield sftp
    finally:
        sftp.close()
        transport.close()

def upload_file(sftp: paramiko.SFTPClient, file: UploadFile, remote_path: str):
    file.file.seek(0)
    sftp.putfo(file.file, remote_path)

def mkdir_p(sftp_client: paramiko.SFTPClient, path: str):
    if path in ('', '/'):
        return
    
    try:
        sftp_client.stat(path)
    except IOError:
        parent = posixpath.dirname(path)
        if parent != path:
            mkdir_p(sftp_client, parent)
        try:
            sftp_client.mkdir(path)
        except IOError:
            try:
                sftp_client.stat(path)
            except IOError:
                raise RuntimeError(f"Failed to create directory: {path}")

def get_directory_files_info(sftp_client: paramiko.SFTPClient, directory_path: str) -> list[PracticeFileInfo]:
    """
    Get file information (name and size) from a directory via SFTP.
    
    :param sftp_client: SFTP client
    :param directory_path: Path to the directory
    :return: List of PracticeFileInfo objects
    """
    files_info = []
    
    try:
        # Check if directory exists
        sftp_client.stat(directory_path)
    except IOError:
        # Directory doesn't exist, return empty list
        return files_info
    
    try:
        # List directory contents
        items = sftp_client.listdir_attr(directory_path)
        
        for item in items:
            # Only include files (not directories)
            if item.st_mode and not (item.st_mode & 0o170000) == 0o040000:
                files_info.append(PracticeFileInfo(
                    name=item.filename,
                    size=item.st_size or 0
                ))
        
        # Sort files by name for consistent ordering
        files_info.sort(key=lambda x: x.name.lower())
        
    except IOError as e:
        raise RuntimeError(f"Failed to read directory '{directory_path}': {str(e)}")
    
    return files_info

async def get_practice_correction_files_info(practice: Practice) -> list[PracticeFileInfo]:
    """
    Get correction files information for a practice asynchronously.
    
    :param practice: Practice
    :return: List of PracticeFileInfo objects
    """
    def _get_files_info():
        # Build correction files path (professor files path)
        correction_files_path = posixpath.join(
            settings.PROFESSOR_FILES_PATH,
            practice.course.academic_year,
            format_directory_name(practice.course.name),
            format_directory_name(practice.name)
        )
        
        # Get files information via SFTP
        with sftp_client() as sftp:
            return get_directory_files_info(sftp, correction_files_path)
    
    return await run_in_threadpool(_get_files_info)

async def replace_practice_files(course: Course, practice_name: str, files: list[UploadFile]):
    base_path = posixpath.join(
        settings.PROFESSOR_FILES_PATH,
        course.academic_year,
        format_directory_name(course.name),
        format_directory_name(practice_name)
    )

    def _replace_practice_files():
        with sftp_client() as sftp:
            try:
                for file_attr in sftp.listdir_attr(base_path):
                    full_path = posixpath.join(base_path, file_attr.filename)
                    sftp.remove(full_path)

            except FileNotFoundError:
                mkdir_p(sftp, base_path)

            # Subir nuevos archivos
            for file in files:
                try:
                    remote_path = posixpath.join(base_path, clean_filename(file.filename))
                    upload_file(sftp, file, remote_path)

                except Exception as e:
                    raise RuntimeError(f"Error uploading file '{file.filename}': {str(e)}")
    
    await run_in_threadpool(_replace_practice_files)

def rename_directory(sftp_client: paramiko.SFTPClient, old_path: str, new_path: str):
    """
    Rename/move directory from old_path to new_path.
    First tries to rename, if that fails, creates new directory and moves contents.
    
    :param sftp_client: SFTP client
    :param old_path: Current directory path
    :param new_path: New directory path
    """
    try:
        # Check if old directory exists
        sftp_client.stat(old_path)
    except IOError:
        # Old directory doesn't exist, nothing to rename
        return
    
    try:
        # Check if new directory already exists
        sftp_client.stat(new_path)
        raise RuntimeError(f"Target directory '{new_path}' already exists")
    except IOError:
        # New directory doesn't exist, which is what we want
        pass
    
    try:
        # Try to rename the directory directly
        sftp_client.rename(old_path, new_path)
        print(f"Successfully renamed directory from '{old_path}' to '{new_path}'")
    except IOError:
        # Rename failed, manually move contents
        print(f"Direct rename failed, moving contents from '{old_path}' to '{new_path}'")
        move_directory_contents(sftp_client, old_path, new_path)

def move_directory_contents(sftp_client: paramiko.SFTPClient, source_dir: str, target_dir: str):
    """
    Move all contents from source_dir to target_dir, then remove source_dir.
    
    :param sftp_client: SFTP client
    :param source_dir: Source directory path
    :param target_dir: Target directory path
    """
    # Create target directory
    mkdir_p(sftp_client, target_dir)
    
    # List contents of source directory
    try:
        items = sftp_client.listdir_attr(source_dir)
    except IOError as e:
        raise RuntimeError(f"Failed to list contents of '{source_dir}': {str(e)}")
    
    # Move each item
    for item in items:
        source_item = posixpath.join(source_dir, item.filename)
        target_item = posixpath.join(target_dir, item.filename)
        
        try:
            if item.st_mode and (item.st_mode & 0o170000) == 0o040000:  # Directory
                # Recursively move directory
                move_directory_contents(sftp_client, source_item, target_item)
            else:
                # Move file
                sftp_client.rename(source_item, target_item)
                print(f"Moved file: {source_item} -> {target_item}")
        except IOError as e:
            raise RuntimeError(f"Failed to move '{source_item}' to '{target_item}': {str(e)}")
    
    # Remove empty source directory
    try:
        sftp_client.rmdir(source_dir)
        print(f"Removed empty directory: {source_dir}")
    except IOError as e:
        print(f"Warning: Failed to remove source directory '{source_dir}': {str(e)}")

async def rename_course_directories(old_course_name: str, new_course_name: str, academic_year: str, old_academic_year: str = None):
    """
    Rename course directories when course name or academic year changes.
    
    :param old_course_name: Current course name
    :param new_course_name: New course name
    :param academic_year: New academic year
    :param old_academic_year: Current academic year (if changing)
    """
    def _rename_directories():
        with sftp_client() as sftp:
            # Use old academic year if provided, otherwise use the new one
            current_academic_year = old_academic_year if old_academic_year else academic_year
            
            # Professor files paths
            old_p_path = posixpath.join(
                settings.PROFESSOR_FILES_PATH, 
                current_academic_year,
                format_directory_name(old_course_name)
            )
            new_p_path = posixpath.join(
                settings.PROFESSOR_FILES_PATH, 
                academic_year,
                format_directory_name(new_course_name)
            )
            
            # Student files paths
            old_a_path = posixpath.join(
                settings.STUDENT_FILES_PATH, 
                current_academic_year,
                format_directory_name(old_course_name)
            )
            new_a_path = posixpath.join(
                settings.STUDENT_FILES_PATH, 
                academic_year,
                format_directory_name(new_course_name)
            )
            
            # Rename professor directory
            try:
                rename_directory(sftp, old_p_path, new_p_path)
            except Exception as e:
                raise Exception(f"Error renaming professor course directory: {str(e)}")
            
            # Rename student directory
            try:
                rename_directory(sftp, old_a_path, new_a_path)
            except Exception as e:
                raise Exception(f"Error renaming student course directory: {str(e)}")
    
    await run_in_threadpool(_rename_directories)

async def rename_practice_directories(old_practice_name: str, new_practice_name: str, course: Course):
    """
    Rename practice directories when practice name changes.
    
    :param old_practice_name: Current practice name
    :param new_practice_name: New practice name
    :param course: Course object
    """
    def _rename_directories():
        with sftp_client() as sftp:
            # Professor files path
            old_p_path = posixpath.join(
                settings.PROFESSOR_FILES_PATH, 
                course.academic_year, 
                format_directory_name(course.name), 
                format_directory_name(old_practice_name)
            )
            new_p_path = posixpath.join(
                settings.PROFESSOR_FILES_PATH, 
                course.academic_year, 
                format_directory_name(course.name), 
                format_directory_name(new_practice_name)
            )
            
            # Student files path
            old_a_path = posixpath.join(
                settings.STUDENT_FILES_PATH, 
                course.academic_year, 
                format_directory_name(course.name), 
                format_directory_name(old_practice_name)
            )
            new_a_path = posixpath.join(
                settings.STUDENT_FILES_PATH, 
                course.academic_year, 
                format_directory_name(course.name), 
                format_directory_name(new_practice_name)
            )
            
            # Rename professor directory
            try:
                rename_directory(sftp, old_p_path, new_p_path)
            except Exception as e:
                raise Exception(f"Error renaming professor directory: {str(e)}")
            
            # Rename student directory
            try:
                rename_directory(sftp, old_a_path, new_a_path)
            except Exception as e:
                raise Exception(f"Error renaming student directory: {str(e)}")
    
    await run_in_threadpool(_rename_directories)

async def create_practice_directories_and_upload_files(course: Course, practice_name: str, files: list[UploadFile]):
    p_path = posixpath.join(settings.PROFESSOR_FILES_PATH, course.academic_year, format_directory_name(course.name), format_directory_name(practice_name))
    a_path = posixpath.join(settings.STUDENT_FILES_PATH, course.academic_year, format_directory_name(course.name), format_directory_name(practice_name))

    def _create_practice_directories_and_upload_files():
        with sftp_client() as sftp:
            mkdir_p(sftp, p_path)
            mkdir_p(sftp, a_path)

            for file in files:
                remote_file_path = posixpath.join(p_path, clean_filename(file.filename))
                upload_file(sftp, file, remote_file_path)

    await run_in_threadpool(_create_practice_directories_and_upload_files)

def rm_rf(path):
    try:
        with sftp_client() as sftp:
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
        print(f"Error removing remote directory {path}: {str(e)}")

async def remove_recursive_diretory(path: str):
    await run_in_threadpool(rm_rf, path)