import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.paper import ResearchPaper
from app.models.chunk import PaperChunk
from app.models.analysis import PaperAnalysis
from app.schemas.analysis import (
    AnalysisResponse,
    CompareRequest,
    CompareResponse,
    ReviewRequest,
    ReviewResponse,
)
from app.services.analysis.analyzer import paper_analyzer
from app.services.analysis.comparator import paper_comparator
from app.services.analysis.reviewer import literature_reviewer

logger = logging.getLogger(__name__)

router = APIRouter(prefix="", tags=["Analysis & Review"])


@router.get("/papers/{paper_id}/analysis", response_model=AnalysisResponse)
def get_paper_analysis(paper_id: int, db: Session = Depends(get_db)):
    """Retrieves cached deep structured analysis for a research paper."""
    paper = db.query(ResearchPaper).filter(ResearchPaper.id == paper_id).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found.")

    analysis = db.query(PaperAnalysis).filter(PaperAnalysis.paper_id == paper_id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found. Run analysis first.")

    return analysis


@router.post("/papers/{paper_id}/analyze", response_model=AnalysisResponse)
def run_paper_analysis(paper_id: int, db: Session = Depends(get_db)):
    """
    Executes or regenerates AI-driven deep analysis for an uploaded paper.
    Extracts summary, methodology, datasets, models, findings, and limitations.
    """
    paper = db.query(ResearchPaper).filter(ResearchPaper.id == paper_id).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found.")

    chunks = db.query(PaperChunk).filter(PaperChunk.paper_id == paper_id).order_by(PaperChunk.chunk_index).all()
    if not chunks:
        raise HTTPException(status_code=400, detail="Paper has no extracted chunks to analyze.")

    chunks_dicts = [
        {"section": c.section, "page_number": c.page_number, "text": c.text}
        for c in chunks
    ]

    analysis_data = paper_analyzer.analyze_paper_text(
        title=paper.title,
        abstract=paper.abstract,
        chunks=chunks_dicts,
        page_count=paper.page_count
    )

    existing = db.query(PaperAnalysis).filter(PaperAnalysis.paper_id == paper_id).first()
    if existing:
        for k, v in analysis_data.items():
            setattr(existing, k, v)
        db.commit()
        db.refresh(existing)
        return existing

    new_analysis = PaperAnalysis(
        paper_id=paper.id,
        **analysis_data
    )
    db.add(new_analysis)
    db.commit()
    db.refresh(new_analysis)
    return new_analysis


@router.post("/compare", response_model=CompareResponse)
def compare_multiple_papers(payload: CompareRequest, db: Session = Depends(get_db)):
    """
    Conducts comparative analysis across two or more selected research papers.
    Contrasts methodologies, datasets, models, performance, and limitations.
    """
    papers = db.query(ResearchPaper).filter(ResearchPaper.id.in_(payload.paper_ids)).all()
    if len(papers) < 2:
        raise HTTPException(status_code=400, detail="At least 2 valid papers are required for comparison.")

    papers_data = []
    for p in papers:
        analysis_dict = {}
        if p.analysis:
            analysis_dict = {
                "summary": p.analysis.summary,
                "methodology": p.analysis.methodology,
                "datasets": p.analysis.datasets or [],
                "models": p.analysis.models or [],
                "limitations": p.analysis.limitations or [],
            }
        papers_data.append({
            "id": p.id,
            "title": p.title,
            "publication_year": p.publication_year,
            "abstract": p.abstract,
            "analysis": analysis_dict,
        })

    comp_result = paper_comparator.compare_papers(papers_data)
    comp_result["compared_paper_ids"] = payload.paper_ids
    return CompareResponse(**comp_result)


@router.post("/review", response_model=ReviewResponse)
def generate_literature_review(payload: ReviewRequest, db: Session = Depends(get_db)):
    """
    Synthesizes a structured literature review across multiple uploaded research papers.
    Highlights methodological trends, common datasets, and unaddressed research gaps.
    """
    papers = db.query(ResearchPaper).filter(ResearchPaper.id.in_(payload.paper_ids)).all()
    if not papers:
        raise HTTPException(status_code=400, detail="No valid papers found for the provided IDs.")

    papers_data = []
    for p in papers:
        analysis_dict = {}
        if p.analysis:
            analysis_dict = {
                "summary": p.analysis.summary,
                "methodology": p.analysis.methodology,
                "datasets": p.analysis.datasets or [],
                "models": p.analysis.models or [],
                "limitations": p.analysis.limitations or [],
            }
        papers_data.append({
            "id": p.id,
            "title": p.title,
            "authors": p.authors,
            "publication_year": p.publication_year,
            "abstract": p.abstract,
            "analysis": analysis_dict,
        })

    review_result = literature_reviewer.generate_review(
        topic=payload.topic or "Survey of Selected Research Papers",
        papers_data=papers_data
    )
    review_result["reviewed_paper_ids"] = payload.paper_ids
    return ReviewResponse(**review_result)
