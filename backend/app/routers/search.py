import logging
from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.paper import ResearchPaper
from app.schemas.search import SearchRequest, SearchResponse, SearchResultItem
from app.services.embeddings.provider import embedding_service
from app.services.vector_store.chroma import vector_store

logger = logging.getLogger(__name__)

router = APIRouter(prefix="", tags=["Semantic Search"])


@router.post("/search", response_model=SearchResponse)
def semantic_search(payload: SearchRequest, db: Session = Depends(get_db)):
    """
    Executes semantic search across all indexed research papers or a filtered subset.
    Returns matched excerpts with relevance scores and page numbers.
    """
    clean_query = payload.query.strip()
    query_vector = embedding_service.embed_query(clean_query)

    raw_results = vector_store.search(
        query_embedding=query_vector,
        paper_ids=payload.paper_ids,
        top_k=payload.top_k
    )

    # Enrich results with paper author and publication metadata from database
    paper_ids_found = list({r["paper_id"] for r in raw_results if r.get("paper_id")})
    papers_map = {}
    if paper_ids_found:
        papers = db.query(ResearchPaper).filter(ResearchPaper.id.in_(paper_ids_found)).all()
        papers_map = {p.id: p for p in papers}

    formatted_items: List[SearchResultItem] = []
    for r in raw_results:
        p_obj = papers_map.get(r.get("paper_id"))
        excerpt = r.get("text", "")
        # Truncate clean snippet
        if len(excerpt) > 300:
            excerpt = excerpt[:300] + "..."

        formatted_items.append(SearchResultItem(
            paper_id=r.get("paper_id") or 0,
            paper_title=p_obj.title if p_obj else r.get("paper_title", "Untitled"),
            authors=p_obj.authors if p_obj else None,
            publication_year=p_obj.publication_year if p_obj else None,
            page_number=r.get("page_number", 1),
            section=r.get("section", "Main Text"),
            matching_excerpt=excerpt,
            similarity_score=r.get("similarity_score", 0.0),
        ))

    return SearchResponse(
        query=clean_query,
        total_results=len(formatted_items),
        results=formatted_items
    )
