import fastapi
from api.controller import router as correctorRouter
from fastapi.middleware.cors import CORSMiddleware

app = fastapi.FastAPI(title="Senser", version="0.1.0-alpha.1")

app.include_router(correctorRouter)

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