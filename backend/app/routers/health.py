from datetime import datetime, timezone
from fastapi import APIRouter, status
from app.config import settings
from app.database import check_db_health
from app.schemas.health import HealthResponse, DatabaseHealth

router = APIRouter(tags=["Health"])


@router.get(
    "/health",
    response_model=HealthResponse,
    status_code=status.HTTP_200_OK,
    summary="Application Health Check",
    description="Returns the operational status of the API and its database connection.",
)
def get_health() -> HealthResponse:
    db_health = check_db_health()
    overall_status = "healthy" if db_health.get("connected") else "degraded"

    return HealthResponse(
        status=overall_status,
        app_name=settings.PROJECT_NAME,
        version=settings.VERSION,
        environment=settings.ENVIRONMENT,
        database=DatabaseHealth(
            status=db_health.get("status", "unknown"),
            connected=db_health.get("connected", False),
            dialect=db_health.get("dialect", "unknown"),
            error=db_health.get("error"),
        ),
        timestamp=datetime.now(timezone.utc).isoformat(),
    )
