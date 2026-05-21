# AI-Powered Knowledge Base — Implementation Plan

## Overview

Build a production-style RAG (Retrieval-Augmented Generation) web application where users upload PDFs, which get processed into embeddings stored in FAISS, then ask natural language questions answered by an LLM using retrieved context.

**Stack:** React + TypeScript + Vite + Tailwind (frontend) / FastAPI + LangChain + FAISS + Sentence Transformers + OpenRouter (backend)

---

## Architecture Flow

```
React Frontend (Vite + TS + Tailwind)
        ↓ Axios HTTP
FastAPI Backend
        ↓
PDF Upload → PyPDFLoader → Text Extraction
        ↓
RecursiveCharacterTextSplitter (chunk_size=900, overlap=175)
        ↓
SentenceTransformers (all-MiniLM-L6-v2) → Embeddings
        ↓
FAISS Vector Store (local disk persistence)
        ↓
Similarity Retrieval (top-4 chunks)
        ↓
LLM Context Injection (OpenRouter / OpenAI)
        ↓
JSON Response { answer, sources[] }
        ↓
React UI — Chat + Source Citations
```

---

## Proposed Changes

### Backend

#### [NEW] `backend/app/main.py`
- FastAPI app entry point
- CORS middleware (allow localhost:5173)
- Include upload and chat routers

#### [NEW] `backend/app/routes/upload.py`
- `POST /upload` — accepts `multipart/form-data` with multiple PDF files
- Saves PDFs to `uploaded_pdfs/`
- Calls `pdf_loader → text_splitter → embeddings → vector_store`
- Returns list of processed file names + chunk counts

#### [NEW] `backend/app/routes/chat.py`
- `POST /chat` — accepts `{ question: string }`
- Calls `rag_pipeline.answer_question()`
- Returns `{ answer, sources: [{ file, snippet }] }`

#### [NEW] `backend/app/utils/pdf_loader.py`
- `load_pdf(path)` — uses `PyPDFLoader`, returns list of LangChain Documents
- Handles corrupt/empty PDFs with try/except

#### [NEW] `backend/app/utils/text_splitter.py`
- `split_documents(docs)` — `RecursiveCharacterTextSplitter(chunk_size=900, chunk_overlap=175)`
- Returns list of chunks with `metadata.source`

#### [NEW] `backend/app/utils/embeddings.py`
- `get_embeddings_model()` — loads `all-MiniLM-L6-v2` via `HuggingFaceEmbeddings`
- Cached singleton to avoid reloading

#### [NEW] `backend/app/utils/vector_store.py`
- `add_documents(chunks)` — adds to FAISS index
- `get_retriever(k=4)` — returns FAISS retriever
- `save_index()` / `load_index()` — disk persistence

#### [NEW] `backend/app/utils/rag_pipeline.py`
- `answer_question(question)` — full RAG flow
- Retrieves top-4 chunks, builds prompt, calls LLM
- Returns `{ answer, sources }`

#### [NEW] `backend/requirements.txt`
- fastapi, uvicorn, langchain, langchain-community, faiss-cpu
- sentence-transformers, pypdf, python-dotenv, openai, httpx

#### [NEW] `backend/.env`
- `OPENROUTER_API_KEY=...`
- `OPENAI_API_BASE=https://openrouter.ai/api/v1`

---

### Frontend

#### [NEW] `frontend/src/types/index.ts`
- `Message`, `Source`, `ChatResponse`, `UploadedFile` TypeScript interfaces

#### [NEW] `frontend/src/store/chatStore.ts`
- Zustand store: `messages`, `uploadedFiles`, `isLoading`, `addMessage`, `addFile`, `clearChat`

#### [NEW] `frontend/src/services/api.ts`
- `uploadPDFs(files)` — POST /upload with FormData
- `askQuestion(question)` — POST /chat

#### [NEW] `frontend/src/components/Sidebar.tsx`
- Upload area (drag & drop + click)
- Uploaded files list with status indicators
- Clear knowledge base button

#### [NEW] `frontend/src/components/UploadBox.tsx`
- Drag-and-drop file input
- File type validation (PDF only)
- Upload progress/success state

#### [NEW] `frontend/src/components/ChatWindow.tsx`
- Message list with auto-scroll
- Empty state with welcome illustration
- Typing indicator animation

#### [NEW] `frontend/src/components/MessageBubble.tsx`
- User vs AI bubble styles
- Source citation cards (collapsible)
- Smooth entry animations

#### [NEW] `frontend/src/components/CitationCard.tsx`
- File name + snippet display
- Collapsible with smooth transition

#### [NEW] `frontend/src/App.tsx`
- Main layout: Sidebar (left) + ChatWindow (center)
- Input bar fixed at bottom

#### [NEW] `frontend/tailwind.config.js`
- Custom warm beige color palette tokens
- Inter/Manrope font setup

#### [NEW] `frontend/src/index.css`
- Google Fonts import (Inter + Manrope)
- Base styles, scrollbar styling, animations

---

## Color System

| Token | Value | Usage |
|-------|-------|-------|
| `bg-warm` | `#F5F1EA` | App background |
| `surface` | `#EFE7DC` | Cards, sidebar |
| `accent` | `#CBB89D` | Primary accent |
| `accent-hover` | `#BDA686` | Hover states |
| `text-primary` | `#2B2B2B` | Main text |
| `text-secondary` | `#6E6256` | Labels, hints |
| `border` | `#DDD2C4` | Dividers |

---

## Verification Plan

### Automated
- Run backend: `uvicorn app.main:app --reload`
- Run frontend: `npm run dev`
- Browser test: upload a PDF, ask a question, verify answer + sources display

### Manual
- Upload multiple PDFs → confirm chunk counts returned
- Ask question → confirm structured JSON response
- Source cards expand/collapse correctly
- Empty state shows before any upload
- Error states handled gracefully

---

## Open Questions

> [!IMPORTANT]
> **LLM Provider**: The plan uses **OpenRouter** (free-tier compatible, no credit card required for many models). If you prefer OpenAI directly, just set `OPENAI_API_KEY` in `.env` — the code supports both with a config flag.

> [!NOTE]
> **Model choice**: Default will be `mistralai/mistral-7b-instruct` via OpenRouter (free). Can be swapped for `openai/gpt-3.5-turbo` or `openai/gpt-4o` easily.

> [!NOTE]
> **FAISS persistence**: Index is saved to `backend/vector_store/` directory. Restarting the server reloads existing index automatically.
