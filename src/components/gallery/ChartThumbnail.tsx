import { useState } from 'react';
import type { ChartAsset } from '../../models/types';
import Plot from '../charts/PlotlyWrapper';
import { useChartStore } from '../../hooks/useChartStore';
import { MoreVertical, FolderPlus, Trash2, Loader2, Pencil, X, Maximize2 } from '../../layouts/icons';
import ChartEditModal from '../charts/ChartEditModal';

interface ChartThumbnailProps {
  chart: ChartAsset;
}

/** Modal que muestra el gráfico a tamaño completo */
function ChartLightbox({ chart, onClose }: { chart: ChartAsset; onClose: () => void }) {
  const fontColor = '#111827'; // Siempre oscuro para contrastar con el fondo blanco del gráfico

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'var(--color-lightbox-overlay)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl rounded-2xl border border-[var(--color-border)] p-6 shadow-2xl"
        style={{ backgroundColor: 'var(--color-lightbox-bg)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between">
          <div>
            <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
              {chart.title || 'Visualización'}
            </h2>
            <p className="text-xs text-[var(--color-text-secondary)]">
              {chart.type} • {new Date(chart.createdAt).toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-input)] hover:text-[var(--color-text-primary)] transition-colors"
            id="lightbox-close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="h-[60vh] w-full rounded-xl bg-white overflow-hidden border border-gray-200">
          <Plot
            data={chart.config.data}
            layout={{
              ...chart.config.layout,
              autosize: true,
              paper_bgcolor: 'transparent',
              plot_bgcolor: 'transparent',
              font: { color: fontColor },
            }}
            config={{ responsive: true, displayModeBar: true }}
            style={{ width: '100%', height: '100%' }}
          />
        </div>
      </div>
    </div>
  );
}

export default function ChartThumbnail({ chart }: ChartThumbnailProps) {
  const { projects, assignChartToProject, removeChartFromProject } = useChartStore();
  const fontColor = '#111827'; // Siempre oscuro
  
  const [showMenu, setShowMenu] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);

  const handleAssign = async (projectId: string) => {
    setIsProcessing(true);
    await assignChartToProject(chart.id, projectId);
    setIsProcessing(false);
    setShowMenu(false);
  };

  const handleRemove = async () => {
    if (!chart.projectId) return;
    setIsProcessing(true);
    await removeChartFromProject(chart.id, chart.projectId);
    setIsProcessing(false);
    setShowMenu(false);
  };

  const handleEditClick = () => {
    setShowMenu(false);
    setShowEditModal(true);
  };

  return (
    <>
      <div className="group relative flex flex-col rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-sidebar)] p-4 shadow-sm transition-all hover:border-[var(--color-primary)] hover:shadow-md">
        {/* Chart Preview — clickable to expand */}
        <div
          className="relative mb-3 h-40 w-full cursor-pointer overflow-hidden rounded-xl bg-white border border-gray-200 shadow-inner"
          onClick={() => setShowLightbox(true)}
          title="Click para ampliar"
        >
          <Plot
            data={chart.config.data}
            layout={{
              ...chart.config.layout,
              autosize: true,
              paper_bgcolor: 'transparent',
              plot_bgcolor: 'transparent',
              font: { color: fontColor },
              margin: { t: 20, r: 10, b: 52, l: 52 },
              showlegend: false,
              title: undefined,
              xaxis: {
                ...chart.config.layout?.xaxis,
                showticklabels: true,
                tickfont: { size: 9, color: fontColor },
                titlefont: { size: 9, color: fontColor },
              },
              yaxis: {
                ...chart.config.layout?.yaxis,
                showticklabels: true,
                tickfont: { size: 9, color: fontColor },
                titlefont: { size: 9, color: fontColor },
              },
            }}
            config={{ staticPlot: true, responsive: true }}
            style={{ width: '100%', height: '100%' }}
          />
          {/* Expand hint on hover */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/20 rounded-xl transition-opacity pointer-events-none">
            <Maximize2 className="h-6 w-6 text-white drop-shadow" />
          </div>
        </div>

        {/* Info */}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="truncate text-sm font-semibold text-[var(--color-text-primary)]">
              {chart.title || 'Sin título'}
            </h3>
            <p className="truncate text-xs text-[var(--color-text-secondary)]">
              {chart.type} • {new Date(chart.createdAt).toLocaleDateString()}
            </p>
            {chart.projectId && (
              <p className="mt-0.5 truncate text-[10px] text-[var(--color-primary)] font-medium">
                {projects.find(p => p.id === chart.projectId)?.name}
              </p>
            )}
          </div>

          {/* Menu Toggle */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              disabled={isProcessing}
              className="rounded-lg p-1 text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg-input)] hover:text-[var(--color-text-primary)] disabled:opacity-50"
              id={`chart-menu-${chart.id}`}
            >
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreVertical className="h-4 w-4" />}
            </button>

            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-full z-20 mt-1 w-48 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-sidebar)] p-1 shadow-xl">
                  {/* Editar título */}
                  <button
                    onClick={handleEditClick}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-bg-input)]"
                    id={`chart-edit-${chart.id}`}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Editar título
                  </button>

                  <div className="my-1 border-t border-[var(--color-border)]" />

                  <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
                    Mover a proyecto
                  </div>
                  <div className="max-h-32 overflow-y-auto">
                    {projects.length === 0 ? (
                      <p className="px-2 py-1.5 text-[10px] italic text-[var(--color-text-secondary)]">
                        Sin proyectos — creá uno arriba
                      </p>
                    ) : (
                      projects.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => handleAssign(p.id)}
                          className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition-colors hover:bg-[var(--color-bg-input)] ${
                            chart.projectId === p.id ? 'text-[var(--color-primary)] font-medium' : 'text-[var(--color-text-primary)]'
                          }`}
                        >
                          <FolderPlus className="h-3.5 w-3.5" />
                          {p.name}
                        </button>
                      ))
                    )}
                  </div>
                  {chart.projectId && (
                    <div className="mt-1 border-t border-[var(--color-border)] pt-1">
                      <button
                        onClick={handleRemove}
                        className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs text-red-400 transition-colors hover:bg-red-400/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Quitar del proyecto
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {showLightbox && <ChartLightbox chart={chart} onClose={() => setShowLightbox(false)} />}

      {/* Edit modal */}
      {showEditModal && (
        <ChartEditModal
          chart={chart}
          onClose={() => setShowEditModal(false)}
          onSaved={() => setShowEditModal(false)}
        />
      )}
    </>
  );
}
