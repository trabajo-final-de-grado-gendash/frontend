import ReactMarkdown from 'react-markdown';
import type { ChatMessage as ChatMessageType, QuotedChartRef } from '../../models/types';
import ChartContainer from '../charts/ChartContainer';
import { Loader2, AlertCircle, BarChart3 } from '../../layouts/icons';

interface ChatMessageProps {
  message: ChatMessageType;
  onQuote?: (ref: QuotedChartRef) => void;
}

const CHART_TYPE_LABELS: Record<string, string> = {
  bar: 'Barra', line: 'Línea', pie: 'Torta', scatter: 'Dispersión',
  area: 'Área', histogram: 'Histograma', heatmap: 'Mapa de calor', box: 'Box',
};

function formatChartType(type: string): string {
  return CHART_TYPE_LABELS[type.toLowerCase()] ?? (type.charAt(0).toUpperCase() + type.slice(1));
}

export default function ChatMessage({ message, onQuote }: ChatMessageProps) {
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
        {/* Indicador de cita estilo reply — solo en mensajes de usuario */}
        {isUser && message.quotedChartRef && (
          <div className="mb-2.5 flex items-center gap-1.5 rounded-lg border-l-2 border-white/50 bg-white/10 px-2.5 py-1.5 text-xs">
            <BarChart3 className="h-3 w-3 shrink-0 opacity-80" />
            <span className="font-semibold opacity-80">
              {formatChartType(message.quotedChartRef.chartType)}
            </span>
            <span className="max-w-[180px] truncate opacity-90">
              {message.quotedChartRef.title}
            </span>
          </div>
        )}

        {/* Markdown text content */}
        <div className="prose prose-invert prose-sm max-w-none">
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>

        {/* Inline chart if present */}
        {message.chartAssetId && (
          <div className="mt-3 rounded-xl bg-[var(--color-bg-main)] p-2">
            <ChartContainer chartId={message.chartAssetId} onQuote={onQuote} />
          </div>
        )}
      </div>
    </div>
  );
}

