import logging
from typing import List, Dict, Any, Optional
from app.services.embeddings.provider import embedding_service
from app.services.vector_store.chroma import vector_store
from app.services.llm.gemini import llm_service

logger = logging.getLogger(__name__)

RAG_SYSTEM_PROMPT = """You are an expert AI Research Assistant specialized in scientific literature analysis.
Your primary role is to answer questions strictly and accurately based on the provided research paper passages.

STRICT GROUNDING RULES:
1. Answer ONLY using the facts, figures, and findings explicitly provided in the retrieved paper context.
2. DO NOT hallucinate or extrapolate beyond what is documented in the source passages.
3. If the retrieved context does not contain sufficient information to answer the question, explicitly state:
   "The provided research papers do not contain information regarding [topic]."
4. Cite your claims using bracketed source tags such as [Source 1], [Source 2], referencing the relevant paper and page.
5. Distinguish clearly between experimental results directly reported by the authors and contextual discussion.
6. Never fabricate or guess page numbers or paper titles.
"""


class RAGPipeline:
    """End-to-end Retrieval-Augmented Generation pipeline with strict citation grounding."""

    def __init__(self):
        self.embedding_service = embedding_service
        self.vector_store = vector_store
        self.llm_service = llm_service

    def answer_question(
        self,
        question: str,
        paper_ids: Optional[List[int]] = None,
        top_k: int = 6
    ) -> Dict[str, Any]:
        """
        Processes a research question through the grounded RAG workflow.
        Returns:
        - answer: Grounded text synthesis
        - citations: List of verified source chunks with page numbers and text excerpts
        - retrieved_chunks: Full chunk data
        """
        cleaned_question = question.strip()
        if not cleaned_question:
            return {
                "answer": "Please provide a valid question about your research papers.",
                "citations": [],
                "retrieved_chunks": []
            }

        # Step 1: Embed question
        query_vector = self.embedding_service.embed_query(cleaned_question)

        # Step 2: Retrieve relevant chunks from vector store
        chunks = self.vector_store.search(
            query_embedding=query_vector,
            paper_ids=paper_ids,
            top_k=top_k
        )

        if not chunks:
            return {
                "answer": "No relevant passages were found in the selected research papers.",
                "citations": [],
                "retrieved_chunks": []
            }

        # Step 3: Build grounded context with citation labels
        context_parts = []
        citations_data = []

        for idx, chunk in enumerate(chunks, start=1):
            source_tag = f"[Source {idx}]"
            paper_title = chunk.get("paper_title") or f"Paper #{chunk.get('paper_id')}"
            page_num = chunk.get("page_number", 1)
            section = chunk.get("section", "Main Text")
            text = chunk.get("text", "")

            context_parts.append(
                f"{source_tag} Paper: \"{paper_title}\" | Page: {page_num} | Section: {section}\n"
                f"Passage: {text}\n"
            )

            citations_data.append({
                "citation_index": idx,
                "source_tag": source_tag,
                "paper_id": chunk.get("paper_id"),
                "paper_title": paper_title,
                "page_number": page_num,
                "section": section,
                "text": text[:350] + ("..." if len(text) > 350 else ""),
                "similarity_score": chunk.get("similarity_score", 0.0),
            })

        assembled_context = "\n---\n".join(context_parts)

        # Step 4: Construct user prompt for LLM
        prompt = (
            f"Retrieved Research Context:\n{assembled_context}\n\n"
            f"Question: {cleaned_question}\n\n"
            f"Synthesize a clear, detailed, and grounded scientific answer. "
            f"Include exact citations like [Source X] citing the paper and page number."
        )

        # Step 5: Execute generation
        answer = self.llm_service.generate_text(
            prompt=prompt,
            system_instruction=RAG_SYSTEM_PROMPT,
            temperature=0.2
        )

        return {
            "answer": answer,
            "citations": citations_data,
            "retrieved_chunks": chunks
        }


rag_pipeline = RAGPipeline()
