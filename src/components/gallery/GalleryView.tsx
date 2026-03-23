import { useEffect } from 'react';
import { useChartStore } from '../../hooks/useChartStore';
import ChartThumbnail from './ChartThumbnail';
import { Loader2, BarChart3 } from '../../layouts/icons';

export default function GalleryView() {
  const { charts, groups, selectedGroupId, isLoading, fetchCharts, fetchGroups, filterByGroup } =
    useChartStore();

  useEffect(() => {
    fetchCharts();
    fetchGroups();
  }, [fetchCharts, fetchGroups]);

  const filteredCharts = selectedGroupId
    ? charts.filter((c) => c.groupId === selectedGroupId)
    : charts;

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-4">
        <h1 className="text-lg font-bold">Galería de Gráficos</h1>
        {/* Group filter */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => filterByGroup(null)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              !selectedGroupId
                ? 'bg-[var(--color-primary)] text-white'
                : 'bg-[var(--color-bg-input)] text-[var(--color-text-secondary)] hover:text-white'
            }`}
          >
            Todos
          </button>
          {groups.map((g) => (
            <button
              key={g.id}
              onClick={() => filterByGroup(g.id)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                selectedGroupId === g.id
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'bg-[var(--color-bg-input)] text-[var(--color-text-secondary)] hover:text-white'
              }`}
            >
              {g.name}
            </button>
          ))}
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" />
          </div>
        ) : filteredCharts.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3">
            <BarChart3 className="h-12 w-12 text-[var(--color-text-secondary)] opacity-40" />
            <p className="text-sm text-[var(--color-text-secondary)]">
              {selectedGroupId
                ? 'No hay gráficos en este grupo'
                : 'Aún no has generado ningún gráfico. ¡Empieza una conversación!'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCharts.map((chart) => (
              <ChartThumbnail key={chart.id} chart={chart} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
