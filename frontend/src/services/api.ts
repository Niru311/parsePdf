/**
 * services/api.ts
 *
 * Centralized API layer using Axios.
 * All HTTP calls to the FastAPI backend go through here.
 * Keeping API calls separate from components makes testing and refactoring easy.
 */

import axios from 'axios';
import type { ChatRequest, ChatResponse, UploadResponse } from '../types';

// ---------------------------------------------------------------------------
// Axios Instance — base URL handled by Vite proxy in dev, or env var in prod
// ---------------------------------------------------------------------------

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',  // Vite proxy handles /upload and /chat
  timeout: 120_000,  // 2 min — embedding large PDFs can be slow
});

// ---------------------------------------------------------------------------
// API Functions
// ---------------------------------------------------------------------------

/**
 * Upload one or more PDF files to the backend for processing.
 *
 * @param files - Array of File objects selected by the user
 * @returns UploadResponse with processed files and any errors
 */
export async function uploadPDFs(files: File[]): Promise<UploadResponse> {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('files', file);
  });

  const response = await api.post<UploadResponse>('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return response.data;
}

/**
 * Send a natural language question to the RAG pipeline.
 *
 * @param question - The user's question string
 * @returns ChatResponse with the LLM's answer and source citations
 */
export async function askQuestion(question: string): Promise<ChatResponse> {
  const body: ChatRequest = { question };
  const response = await api.post<ChatResponse>('/chat', body);
  return response.data;
}

export default api;
