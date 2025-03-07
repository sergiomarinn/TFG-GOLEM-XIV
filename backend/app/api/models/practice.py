from sqlmodel import Field, Relationship
from typing import List, Optional
from datetime import date
from .base import SQLModel

class Practicas(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    curs: int = Field(foreign_key="cursos.id")
    nom: str = Field(primary_key=True)
    descripcio: Optional[str] = None
    idiomaP: str
    entrega: Optional[date] = None
    usuarios: List["User"] = Relationship(back_populates="practicas", link_model="PracticasUsuario")

class PracticasUsuario(SQLModel, table=True):
    user_niub: str = Field(foreign_key="user.niub", primary_key=True)
    practicas_id: int = Field(foreign_key="practicas.id", primary_key=True)
    corregit: bool = Field(default=False)