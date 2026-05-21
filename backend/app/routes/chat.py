"""
chat.py — Route handler for natural language question answering.

Endpoint: POST /chat
  - Accepts { "question": "..." }
  - Runs the RAG pipeline to retrieve relevant chunks and generate an answer
  - Returns the answer text and source citations
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.utils.rag_pipeline import answer_question

# ---------------------------------------------------------------------------
# Router Setup
# ---------------------------------------------------------------------------

router = APIRouter()


# ---------------------------------------------------------------------------
# Request / Response Models
# ---------------------------------------------------------------------------

class ChatRequest(BaseModel):
    """Incoming chat request body."""
    question: str = Field(
        ...,
        min_length=3,
        max_length=2000,
        description="The natural language question to answer.",
        example="What is the main topic of the uploaded document?",
    )


class SourceCitation(BaseModel):
    """A single source chunk used to generate the answer."""
    file: str = Field(..., description="Name of the source PDF file.")
    snippet: str = Field(..., description="Relevant text excerpt from the document.")


class ChatResponse(BaseModel):
    """Outgoing chat response body."""
    answer: str = Field(..., description="LLM-generated answer.")
    sources: list[SourceCitation] = Field(
        default_factory=list,
        description="List of source citations used to generate the answer.",
    )


# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------

@router.post("", response_model=ChatResponse)
async def ask_question(request: ChatRequest):
    """
    Answer a natural language question using the RAG pipeline.

    Flow:
      1. Embed the question
      2. Retrieve top-4 similar chunks from FAISS
      3. Build a context prompt
      4. Call the LLM (OpenRouter)
      5. Return the answer + source citations

    Returns:
        ChatResponse with answer and sources.
    """
    question = request.question.strip()

    if not question:
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    try:
        result = answer_question(question)
        return ChatResponse(
            answer=result["answer"],
            sources=[SourceCitation(**s) for s in result["sources"]],
        )

    except RuntimeError as exc:
        # No documents in the knowledge base yet
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    except ValueError as exc:
        # Missing API key or configuration error
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    except Exception as exc:
        # Unexpected errors
        print(f"[Chat] Unexpected error: {exc}")
        import traceback
        trace = traceback.format_exc()
        raise HTTPException(
            status_code=500,
            detail=f"An unexpected error occurred while processing your question: {exc}\n\n{trace}",
        ) from exc
