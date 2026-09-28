import os
import re
import logging
from typing import Dict, List, Any, Tuple
import pymupdf  # PyMuPDF

logger = logging.getLogger(__name__)

COMMON_SECTIONS = [
    "abstract",
    "introduction",
    "related work",
    "background",
    "methodology",
    "methods",
    "system design",
    "architecture",
    "experiments",
    "experimental setup",
    "results",
    "evaluation",
    "discussion",
    "conclusion",
    "conclusions",
    "limitations",
    "future work",
    "references",
]


def clean_text(text: str) -> str:
    """Removes non-printable characters, redundant whitespace, and page breaks."""
    if not text:
        return ""
    # Normalize newline dashes (hyphenated line breaks e.g. "re- \nsearch" -> "research")
    text = re.sub(r'(\w+)-\s*\n\s*(\w+)', r'\1\2', text)
    # Normalize multiple newlines
    text = re.sub(r'\n{3,}', '\n\n', text)
    # Normalize multiple horizontal spaces
    text = re.sub(r'[ \t]+', ' ', text)
    return text.strip()


def detect_section_header(line: str) -> str | None:
    """Attempts to identify if a line is a scientific paper section header."""
    clean_line = line.strip().lower()
    # Strip numbering like "1. Introduction" or "III. METHODOLOGY"
    stripped = re.sub(r'^(\d+(\.\d+)*|[ivxlcdm]+[\.:])\s*', '', clean_line)
    for sec in COMMON_SECTIONS:
        if stripped == sec or stripped.startswith(sec + " ") or stripped.startswith(sec + ":"):
            return sec.title()
    return None


class PDFExtractor:
    """Extracts text page-by-page from PDFs preserving page numbers and metadata."""

    @staticmethod
    def extract_paper(file_path: str) -> Dict[str, Any]:
        """
        Reads a PDF file using PyMuPDF and returns:
        - title
        - authors
        - abstract
        - publication_year
        - page_count
        - pages: list of { "page_number": int, "text": str, "sections": list[str] }
        """
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"PDF file not found at: {file_path}")

        try:
            doc = pymupdf.open(file_path)
        except Exception as e:
            raise ValueError(f"Failed to open PDF file: {str(e)}")

        page_count = len(doc)
        if page_count == 0:
            doc.close()
            raise ValueError("The uploaded PDF has 0 pages.")

        pdf_meta = doc.metadata or {}
        raw_title = pdf_meta.get("title", "").strip()
        raw_author = pdf_meta.get("author", "").strip()
        raw_date = pdf_meta.get("creationDate", "")

        year = None
        if raw_date and len(raw_date) >= 6:
            # CreationDate often formatted as D:YYYYMMDD...
            year_match = re.search(r'(?:D:)?(19\d{2}|20\d{2})', raw_date)
            if year_match:
                year = int(year_match.group(1))

        pages_data: List[Dict[str, Any]] = []
        full_text_first_pages: List[str] = []

        current_detected_section = "Introduction"

        for page_idx in range(page_count):
            page_num = page_idx + 1  # 1-based page numbering
            page = doc[page_idx]
            page_raw_text = page.get_text("text") or ""
            cleaned = clean_text(page_raw_text)

            # Detect sections on this page
            page_sections = []
            lines = cleaned.split("\n")
            for line in lines[:10]:  # Look at headers on top of page / paragraphs
                sec = detect_section_header(line)
                if sec:
                    current_detected_section = sec
                    if sec not in page_sections:
                        page_sections.append(sec)

            pages_data.append({
                "page_number": page_num,
                "text": cleaned,
                "section": current_detected_section,
                "page_sections": page_sections,
            })

            if page_idx < 3:
                full_text_first_pages.append(cleaned)

        doc.close()

        first_page_text = full_text_first_pages[0] if full_text_first_pages else ""

        # Extract title from first page if PDF metadata title is generic or missing
        title = raw_title
        if not title or len(title) < 5 or title.lower().endswith(".pdf") or "untitled" in title.lower():
            # Heuristic: Take first non-empty lines from page 1
            lines = [l.strip() for l in first_page_text.split("\n") if len(l.strip()) > 5]
            if lines:
                title = lines[0]
                # If first line is very short, combine with second line
                if len(title) < 30 and len(lines) > 1 and len(lines[1]) > 5:
                    title = f"{title} {lines[1]}"

        # Extract abstract heuristic from first 2 pages
        abstract = ""
        combined_intro = "\n".join(full_text_first_pages)
        abstract_match = re.search(
            r'abstract[:\s\-\.]+(.+?)(?:introduction|keywords|1[\.\s]|i[\.\s]|\Z)',
            combined_intro,
            re.IGNORECASE | re.DOTALL
        )
        if abstract_match:
            abstract = clean_text(abstract_match.group(1))[:2500]

        return {
            "title": title[:500] if title else "Untitled Research Paper",
            "authors": raw_author[:500] if raw_author else "Authors not specified",
            "abstract": abstract if abstract else None,
            "publication_year": year,
            "page_count": page_count,
            "pages": pages_data,
        }
