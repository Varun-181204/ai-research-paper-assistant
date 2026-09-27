import logging
from typing import Generator
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from app.config import settings

logger = logging.getLogger(__name__)

# Base class for models
Base = declarative_base()

def get_engine():
    """
    Creates and returns the SQLAlchemy engine.
    Tries the configured PostgreSQL DATABASE_URL. If PostgreSQL is unreachable
    or if DATABASE_URL starts with sqlite, it gracefully initializes SQLite for local development.
    """
    db_url = settings.DATABASE_URL
    connect_args = {}

    if db_url.startswith("sqlite"):
        connect_args = {"check_same_thread": False}
        return create_engine(db_url, connect_args=connect_args, echo=False)

    try:
        # Test PostgreSQL connection with pool pre-ping
        engine = create_engine(
            db_url,
            pool_pre_ping=True,
            connect_args={"connect_timeout": 3} if "psycopg" in db_url else {}
        )
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info("Successfully connected to primary database: %s", db_url.split("@")[-1])
        return engine
    except Exception as e:
        logger.warning(
            "Primary database connection (%s) failed: %s. Falling back to local SQLite: %s",
            db_url.split("@")[-1] if "@" in db_url else db_url,
            str(e),
            settings.SQLITE_FALLBACK_URL
        )
        return create_engine(
            settings.SQLITE_FALLBACK_URL,
            connect_args={"check_same_thread": False},
            echo=False
        )


engine = get_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency that provides a database session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def check_db_health() -> dict:
    """Checks active database connection health and returns details."""
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {
            "status": "healthy",
            "dialect": engine.dialect.name,
            "connected": True
        }
    except Exception as exc:
        return {
            "status": "unhealthy",
            "error": str(exc),
            "connected": False
        }


def init_db() -> None:
    """Initializes all database tables registered with Base."""
    import app.models  # Ensure all models are registered
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables initialized successfully.")
