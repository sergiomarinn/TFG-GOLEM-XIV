import posixpath
import paramiko
import asyncio
from fastapi import UploadFile
from concurrent.futures import ThreadPoolExecutor
from app.core.config import settings
from contextlib import contextmanager

executor = ThreadPoolExecutor(max_workers=5)

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

async def upload_file_sftp(sftp: paramiko.SFTPClient, file: UploadFile, remote_path: str, buffer_size: int = 1024 * 1024):
    def _upload():
        file.file.seek(0)
        with sftp.file(remote_path, 'wb') as remote_file:
            while True:
                chunk = file.file.read(buffer_size)
                if not chunk:
                    break
                remote_file.write(chunk)

    loop = asyncio.get_event_loop()
    await loop.run_in_executor(executor, _upload)


def mkdir_p(sftp_client: paramiko.SFTPClient, remote_directory: str):
    """
    Create remote directory recursively, similar to mkdir -p in Linux.
    
    :param sftp_client: SFTP client
    :param remote_directory: Remote directory path to create
    """
    if remote_directory in ('', '/'):
        return
        
    try:
        sftp_client.stat(remote_directory)
    except IOError:
        parent = posixpath.dirname(remote_directory)
        if parent != remote_directory:
            mkdir_p(sftp_client, parent)
        try:
            sftp_client.mkdir(remote_directory)
        except IOError as e:
            # Check if the directory now exists
            try:
                sftp_client.stat(remote_directory)
            except IOError:
                raise RuntimeError(f"Failed to create directory '{remote_directory}': {str(e)}")
