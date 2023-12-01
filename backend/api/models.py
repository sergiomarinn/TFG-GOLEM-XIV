from sqlalchemy import Boolean, Column, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from .database import Base


class User(Base):
    __tablename__ = "users"

    niub = Column(Integer, primary_key=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    nombre = Column(String, nullable=False)
    apellidos = Column(String, nullable=False)
    is_alumno = Column(Boolean, default=True)
    is_profesor = Column(Boolean, default=False)
    is_admin = Column(Boolean, default=False)


class cursos(Base):
    __tablename__ = "cursos"

    id = Column(Integer, primary_key=True, index=True)
    nom = Column(String)
    profesor= Column(Integer, ForeignKey("users.niub"), nullable=False)
    curs= Column(String, nullable=False)

class assignaturas_alumnos(Base):
    __tablename__ = "assignaturas_alumnos"

    niub = Column(Integer, ForeignKey("users.niub"), nullable=False, primary_key=True)
    id_assignatura = Column(Integer, ForeignKey("cursos.id"), nullable=False)


    