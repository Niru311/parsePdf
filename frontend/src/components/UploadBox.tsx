/**
 * components/UploadBox.tsx
 *
 * Drag-and-drop / click-to-browse PDF upload area.
 *
 * Features:
 *  - Drag and drop with visual feedback
 *  - Click to open file browser
 *  - PDF-only validation
 *  - Multiple file selection
 *  - Disabled state while uploading
 */

import { useRef, useState, useCallback } from 'react';
import { Upload, FileText } from 'lucide-react';

interface UploadBoxProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
}

export function UploadBox({ onFilesSelected, disabled = false }: UploadBoxProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  /** Filter and return only valid PDF files */
  const filterPDFs = (files: FileList | File[]): File[] => {
    const arr = Array.from(files);
    return arr.filter((f) => f.type === 'application/pdf' || f.name.endsWith('.pdf'));
  };

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      if (disabled) return;

      const validFiles = filterPDFs(e.dataTransfer.files);
      if (validFiles.length > 0) onFilesSelected(validFiles);
    },
    [disabled, onFilesSelected]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const validFiles = filterPDFs(e.target.files);
    if (validFiles.length > 0) onFilesSelected(validFiles);
    // Reset input so the same file can be re-uploaded if needed
    e.target.value = '';
  };

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label="Upload PDF files"
      onClick={() => !disabled && inputRef.current?.click()}
      onKeyDown={(e) => e.key === 'Enter' && !disabled && inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); if (!disabled) setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      style={{
        border: `2px dashed ${isDragging ? 'var(--color-accent)' : 'var(--color-border)'}`,
        borderRadius: '12px',
        padding: '1.5rem 1rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.625rem',
        cursor: disabled ? 'not-allowed' : 'pointer',
        background: isDragging ? 'rgba(203,184,157,0.1)' : 'transparent',
        transition: 'all 0.18s ease',
        opacity: disabled ? 0.6 : 1,
        userSelect: 'none',
      }}
    >
      {/* Hidden native file input */}
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,application/pdf"
        multiple
        style={{ display: 'none' }}
        onChange={handleInputChange}
        id="pdf-upload-input"
        disabled={disabled}
        aria-label="Select PDF files"
      />

      {/* Icon */}
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: '10px',
          background: 'var(--color-surface-2)',
          border: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Upload size={18} color="var(--color-accent-dark)" />
      </div>

      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
          {isDragging ? 'Drop PDFs here' : 'Upload PDFs'}
        </p>
        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
          Drag & drop or click to browse
        </p>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem',
          fontSize: '0.6875rem',
          color: 'var(--color-text-muted)',
          background: 'var(--color-surface-2)',
          padding: '0.25rem 0.625rem',
          borderRadius: '100px',
          border: '1px solid var(--color-border-light)',
        }}
      >
        <FileText size={10} />
        PDF files only
      </div>
    </div>
  );
}
