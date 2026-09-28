from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database import get_db
from app.models.paper import ResearchPaper, ProcessingStatus
from app.models.chunk import PaperChunk
from app.models.conversation import Conversation
from app.models.note import ResearchNote
from app.schemas.dashboard import DashboardStatsResponse
from app.routers.papers import _format_paper_response
from app.routers.notes import _format_note

router = APIRouter(prefix="", tags=["Dashboard"])


@router.get("/dashboard/stats", response_model=DashboardStatsResponse)
def get_dashboard_stats(db: Session = Depends(get_db)):
    """
    Returns real statistics reflecting the active state of the research library.
    No synthetic metrics.
    """
    total_papers = db.query(ResearchPaper).count()
    papers_processed = db.query(ResearchPaper).filter(ResearchPaper.processing_status == ProcessingStatus.COMPLETED.value).count()
    papers_failed = db.query(ResearchPaper).filter(ResearchPaper.processing_status == ProcessingStatus.FAILED.value).count()
    total_chunks = db.query(PaperChunk).count()
    total_conversations = db.query(Conversation).count()
    total_notes = db.query(ResearchNote).count()

    recent_papers_models = db.query(ResearchPaper).order_by(desc(ResearchPaper.created_at)).limit(5).all()
    recent_notes_models = db.query(ResearchNote).order_by(desc(ResearchNote.updated_at)).limit(5).all()

    recent_papers = [_format_paper_response(p, db) for p in recent_papers_models]
    recent_notes = [_format_note(n) for n in recent_notes_models]

    return DashboardStatsResponse(
        total_papers=total_papers,
        papers_processed=papers_processed,
        papers_failed=papers_failed,
        total_chunks=total_chunks,
        total_conversations=total_conversations,
        total_notes=total_notes,
        recent_papers=recent_papers,
        recent_notes=recent_notes
    )
