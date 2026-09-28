import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database import get_db
from app.models.note import ResearchNote
from app.models.paper import ResearchPaper
from app.schemas.note import NoteCreate, NoteUpdate, NoteResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/notes", tags=["Research Notes"])


def _format_note(n: ResearchNote) -> dict:
    return {
        "id": n.id,
        "paper_id": n.paper_id,
        "paper_title": n.paper.title if n.paper else None,
        "title": n.title,
        "content": n.content,
        "created_at": n.created_at,
        "updated_at": n.updated_at,
    }


@router.get("", response_model=List[NoteResponse])
def list_notes(
    paper_id: Optional[int] = Query(None, description="Filter notes by specific paper ID"),
    db: Session = Depends(get_db)
):
    """Lists research notes, optionally filtered by paper."""
    query = db.query(ResearchNote)
    if paper_id:
        query = query.filter(ResearchNote.paper_id == paper_id)
    notes = query.order_by(desc(ResearchNote.updated_at)).all()
    return [_format_note(n) for n in notes]


@router.post("", response_model=NoteResponse, status_code=status.HTTP_201_CREATED)
def create_note(payload: NoteCreate, db: Session = Depends(get_db)):
    """Creates a new research note, optionally associated with a paper."""
    if payload.paper_id:
        paper = db.query(ResearchPaper).filter(ResearchPaper.id == payload.paper_id).first()
        if not paper:
            raise HTTPException(status_code=404, detail="Referenced paper not found.")

    note = ResearchNote(
        paper_id=payload.paper_id,
        title=payload.title,
        content=payload.content
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    return _format_note(note)


@router.get("/{note_id}", response_model=NoteResponse)
def get_note(note_id: int, db: Session = Depends(get_db)):
    """Retrieves a single research note by ID."""
    note = db.query(ResearchNote).filter(ResearchNote.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found.")
    return _format_note(note)


@router.put("/{note_id}", response_model=NoteResponse)
def update_note(note_id: int, payload: NoteUpdate, db: Session = Depends(get_db)):
    """Updates an existing research note."""
    note = db.query(ResearchNote).filter(ResearchNote.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found.")

    if payload.title is not None:
        note.title = payload.title
    if payload.content is not None:
        note.content = payload.content
    if payload.paper_id is not None:
        if payload.paper_id != 0:
            paper = db.query(ResearchPaper).filter(ResearchPaper.id == payload.paper_id).first()
            if not paper:
                raise HTTPException(status_code=404, detail="Referenced paper not found.")
            note.paper_id = payload.paper_id
        else:
            note.paper_id = None

    db.commit()
    db.refresh(note)
    return _format_note(note)


@router.delete("/{note_id}", status_code=status.HTTP_200_OK)
def delete_note(note_id: int, db: Session = Depends(get_db)):
    """Deletes a research note."""
    note = db.query(ResearchNote).filter(ResearchNote.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found.")
    db.delete(note)
    db.commit()
    return {"status": "success", "message": f"Note #{note_id} deleted."}
