from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, Form
from api.auth.controller import decodeToken
from typing import Annotated, Optional
from pydantic import BaseModel
from sqlalchemy.orm import Session
from pathlib import Path
from typing import Annotated  
import os   
from api.mongodb import MongoDBClient
from api.database import SessionLocal
from api import models #rcp_client
import pandas as pd
from sqlalchemy.dialects.postgresql import insert


prof_path = './api/correcciones/profesores'
almn_path = './api/correcciones/alumnos'
#rabbit = rcp_client.RpcClient()

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

auth = Annotated[dict, Depends(decodeToken)]

router = APIRouter(
    prefix="/cursos",
    responses={404: {"description": "Not found"}},
    tags=["cursos"],
)

class Curs(BaseModel):
    descripcio: Optional[str] = None
    curs: str
    nom : str

class Practica(BaseModel):
    id : int
    descripcio: Optional[str] = None
    nom : str
    llenguatje:str



@router.post("")
async def crear_nou_curs(user: auth ,file: UploadFile , formData: Curs = Depends(),  db: Session = Depends(get_db)):
    
    if user['is_alumno']:
        raise HTTPException(401, "Unauthorized")
    
    curs = models.cursos(nom=formData.nom, curs=formData.curs, descripcio=formData.descripcio)
    db.add(curs)
    db.commit()
    db.refresh(curs)
    data = pd.read_excel(file.file.read())
    
    p_path = prof_path + "/" + curs.curs + "/" + curs.nom
    a_path = almn_path + "/" + curs.curs + "/" + curs.nom

    try:
        os.makedirs(p_path)
        os.makedirs(a_path)
    except FileExistsError:
        pass
    
    info = [{"user_niub": user['niub'], "cursos_id" : curs.id}]
    for i in data["niub"]:
        info.append({"user_niub": i, "cursos_id" : curs.id})

    stmt = insert(models.cursos_usuario).values(info)
    db.execute(stmt)
    db.commit()

    return curs 


@router.post("/practica")
async def crear_practicas(user: auth, formData: Curs, db: Session = Depends(get_db)):
    if user['is_alumno']:
        raise HTTPException(401, "Unauthorized")
    

    
    



@router.get("")
async def get_cursos(user: auth, db: Session = Depends(get_db)):
    cursos = db.query(models.cursos).join(models.cursos.usuarios).filter(models.User.niub == user['niub']).all()
    return cursos

@router.delete("")
def deleteUser(formdata : Curs = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.cursos).filter(models.cursos.nom == formdata.nom).first() 
    db.delete(user)
    db.commit()
    return{"eliminado" : user}