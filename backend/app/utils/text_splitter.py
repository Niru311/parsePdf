"""
text_splitter.py — Splits LangChain Documents into smaller, overlapping chunks.

Uses RecursiveCharacterTextSplitter which is the recommended approach for
semantic coherence — it tries to split on paragraphs, then sentences, then words.
"""

from typing import List

from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter

# ---------------------------------------------------------------------------
# Configuration Constants
# ---------------------------------------------------------------------------

CHUNK_SIZE = 900       # Maximum characters per chunk
CHUNK_OVERLAP = 175    # Overlap between consecutive chunks for context continuity


def split_documents(documents: List[Document]) -> List[Document]:
    """
    Split a list of Documents into smaller overlapping chunks.

    Args:
        documents: List of full-page LangChain Documents from the PDF loader.

    Returns:
        List of chunked Documents. Each chunk inherits the source metadata
        (filename, page number) from its parent document.
    """
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        # Try splitting on paragraphs → sentences → words → characters
        separators=["\n\n", "\n", ". ", " ", ""],
    )

    chunks = splitter.split_documents(documents)
    return chunks
