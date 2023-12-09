from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Table, VARCHAR
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from .database import Base

Base = declarative_base()


class cursos_usuario(Base):
    __tablename__ ='cursos_usuario'

    user_niub = Column(String, ForeignKey('user.niub'), primary_key = True)
    cursos_id = Column(Integer, ForeignKey('cursos.id'), primary_key = True)


class User(Base):
    __tablename__ = "user"

    niub = Column(String, unique=True ,primary_key=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    nombre = Column(String, nullable=False)
    apellidos = Column(String, nullable=False)
    is_alumno = Column(Boolean, default=True)
    is_profesor = Column(Boolean, default=False)
    is_admin = Column(Boolean, default=False)
    cursos = relationship('cursos', secondary='cursos_usuario', back_populates='usuarios')


class cursos(Base):
    __tablename__ = "cursos"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nom = Column(String, nullable=False)
    curs= Column(String, nullable=False)
    descripcio= Column(String)
    usuarios = relationship(User, secondary='cursos_usuario', back_populates='cursos')
    practicas = relationship('practicas')

class practicas(Base):

    __tablename__ = "practicas"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    curs = Column(Integer, ForeignKey('cursos.id'), primary_key=True)
    nom = Column(String, nullable=False)
    Descripcio = Column(String)
    idiomaP = Column(String, nullable=False)




    