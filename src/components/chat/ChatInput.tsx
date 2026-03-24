import { useState, useRef, useEffect } from 'react';
import { Send, Loader2 } from '../../layouts/icons';

interface ChatInputProps {
  onSubmit: (message: string) => void;
  isLoading: boolean;
}

export default function ChatInput({ onSubmit, isLoading }: ChatInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 200) + 'px';
    }
  }, [value]);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed || isLoading) return;
    onSubmit(trimmed);
    setValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="border-t border-[var(--color-border)] bg-[var(--color-bg-sidebar)] p-4">
      <div className="mx-auto flex max-w-3xl items-end gap-3 rounded-2xl bg-[var(--color-bg-input)] px-4 py-3">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribe tu consulta para generar un gráfico..."
          rows={1}
          disabled={isLoading}
          className="max-h-[200px] flex-1 resize-none bg-transparent py-1.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:outline-none disabled:opacity-50"
          id="chat-input"
        />
        <button
          onClick={handleSubmit}
          disabled={!value.trim() || isLoading}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary)] text-white transition-colors hover:bg-[var(--color-primary-hover)] disabled:opacity-40 disabled:cursor-not-allowed"
          id="chat-submit"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}
