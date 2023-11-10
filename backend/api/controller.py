from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session


from api.database import SessionLocal
from . import models, schemas, crud
from .database import SessionLocal, engine
from api.mongodb import MongoDBClient



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
 


router = APIRouter(
    prefix="/corrector",
    responses={404: {"description": "Not found"}},
    tags=["corrector"],
)




@router.get("")
def Hello_World():
    return {"message" : "Hola"}


@router.post("/users")
async def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    return crud.create_user(db=db, user=user)


@router.get("/users")
async def read_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), mongodb: Session = Depends(get_mongodb_client)):
    users = crud.get_users(db,mongodb,skip=skip, limit=limit)
    return users



@router.post("/users/login")
async def login(data: schemas.UserBase, db: Session = Depends(get_db) ):
    email = data.email
    password = data.password
    users = crud.login(db, email, password)
    return users