"""
pdf_loader.py — Loads and extracts text from PDF files using LangChain's PyPDFLoader.

Each page becomes a LangChain Document with metadata including the source filename.
"""

import os
from typing import List

from langchain_community.document_loaders import PyPDFLoader
from langchain_core.documents import Document


def load_pdf(file_path: str) -> List[Document]:
    """
    Load a PDF file and return its pages as LangChain Documents.

    Args:
        file_path: Absolute path to the PDF file on disk.

    Returns:
        A list of Document objects, one per page.
        Each Document has `page_content` (text) and `metadata` (source, page).

    Raises:
        ValueError: If the file does not exist or produces no content.
    """
    if not os.path.exists(file_path):
        raise ValueError(f"PDF file not found: {file_path}")

    try:
        loader = PyPDFLoader(file_path)
        pages: List[Document] = loader.load()
    except Exception as exc:
        raise ValueError(f"Failed to parse PDF '{file_path}': {exc}") from exc

    # Filter out pages with no meaningful text content
    non_empty_pages = [p for p in pages if p.page_content.strip()]

    if not non_empty_pages:
        raise ValueError(
            f"PDF '{os.path.basename(file_path)}' contains no extractable text. "
            "It may be a scanned/image-only PDF."
        )

    return non_empty_pages
