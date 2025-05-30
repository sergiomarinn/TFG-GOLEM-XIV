from fastapi import APIRouter

from app.api.routes import login, users, courses, practices

api_router = APIRouter()
api_router.include_router(login.router, tags=["login"])
api_router.include_router(users.router, tags=["users"], prefix="/users")
api_router.include_router(courses.router, tags=["course"], prefix="/courses")
api_router.include_router(practices.router, tags=["practices"], prefix="/practices")