from typing import List, Optional, Any
from datetime import datetime
from pydantic import BaseModel
from app.schemas.paper import PaperResponse
from app.schemas.note import NoteResponse


class DashboardStatsResponse(BaseModel):
    total_papers: int
    papers_processed: int
    papers_failed: int
    total_chunks: int
    total_conversations: int
    total_notes: int
    recent_papers: List[PaperResponse] = []
    recent_notes: List[NoteResponse] = []
