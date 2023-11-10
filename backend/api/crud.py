import os
from sqlalchemy.orm import Session
from api.mongodb import MongoDBClient
import api.utils as utils
from fastapi_login import LoginManager
from fastapi_login.exceptions import InvalidCredentialsException
from dotenv import find_dotenv, load_dotenv
from . import models, schemas

dotenv_path = find_dotenv()
load_dotenv(dotenv_path)

secret_key = os.getenv("login_manager_secret_key")

manager = LoginManager(secret_key, token_url='/users/login')

def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()


def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()


def get_users(db: Session, mongodb: MongoDBClient ,skip: int = 0, limit: int = 100):
    mongodb.ping()
    return db.query(models.User).offset(skip).limit(limit).all()


def create_user(db: Session, user: schemas.UserCreate):
    password = utils.hash(user.password)
    db_user = models.User(email=user.email, password=password, nombre=user.nombre, apellidos=user.apellidos)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def login(db: Session, email: str, password: str):
    user = get_user_by_email(db,email) 
    if not user:
        raise InvalidCredentialsException 
    elif not utils.verify(password, user.password):
        raise InvalidCredentialsException
    
    access_token = manager.create_access_token(
        data=dict(sub=email)
    )
    return {'access_token': access_token, 'token_type': 'bearer'}