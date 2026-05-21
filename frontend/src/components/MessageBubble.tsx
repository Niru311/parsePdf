/**
 * components/MessageBubble.tsx
 *
 * Renders a single message in the chat — either from the user or the AI.
 *
 * User messages:   right-aligned, warm beige accent
 * AI messages:     left-aligned, lighter cream, with source citations below
 */

import { Bot, User } from 'lucide-react';
import { CitationCard } from './CitationCard';
import type { Message } from '../types';

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div
      className="animate-fade-in-up"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isUser ? 'flex-end' : 'flex-start',
        gap: '0.5rem',
        padding: '0 1.5rem',
      }}
    >
      {/* Avatar + Bubble row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: '0.625rem',
          flexDirection: isUser ? 'row-reverse' : 'row',
          maxWidth: '75%',
        }}
      >
        {/* Avatar icon */}
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: '50%',
            background: isUser ? 'var(--color-accent)' : 'var(--color-surface-2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            border: '1px solid var(--color-border)',
          }}
          aria-hidden="true"
        >
          {isUser ? (
            <User size={15} color="var(--color-text-primary)" />
          ) : (
            <Bot size={15} color="var(--color-accent-dark)" />
          )}
        </div>

        {/* Message bubble */}
        <div
          style={{
            background: isUser ? 'var(--color-user-bubble)' : 'var(--color-ai-bubble)',
            border: '1px solid var(--color-border)',
            borderRadius: isUser ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
            padding: '0.75rem 1rem',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <p
            style={{
              fontSize: '0.9375rem',
              lineHeight: 1.65,
              color: 'var(--color-text-primary)',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {message.content}
          </p>
        </div>
      </div>

      {/* Source citations — only for assistant messages that have sources */}
      {!isUser && message.sources && message.sources.length > 0 && (
        <div
          style={{
            maxWidth: '75%',
            marginLeft: '2.5rem',  // Align with bubble (past avatar)
            width: '100%',
          }}
        >
          <p
            style={{
              fontSize: '0.75rem',
              color: 'var(--color-text-muted)',
              marginBottom: '0.375rem',
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            Sources
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            {message.sources.map((source, i) => (
              <CitationCard key={i} source={source} index={i} />
            ))}
          </div>
        </div>
      )}

      {/* Timestamp */}
      <span
        style={{
          fontSize: '0.6875rem',
          color: 'var(--color-text-muted)',
          marginLeft: isUser ? 0 : '2.5rem',
          marginRight: isUser ? '2.5rem' : 0,
        }}
      >
        {new Date(message.timestamp).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </span>
    </div>
  );
}
