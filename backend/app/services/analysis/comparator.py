import logging
from typing import List, Dict, Any
from app.services.llm.gemini import llm_service

logger = logging.getLogger(__name__)


class PaperComparator:
    """Performs multi-paper comparative analysis."""

    def __init__(self):
        self.llm_service = llm_service

    def compare_papers(self, papers_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Takes a list of paper summaries/metadata and produces a grounded comparison.
        """
        if len(papers_data) < 2:
            raise ValueError("At least 2 papers are required for comparative analysis.")

        papers_summary_block = []
        for idx, p in enumerate(papers_data, 1):
            title = p.get("title", f"Paper {idx}")
            abstract = p.get("abstract", "No abstract available.")
            analysis = p.get("analysis", {})
            methodology = analysis.get("methodology", "Not specified")
            datasets = ", ".join(analysis.get("datasets", [])) or "None listed"
            models = ", ".join(analysis.get("models", [])) or "None listed"

            papers_summary_block.append(
                f"[Paper {idx}]: \"{title}\" (Year: {p.get('publication_year', 'N/A')})\n"
                f"- Abstract: {abstract[:400]}...\n"
                f"- Methodology: {methodology[:300]}...\n"
                f"- Datasets: {datasets}\n"
                f"- Models: {models}\n"
            )

        context = "\n---\n".join(papers_summary_block)

        prompt = f"""You are a scientific survey author. Compare the following research papers:

{context}

Produce a structured JSON comparison with the following keys:
{{
  "comparison_summary": "High-level synthesis contrasting the papers.",
  "methodological_differences": "Detailed comparison of approaches, algorithms, and architectures.",
  "dataset_comparison": "Comparison of datasets, benchmarks, and data preparation techniques.",
  "model_architectures": "Contrasting the models and baseline comparisons.",
  "results_and_performance": "Comparative performance, trade-offs, and metric comparisons.",
  "common_limitations": "Limitations shared across these papers or unique drawbacks.",
  "recommendations": "Guidance on when to prefer each proposed approach."
}}
"""

        try:
            return self.llm_service.generate_json(prompt)
        except Exception as e:
            logger.warning("Paper comparison failed: %s", str(e))
            return {
                "comparison_summary": f"Comparison of {len(papers_data)} uploaded papers.",
                "methodological_differences": "Approaches differ across the selected literature.",
                "dataset_comparison": "Refer to individual paper analyses for dataset breakdowns.",
                "model_architectures": "Multiple models evaluated across documents.",
                "results_and_performance": "Comparative metrics detailed in respective evaluations.",
                "common_limitations": "Boundaries discussed in respective papers.",
                "recommendations": "Select approach based on task requirements."
            }


paper_comparator = PaperComparator()
