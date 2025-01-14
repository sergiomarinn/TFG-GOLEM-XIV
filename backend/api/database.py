from sqlalchemy import create_engine

from sqlalchemy.orm import sessionmaker, declarative_base

from sqlalchemy.sql import text

import os
from dotenv import load_dotenv

load_dotenv("C:/Users/rocio/IdeaProjects/TFG/backend/.env")

SQLALCHEMY_DATABASE_URL = os.getenv("url_db")

engine = create_engine(
    SQLALCHEMY_DATABASE_URL
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()