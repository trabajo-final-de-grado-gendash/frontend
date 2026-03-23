import { useState, useEffect } from 'react';
import Plot from './PlotlyWrapper';
import { useChartStore } from '../../hooks/useChartStore';
import type { ChartAsset } from '../../models/types';
import { Loader2, AlertCircle } from '../../layouts/icons';

interface ChartContainerProps {
  chartId: string;
}

export default function ChartContainer({ chartId }: ChartContainerProps) {
  const getChartById = useChartStore((s) => s.getChartById);
  const [chart, setChart] = useState<ChartAsset | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    getChartById(chartId).then((result) => {
      if (cancelled) return;
      if (result) {
        setChart(result);
      } else {
        setError('No se pudo cargar el gráfico.');
      }
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [chartId, getChartById]);

  if (loading) {
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
    return (
      <Plot
        data={chart.config.data}
        layout={{
          ...chart.config.layout,
          autosize: true,
          margin: { t: 40, r: 20, b: 40, l: 50 },
        }}
        config={{
          responsive: true,
          displayModeBar: false,
        }}
        useResizeHandler
        style={{ width: '100%', height: '300px' }}
      />
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
