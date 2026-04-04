import { useState } from 'react';
import { useChartStore } from '../../hooks/useChartStore';
import type { ChartAsset } from '../../models/types';

interface ChartEditModalProps {
  chart: ChartAsset;
  onClose: () => void;
}

function extractTitleText(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && 'text' in value) {
    const text = (value as { text?: unknown }).text;
    return typeof text === 'string' ? text : '';
  }
  return '';
}

function extractAxisTitle(axis: unknown): string {
  if (!axis || typeof axis !== 'object' || !('title' in axis)) return '';
  return extractTitleText((axis as { title?: unknown }).title);
}

function supportsCartesianAxes(chart: ChartAsset): boolean {
  return chart.config.data.some((trace) => {
    const t = trace as { type?: string; x?: unknown; y?: unknown };
    if (t.type === 'pie') return false;
    return Array.isArray(t.x) || Array.isArray(t.y);
  });
}

export default function ChartEditModal({ chart, onClose }: ChartEditModalProps) {
  const { updateChartMetadata, clearError, error, isLoading } = useChartStore();
  const hasAxes = supportsCartesianAxes(chart);

  const [title, setTitle] = useState(chart.title);
  const [xAxisTitle, setXAxisTitle] = useState(extractAxisTitle(chart.config.layout?.xaxis));
  const [yAxisTitle, setYAxisTitle] = useState(extractAxisTitle(chart.config.layout?.yaxis));
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const nextTitle = title.trim();
    const nextXAxisTitle = xAxisTitle.trim();
    const nextYAxisTitle = yAxisTitle.trim();

    if (!nextTitle) {
      setFormError('El título del gráfico es obligatorio.');
      return;
    }

    setFormError(null);
    clearError();

    const updated = await updateChartMetadata(chart.id, {
      title: nextTitle,
      xAxisTitle: hasAxes ? nextXAxisTitle : '',
      yAxisTitle: hasAxes ? nextYAxisTitle : '',
    });

    if (updated) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-[var(--color-bg-card)] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-2 text-base font-bold">Editar gráfico</h3>
        <p className="mb-4 text-xs text-[var(--color-text-secondary)] truncate">
          ID: {chart.id}
        </p>

        <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
          <label className="text-xs text-[var(--color-text-secondary)]">
            Título
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-lg bg-[var(--color-bg-input)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
              placeholder="Título del gráfico"
              disabled={isLoading}
            />
          </label>

          {hasAxes ? (
            <>
              <label className="text-xs text-[var(--color-text-secondary)]">
                Eje X (opcional)
                <input
                  type="text"
                  value={xAxisTitle}
                  onChange={(e) => setXAxisTitle(e.target.value)}
                  className="mt-1 w-full rounded-lg bg-[var(--color-bg-input)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                  placeholder="Nombre del eje X"
                  disabled={isLoading}
                />
              </label>

              <label className="text-xs text-[var(--color-text-secondary)]">
                Eje Y (opcional)
                <input
                  type="text"
                  value={yAxisTitle}
                  onChange={(e) => setYAxisTitle(e.target.value)}
                  className="mt-1 w-full rounded-lg bg-[var(--color-bg-input)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                  placeholder="Nombre del eje Y"
                  disabled={isLoading}
                />
              </label>
            </>
          ) : (
            <p className="rounded-lg bg-[var(--color-bg-input)] px-3 py-2 text-xs text-[var(--color-text-secondary)]">
              Este tipo de gráfico no utiliza ejes (por ejemplo, pie). Solo se puede editar el título.
            </p>
          )}

          {(formError || error) && (
            <p className="rounded-lg bg-red-900/30 px-3 py-2 text-xs text-[var(--color-error)]">
              {formError || error}
            </p>
          )}

          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg bg-[var(--color-bg-input)] py-2 text-sm text-[var(--color-text-secondary)] hover:text-white"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 rounded-lg bg-[var(--color-primary)] py-2 text-sm text-white transition-colors hover:bg-[var(--color-primary-hover)] disabled:opacity-40"
              disabled={isLoading}
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}