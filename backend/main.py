import fastapi
from api.auth.controller import router as correctorRouter
from api.cursos.controller import router as cursosRouter
from fastapi.middleware.cors import CORSMiddleware

app = fastapi.FastAPI()

app.include_router(correctorRouter)

app.include_router(cursosRouter)

origins = [
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def index():
    #Return the api name and version
    return {"name": app.title, "version": app.version}