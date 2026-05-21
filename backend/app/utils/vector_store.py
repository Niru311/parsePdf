"""
vector_store.py — Manages the FAISS vector database.

Responsibilities:
  - Add new document chunks to the FAISS index
  - Persist the index to disk (so it survives server restarts)
  - Load an existing index on startup
  - Provide a retriever for semantic similarity search
"""

import os
from typing import List, Optional

from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document
from langchain_core.vectorstores import VectorStoreRetriever

from app.utils.embeddings import get_embeddings_model

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------

# Directory where the FAISS index files will be saved
VECTOR_STORE_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(__file__))),  # backend/
    "vector_store",
)
FAISS_INDEX_NAME = "knowledge_base"  # FAISS saves two files: .faiss + .pkl

# ---------------------------------------------------------------------------
# In-memory FAISS store — shared across requests
# ---------------------------------------------------------------------------

_vector_store: Optional[FAISS] = None


def _get_index_path() -> str:
    """Return the full path where the FAISS index folder is stored."""
    os.makedirs(VECTOR_STORE_DIR, exist_ok=True)
    return VECTOR_STORE_DIR


def load_existing_index() -> bool:
    """
    Attempt to load a previously saved FAISS index from disk.

    Returns:
        True if an existing index was loaded, False otherwise.
    """
    global _vector_store
    index_path = _get_index_path()
    faiss_file = os.path.join(index_path, f"{FAISS_INDEX_NAME}.faiss")

    if os.path.exists(faiss_file):
        print(f"[VectorStore] Loading existing FAISS index from {index_path}")
        embeddings = get_embeddings_model()
        _vector_store = FAISS.load_local(
            index_path,
            embeddings,
            index_name=FAISS_INDEX_NAME,
            allow_dangerous_deserialization=True,  # Required by newer LangChain versions
        )
        print("[VectorStore] Existing index loaded.")
        return True

    print("[VectorStore] No existing index found. Will create on first upload.")
    return False


def add_documents(chunks: List[Document]) -> int:
    """
    Add document chunks to the FAISS vector store.

    If no index exists yet, creates a new one. If one already exists,
    merges the new documents into it. Saves to disk after each update.

    Args:
        chunks: List of LangChain Document chunks to embed and store.

    Returns:
        Total number of documents now in the index.
    """
    global _vector_store
    embeddings = get_embeddings_model()

    if _vector_store is None:
        print(f"[VectorStore] Creating new FAISS index with {len(chunks)} chunks.")
        _vector_store = FAISS.from_documents(chunks, embeddings)
    else:
        print(f"[VectorStore] Adding {len(chunks)} new chunks to existing index.")
        new_store = FAISS.from_documents(chunks, embeddings)
        _vector_store.merge_from(new_store)

    # Persist to disk immediately
    _vector_store.save_local(_get_index_path(), index_name=FAISS_INDEX_NAME)
    print("[VectorStore] Index saved to disk.")

    return _vector_store.index.ntotal


def get_retriever(k: int = 4) -> VectorStoreRetriever:
    """
    Return a FAISS retriever configured to fetch the top-k similar chunks.

    Args:
        k: Number of similar chunks to retrieve per query.

    Returns:
        A LangChain VectorStoreRetriever.

    Raises:
        RuntimeError: If no documents have been added yet.
    """
    if _vector_store is None:
        raise RuntimeError(
            "No documents in the knowledge base. Please upload a PDF first."
        )
    return _vector_store.as_retriever(search_kwargs={"k": k})


def clear_index() -> None:
    """
    Clear the in-memory FAISS index and delete the saved index files from disk.
    """
    global _vector_store
    _vector_store = None

    # Remove saved index files
    for ext in [".faiss", ".pkl"]:
        file_path = os.path.join(VECTOR_STORE_DIR, f"{FAISS_INDEX_NAME}{ext}")
        if os.path.exists(file_path):
            os.remove(file_path)

    print("[VectorStore] Index cleared from memory and disk.")


def get_document_count() -> int:
    """Return the number of vectors currently stored in the index."""
    if _vector_store is None:
        return 0
    return _vector_store.index.ntotal
