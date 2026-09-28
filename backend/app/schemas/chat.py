from typing import List, Optional, Any
from datetime import datetime
from pydantic import BaseModel, Field


class CitationItem(BaseModel):
    citation_index: int
    source_tag: str
    paper_id: Optional[int] = None
    paper_title: str
    page_number: int
    section: Optional[str] = "Main Text"
    text: str
    similarity_score: float = 0.0


class ChatRequest(BaseModel):
    conversation_id: Optional[int] = None
    paper_ids: Optional[List[int]] = None
    question: str = Field(..., min_length=1)
    top_k: int = Field(default=6, ge=1, le=20)


class ChatResponse(BaseModel):
    conversation_id: int
    question: str
    answer: str
    citations: List[CitationItem]


class MessageResponse(BaseModel):
    id: int
    conversation_id: int
    role: str
    content: str
    citations: Optional[List[dict]] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ConversationResponse(BaseModel):
    id: int
    title: str
    selected_paper_ids: Optional[List[int]] = None
    created_at: datetime
    updated_at: datetime
    messages: List[MessageResponse] = []

    class Config:
        from_attributes = True
