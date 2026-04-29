import { X, BarChart3 } from '../../layouts/icons';
import type { QuotedChartRef } from '../../models/types';

interface QuotedChartProps {
  quotedChart: QuotedChartRef;
  onClear: () => void;
}

const CHART_TYPE_LABELS: Record<string, string> = {
  bar: 'Barra',
  line: 'Línea',
  pie: 'Torta',
  scatter: 'Dispersión',
  area: 'Área',
  histogram: 'Histograma',
  heatmap: 'Mapa de calor',
  box: 'Box',
};

function formatChartType(type: string): string {
  const key = type.toLowerCase();
  return CHART_TYPE_LABELS[key] ?? (type.charAt(0).toUpperCase() + type.slice(1));
}

export default function QuotedChart({ quotedChart, onClear }: QuotedChartProps) {
  return (
    <div className="mx-auto max-w-3xl px-1 pb-1.5">
      <div className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-primary)]/40 bg-[var(--color-primary)]/10 px-3 py-1.5 text-xs">
        <BarChart3 className="h-3.5 w-3.5 shrink-0 text-[var(--color-primary)]" />
        <span className="font-semibold text-[var(--color-primary)]">
          {formatChartType(quotedChart.chartType)}
        </span>
        <span className="max-w-[220px] truncate text-[var(--color-text-primary)]">
          {quotedChart.title}
        </span>
        <button
          onClick={onClear}
          className="ml-0.5 flex items-center justify-center rounded p-0.5 text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-error)]"
          aria-label="Cancelar cita"
          id="clear-quoted-chart"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
