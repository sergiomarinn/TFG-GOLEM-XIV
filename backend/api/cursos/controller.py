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
import asyncio
import json
from api.mongodb import MongoDBClient
from api.database import SessionLocal
from api import models, updated_rpc_client_ping
import pandas as pd
from sqlalchemy.dialects.postgresql import insert

full_path = os.getenv("full_path")
prof_path = './api/correcciones/profesores'
almn_path = './api/correcciones/alumnos'
rpc_client = None

rpc_client = updated_rpc_client_ping.RpcClientPing()
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
                         file: UploadFile = File(...),
                         db: Session = Depends(get_db),
                         mongo: Session = Depends(get_mongodb_client)):

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
    mongo.getDatabase("mydb")
    mongo.getCollection("mycol")
    mongo.push_curso(user['niub'], curs.id)
    for i in data["niub"]:
        info.append({"user_niub": i.lower(), "cursos_id": curs.id})
        mongo.push_curso(i.lower(), curs.id)

    stmt = insert(models.cursos_usuario).values(info)
    db.execute(stmt)
    db.commit()
    return curs


@router.post("/practica")
async def crear_practicas(user: auth,
                          nom: str = Form(...),
                          idiomaP: str = Form(...),
                          descripcio: str = Form(...),
                          files: Optional[list[UploadFile]] = File(None),
                          id_curs: str = Form(...),
                          db: Session = Depends(get_db),
                          mongo: Session = Depends(get_mongodb_client)):

    if user['is_alumno']:
        raise HTTPException(401, "Unauthorized")

    curs = db.query(models.cursos).join(models.cursos.usuarios).filter(
        models.User.niub == user['niub'], models.cursos.id == id_curs).first()

    practica = models.practicas(
        nom=nom, curs=id_curs, descripcio=descripcio, idiomaP=idiomaP)

    try:
        db.add(practica)
        db.commit()

    except SQLAlchemyError as e:
        error = str(e.__dict__['orig'])
        raise HTTPException(500, "Prueba")

    p_path = prof_path + "/" + curs.curs + "/" + curs.nom + "/" + nom
    a_path = almn_path + "/" + curs.curs + "/" + curs.nom + "/" + nom

    try:
        os.makedirs(p_path)
        os.makedirs(a_path)
    except FileExistsError:
        pass

    usuarios_en_curso = (
        db.query(models.User)
        .join(models.cursos_usuario)
        .join(models.cursos)
        .filter(models.cursos.nom == curs.nom)
        .all()
    )

    mongo.getDatabase("mydb")
    mongo.getCollection("mycol")

    info = []

    for usuario in usuarios_en_curso:
        mongo.push_practicas(usuario.niub, curs.id, practica.id)
        info.append({'user_niub': usuario.niub, 'practicas_id': practica.id})

    stmt = insert(models.practicas_usuario).values(info)
    db.execute(stmt)
    db.commit()

    if files != None:

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
    response = Response(content=buffer.getvalue(
    ), media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    response.headers["Content-Disposition"] = f"attachment; filename=plantilla_alumnes.xlsx"

    return response
    
@router.get("")
async def get_cursos(user: auth, db: Session = Depends(get_db), mongo: Session = Depends(get_mongodb_client)):
    if user['is_admin']:
        cursos = db.query(models.cursos).all()
        return cursos
    cursos = db.query(models.cursos).join(models.cursos.usuarios).filter(
        models.User.niub == user['niub']).all()   
    return cursos


@router.get("/curs/practicas/{id}")
async def get_practiques(id: int, user: auth, db: Session = Depends(get_db)):

    practiques = db.query(models.practicas).filter(
        models.practicas.curs == id).all()

    return practiques


@router.get("/curs/{id}")
async def get_curs_info(id: int, user: auth, db: Session = Depends(get_db)):

    curs = db.query(models.cursos).filter(
        models.cursos.id == id).first()

    return curs


@router.get("/practica/{id}")
async def get_practica_info(id: int, user: auth, db: Session = Depends(get_db), mongo: Session = Depends(get_mongodb_client)):
    practica = db.query(models.practicas).filter(
        models.practicas.id == id).first()
    return practica

@router.post("/upload")
async def upload_file(
    user: auth,
    id_practica: int = Form(...),
    files: list[UploadFile] = File(...),
    db: Session = Depends(get_db),
    mongo: Session = Depends(get_mongodb_client)
):
    curs = db.query(models.cursos).join(models.practicas).filter(
        models.practicas.id == id_practica).first()
    practica = db.query(models.practicas).filter(
        models.practicas.id == id_practica).first()

    if user['is_alumno']:

        a_path = almn_path + "/" + curs.curs + "/" + \
            curs.nom + "/" + practica.nom + "/" + user['niub']

        try:
            os.makedirs(a_path)
        except FileExistsError:
            pass

        for file in files:
            directorio = a_path + "/" + file.filename
            with open(directorio, 'wb') as f:
                chunk_size = 1024 * 1024
                while True:
                    chunk = file.file.read(chunk_size)
                    if not chunk:
                        break
                    f.write(chunk)
            mongo.getDatabase("mydb")
            mongo.getCollection("mycol")
            mongo.cambiar_direccion_fichero(user['niub'], curs.id, practica.id, directorio)
        
        a_path = full_path + '/alumnos/' +  curs.curs + "/" + curs.nom + "/" + practica.nom + "/" + user['niub'] 
        p_path = full_path + '/profesores/' +  curs.curs + "/" + curs.nom + "/" + practica.nom
        print(a_path)
        print(p_path)
        await rpc_client.connect()
        result = await rpc_client.call("java_checks", curs.nom, curs.curs, practica.nom, user['niub'], a_path, p_path)
        string = result.decode("utf-8")
        resposta  = json.loads(string)
        mongo.correccion(user['niub'], curs.id, practica.id, resposta)
        
    else:
        p_path = prof_path + "/" + curs.curs + "/" + curs.nom + "/" + practica.nom
        if files != None:
            for file in files:
                directorio = p_path + "/" + file.filename
                with open(directorio, 'wb') as f:
                    chunk_size = 1024 * 1024
                    while True:
                        chunk = file.file.read(chunk_size)
                        if not chunk:
                            break
                        f.write(chunk)

