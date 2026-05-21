/**
 * types/index.ts
 *
 * Shared TypeScript interfaces for the entire frontend.
 * Keeping types centralized makes refactoring and interview explanations easy.
 */

// ---------------------------------------------------------------------------
// Chat Types
// ---------------------------------------------------------------------------

/** A single source citation returned alongside an AI answer */
export interface Source {
  /** Name of the PDF file this chunk came from */
  file: string;
  /** A short excerpt of the relevant text */
  snippet: string;
}

/** Roles in a conversation — mirrors the OpenAI convention */
export type MessageRole = 'user' | 'assistant';

/** A single message in the chat history */
export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  /** Source citations — only present on assistant messages */
  sources?: Source[];
  /** ISO timestamp */
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Upload Types
// ---------------------------------------------------------------------------

/** Status of a single uploaded file */
export type FileStatus = 'uploading' | 'done' | 'error';

/** A file that has been added to the upload queue */
export interface UploadedFile {
  id: string;
  name: string;
  status: FileStatus;
  /** Number of chunks created from this file */
  chunks: number;
}

// ---------------------------------------------------------------------------
// API Response Types
// ---------------------------------------------------------------------------

/** Response from POST /upload */
export interface UploadResponse {
  message: string;
  processed: ProcessedFile[];
  errors: Array<{ file: string; error: string }>;
}

export interface ProcessedFile {
  file: string;
  pages: number;
  chunks: number;
  total_vectors_in_db: number;
  status: 'success';
}

/** Response from POST /chat */
export interface ChatResponse {
  answer: string;
  sources: Source[];
}

/** Request body for POST /chat */
export interface ChatRequest {
  question: string;
}
