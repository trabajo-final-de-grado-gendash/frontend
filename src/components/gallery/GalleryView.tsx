import { useEffect } from 'react';
import { useChartStore } from '../../hooks/useChartStore';
import ChartThumbnail from './ChartThumbnail';
import ProjectManager from './ProjectManager';
import { Loader2, BarChart3, X } from '../../layouts/icons';
import ProminentErrorAlert from '../common/ProminentErrorAlert';

export default function GalleryView() {
  const {
    charts,
    projects,
    selectedProjectId,
    isLoading,
    error,
    clearError,
    fetchCharts,
    fetchProjects,
    filterByProject,
    deleteProject,
  } = useChartStore();

  useEffect(() => {
    fetchCharts();
    fetchProjects();
  }, [fetchCharts, fetchProjects]);

  const filteredCharts = selectedProjectId
    ? charts.filter((c) => c.projectId === selectedProjectId)
    : charts;

  const retryLoad = async () => {
    clearError();
    await fetchCharts();
    await fetchProjects();
  };

  const handleDeleteProject = async (e: React.MouseEvent, projectId: string, projectName: string) => {
    e.stopPropagation(); // No activar el filtro al hacer click en X
    if (!window.confirm(`¿Eliminar el proyecto "${projectName}"? Los gráficos no se borrarán.`)) return;
    await deleteProject(projectId);
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {error && (
        <ProminentErrorAlert
          message={error}
          onClose={clearError}
          onRetry={retryLoad}
          title="No se pudo cargar la galeria"
        />
      )}

      {/* Header */}
      <header className="flex flex-wrap items-center gap-3 border-b border-[var(--color-border)] px-6 py-4">
        <h1 className="text-lg font-bold shrink-0">Galería de Gráficos</h1>

        {/* Project filter pills */}
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <button
            onClick={() => filterByProject(null)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              !selectedProjectId
                ? 'bg-[var(--color-primary)] text-white'
                : 'bg-[var(--color-bg-input)] text-[var(--color-text-secondary)] hover:text-white'
            }`}
          >
            Todos
          </button>
          {projects.map((p) => (
            <div key={p.id} className="group relative flex items-center">
              <button
                onClick={() => filterByProject(p.id)}
                className={`rounded-full pl-3 pr-7 py-1 text-xs font-medium transition-colors ${
                  selectedProjectId === p.id
                    ? 'bg-[var(--color-primary)] text-white'
                    : 'bg-[var(--color-bg-input)] text-[var(--color-text-secondary)] hover:text-white'
                }`}
              >
                {p.name}
              </button>
              {/* Delete project button — visible on hover */}
              <button
                onClick={(e) => handleDeleteProject(e, p.id, p.name)}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center justify-center h-4 w-4 rounded-full bg-black/20 text-white hover:bg-red-500 transition-colors"
                title={`Eliminar proyecto "${p.name}"`}
                id={`delete-project-${p.id}`}
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Inline project creator — Bug 1 fix */}
        <div className="shrink-0">
          <ProjectManager compact />
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
              {selectedProjectId
                ? 'No hay gráficos en este proyecto'
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
