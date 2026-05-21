/**
 * store/chatStore.ts
 *
 * Zustand global state store.
 *
 * Manages:
 *  - Chat message history
 *  - Uploaded files list
 *  - Loading / streaming state
 *
 * Why Zustand?
 *  - Minimal boilerplate compared to Redux
 *  - No Provider wrapping needed
 *  - Simple to explain in an interview
 */

import { create } from 'zustand';
import { nanoid } from './nanoid';
import type { Message, UploadedFile, Source } from '../types';

// ---------------------------------------------------------------------------
// Store Shape
// ---------------------------------------------------------------------------

interface ChatState {
  /** Full conversation history */
  messages: Message[];

  /** Files that have been added or are being uploaded */
  uploadedFiles: UploadedFile[];

  /** True while waiting for the AI response */
  isLoading: boolean;

  /** True while PDFs are being processed */
  isUploading: boolean;

  /** Whether the knowledge base has at least one document */
  hasDocuments: boolean;

  // --- Actions ---
  addUserMessage: (content: string) => string;
  addAssistantMessage: (content: string, sources: Source[]) => void;
  addUploadedFile: (file: Omit<UploadedFile, 'id'>) => string;
  updateFileStatus: (
    id: string,
    status: UploadedFile['status'],
    extra?: Partial<UploadedFile>
  ) => void;
  setIsLoading: (v: boolean) => void;
  setIsUploading: (v: boolean) => void;
  setHasDocuments: (v: boolean) => void;
  clearChat: () => void;
  clearKnowledgeBase: () => void;
}

// ---------------------------------------------------------------------------
// Store Implementation
// ---------------------------------------------------------------------------

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  uploadedFiles: [],
  isLoading: false,
  isUploading: false,
  hasDocuments: false,

  /** Add a user message and return its generated ID */
  addUserMessage: (content) => {
    const id = nanoid();
    set((state) => ({
      messages: [
        ...state.messages,
        {
          id,
          role: 'user',
          content,
          timestamp: new Date().toISOString(),
        },
      ],
    }));
    return id;
  },

  /** Add the assistant's reply with source citations */
  addAssistantMessage: (content, sources) => {
    set((state) => ({
      messages: [
        ...state.messages,
        {
          id: nanoid(),
          role: 'assistant',
          content,
          sources,
          timestamp: new Date().toISOString(),
        },
      ],
    }));
  },

  /** Register a new file in the upload list and return its ID */
  addUploadedFile: (file) => {
    const id = nanoid();
    set((state) => ({
      uploadedFiles: [...state.uploadedFiles, { ...file, id }],
    }));
    return id;
  },

  /** Update a file's status after upload completes or fails */
  updateFileStatus: (id, status, extra = {}) => {
    set((state) => ({
      uploadedFiles: state.uploadedFiles.map((f) =>
        f.id === id ? { ...f, status, ...extra } : f
      ),
    }));
  },

  setIsLoading: (v) => set({ isLoading: v }),
  setIsUploading: (v) => set({ isUploading: v }),
  setHasDocuments: (v) => set({ hasDocuments: v }),

  /** Clear only the chat messages, keep uploaded files */
  clearChat: () => set({ messages: [] }),

  /** Clear uploaded files list (does not delete from FAISS — call the API for that) */
  clearKnowledgeBase: () =>
    set({ uploadedFiles: [], messages: [], hasDocuments: false }),
}));
