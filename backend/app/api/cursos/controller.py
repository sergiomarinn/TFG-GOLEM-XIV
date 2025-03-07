#Se importan varias funcionalidades de FastAPI para manejar rutas, excepciones, y archivos. 
#decodeToken se usa para la autenticación de los usuarios.
from fastapi import APIRouter, Depends, HTTPException, Request, Response, UploadFile, Form, File
from fastapi.responses import FileResponse, StreamingResponse

#Se utilizan para manejar datos, bases de datos (SQL y MongoDB), y archivos.
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
from datetime import date

#Un cliente que se usa para comunicarse con otro servicio (probablemente en Java) para procesar datos.
from api import models, updated_rpc_client_ping, sender

#Para manipular datos tabulares, especialmente archivos CSV y Excel.
import pandas as pd

from sqlalchemy.dialects.postgresql import insert
from api import sender

full_path = os.getenv("full_path")
prof_path = './api/correcciones/profesores'
almn_path = './api/correcciones/alumnos'


send = None

# Dependency to get db session

"""FUNCIONES PARA MANEJAR CONEXIONES A BASE DE DATOS"""

#Crea una sesión de base de datos local que se cerrará después de ser utilizada.
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


"""DEFINICIÓN DEL ROUTER Y MODELOS"""

#Dependencia que extrae y verifica el token de autenticación.
auth = Annotated[dict, Depends(decodeToken)]

#Permite agrupar endpoints relacionados bajo un prefijo.
router = APIRouter(
    prefix="/cursos",
    responses={404: {"description": "Not found"}},
    tags=["cursos"],
)

#Modelos definidos usando Pydantic, que facilita la validación de datos en las solicitudes.
class Curs(BaseModel):
    descripcio: Optional[str] = None
    curs: str
    nom: str


class Practica(BaseModel):
    id: int
    descripcio: Optional[str] = None
    nom: str
    llenguatje: str

"""ENDPOINTS"""

#Permite a un usuario (que no es un alumno) crear un nuevo curso.
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

#Permite a un usuario (que no es un alumno) crear una práctica asociada a un curso.
@router.post("/practica")
async def crear_practicas(user: auth,
                          nom: str = Form(...),
                          idiomaP: str = Form(...),
                          descripcio: str = Form(...),
                          entrega: str = Form(...),
                          files: Optional[list[UploadFile]] = File(None),
                          id_curs: str = Form(...),
                          db: Session = Depends(get_db),
                          mongo: Session = Depends(get_mongodb_client)):

    if user['is_alumno']:
        raise HTTPException(401, "Unauthorized")

    curs = db.query(models.cursos).join(models.cursos.usuarios).filter(
        models.User.niub == user['niub'], models.cursos.id == id_curs).first()

    practica = models.practicas(
        nom=nom, curs=id_curs, descripcio=descripcio, idiomaP=idiomaP, entrega=date.fromisoformat(entrega))

    try:
        db.add(practica)
        db.commit()

    except SQLAlchemyError as e:
        error = str(e.__dict__['orig'])
        raise HTTPException(500, error)

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

#Permite a los usuarios descargar una plantilla de alumnos en formato CSV.
@router.get("/csv")
async def get_csv():

    df = pd.DataFrame(columns=["niub", "nom", "cognoms"])
    return StreamingResponse(iter(df.to_csv(index=False)), media_type="text/csv",
                             headers={"Content-Disposition": f"attachment; filename=plantilla_alumnes.csv"})

#Permite a los usuarios descargar una plantilla de alumnos en formato Excel.
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
    
#Permiten a los usuarios obtener la lista de cursos.
@router.get("")
async def get_cursos(user: auth, db: Session = Depends(get_db), mongo: Session = Depends(get_mongodb_client)):
    if user['is_admin']:
        cursos = db.query(models.cursos).all()
        return cursos
    cursos = db.query(models.cursos).join(models.cursos.usuarios).filter(
        models.User.niub == user['niub']).all()   
    return cursos

#Permiten a los usuarios obtener la lista de prácticas por curso.
@router.get("/curs/practicas/{id}")
async def get_practiques(id: int, user: auth, db: Session = Depends(get_db)):

    practiques = db.query(models.practicas).filter(
        models.practicas.curs == id).all()

    return practiques

#Permiten a los usuarios obtener la lista de prácticas por usuario.
@router.get("/practicas/usuario")
async def get_practiques(user: auth, db: Session = Depends(get_db)):

    practiques = db.query(
    models.practicas.nom,       # Campo 'nom' de la tabla 'practicas'
    models.practicas.entrega,   # Campo 'entrega' de la tabla 'practicas'
    models.practicas.descripcio # Campo 'descripcio' de la tabla 'practicas'
    ).join(
        models.practicas_usuario,  # Unimos con la tabla 'practicas_usuario'
        models.practicas.id == models.practicas_usuario.practicas_id  # Condición de unión
    ).filter(
        models.practicas_usuario.user_niub == user['niub']  # Filtramos por el 'user_niub' del usuario
    ).all()

    practicas = [
    {"nom": nom, "entrega": entrega, "descripcio" : descripcio}
    for nom, entrega, descripcio in practiques
    ] 
    print("Practicas_usuario: ", practiques)
    return practicas
#Permiten a los usuarios obtener información detallada de un curso específico.
@router.get("/curs/{id}")
async def get_curs_info(id: int, user: auth, db: Session = Depends(get_db)):

    curs = db.query(models.cursos).filter(
        models.cursos.id == id).first()

    return curs

#Permiten a los usuarios obtener detalles de una práctica específica.
@router.get("/practica/{id}")
async def get_practica_info(id: int, user: auth, db: Session = Depends(get_db), mongo: Session = Depends(get_mongodb_client)):
    practica = db.query(models.practicas).filter(
        models.practicas.id == id).first()
    return practica

#Permiten a los usuarios obtener las prácticas que tiene corregidas.
@router.get("/practicas_corregidas")
async def get_practicas_corregidas(user: auth, db: Session = Depends(get_db), mongo: Session = Depends(get_mongodb_client)):
    practicas_corregidas_con_cursos = (
    db.query(
        models.practicas_usuario.practicas_id,  # ID de la práctica
        models.practicas.curs             # ID del curso asociado
    )
    .join(
        models.practicas,  # Tabla a unir
        models.practicas.id == models.practicas_usuario.practicas_id  # Clave de unión
    )
    .filter(
        models.practicas_usuario.corregit == True,                  # Filtro: prácticas corregidas
        models.practicas_usuario.user_niub == user['niub']         # Filtro: usuario específico
    )
    .all()
    )
    
    print("Prácticas postgress",practicas_corregidas_con_cursos)

    practicas = [
    {"id_practica": practica_id, "id_curso": curso_id}
    for practica_id, curso_id in practicas_corregidas_con_cursos
    ] 

    print("IDs Prácticas IDs cursos",practicas)

    mongo.getDatabase("mydb")
    mongo.getCollection("mycol")
    practicas_corregidas = mongo.practicas(user['niub'], practicas)
    print("Prácticas controller",practicas_corregidas)

    practicas_combinadas = []

    for p in json.loads(practicas_corregidas):
        info = await get_practica_info(p['practica_id'], user, db, mongo)
        curs = await get_curs_info(info.curs, user, db)
        print("Pràctica Controller", info)
        print("Curs Controller", curs)
        practicas_combinadas.append({
            'practica_id': info.id,
            'curs': curs.nom,
            'nom': info.nom,
            'descripcio': info.descripcio,
            'idiomaP': info.idiomaP,
            'correccion': p["correccion"]
        })
    return practicas_combinadas



#Permite a los alumnos subir archivos relacionados con sus prácticas.
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

        body={
            "name": practica.nom,
            "idiomaP": practica.idiomaP,
            "niub": user['niub'],
            "curs_id": curs.id,
            "practica_id": practica.id
        }

        practica_usuario = db.query(models.practicas_usuario).filter(
        models.practicas_usuario.user_niub == user['niub'], models.practicas_usuario.practicas_id == practica.id).first()

        if(practica_usuario):
            # Actualizar la entrada existente
            practica_usuario.corregit = False
            db.commit()
        else:
            new_practica_usuario = models.practicas_usuario(user_niub = user['niub'], practicas_id = practica.id, corregit = False)
            db.add(new_practica_usuario)
            db.commit()

        send = sender.Sender(body)
        
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

