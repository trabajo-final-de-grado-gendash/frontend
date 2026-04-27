import { useState, useEffect } from 'react';
import Plot from './PlotlyWrapper';
import { useChartStore } from '../../hooks/useChartStore';
import type { ChartAsset, QuotedChartRef } from '../../models/types';
import { Loader2, AlertCircle, Pencil, MessageSquare } from '../../layouts/icons';
import ChartEditModal from './ChartEditModal';

interface ChartContainerProps {
  chartId: string;
  onQuote?: (ref: QuotedChartRef) => void;
}

function extractTitleText(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && 'text' in value) {
    const text = (value as { text?: unknown }).text;
    return typeof text === 'string' ? text : '';
  }
  return '';
}

export default function ChartContainer({ chartId, onQuote }: ChartContainerProps) {
  const getChartById = useChartStore((s) => s.getChartById);

  // Suscripción reactiva: cuando directUpdate() actualiza el store,
  // este selector dispara un re-render automáticamente.
  const chartFromStore = useChartStore((s) => s.charts.find((c) => c.id === chartId) ?? null);

  const [asyncChart, setAsyncChart] = useState<ChartAsset | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // El chart efectivo: prefiere el del store (reactivo) sobre el cargado async
  const chart = chartFromStore ?? asyncChart;

  // Carga inicial desde ApiLocalState (para charts que aún no están en useChartStore.charts)
  useEffect(() => {
    if (chartFromStore) {
      // Ya está en el store, no hace falta fetch async
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    getChartById(chartId).then((result) => {
      if (cancelled) return;
      if (result) {
        setAsyncChart(result);
      } else {
        setError('No se pudo cargar el gráfico.');
      }
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [chartId, getChartById, chartFromStore]);

  // Re-carga async cuando chartFromStore desaparece (edge case)
  const loadChart = () => {
    setLoading(true);
    getChartById(chartId).then((result) => {
      if (result) setAsyncChart(result);
      else setError('No se pudo cargar el gráfico.');
      setLoading(false);
    });
  };

  if (loading && !chart) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--color-primary)]" />
      </div>
    );
  }

  if (error || !chart) {
    return (
      <div className="flex h-48 items-center justify-center gap-2 text-[var(--color-error)]">
        <AlertCircle className="h-5 w-5" />
        <span className="text-sm">{error || 'Gráfico no disponible'}</span>
      </div>
    );
  }

  try {
    const xAxisTitle = extractTitleText(
      (chart.config.layout?.xaxis as { title?: unknown } | undefined)?.title,
    );
    const yAxisTitle = extractTitleText(
      (chart.config.layout?.yaxis as { title?: unknown } | undefined)?.title,
    );

    return (
      <>
        {/* Wrapper con overlay de acciones */}
        <div className="group relative">
          {/* Botones de acción — visibles on hover */}
          <div className="absolute right-2 top-2 z-10 flex gap-1.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
            {/* Lápiz: edición explícita (TFG-56) */}
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--color-bg-sidebar)]/90 text-[var(--color-text-secondary)] shadow-sm backdrop-blur-sm transition-colors hover:text-[var(--color-primary)]"
              title="Editar gráfico"
              id={`chart-edit-btn-${chartId}`}
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>

            {/* Citar: edición generativa (TFG-57) */}
            {onQuote && (
              <button
                onClick={() =>
                  onQuote({ resultId: chart.id, title: chart.title, chartType: chart.type })
                }
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--color-bg-sidebar)]/90 text-[var(--color-text-secondary)] shadow-sm backdrop-blur-sm transition-colors hover:text-[var(--color-primary)]"
                title="Citar en el chat"
                id={`chart-quote-btn-${chartId}`}
              >
                <MessageSquare className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Gráfico */}
          <Plot
            data={chart.config.data}
            layout={{
              ...chart.config.layout,
              autosize: true,
              margin: {
                t: 40,
                r: 20,
                b: xAxisTitle ? 70 : 40,
                l: yAxisTitle ? 80 : 50,
              },
            }}
            config={{ responsive: true, displayModeBar: false }}
            useResizeHandler
            style={{ width: '100%', height: '300px' }}
          />
        </div>

        {/* Modal de edición */}
        {isEditModalOpen && (
          <ChartEditModal
            chart={chart}
            onClose={() => setIsEditModalOpen(false)}
            onSaved={loadChart}
          />
        )}
      </>
    );
  } catch {
    return (
      <div className="flex h-48 items-center justify-center gap-2 text-[var(--color-error)]">
        <AlertCircle className="h-5 w-5" />
        <span className="text-sm">Error al renderizar el gráfico</span>
      </div>
    );
  }
}
