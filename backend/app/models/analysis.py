from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database import Base


class PaperAnalysis(Base):
    __tablename__ = "paper_analyses"

    id = Column(Integer, primary_key=True, index=True)
    paper_id = Column(Integer, ForeignKey("research_papers.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    summary = Column(Text, nullable=True)
    key_findings = Column(JSON, nullable=True)  # List[str]
    research_problem = Column(Text, nullable=True)
    objectives = Column(JSON, nullable=True)  # List[str]
    methodology = Column(Text, nullable=True)
    datasets = Column(JSON, nullable=True)  # List[str]
    models = Column(JSON, nullable=True)  # List[str]
    tools_technologies = Column(JSON, nullable=True)  # List[str]
    results = Column(Text, nullable=True)
    limitations = Column(JSON, nullable=True)  # List[str]
    future_work = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    paper = relationship("ResearchPaper", back_populates="analysis")
