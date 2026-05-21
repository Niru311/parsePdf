/**
 * components/CitationCard.tsx
 *
 * Displays a single source citation retrieved by the RAG pipeline.
 * Collapsible to keep the UI clean while still providing full context.
 */

import { useState } from 'react';
import { FileText, ChevronDown, ChevronUp } from 'lucide-react';
import type { Source } from '../types';

interface CitationCardProps {
  source: Source;
  index: number;
}

export function CitationCard({ source, index }: CitationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      style={{
        background: 'var(--color-bg)',
        border: '1px solid var(--color-border)',
        borderRadius: '8px',
        overflow: 'hidden',
        transition: 'box-shadow 0.18s ease',
      }}
    >
      {/* Header — always visible, clickable to toggle */}
      <button
        onClick={() => setIsExpanded((v) => !v)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 0.75rem',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          color: 'var(--color-text-secondary)',
          transition: 'background 0.15s ease',
        }}
        aria-expanded={isExpanded}
        aria-label={`Toggle source ${index + 1}: ${source.file}`}
      >
        <FileText size={13} style={{ flexShrink: 0, color: 'var(--color-accent-dark)' }} />
        <span
          style={{
            flex: 1,
            fontSize: '0.75rem',
            fontWeight: 500,
            color: 'var(--color-text-secondary)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {index + 1}. {source.file}
        </span>
        {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
      </button>

      {/* Expandable snippet */}
      {isExpanded && (
        <div
          style={{
            padding: '0 0.75rem 0.625rem',
            borderTop: '1px solid var(--color-border-light)',
          }}
          className="animate-fade-in-up"
        >
          <p
            style={{
              fontSize: '0.8125rem',
              lineHeight: 1.6,
              color: 'var(--color-text-secondary)',
              marginTop: '0.5rem',
              fontStyle: 'italic',
            }}
          >
            "{source.snippet}..."
          </p>
        </div>
      )}
    </div>
  );
}
