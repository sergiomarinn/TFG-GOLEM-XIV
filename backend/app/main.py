"""Es el punto de entrada principal de la aplicación FastAPI en tu proyecto.
El propósito del archivo es levantar el servidor FastAPI y manejar las rutas mediante 
la inclusión de los routers definidos en otras partes del proyecto."""


import fastapi
from api.auth.controller import router as correctorRouter
from api.cursos.controller import router as cursosRouter
from fastapi.middleware.cors import CORSMiddleware


app = fastapi.FastAPI()

app.include_router(correctorRouter)
app.include_router(cursosRouter)

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000"
]


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"]
)


@app.get("/")
def index():
    return {"name": app.title, "version": app.version}


