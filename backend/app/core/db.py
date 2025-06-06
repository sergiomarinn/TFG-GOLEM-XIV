from sqlmodel import Session, create_engine, select
from sqlalchemy.pool import NullPool

from app import crud
from app.core.config import settings
from app.models import User, UserCreate

engine = create_engine(
    str(settings.SQLALCHEMY_DATABASE_URI), 
    poolclass=NullPool,
    connect_args={"prepare_threshold": None}
)

def init_db(session: Session) -> None:
    user = session.exec(
        select(User).where(User.email == settings.FIRST_SUPERUSER)
    ).first()
    if not user:
        user_in = UserCreate(
            email=settings.FIRST_SUPERUSER,
            password=settings.FIRST_SUPERUSER_PASSWORD,
            is_superuser=True,
        )
        user = crud.user.create_user(session=session, user_create=user_in)