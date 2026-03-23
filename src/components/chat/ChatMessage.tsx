import ReactMarkdown from 'react-markdown';
import type { ChatMessage as ChatMessageType } from '../../models/types';
import ChartContainer from '../charts/ChartContainer';
import { Loader2, AlertCircle } from '../../layouts/icons';

interface ChatMessageProps {
  message: ChatMessageType;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  if (message.status === 'loading') {
    return (
      <div className="flex justify-start px-4 py-3">
        <div className="flex max-w-[80%] items-center gap-2 rounded-2xl bg-[var(--color-bg-card)] px-4 py-3 text-sm text-[var(--color-text-secondary)]">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Generando respuesta...</span>
        </div>
      </div>
    );
  }

  if (message.status === 'error') {
    return (
      <div className="flex justify-start px-4 py-3">
        <div className="flex max-w-[80%] items-center gap-2 rounded-2xl bg-red-900/30 border border-red-800 px-4 py-3 text-sm text-[var(--color-error)]">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{message.content || 'Ocurrió un error al procesar tu consulta.'}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex px-4 py-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? 'bg-[var(--color-primary)] text-white'
            : 'bg-[var(--color-bg-card)] text-[var(--color-text-primary)]'
        }`}
      >
        {/* Markdown text content */}
        <div className="prose prose-invert prose-sm max-w-none">
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>

        {/* Inline chart if present */}
        {message.chartAssetId && (
          <div className="mt-3 rounded-xl bg-[var(--color-bg-main)] p-2">
            <ChartContainer chartId={message.chartAssetId} />
          </div>
        )}
      </div>
    </div>
  );
}
