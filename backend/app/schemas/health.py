from typing import Dict, Any
from pydantic import BaseModel, Field


class DatabaseHealth(BaseModel):
    status: str
    connected: bool
    dialect: str = Field(default="unknown")
    error: str | None = None


class HealthResponse(BaseModel):
    status: str = "healthy"
    app_name: str
    version: str
    environment: str
    database: DatabaseHealth
    timestamp: str
