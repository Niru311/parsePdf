"""
rag_pipeline.py — The core Retrieval-Augmented Generation pipeline.

Flow:
  1. Embed the user's question
  2. Retrieve top-k semantically similar chunks from FAISS
  3. Inject retrieved context into a structured prompt
  4. Send prompt to the LLM via OpenRouter
  5. Return the answer + source citations
"""

import os
from typing import Any, Dict, List

from langchain_core.documents import Document
from langchain_openai import ChatOpenAI
from dotenv import load_dotenv

from app.utils.vector_store import get_retriever

# ---------------------------------------------------------------------------
# Load environment variables from .env
# ---------------------------------------------------------------------------

load_dotenv()

# ---------------------------------------------------------------------------
# LLM Configuration
# ---------------------------------------------------------------------------

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"

# Model to use — can be changed to any OpenRouter-supported model
# Free options: mistralai/mistral-7b-instruct, google/gemma-3-1b-it:free
DEFAULT_MODEL = os.getenv("LLM_MODEL", "mistralai/mistral-7b-instruct")

# Number of chunks to retrieve
RETRIEVAL_K = 4

# ---------------------------------------------------------------------------
# Prompt Template
# ---------------------------------------------------------------------------

SYSTEM_PROMPT = """You are a knowledgeable AI assistant that answers questions 
strictly based on the provided document context. 

Rules:
- Only use information from the provided context to answer.
- If the context does not contain enough information, say: 
  "I could not find enough information in the uploaded documents."
- Be concise, clear, and factually accurate.
- Do not hallucinate or add information not present in the context.
"""


def _build_prompt(question: str, context_chunks: List[Document]) -> str:
    """
    Construct the full prompt string by combining the context chunks and question.

    Args:
        question: The user's natural language question.
        context_chunks: Retrieved Document objects from FAISS.

    Returns:
        A formatted prompt string ready to send to the LLM.
    """
    context_text = "\n\n---\n\n".join(
        [
            f"[Source: {doc.metadata.get('source', 'Unknown')}]\n{doc.page_content}"
            for doc in context_chunks
        ]
    )

    return (
        f"Use the following context from uploaded documents to answer the question.\n\n"
        f"CONTEXT:\n{context_text}\n\n"
        f"QUESTION: {question}\n\n"
        f"ANSWER:"
    )


def _get_llm() -> ChatOpenAI:
    """
    Initialize and return the ChatOpenAI client pointed at OpenRouter.

    Returns:
        A configured ChatOpenAI instance.

    Raises:
        ValueError: If the OpenRouter API key is not set.
    """
    if not OPENROUTER_API_KEY:
        raise ValueError(
            "OPENROUTER_API_KEY is not set. "
            "Please add it to your backend/.env file."
        )

    return ChatOpenAI(
        model=DEFAULT_MODEL,
        openai_api_key=OPENROUTER_API_KEY,
        openai_api_base=OPENROUTER_BASE_URL,
        temperature=0.3,  # Lower = more factual, less creative
        max_tokens=1024,
        default_headers={
            # OpenRouter requires these headers for tracking
            "HTTP-Referer": "http://localhost:5173",
            "X-Title": "AI Knowledge Base",
        },
    )


def answer_question(question: str) -> Dict[str, Any]:
    """
    Run the full RAG pipeline for a given question.

    Steps:
      1. Retrieve top-k relevant chunks from FAISS
      2. Build a context-aware prompt
      3. Call the LLM
      4. Format and return the response with source citations

    Args:
        question: The user's natural language question.

    Returns:
        Dict with keys:
          - "answer" (str): The LLM-generated answer.
          - "sources" (list): Each source has "file" and "snippet" keys.

    Raises:
        RuntimeError: If no documents are in the knowledge base.
        ValueError: If the API key is missing.
    """
    # Step 1: Retrieve relevant chunks
    retriever = get_retriever(k=RETRIEVAL_K)
    context_chunks: List[Document] = retriever.invoke(question)

    if not context_chunks:
        return {
            "answer": "I could not find enough information in the uploaded documents.",
            "sources": [],
        }

    # Step 2: Build the prompt
    prompt = _build_prompt(question, context_chunks)

    # Step 3: Call the LLM
    llm = _get_llm()
    response = llm.invoke(
        [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ]
    )

    answer_text: str = response.content.strip()

    # Step 4: Build source citations
    sources = []
    seen_snippets = set()

    for doc in context_chunks:
        snippet = doc.page_content.strip()[:300]  # First 300 chars as preview
        if snippet not in seen_snippets:
            seen_snippets.add(snippet)
            sources.append(
                {
                    "file": os.path.basename(
                        doc.metadata.get("source", "Unknown")
                    ),
                    "snippet": snippet,
                }
            )

    return {
        "answer": answer_text,
        "sources": sources,
    }
