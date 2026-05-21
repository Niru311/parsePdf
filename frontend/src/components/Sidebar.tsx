/**
 * components/Sidebar.tsx
 *
 * Left panel — drag-and-drop PDF upload area + uploaded files list.
 *
 * Features:
 *  - Drag-and-drop + click-to-browse
 *  - File type validation (PDF only)
 *  - Per-file status indicators (uploading / done / error)
 *  - Clear parsePDF button
 */

import { useRef, useState } from 'react';
import { UploadCloud, FileText, CheckCircle, XCircle, Loader, Trash2, BookOpen } from 'lucide-react';
import { useChatStore } from '../store/chatStore';
import { uploadPDFs } from '../services/api';

export function Sidebar() {
  const {
    uploadedFiles,
    isUploading,
    addUploadedFile,
    updateFileStatus,
    setIsUploading,
    setHasDocuments,
    clearKnowledgeBase,
  } = useChatStore();

  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ----------------------------------------------------------------
     File handling helpers
  ---------------------------------------------------------------- */
  const processFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const pdfFiles = Array.from(files).filter((f) => f.type === 'application/pdf');
    if (pdfFiles.length === 0) return;

    // Register each file in the store with "uploading" status
    const fileIds = pdfFiles.map((f) =>
      addUploadedFile({ name: f.name, status: 'uploading', chunks: 0 })
    );

    setIsUploading(true);
    try {
      const result = await uploadPDFs(pdfFiles);

      // Map result back to store entries
      result.processed.forEach((resultFile, i) => {
        updateFileStatus(fileIds[i], 'done', { chunks: resultFile.chunks });
      });

      // Mark any errors
      result.errors?.forEach((_errObj, i) => {
        const idx = result.processed.length + i;
        if (fileIds[idx]) updateFileStatus(fileIds[idx], 'error');
      });

      if (result.processed.length > 0) setHasDocuments(true);
    } catch {
      fileIds.forEach((id) => updateFileStatus(id, 'error'));
    } finally {
      setIsUploading(false);
    }
  };

  /* ----------------------------------------------------------------
     Drag event handlers
  ---------------------------------------------------------------- */
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
  };

  /* ================================================================
     RENDER
  ================================================================ */
  return (
    <aside className="sidebar" aria-label="parsePDF sidebar">
      {/* ---- Header ---- */}
      <div
        style={{
          padding: '1.25rem 1.25rem 1rem',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <BookOpen size={20} color="var(--color-accent-dark)" />
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1rem',
              fontWeight: 700,
              color: 'var(--color-text-primary)',
            }}
          >
            parsePDF
          </h2>
        </div>
        <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
          Upload PDFs to start chatting
        </p>
      </div>

      {/* ---- Upload area ---- */}
      <div style={{ padding: '1rem' }}>
        <div
          id="pdf-drop-zone"
          role="button"
          tabIndex={0}
          aria-label="Upload PDF files — drag and drop or click to browse"
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          style={{
            border: `2px dashed ${isDragging ? 'var(--color-accent)' : 'var(--color-border)'}`,
            borderRadius: '12px',
            padding: '1.5rem 1rem',
            textAlign: 'center',
            cursor: isUploading ? 'wait' : 'pointer',
            transition: 'all 0.2s ease',
            background: isDragging ? 'rgba(203,184,157,0.08)' : 'transparent',
            transform: isDragging ? 'scale(1.01)' : 'scale(1)',
          }}
        >
          {isUploading ? (
            <Loader
              size={28}
              color="var(--color-accent)"
              className="animate-spin"
              style={{ margin: '0 auto 0.625rem' }}
            />
          ) : (
            <UploadCloud
              size={28}
              color={isDragging ? 'var(--color-accent)' : 'var(--color-text-muted)'}
              style={{ margin: '0 auto 0.625rem', display: 'block', transition: 'color 0.2s' }}
            />
          )}
          <p
            style={{
              fontSize: '0.8125rem',
              fontWeight: 500,
              color: isUploading ? 'var(--color-accent-dark)' : 'var(--color-text-secondary)',
            }}
          >
            {isUploading ? 'Processing…' : 'Drop PDFs here'}
          </p>
          {!isUploading && (
            <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
              or click to browse
            </p>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          multiple
          style={{ display: 'none' }}
          aria-hidden="true"
          onChange={(e) => processFiles(e.target.files)}
        />
      </div>

      {/* ---- Uploaded files list ---- */}
      {uploadedFiles.length > 0 && (
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '0 1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
          }}
          aria-label="Uploaded files"
        >
          <p
            style={{
              fontSize: '0.7rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--color-text-muted)',
              marginBottom: '0.25rem',
            }}
          >
            Documents ({uploadedFiles.length})
          </p>

          {uploadedFiles.map((file) => (
            <div
              key={file.id}
              className="animate-fade-in-up"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'var(--color-bg)',
                border: '1px solid var(--color-border-light)',
                borderRadius: '8px',
                padding: '0.5rem 0.625rem',
              }}
            >
              {/* Status icon */}
              <div style={{ flexShrink: 0 }}>
                {file.status === 'uploading' && (
                  <Loader size={14} color="var(--color-accent)" className="animate-spin" />
                )}
                {file.status === 'done' && (
                  <CheckCircle size={14} color="var(--color-success)" />
                )}
                {file.status === 'error' && (
                  <XCircle size={14} color="var(--color-error)" />
                )}
              </div>

              <FileText size={13} color="var(--color-text-muted)" style={{ flexShrink: 0 }} />

              {/* File name */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: 500,
                    color: 'var(--color-text-primary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {file.name}
                </p>
                {file.status === 'done' && file.chunks > 0 && (
                  <p style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>
                    {file.chunks} chunks indexed
                  </p>
                )}
                {file.status === 'error' && (
                  <p style={{ fontSize: '0.68rem', color: 'var(--color-error)' }}>
                    Failed to process
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ---- Clear parsePDF ---- */}
      {uploadedFiles.length > 0 && (
        <div
          style={{
            padding: '1rem',
            borderTop: '1px solid var(--color-border)',
            marginTop: 'auto',
          }}
        >
          <button
            id="clear-kb-btn"
            className="btn btn-ghost"
            onClick={clearKnowledgeBase}
            style={{ width: '100%', justifyContent: 'center', gap: '0.375rem' }}
            aria-label="Clear parsePDF"
          >
            <Trash2 size={14} />
            Clear parsePDF
          </button>
        </div>
      )}
    </aside>
  );
}
