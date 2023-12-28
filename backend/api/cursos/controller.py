from fastapi import APIRouter, Depends, HTTPException, Request, Response, UploadFile, Form, File
from fastapi.responses import FileResponse, StreamingResponse
from api.auth.controller import decodeToken
from typing import Annotated, List, Optional
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from pathlib import Path
from typing import Annotated
from io import BytesIO
import os
from api.mongodb import MongoDBClient
from api.database import SessionLocal
from api import models  # rcp_client
import pandas as pd
from sqlalchemy.dialects.postgresql import insert


prof_path = './api/correcciones/profesores'
almn_path = './api/correcciones/alumnos'

# rabbit = rcp_client.RpcClient()

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
    nom: str


class Practica(BaseModel):
    id: int
    descripcio: Optional[str] = None
    nom: str
    llenguatje: str


@router.post("")
async def crear_nou_curs(user: auth, nom: str = Form(...),
                         curs: str = Form(...),
                         descripcio: str = Form(...),
                         file: UploadFile = File(...),  db: Session = Depends(get_db)):

    if user['is_alumno']:
        raise HTTPException(401, "Unauthorized")

    filN, extension = os.path.splitext(file.filename)

    if extension.lower() == ".csv":
        data = pd.read_csv(file.file)
    elif extension.lower() in [".xlsx", ".xls"]:
        data = pd.read_excel(file.file.read())
    else:
        raise HTTPException(500, "Solo se puede subir archivos csv o excel")

    curs = models.cursos(nom=nom, curs=curs,
                         descripcio=descripcio)
    db.add(curs)
    db.commit()
    db.refresh(curs)

    p_path = prof_path + "/" + curs.curs + "/" + curs.nom
    a_path = almn_path + "/" + curs.curs + "/" + curs.nom

    try:
        os.makedirs(p_path)
        os.makedirs(a_path)
    except FileExistsError:
        pass

    info = [{"user_niub": user['niub'], "cursos_id": curs.id}]
    for i in data["niub"]:
        info.append({"user_niub": i, "cursos_id": curs.id})

    stmt = insert(models.cursos_usuario).values(info)
    db.execute(stmt)
    db.commit()
    return curs


@router.post("/practica")
async def crear_practicas(user: auth, 
                         nom: str = Form(...),
                         idiomaP: str = Form(...),
                         descripcio: str = Form(...),
                         files: list[UploadFile] = File(...),
                         id_curs: str = Form(...), 
                         db: Session = Depends(get_db)):
    
    if user['is_alumno']:
        raise HTTPException(401, "Unauthorized")
    
    
    curs = db.query(models.cursos).join(models.cursos.usuarios).filter(
        models.User.niub == user['niub'], models.cursos.id == id_curs).first()
    
    practica = models.practicas(nom=nom, curs=id_curs, descripcio=descripcio,idiomaP=idiomaP)

    try: 
        db.add(practica)
        db.commit() 

    except SQLAlchemyError as e:
        error = str(e.__dict__['orig'])
        raise HTTPException(500 , "Prueba")

    p_path = prof_path + "/" + curs.curs + "/" + curs.nom + "/" + nom
    a_path = almn_path + "/" + curs.curs + "/" + curs.nom + "/" + nom

    try:
        os.makedirs(p_path)
        os.makedirs(a_path)
    except FileExistsError:
        pass



    for file in files:
        directorio = p_path + "/" + file.filename
        with open(directorio, 'wb') as f:
            chunk_size = 1024 * 1024
            while True:
                chunk = file.file.read(chunk_size)
                if not chunk:
                    break
                f.write(chunk)
    


@router.get("/csv")
async def get_csv():

    df = pd.DataFrame(columns=["niub", "nom", "cognoms"])
    return StreamingResponse(iter(df.to_csv(index=False)), media_type="text/csv",
                             headers={"Content-Disposition": f"attachment; filename=plantilla_alumnes.csv"})


@router.get("/excel")
async def get_excel():

    df = pd.DataFrame(columns=["niub", "nom", "cognoms"])

    # Crear archivo Excel en memoria
    buffer = BytesIO()
    with pd.ExcelWriter(buffer, engine="openpyxl") as writer:
        df.to_excel(writer, sheet_name="Sheet1")

    # Configurar la respuesta HTTP
    response = Response(content=buffer.getvalue(), media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    response.headers["Content-Disposition"] = f"attachment; filename=plantilla_alumnes.xlsx"

    return response


@router.get("")
async def get_cursos(user: auth, db: Session = Depends(get_db)):
    cursos = db.query(models.cursos).join(models.cursos.usuarios).filter(
        models.User.niub == user['niub']).all()
    return cursos


@router.get("/curs/{id}")
async def get_practiques(id: int, user: auth, db: Session = Depends(get_db)):
   
    practiques = db.query(models.practicas).filter(
       models.practicas.curs == id).all()
    
    return practiques

@router.delete("")
def deleteUser(formdata: Curs = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.cursos).filter(
        models.cursos.nom == formdata.nom).first()
    db.delete(user)
    db.commit()
    return {"eliminado": user}


@router.post("/upload")
async def upload_file(
    nom: str = Form(...),
    curs: str = Form(...),
    descripcio: str = Form(...),
    file: UploadFile = File(...),
):
    return {
        "nom": nom,
        "curs": curs,
        "descripcio": descripcio,
        "file_content_type": file.content_type,
    }
