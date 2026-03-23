import { useState } from 'react';
import Plot from '../charts/PlotlyWrapper';
import type { ChartAsset } from '../../models/types';
import GroupManager from './GroupManager';
import { FolderPlus } from '../../layouts/icons';

interface ChartThumbnailProps {
  chart: ChartAsset;
}

export default function ChartThumbnail({ chart }: ChartThumbnailProps) {
  const [expanded, setExpanded] = useState(false);
  const [showGroupManager, setShowGroupManager] = useState(false);

  return (
    <>
      {/* Card */}
      <div
        className="group cursor-pointer overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] transition-all hover:border-[var(--color-primary)] hover:shadow-lg hover:shadow-[var(--color-primary)]/10"
      >
        {/* Mini chart preview */}
        <div className="pointer-events-none h-48 p-2" onClick={() => setExpanded(true)}>
          <Plot
            data={chart.config.data}
            layout={{
              ...chart.config.layout,
              autosize: true,
              margin: { t: 30, r: 10, b: 30, l: 30 },
            }}
            config={{ staticPlot: true, responsive: true, displayModeBar: false }}
            useResizeHandler
            style={{ width: '100%', height: '100%' }}
          />
        </div>
        {/* Info */}
        <div className="flex items-center justify-between border-t border-[var(--color-border)] px-4 py-3">
          <div className="min-w-0 flex-1" onClick={() => setExpanded(true)}>
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
              {chart.title}
            </h3>
            <p className="mt-1 text-xs text-[var(--color-text-secondary)] truncate">
              {chart.prompt}
            </p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); setShowGroupManager(true); }}
            className="ml-2 rounded-lg p-1.5 text-[var(--color-text-secondary)] opacity-0 transition-all group-hover:opacity-100 hover:bg-[var(--color-bg-input)] hover:text-[var(--color-primary)]"
            title="Asignar grupo"
          >
            <FolderPlus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Expanded modal overlay */}
      {expanded && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setExpanded(false)}
        >
          <div
            className="w-full max-w-3xl rounded-2xl bg-[var(--color-bg-card)] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">{chart.title}</h2>
              <button
                onClick={() => setExpanded(false)}
                className="text-[var(--color-text-secondary)] hover:text-white"
              >
                ✕
              </button>
            </div>
            <Plot
              data={chart.config.data}
              layout={{
                ...chart.config.layout,
                autosize: true,
                margin: { t: 40, r: 20, b: 40, l: 50 },
              }}
              config={{ responsive: true }}
              useResizeHandler
              style={{ width: '100%', height: '450px' }}
            />
            <p className="mt-3 text-sm text-[var(--color-text-secondary)]">
              Prompt: "{chart.prompt}"
            </p>
          </div>
        </div>
      )}
      {/* Group manager modal */}
      {showGroupManager && (
        <GroupManager chart={chart} onClose={() => setShowGroupManager(false)} />
      )}
    </>
  );
}
