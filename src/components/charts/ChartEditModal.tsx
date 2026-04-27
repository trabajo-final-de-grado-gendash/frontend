import { useState } from 'react';
import type { ChartAsset, Plotly } from '../../models/types';
import { patchChartMetadata } from '../../services/repositories/ApiResultService';
import { saveChartState } from '../../services/repositories/ApiLocalState';
import { X, Loader2 } from '../../layouts/icons';

interface ChartEditModalProps {
  chart: ChartAsset;
  onClose: () => void;
  /** Se llama cuando el PATCH fue exitoso y el ChartAsset ya está actualizado en local state. */
  onSaved: () => void;
}

/** Tipos sin ejes cartesianos */
const PIE_TYPES = new Set(['pie', 'donut', 'sunburst', 'treemap', 'funnel']);

function extractAxisTitle(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && 'text' in value) {
    const text = (value as { text?: unknown }).text;
    return typeof text === 'string' ? text : '';
  }
  return '';
}

export default function ChartEditModal({ chart, onClose, onSaved }: ChartEditModalProps) {
  const isPieChart = PIE_TYPES.has(chart.type.toLowerCase());

  const [title, setTitle] = useState(chart.title);
  const [xAxisTitle, setXAxisTitle] = useState(
    extractAxisTitle((chart.config.layout?.xaxis as { title?: unknown } | undefined)?.title),
  );
  const [yAxisTitle, setYAxisTitle] = useState(
    extractAxisTitle((chart.config.layout?.yaxis as { title?: unknown } | undefined)?.title),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('El título del gráfico es obligatorio.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const payload: Record<string, string> = { title: trimmedTitle };
      if (!isPieChart) {
        if (xAxisTitle.trim()) payload.xaxis_title = xAxisTitle.trim();
        if (yAxisTitle.trim()) payload.yaxis_title = yAxisTitle.trim();
      }

      const response = await patchChartMetadata(chart.id, payload);

      // Reconstruir el ChartAsset con el plotly_json actualizado del backend
      const updatedLayout = (response.plotly_json?.layout ?? {}) as Partial<Plotly.Layout>;
      const updatedChart: ChartAsset = {
        ...chart,
        title: trimmedTitle,
        config: { ...chart.config, layout: updatedLayout },
      };
      saveChartState(updatedChart);

      onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar los cambios.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-sidebar)] p-6 shadow-2xl">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
            Editar gráfico
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]"
            id="chart-edit-modal-close"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--color-text-secondary)]">
              Título <span className="text-[var(--color-error)]">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
              placeholder="Título del gráfico"
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-input)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] transition-colors focus:border-[var(--color-primary)] focus:outline-none"
              id="chart-edit-title"
              autoFocus
            />
          </div>

          {/* Axis fields — hidden for pie-family charts */}
          {!isPieChart && (
            <>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--color-text-secondary)]">
                  Etiqueta eje X
                </label>
                <input
                  type="text"
                  value={xAxisTitle}
                  onChange={(e) => setXAxisTitle(e.target.value)}
                  placeholder="Ej: Mes, Región, Producto..."
                  className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-input)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] transition-colors focus:border-[var(--color-primary)] focus:outline-none"
                  id="chart-edit-xaxis"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--color-text-secondary)]">
                  Etiqueta eje Y
                </label>
                <input
                  type="text"
                  value={yAxisTitle}
                  onChange={(e) => setYAxisTitle(e.target.value)}
                  placeholder="Ej: Ventas (USD), Cantidad..."
                  className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-input)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] transition-colors focus:border-[var(--color-primary)] focus:outline-none"
                  id="chart-edit-yaxis"
                />
              </div>
            </>
          )}

          {/* Inline error */}
          {error && (
            <p className="text-xs text-[var(--color-error)]">{error}</p>
          )}
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="rounded-lg px-4 py-2 text-sm text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)] disabled:opacity-40"
            id="chart-edit-cancel"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !title.trim()}
            className="flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-40"
            id="chart-edit-save"
          >
            {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {isSaving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}
