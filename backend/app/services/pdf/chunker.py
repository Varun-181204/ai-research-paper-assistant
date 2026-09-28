import re
from typing import List, Dict, Any


class PageAwareChunker:
    """
    Performs page-aware semantic chunking on extracted PDF pages.
    Preserves exact page numbers, section titles, and source identifiers for RAG citations.
    """

    def __init__(self, chunk_size: int = 1000, chunk_overlap: int = 200):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

    def chunk_paper(
        self,
        paper_id: int,
        pages: List[Dict[str, Any]],
        source_filename: str,
        paper_title: str
    ) -> List[Dict[str, Any]]:
        """
        Splits text from each page into manageable, overlapping chunks.
        Guarantees that each chunk is associated with its source page.
        """
        chunks: List[Dict[str, Any]] = []
        global_chunk_index = 0

        for page_data in pages:
            page_num = page_data["page_number"]
            page_text = page_data["text"]
            section = page_data.get("section", "Main Text")

            if not page_text or len(page_text.strip()) < 20:
                continue

            # Split page text into overlapping windows
            page_chunks = self._split_text_semantically(page_text)

            for local_idx, chunk_text in enumerate(page_chunks):
                chunk_record = {
                    "paper_id": paper_id,
                    "page_number": page_num,
                    "section": section,
                    "chunk_index": global_chunk_index,
                    "text": chunk_text,
                    "metadata": {
                        "paper_id": paper_id,
                        "page_number": page_num,
                        "section": section,
                        "chunk_index": global_chunk_index,
                        "source_filename": source_filename,
                        "paper_title": paper_title,
                        "char_length": len(chunk_text),
                    }
                }
                chunks.append(chunk_record)
                global_chunk_index += 1

        return chunks

    def _split_text_semantically(self, text: str) -> List[str]:
        """
        Splits text on paragraph or sentence boundaries up to `chunk_size`
        with `chunk_overlap` overlap between consecutive chunks.
        """
        paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
        if not paragraphs:
            paragraphs = [text.strip()]

        chunks = []
        current_chunk = ""

        for para in paragraphs:
            # If paragraph fits in current chunk
            if len(current_chunk) + len(para) + 2 <= self.chunk_size:
                if current_chunk:
                    current_chunk += "\n\n" + para
                else:
                    current_chunk = para
            else:
                # If current chunk has content, save it
                if current_chunk:
                    chunks.append(current_chunk)
                    # Create overlap from end of current chunk
                    overlap_seed = current_chunk[-self.chunk_overlap:] if len(current_chunk) > self.chunk_overlap else ""
                    current_chunk = (overlap_seed + "\n\n" + para).strip() if overlap_seed else para
                else:
                    # Single paragraph exceeds chunk_size, split by sentences
                    sentences = re.split(r'(?<=[.?!])\s+', para)
                    sub_chunk = ""
                    for sent in sentences:
                        if len(sub_chunk) + len(sent) + 1 <= self.chunk_size:
                            sub_chunk = f"{sub_chunk} {sent}".strip()
                        else:
                            if sub_chunk:
                                chunks.append(sub_chunk)
                            sub_chunk = sent
                    if sub_chunk:
                        current_chunk = sub_chunk

        if current_chunk and current_chunk not in chunks:
            chunks.append(current_chunk)

        # Filter out trivial/whitespace chunks
        return [c for c in chunks if len(c.strip()) > 30]
