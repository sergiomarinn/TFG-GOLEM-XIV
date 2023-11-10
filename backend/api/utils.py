import os
from passlib.context import CryptContext
from dotenv import find_dotenv, load_dotenv
dotenv_path = find_dotenv()
load_dotenv(dotenv_path)

secret_key = os.getenv("encrypt_key")

pwd_context = CryptContext(schemes=[secret_key], deprecated="auto")

def hash(password: str):
    return pwd_context.hash(password)

def verify(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)