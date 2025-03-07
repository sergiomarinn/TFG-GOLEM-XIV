from sqlmodel import Field, Relationship

from typing import List, Optional
from .base import SQLModel

class CursosUsuario(SQLModel, table=True):
    user_niub: str = Field(foreign_key="user.niub", primary_key=True)
    cursos_id: int = Field(foreign_key="cursos.id", primary_key=True)

class Cursos(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    nom: str
    curs: str
    descripcio: Optional[str] = None
    usuarios: List["User"] = Relationship(back_populates="cursos", link_model=CursosUsuario)
    practicas: List["Practicas"] = Relationship(back_populates="cursos")