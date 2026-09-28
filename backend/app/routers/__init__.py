from app.routers.health import router as health_router
from app.routers.papers import router as papers_router
from app.routers.chat import router as chat_router
from app.routers.analysis import router as analysis_router
from app.routers.search import router as search_router
from app.routers.notes import router as notes_router
from app.routers.dashboard import router as dashboard_router

__all__ = [
    "health_router",
    "papers_router",
    "chat_router",
    "analysis_router",
    "search_router",
    "notes_router",
    "dashboard_router",
]
