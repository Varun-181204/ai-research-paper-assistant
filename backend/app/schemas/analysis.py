from typing import List, Optional, Any
from datetime import datetime
from pydantic import BaseModel, Field


class AnalysisResponse(BaseModel):
    id: int
    paper_id: int
    summary: Optional[str] = None
    key_findings: Optional[List[str]] = []
    research_problem: Optional[str] = None
    objectives: Optional[List[str]] = []
    methodology: Optional[str] = None
    datasets: Optional[List[str]] = []
    models: Optional[List[str]] = []
    tools_technologies: Optional[List[str]] = []
    results: Optional[str] = None
    limitations: Optional[List[str]] = []
    future_work: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CompareRequest(BaseModel):
    paper_ids: List[int] = Field(..., min_length=2)


class CompareResponse(BaseModel):
    comparison_summary: str
    methodological_differences: str
    dataset_comparison: str
    model_architectures: str
    results_and_performance: str
    common_limitations: str
    recommendations: str
    compared_paper_ids: List[int]


class ReviewRequest(BaseModel):
    paper_ids: List[int] = Field(..., min_length=1)
    topic: Optional[str] = "Survey of Selected Scientific Literature"


class ReviewResponse(BaseModel):
    topic: str
    executive_summary: str
    research_landscape: str
    common_approaches: List[str]
    methodological_differences: str
    datasets_and_benchmarks: List[str]
    models_and_architectures: List[str]
    results_synthesis: str
    unaddressed_limitations: List[str]
    identified_research_gaps: List[str]
    reviewed_paper_ids: List[int]
