from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, Form
from api.auth.controller import decodeToken
from typing import Annotated
from pydantic import BaseModel
from sqlalchemy.orm import Session
from pathlib import Path
from typing import Annotated  
import os   
from api.mongodb import MongoDBClient
from api.database import SessionLocal

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



@router.post("")
async def crear_nou_curs(user: auth, formData):
    if user['is_profesor'] != True:
        raise HTTPException(401, 'Unauthorized')
    