from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field


class NoteCreate(BaseModel):
    paper_id: Optional[int] = None
    title: str = Field(..., min_length=1, max_length=255)
    content: str = Field(..., min_length=1)


class NoteUpdate(BaseModel):
    paper_id: Optional[int] = None
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    content: Optional[str] = Field(None, min_length=1)


class NoteResponse(BaseModel):
    id: int
    paper_id: Optional[int] = None
    paper_title: Optional[str] = None
    title: str
    content: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
