import os
import shutil
import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database import get_db
from app.config import settings
from app.models.paper import ResearchPaper, ProcessingStatus
from app.models.chunk import PaperChunk
from app.schemas.paper import PaperResponse, PaperDetailResponse, ChunkResponse
from app.services.pdf.extractor import PDFExtractor
from app.services.pdf.chunker import PageAwareChunker
from app.services.embeddings.provider import embedding_service
from app.services.vector_store.chroma import vector_store

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/papers", tags=["Research Papers"])
chunker = PageAwareChunker()


def _format_paper_response(p: ResearchPaper, db: Session) -> dict:
    chunk_count = db.query(PaperChunk).filter(PaperChunk.paper_id == p.id).count()
    return {
        "id": p.id,
        "title": p.title,
        "authors": p.authors,
        "abstract": p.abstract,
        "publication_year": p.publication_year,
        "filename": p.filename,
        "page_count": p.page_count,
        "processing_status": p.processing_status,
        "error_message": p.error_message,
        "chunk_count": chunk_count,
        "created_at": p.created_at,
        "updated_at": p.updated_at,
    }


@router.post("/upload", response_model=PaperResponse, status_code=status.HTTP_201_CREATED)
async def upload_paper(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Uploads a research paper in PDF format, extracts text and metadata,
    generates chunks and vector embeddings, and registers the paper in the library.
    """
    # 1. Validation
    filename = file.filename or "paper.pdf"
    if not filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Only PDF files are supported."
        )

    # Sanitize filename
    safe_basename = "".join(c for c in filename if c.isalnum() or c in "._- ")
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    save_path = os.path.join(settings.UPLOAD_DIR, safe_basename)

    # Avoid duplicate file override by appending suffix if needed
    counter = 1
    base_name, ext = os.path.splitext(safe_basename)
    while os.path.exists(save_path):
        save_path = os.path.join(settings.UPLOAD_DIR, f"{base_name}_{counter}{ext}")
        counter += 1

    try:
        with open(save_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to save uploaded file: {str(exc)}")

    file_size = os.path.getsize(save_path)
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if file_size > max_bytes:
        os.remove(save_path)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File exceeds maximum size limit of {settings.MAX_UPLOAD_SIZE_MB}MB."
        )

    # 2. Create Paper Record with UPLOADED status
    paper = ResearchPaper(
        title=base_name.replace("_", " ").title(),
        filename=os.path.basename(save_path),
        file_path=save_path,
        file_size_bytes=file_size,
        processing_status=ProcessingStatus.PROCESSING.value,
    )
    db.add(paper)
    db.commit()
    db.refresh(paper)

    # 3. PDF Extraction Pipeline
    try:
        extracted = PDFExtractor.extract_paper(save_path)

        paper.title = extracted["title"]
        paper.authors = extracted["authors"]
        paper.abstract = extracted["abstract"]
        paper.publication_year = extracted["publication_year"]
        paper.page_count = extracted["page_count"]

        # 4. Page-Aware Chunking
        chunks_data = chunker.chunk_paper(
            paper_id=paper.id,
            pages=extracted["pages"],
            source_filename=paper.filename,
            paper_title=paper.title
        )

        if not chunks_data:
            raise ValueError("No readable text could be extracted from this PDF.")

        # Save chunks to PostgreSQL
        db_chunk_models = []
        texts_to_embed = []
        for c in chunks_data:
            chunk_rec = PaperChunk(
                paper_id=paper.id,
                page_number=c["page_number"],
                section=c["section"],
                chunk_index=c["chunk_index"],
                text=c["text"],
                chunk_metadata=c["metadata"]
            )
            db_chunk_models.append(chunk_rec)
            texts_to_embed.append(c["text"])

        db.bulk_save_objects(db_chunk_models)
        db.commit()

        # 5. Embeddings & ChromaDB Vector Store
        embeddings = embedding_service.embed_texts(texts_to_embed)
        vector_store.add_chunks(
            paper_id=paper.id,
            chunks=chunks_data,
            embeddings=embeddings
        )

        paper.processing_status = ProcessingStatus.COMPLETED.value
        db.commit()
        db.refresh(paper)
        logger.info("Successfully ingested paper %d: %s (%d chunks)", paper.id, paper.title, len(chunks_data))

    except Exception as exc:
        logger.error("Processing failed for paper %d: %s", paper.id, str(exc))
        paper.processing_status = ProcessingStatus.FAILED.value
        paper.error_message = str(exc)
        db.commit()
        db.refresh(paper)

    return _format_paper_response(paper, db)


@router.get("", response_model=List[PaperResponse])
def list_papers(
    search: Optional[str] = Query(None, description="Search by title, authors, or filename"),
    status_filter: Optional[str] = Query(None, description="Filter by status (UPLOADED, PROCESSING, COMPLETED, FAILED)"),
    db: Session = Depends(get_db)
):
    """Lists all research papers in the library."""
    query = db.query(ResearchPaper)
    if status_filter:
        query = query.filter(ResearchPaper.processing_status == status_filter.upper())
    if search:
        s = f"%{search}%"
        query = query.filter(
            (ResearchPaper.title.ilike(s)) |
            (ResearchPaper.authors.ilike(s)) |
            (ResearchPaper.filename.ilike(s))
        )
    papers = query.order_by(desc(ResearchPaper.created_at)).all()
    return [_format_paper_response(p, db) for p in papers]


@router.get("/{paper_id}", response_model=PaperDetailResponse)
def get_paper(paper_id: int, db: Session = Depends(get_db)):
    """Retrieves paper details by ID."""
    paper = db.query(ResearchPaper).filter(ResearchPaper.id == paper_id).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found.")

    res = _format_paper_response(paper, db)
    res["has_analysis"] = paper.analysis is not None
    return res


@router.get("/{paper_id}/chunks", response_model=List[ChunkResponse])
def get_paper_chunks(paper_id: int, db: Session = Depends(get_db)):
    """Retrieves extracted chunks for a specific paper."""
    chunks = db.query(PaperChunk).filter(PaperChunk.paper_id == paper_id).order_by(PaperChunk.chunk_index).all()
    return chunks


@router.get("/{paper_id}/pdf")
def stream_pdf(paper_id: int, db: Session = Depends(get_db)):
    """Streams the raw PDF file for in-browser document preview."""
    paper = db.query(ResearchPaper).filter(ResearchPaper.id == paper_id).first()
    if not paper or not os.path.exists(paper.file_path):
        raise HTTPException(status_code=404, detail="PDF file not found on disk.")
    return FileResponse(
        path=paper.file_path,
        media_type="application/pdf",
        filename=paper.filename
    )


@router.delete("/{paper_id}", status_code=status.HTTP_200_OK)
def delete_paper(paper_id: int, db: Session = Depends(get_db)):
    """Deletes paper record, chunks, vector store embeddings, and disk file."""
    paper = db.query(ResearchPaper).filter(ResearchPaper.id == paper_id).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found.")

    # 1. Delete Chroma vectors
    vector_store.delete_paper(paper_id)

    # 2. Delete file from disk
    if paper.file_path and os.path.exists(paper.file_path):
        try:
            os.remove(paper.file_path)
        except Exception as e:
            logger.warning("Could not delete file %s: %s", paper.file_path, str(e))

    # 3. Delete from DB (cascades to chunks, notes, analysis)
    db.delete(paper)
    db.commit()

    return {"status": "success", "message": f"Paper #{paper_id} deleted successfully."}
