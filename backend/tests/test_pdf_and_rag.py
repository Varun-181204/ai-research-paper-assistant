import os
import pymupdf
import pytest
from app.services.pdf.extractor import PDFExtractor
from app.services.pdf.chunker import PageAwareChunker
from app.services.embeddings.provider import embedding_service
from app.services.vector_store.chroma import vector_store
from app.services.rag.pipeline import rag_pipeline


@pytest.fixture
def sample_pdf(tmp_path):
    """Creates a realistic 2-page research PDF for testing."""
    pdf_path = str(tmp_path / "sample_paper.pdf")
    doc = pymupdf.open()

    # Page 1: Title, Abstract, Introduction
    p1 = doc.new_page()
    p1.insert_text((50, 72), "Attention Is All You Need In Clinical Vision", fontsize=16)
    p1.insert_text((50, 100), "Author: Dr. Jane Doe and Alex Smith", fontsize=10)
    p1.insert_text(
        (50, 130),
        "Abstract: Deep neural networks have revolutionized medical image analysis. "
        "In this study, we propose MedTransformer, an attention-based vision model for thoracic radiography. "
        "Our experiments indicate significant improvements in classification accuracy on chest X-rays.",
        fontsize=10
    )
    p1.insert_text(
        (50, 220),
        "1. Introduction\n"
        "Computer-aided diagnosis has seen rapid advancements. Traditional CNNs suffer from restricted "
        "receptive fields. We introduce self-attention mechanisms to overcome these spatial constraints.",
        fontsize=10
    )

    # Page 2: Methodology, Results, Limitations
    p2 = doc.new_page()
    p2.insert_text(
        (50, 72),
        "2. Methodology and Datasets\n"
        "We trained MedTransformer on NIH Chest X-ray 14 dataset containing 112,120 frontal-view images. "
        "The model uses 12 multi-head attention layers with 768 hidden dimensions.\n\n"
        "3. Experimental Results\n"
        "MedTransformer achieved an AUC of 0.892, outperforming DenseNet-121 baseline by 4.3%.\n\n"
        "4. Limitations\n"
        "The primary limitation is computational latency during high-resolution volumetric CT scans.",
        fontsize=10
    )

    doc.save(pdf_path)
    doc.close()
    return pdf_path


def test_pdf_extraction(sample_pdf):
    """Verifies that PDF text and page counts are accurately extracted."""
    data = PDFExtractor.extract_paper(sample_pdf)
    assert data["page_count"] == 2
    assert "Attention Is All You Need" in data["title"]
    assert "Dr. Jane Doe" in data["authors"] or "Author" in data["pages"][0]["text"]
    assert len(data["pages"]) == 2
    assert "MedTransformer" in data["pages"][0]["text"]
    assert "NIH Chest X-ray" in data["pages"][1]["text"]


def test_page_aware_chunking(sample_pdf):
    """Verifies chunking preserves page associations and metadata."""
    data = PDFExtractor.extract_paper(sample_pdf)
    chunker = PageAwareChunker(chunk_size=300, chunk_overlap=50)
    chunks = chunker.chunk_paper(
        paper_id=999,
        pages=data["pages"],
        source_filename="sample.pdf",
        paper_title="Sample Title"
    )

    assert len(chunks) >= 2
    for c in chunks:
        assert c["paper_id"] == 999
        assert c["page_number"] in (1, 2)
        assert len(c["text"]) > 20
        assert "source_filename" in c["metadata"]


def test_embedding_and_vector_store():
    """Tests embedding generation and ChromaDB indexing and retrieval."""
    test_chunks = [
        {
            "paper_id": 999,
            "page_number": 2,
            "section": "Results",
            "chunk_index": 0,
            "text": "MedTransformer achieved an AUC of 0.892, outperforming DenseNet-121.",
            "metadata": {"source_filename": "sample.pdf", "paper_title": "MedTransformer Paper"}
        }
    ]

    embs = embedding_service.embed_texts([test_chunks[0]["text"]])
    assert len(embs) == 1
    assert len(embs[0]) == 768

    vector_store.add_chunks(paper_id=999, chunks=test_chunks, embeddings=embs)

    # Search for AUC or MedTransformer
    q_vec = embedding_service.embed_query("What was the AUC achieved by MedTransformer?")
    results = vector_store.search(query_embedding=q_vec, paper_ids=[999], top_k=2)

    assert len(results) >= 1
    assert "0.892" in results[0]["text"]
    assert results[0]["page_number"] == 2

    # Clean up
    vector_store.delete_paper(999)
