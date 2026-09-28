import logging
from typing import Dict, Any, List
from app.services.llm.gemini import llm_service

logger = logging.getLogger(__name__)

ANALYSIS_SYSTEM_PROMPT = """You are a Principal Scientific Reviewer and Research Analyst.
Your task is to analyze an extracted research paper and produce a rigorous, structured synthesis.
You must be factual, precise, and ground every element in the text of the paper.
Never fabricate datasets, metrics, or claims.
"""


class PaperAnalyzer:
    """Performs structured deep analysis of research papers."""

    def __init__(self):
        self.llm_service = llm_service

    def analyze_paper_text(
        self,
        title: str,
        abstract: str | None,
        chunks: List[Dict[str, Any]],
        page_count: int
    ) -> Dict[str, Any]:
        """
        Analyzes the research paper using targeted excerpts.
        Returns structured analysis matching PaperAnalysis schema.
        """
        # Select strategic excerpts: Beginning (intro/abstract), Middle (methods), and End (results/conclusion)
        total_chunks = len(chunks)
        selected_texts = []

        if abstract:
            selected_texts.append(f"ABSTRACT:\n{abstract}")

        if total_chunks <= 8:
            selected_chunks = chunks
        else:
            # First 3 chunks (Title, Intro, Problem)
            # Middle 3 chunks (Methodology, Architecture)
            # Last 3 chunks (Results, Discussion, Limitations)
            start_chunks = chunks[:3]
            mid_idx = total_chunks // 2
            mid_chunks = chunks[mid_idx-1 : mid_idx+2]
            end_chunks = chunks[-3:]
            selected_chunks = start_chunks + mid_chunks + end_chunks

        for c in selected_chunks:
            sec = c.get("section", "Section")
            page = c.get("page_number", 1)
            selected_texts.append(f"[{sec} - Page {page}]:\n{c.get('text', '')}")

        context_blob = "\n\n".join(selected_texts)[:14000]

        prompt = f"""Analyze the following research paper excerpts and output a valid JSON object:

Paper Title: {title}
Page Count: {page_count}

Excerpts:
{context_blob}

Output JSON with EXACTLY these keys:
{{
  "summary": "Comprehensive 3-5 sentence summary of the paper and its main contribution.",
  "key_findings": ["Key finding 1", "Key finding 2", "Key finding 3"],
  "research_problem": "The specific research challenge, inefficiency, or gap addressed.",
  "objectives": ["Primary objective", "Secondary objective"],
  "methodology": "Detailed description of the proposed algorithm, framework, or methodology.",
  "datasets": ["Dataset 1", "Dataset 2"],
  "models": ["Model/Architecture 1", "Model 2"],
  "tools_technologies": ["Tool/Framework 1", "Language/Platform 2"],
  "results": "Concrete experimental outcomes, accuracy/performance numbers, and comparisons.",
  "limitations": ["Acknowledged limitation 1", "Limitation 2"],
  "future_work": "Proposed future research directions stated or implied by the authors."
}}
"""

        try:
            analysis = self.llm_service.generate_json(
                prompt=prompt,
                system_instruction=ANALYSIS_SYSTEM_PROMPT
            )
            # Ensure required keys exist with reasonable defaults if missing from LLM response
            return {
                "summary": analysis.get("summary") or (abstract if abstract else f"Analysis of {title}."),
                "key_findings": analysis.get("key_findings") or ["Detailed findings documented in main text."],
                "research_problem": analysis.get("research_problem") or "Investigation of problem domain addressed in paper.",
                "objectives": analysis.get("objectives") or ["Advance state of the art in the domain."],
                "methodology": analysis.get("methodology") or "Methodology described across primary sections.",
                "datasets": analysis.get("datasets") or [],
                "models": analysis.get("models") or [],
                "tools_technologies": analysis.get("tools_technologies") or [],
                "results": analysis.get("results") or "Empirical evaluations documented in results section.",
                "limitations": analysis.get("limitations") or ["Refer to discussion section for detailed scope boundaries."],
                "future_work": analysis.get("future_work") or "Extended evaluations and architectural variants."
            }
        except Exception as e:
            logger.warning("Automated LLM analysis failed: %s. Using heuristic analysis.", str(e))
            return {
                "summary": abstract if abstract else f"Paper titled: {title}.",
                "key_findings": ["Extracted text available in paper chunk index."],
                "research_problem": f"Research presented in {title}",
                "objectives": ["Study and empirical validation."],
                "methodology": "See extracted document chunks for complete methodology.",
                "datasets": [],
                "models": [],
                "tools_technologies": [],
                "results": "Refer to extracted experimental tables and evaluation chunks.",
                "limitations": ["Configure Gemini API key to generate automatic deep synthesis."],
                "future_work": "Further exploration of proposed techniques."
            }


paper_analyzer = PaperAnalyzer()
