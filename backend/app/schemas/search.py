from typing import List, Optional
from pydantic import BaseModel, Field


class SearchRequest(BaseModel):
    query: str = Field(..., min_length=2)
    top_k: int = Field(default=8, ge=1, le=30)
    paper_ids: Optional[List[int]] = None


class SearchResultItem(BaseModel):
    paper_id: int
    paper_title: str
    authors: Optional[str] = None
    publication_year: Optional[int] = None
    page_number: int
    section: Optional[str] = "Main Text"
    matching_excerpt: str
    similarity_score: float


class SearchResponse(BaseModel):
    query: str
    total_results: int
    results: List[SearchResultItem]
