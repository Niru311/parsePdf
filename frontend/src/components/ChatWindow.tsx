/**
 * components/ChatWindow.tsx
 *
 * The central chat panel:
 *  - Scrollable message list with auto-scroll to bottom
 *  - Empty / welcome state before any conversation
 *  - Typing indicator while waiting for AI
 *  - Input bar fixed at the bottom
 */

import { useEffect, useRef, useState, type KeyboardEvent, type FormEvent } from 'react';
import { Send, BookOpen } from 'lucide-react';
import { MessageBubble } from './MessageBubble';
import { useChatStore } from '../store/chatStore';
import { askQuestion } from '../services/api';

export function ChatWindow() {
  const { messages, isLoading, hasDocuments, addUserMessage, addAssistantMessage, setIsLoading } =
    useChatStore();

  const [inputValue, setInputValue] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /* ----------------------------------------------------------------
     Auto-scroll to latest message
  ---------------------------------------------------------------- */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  /* ----------------------------------------------------------------
     Auto-grow textarea up to ~6 rows
  ---------------------------------------------------------------- */
  const handleInput = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 144) + 'px';
  };

  /* ----------------------------------------------------------------
     Submit question
  ---------------------------------------------------------------- */
  const handleSubmit = async (e?: FormEvent) => {
    e?.preventDefault();
    const question = inputValue.trim();
    if (!question || isLoading) return;

    setInputValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    addUserMessage(question);
    setIsLoading(true);

    try {
      const response = await askQuestion(question);
      addAssistantMessage(response.answer, response.sources);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      addAssistantMessage(`⚠️ Error: ${message}`, []);
    } finally {
      setIsLoading(false);
    }
  };

  /* Shift+Enter = newline, Enter = submit */
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const canSubmit = inputValue.trim().length > 0 && !isLoading;

  /* ================================================================
     RENDER
  ================================================================ */
  return (
    <div className="main-panel">
      {/* ---- Message area ---- */}
      <div
        id="chat-message-list"
        role="log"
        aria-label="Chat conversation"
        aria-live="polite"
        style={{
          flex: 1,
          overflowY: 'auto',
          paddingTop: '2rem',
          paddingBottom: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
        }}
      >
        {messages.length === 0 ? (
          /* ---- Welcome / empty state ---- */
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1rem',
              padding: '3rem 2rem',
              textAlign: 'center',
              animation: 'fadeInUp 0.4s ease-out',
            }}
          >
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: '20px',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'var(--shadow-md)',
              }}
            >
              <BookOpen size={34} color="var(--color-accent-dark)" />
            </div>
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.5rem',
                fontWeight: 700,
                color: 'var(--color-text-primary)',
              }}
            >
              parsePDF
            </h1>
            <p style={{ fontSize: '0.9375rem', color: 'var(--color-text-secondary)', maxWidth: 380 }}>
              {hasDocuments
                ? 'Your documents are ready. Ask anything!'
                : 'Upload one or more PDFs using the sidebar, then ask a question about their contents.'}
            </p>

            {/* Example prompt chips */}
            {hasDocuments && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center', marginTop: '0.5rem' }}>
                {[
                  'Summarize the key points',
                  'What are the main topics?',
                  'List the conclusions',
                ].map((chip) => (
                  <button
                    key={chip}
                    onClick={() => {
                      setInputValue(chip);
                      textareaRef.current?.focus();
                    }}
                    style={{
                      padding: '0.375rem 0.875rem',
                      borderRadius: '999px',
                      background: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      fontSize: '0.8125rem',
                      color: 'var(--color-text-secondary)',
                      cursor: 'pointer',
                      transition: 'all 0.18s ease',
                      fontFamily: 'var(--font-sans)',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-surface-2)';
                      (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-primary)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-surface)';
                      (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-secondary)';
                    }}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)
        )}

        {/* Typing indicator */}
        {isLoading && (
          <div
            style={{ padding: '0 1.5rem' }}
            className="animate-fade-in-up"
            aria-label="AI is typing"
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                background: 'var(--color-ai-bubble)',
                border: '1px solid var(--color-border)',
                borderRadius: '14px 14px 14px 4px',
                padding: '0.75rem 1rem',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ---- Input bar ---- */}
      <div
        style={{
          padding: '0.875rem 1.25rem 1rem',
          borderTop: '1px solid var(--color-border)',
          background: 'var(--color-bg)',
        }}
      >
        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            gap: '0.625rem',
            alignItems: 'flex-end',
          }}
        >
          <textarea
            ref={textareaRef}
            id="chat-input"
            className="input"
            placeholder={
              hasDocuments ? 'Ask a question about your documents…' : 'Upload PDFs first to start chatting…'
            }
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              handleInput();
            }}
            onKeyDown={handleKeyDown}
            disabled={!hasDocuments || isLoading}
            rows={1}
            aria-label="Question input"
            style={{ flex: 1 }}
          />
          <button
            id="chat-send-btn"
            type="submit"
            className="btn btn-primary"
            disabled={!canSubmit || !hasDocuments}
            aria-label="Send message"
            style={{
              height: 42,
              width: 42,
              padding: 0,
              borderRadius: '10px',
              flexShrink: 0,
            }}
          >
            <Send size={17} />
          </button>
        </form>
        <p
          style={{
            fontSize: '0.7rem',
            color: 'var(--color-text-muted)',
            textAlign: 'center',
            marginTop: '0.5rem',
          }}
        >
          Press <kbd style={{ fontFamily: 'monospace' }}>Enter</kbd> to send · <kbd style={{ fontFamily: 'monospace' }}>Shift+Enter</kbd> for new line
        </p>
      </div>
    </div>
  );
}
