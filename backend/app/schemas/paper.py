from typing import List, Optional, Any
from datetime import datetime
from pydantic import BaseModel, Field


class ChunkResponse(BaseModel):
    id: int
    paper_id: int
    page_number: int
    section: Optional[str] = None
    chunk_index: int
    text: str

    class Config:
        from_attributes = True


class PaperResponse(BaseModel):
    id: int
    title: str
    authors: Optional[str] = None
    abstract: Optional[str] = None
    publication_year: Optional[int] = None
    filename: str
    page_count: int
    processing_status: str
    error_message: Optional[str] = None
    chunk_count: int = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PaperDetailResponse(PaperResponse):
    has_analysis: bool = False
