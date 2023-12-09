from datetime import datetime, timedelta
import json
from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, Form
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
import jwt
from pydantic import BaseModel
from sqlalchemy.orm import Session
from pathlib import Path
from typing import Annotated  
import os   
from api.mongodb import MongoDBClient
import api.utils as utils
from fastapi_login import LoginManager
from fastapi_login.exceptions import InvalidCredentialsException
from dotenv import find_dotenv, load_dotenv

from api.database import SessionLocal, engine
from api import models

dotenv_path = find_dotenv()

load_dotenv(dotenv_path)

UPLOAD_DIR = './api/correcciones'

secret_key = os.getenv("login_manager_secret_key")
algoritmo = os.getenv("algoritmo")
oauth2_bearer = OAuth2PasswordBearer(tokenUrl='/users/login')

models.Base.metadata.create_all(bind=engine)

# Dependency to get db session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_mongodb_client():
    mongodb = MongoDBClient()
    try:
        yield mongodb
    finally:
        mongodb.close()        
 
class Token(BaseModel):
    access_token:str
    token_type:str
    
class registro(BaseModel):
    niub: str  
    email: str
    password: str
    nombre: str   
    apellidos: str

class login (BaseModel):
    username:str
    password: str

router = APIRouter(
    prefix="/users",
    responses={404: {"description": "Not found"}},
    tags=["users"],
)

async def decodeToken(token: Annotated[str, Depends(oauth2_bearer)]):
    try:
        payload = jwt.decode(token, secret_key, algorithms=algoritmo)
        niub: int = payload.get('niub')
        is_alumno: bool = payload.get('is_alumno')
        is_profesor: bool = payload.get('is_profesor')
        is_admin: bool = payload.get('is_admin')
        if niub is None:
            raise HTTPException(status_code=401, detail="No estas autorizado")
        return {'niub': niub, 'is_alumno': is_alumno, 'is_profesor': is_profesor, 'is_admin': is_admin}
    except jwt.exceptions.InvalidTokenError :
        raise HTTPException(status_code=401, detail="No estas autorizado")

class profesor(BaseModel):
    niub:str



@router.post("/profesor")
async def give_profesor(user: Annotated[dict, Depends(decodeToken)], formdata: profesor, db : Session= Depends(get_db)):
    if not user['is_admin']:
        raise HTTPException(401, 'Unauthorized')
    db.query(models.User).filter(models.User.niub == formdata.niub).update({'is_alumno': False, 'is_profesor' : True})
    db.commit()
    return {"message" : "updated"}
    

@router.delete("")
def deleteUser(niub: int = Form(...), db: Session = Depends(get_db) ):
    user = db.query(models.User).filter(models.User.niub == niub).first() 
    db.delete(user)
    db.commit()
    return{"eliminado" : user}


@router.post("/")
async def create_user(formData: registro, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.niub == formData.niub).first() 
    if user:
        raise HTTPException(status_code = 400, detail="Este usuario ya existe")
    password_h = utils.hash(formData.password)
    db_user = models.User(niub=formData.niub,email=formData.email, password=password_h, nombre=formData.nombre, apellidos=formData.apellidos)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


@router.post("/login", response_model=Token)
async def login(form_data:login, db: Session = Depends(get_db) ):
    if form_data.username == "":
        raise InvalidCredentialsException
    
    if '@' in form_data.username:
        user = comprovar_usuario_email(form_data.username, form_data.password, db)
    else:
        user = comprovar_usuario_niub(form_data.username, form_data.password, db)
    
    token = create_token(user.niub, user.is_alumno, user.is_profesor, user.is_admin, timedelta(minutes=20))

    return {'access_token' : token, 'token_type': 'Bearer'}


def create_token(niub, is_alumno, is_profesor, is_admin, expires_delta: timedelta):
    encode = {'niub': niub, 'is_alumno': is_alumno, 'is_profesor': is_profesor, 'is_admin': is_admin}
    expires= datetime.utcnow() + expires_delta
    encode.update({'exp': expires})
    return jwt.encode(encode, secret_key, algorithm=algoritmo )

def comprovar_usuario_email(usuario: str, constraseña: str, db) :
    user = db.query(models.User).filter(models.User.email == usuario).first()
    if not user:
        raise InvalidCredentialsException 
    elif not utils.verify(constraseña, user.password):
        raise InvalidCredentialsException
    return user

def comprovar_usuario_niub(usuario: str, constraseña: str, db) :
    user = db.query(models.User).filter(models.User.niub == usuario).first()
    if not user:
        raise InvalidCredentialsException 
    elif not utils.verify(constraseña, user.password):
        raise InvalidCredentialsException
    return user

class test(BaseModel):
    curs: str
    assignatura:str
    practica:str

@router.post("/uploadfile")
async def login(file: UploadFile, fileForm: test = Depends()):
    directorio = UPLOAD_DIR +"/" + fileForm.curs + "/" + fileForm.assignatura + "/" + fileForm.practica + "/" + file.filename
    with open(directorio, 'wb') as f:
        chunk_size = 1024 * 1024
        while True:
            chunk = file.file.read(chunk_size)
            if not chunk:
                break
            f.write(chunk)
