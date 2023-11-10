from typing import Union

from pydantic import BaseModel


class UserBase(BaseModel):
    email: str
    password: str


class UserCreate(UserBase):
    nombre: str
    apellidos: str 


