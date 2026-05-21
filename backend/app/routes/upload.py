"""
upload.py — Route handler for PDF file uploads.

Endpoint: POST /upload
  - Accepts one or more PDF files via multipart/form-data
  - Saves files to the `uploaded_pdfs/` directory
  - Runs the full ingestion pipeline: extract → chunk → embed → store
  - Returns a summary of processed files
"""

import os
import shutil
from typing import List

from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import JSONResponse

from app.utils.pdf_loader import load_pdf
from app.utils.text_splitter import split_documents
from app.utils.vector_store import add_documents

# ---------------------------------------------------------------------------
# Router Setup
# ---------------------------------------------------------------------------

router = APIRouter()

# Directory to persist uploaded PDFs
UPLOAD_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(__file__))),  # backend/
    "uploaded_pdfs",
)
os.makedirs(UPLOAD_DIR, exist_ok=True)


# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------

@router.post("")
async def upload_pdfs(files: List[UploadFile] = File(...)):
    """
    Upload one or more PDF files and process them into the knowledge base.

    For each file:
      1. Validate it is a PDF
      2. Save to disk
      3. Extract text with PyPDFLoader
      4. Chunk text with RecursiveCharacterTextSplitter
      5. Embed chunks and store in FAISS

    Returns:
        JSON with list of processed files and their chunk counts.
    """
    if not files:
        raise HTTPException(status_code=400, detail="No files were uploaded.")

    results = []
    errors = []

    for upload_file in files:
        filename = upload_file.filename or "unnamed.pdf"

        # --- Validate file type ---
        if not filename.lower().endswith(".pdf"):
            errors.append({"file": filename, "error": "Only PDF files are accepted."})
            continue

        # --- Save file to disk ---
        save_path = os.path.join(UPLOAD_DIR, filename)
        try:
            with open(save_path, "wb") as buffer:
                shutil.copyfileobj(upload_file.file, buffer)
        except Exception as exc:
            errors.append({"file": filename, "error": f"Failed to save: {exc}"})
            continue

        # --- Run ingestion pipeline ---
        try:
            # Step 1: Extract text pages
            pages = load_pdf(save_path)

            # Step 2: Split into chunks
            chunks = split_documents(pages)

            # Step 3: Embed + store in FAISS
            total_vectors = add_documents(chunks)

            results.append(
                {
                    "file": filename,
                    "pages": len(pages),
                    "chunks": len(chunks),
                    "total_vectors_in_db": total_vectors,
                    "status": "success",
                }
            )
            print(f"[Upload] Processed '{filename}': {len(chunks)} chunks added.")

        except ValueError as exc:
            # Graceful handling of empty/corrupt PDFs
            errors.append({"file": filename, "error": str(exc)})
        except Exception as exc:
            errors.append(
                {"file": filename, "error": f"Unexpected error: {exc}"}
            )

    if not results and errors:
        raise HTTPException(
            status_code=422,
            detail={"message": "All uploads failed.", "errors": errors},
        )

    return JSONResponse(
        content={
            "message": f"Processed {len(results)} file(s) successfully.",
            "processed": results,
            "errors": errors,
        }
    )
