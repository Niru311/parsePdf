"""
embeddings.py — Provides a singleton HuggingFace embeddings model.

Uses sentence-transformers/all-MiniLM-L6-v2:
  - Fast (runs on CPU)
  - Produces 384-dimensional embeddings
  - Great for semantic similarity tasks

The singleton pattern avoids reloading the model on every request.
"""

from langchain_huggingface import HuggingFaceEmbeddings

# ---------------------------------------------------------------------------
# Singleton — loaded once, reused across all requests
# ---------------------------------------------------------------------------

_embeddings_model: HuggingFaceEmbeddings | None = None

EMBEDDING_MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"


def get_embeddings_model() -> HuggingFaceEmbeddings:
    """
    Return the shared HuggingFaceEmbeddings instance.

    The model is downloaded from HuggingFace Hub on first call (cached locally
    in ~/.cache/huggingface after that), then reused for all subsequent calls.

    Returns:
        A LangChain-compatible HuggingFaceEmbeddings object.
    """
    global _embeddings_model

    if _embeddings_model is None:
        print(f"[Embeddings] Loading model: {EMBEDDING_MODEL_NAME}")
        _embeddings_model = HuggingFaceEmbeddings(
            model_name=EMBEDDING_MODEL_NAME,
            model_kwargs={"device": "cpu"},   # Use GPU by setting "cuda" if available
            encode_kwargs={"normalize_embeddings": True},  # Cosine similarity friendly
        )
        print("[Embeddings] Model loaded successfully.")

    return _embeddings_model
