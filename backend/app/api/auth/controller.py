#Gestiona la autenticación de usuarios y otros aspectos relacionados con la creación,
#eliminación y autenticación de cuentas.
#Está basado en FastAPI y JWT para gestionar tokens de autenticación.

#Se utiliza para gestionar la expiración de los tokens de acceso.
from datetime import datetime, timedelta

import json

#Importa componentes esenciales de FastAPI como APIRouter para definir rutas, 
#Depends para gestionar dependencias, HTTPException para errores HTTP,
#UploadFile y Form para manejar formularios y archivos.
from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, Form

#Se utilizan para implementar la autenticación con el protocolo OAuth2 y Bearer Tokens.
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer

#Esta librería permite generar y verificar tokens JWT.
import jwt

#Utilizado por FastAPI para validar los datos de entrada (como formularios).
from pydantic import BaseModel

#Para gestionar sesiones con la base de datos usando SQLAlchemy.
from sqlalchemy.orm import Session

#Para manejar rutas de archivos.
from pathlib import Path
from typing import Annotated  

#Para manejar variables de entorno
import os   

#Cliente personalizado para interaccionar con MongoDB.
from api.mongodb import MongoDBClient

#Herramientas de utilidad como hashing de contraseñas.
import api.utils as utils

#Herramienta que facilita la gestión de login con FastAPI.
from fastapi_login import LoginManager
from fastapi_login.exceptions import InvalidCredentialsException

#Carga las variables de entorno desde un archivo .env.
from dotenv import find_dotenv, load_dotenv

#Importa la base de datos local de SQLAlchemy.
from api.database import SessionLocal, engine

#Importa los modelos de la base de datos para manipular entidades como User.
from api import models

"""CARGA DE CONFIGURACIÓN"""

#Cargan el archivo .env para poder acceder a variables de entorno en el código
dotenv_path = find_dotenv()
load_dotenv(dotenv_path)

#Define el directorio donde se almacenarán los archivos subidos.
UPLOAD_DIR = './api/correcciones'

#Clave secreta utilizada para firmar los tokens JWT.
secret_key = os.getenv("login_manager_secret_key")
#Algoritmo de cifrado utilizado para los JWT.
algoritmo = os.getenv("algoritmo")
#Define el esquema de autenticación con OAuth2 Bearer tokens, apuntando al endpoint de login /users/login.
oauth2_bearer = OAuth2PasswordBearer(tokenUrl='/users/login')


"""CREACIÓN DE TABLAS Y DEPENDENCIAS DE LA BASE DE DATOS"""

#Crea todas las tablas en la base de datos si aún no existen, basado en los modelos definidos en models.Base.
models.Base.metadata.create_all(bind=engine)

#Una dependencia para obtener una sesión de base de datos con SQLAlchemy y 
#asegurarse de que se cierre después de cada solicitud.
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

#Para gestionar la conexión con MongoDB.
def get_mongodb_client():
    mongodb = MongoDBClient()
    try:
        yield mongodb
    finally:
        mongodb.close()        
 
"""DEFINICIÓN DE ESQUEMAS Y RUTAS"""
#Esquema para representar los tokens de acceso
class Token(BaseModel):
    access_token:str
    token_type:str
    
#Esquema para registrar los tokens de acceso    
class registro(BaseModel):
    niub: str  
    email: str
    password: str
    nombre: str   
    apellidos: str

#Esquema para las credenciales de inicio de sesión
class login (BaseModel):
    username:str
    password: str

#Crea un enrutador de FastAPI con el prefijo /users para agrupar 
#todas las rutas relacionadas con los usuarios.
router = APIRouter(
    prefix="/users",
    responses={404: {"description": "Not found"}},
    tags=["users"],
)

"""DECODIFIACIÓN DEL TOKEN JWT"""

#Decodifica el token JWT, valida su contenido y extrae información como niub, 
#is_alumno, is_profesor, y is_admin. Si el token es inválido, lanza una excepción HTTP 401.
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

#Asigna el rol de profesor a un usuario si la persona autenticada es un administrador. 
#Cambia el estado del usuario en la base de datos.
@router.post("/profesor")
async def give_profesor(user: Annotated[dict, Depends(decodeToken)], niub: str = Form(...), db : Session= Depends(get_db)):
    if not user['is_admin']:
        raise HTTPException(401, 'Unauthorized')
    db.query(models.User).filter(models.User.niub == niub.lower()).update({'is_alumno': False, 'is_profesor' : True})
    db.commit()
    return {"message" : "updated"}
    
#Elimina un usuario de la base de datos basado en su niub.
@router.delete("")
def deleteUser(niub: int = Form(...), db: Session = Depends(get_db) ):
    user = db.query(models.User).filter(models.User.niub == niub).first() 
    db.delete(user)
    db.commit()
    return{"eliminado" : user}

#Crea un nuevo usuario en la base de datos SQL y MongoDB. Hash de la contraseña y validación de que el usuario no existe.
@router.post("/")
async def create_user(formData: registro, db: Session = Depends(get_db), mongo : Session = Depends(get_mongodb_client)):
    user = db.query(models.User).filter(models.User.niub == formData.niub).first() 
    if user:
        raise HTTPException(status_code = 400, detail="Este usuario ya existe")
    password_h = utils.hash(formData.password)
    db_user = models.User(niub=formData.niub.lower(),email=formData.email.lower(), password=password_h, nombre=formData.nombre, apellidos=formData.apellidos)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    mongo.getDatabase("mydb")
    mongo.set(mongo.getCollection("mycol"), db_user.niub)
    return db_user

#Valida las credenciales de inicio de sesión y genera un token JWT con los permisos correspondientes.
@router.post("/login")
async def login(form_data:login, db: Session = Depends(get_db) ):
    if form_data.username == "":
        raise InvalidCredentialsException
    
    if '@' in form_data.username.lower():
        user = comprovar_usuario_email(form_data.username.lower(), form_data.password, db)
    else:
        user = comprovar_usuario_niub(form_data.username.lower(), form_data.password, db)
    
    token = create_token(user.niub, user.is_alumno, user.is_profesor, user.is_admin, timedelta(minutes=20))

    return {'access_token' : token, 'token_type': 'Bearer', 'is_alumne' : user.is_alumno, 'is_profesor' : user.is_profesor, 'is_admin' : user.is_admin }

#Crea y devuelve un JWT con los roles del usuario y una fecha de expiración.
def create_token(niub, is_alumno, is_profesor, is_admin, expires_delta: timedelta):
    encode = {'niub': niub, 'is_alumno': is_alumno, 'is_profesor': is_profesor, 'is_admin': is_admin}
    expires= datetime.utcnow() + expires_delta
    encode.update({'exp': expires})
    return jwt.encode(encode, secret_key, algorithm=algoritmo )

#Verifica las credenciales de un usuario cuando inicia sesión usando su correo electrónico.
def comprovar_usuario_email(usuario: str, constraseña: str, db) :
    user = db.query(models.User).filter(models.User.email == usuario).first()
    if not user:
        raise InvalidCredentialsException 
    elif not utils.verify(constraseña, user.password):
        raise InvalidCredentialsException
    return user

#Verifica las credenciales utilizando el NIUB del usuario.
def comprovar_usuario_niub(usuario: str, constraseña: str, db) :
    user = db.query(models.User).filter(models.User.niub == usuario).first()
    if not user:
        raise InvalidCredentialsException 
    elif not utils.verify(constraseña, user.password):
        raise InvalidCredentialsException
    return user

#Define un modelo de datos que se utiliza para recibir información sobre un test
class test(BaseModel):
    curs: str
    assignatura:str
    practica:str

#Permite a los usuarios subir archivos y guardarlos en una estructura de directorios organizada por curso, asignatura y práctica.
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
