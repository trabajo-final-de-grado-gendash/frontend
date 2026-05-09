import { useState } from 'react';
import { useChartStore } from '../../hooks/useChartStore';
import { Plus, X, Loader2, FolderOpen } from '../../layouts/icons';

interface ProjectManagerProps {
  /** Modo compacto: solo muestra el botón '+' sin el listado de proyectos */
  compact?: boolean;
}

export default function ProjectManager({ compact = false }: ProjectManagerProps) {
  const {
    projects,
    createProject,
    isLoading,
    error,
    clearError,
  } = useChartStore();

  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const handleCreate = async () => {
    if (!newName.trim()) return;
    const success = await createProject(newName, newDesc);
    if (success) {
      setIsAdding(false);
      setNewName('');
      setNewDesc('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleCreate();
    if (e.key === 'Escape') { setIsAdding(false); setNewName(''); setNewDesc(''); }
  };

  if (compact) {
    return (
      <div className="relative">
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-1.5 rounded-full border border-[var(--color-border)] px-3 py-1 text-xs font-medium text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
          title="Nuevo proyecto"
          id="gallery-new-project"
        >
          {isAdding ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          {isAdding ? 'Cancelar' : 'Nuevo proyecto'}
        </button>

        {isAdding && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setIsAdding(false)} />
            <div className="absolute right-0 top-full z-20 mt-2 w-64 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-sidebar)] p-3 shadow-xl">
              <p className="mb-2 text-xs font-semibold text-[var(--color-text-primary)]">Nuevo proyecto</p>
              <div className="space-y-2">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Nombre del proyecto"
                  className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-input)] px-3 py-1.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:border-[var(--color-primary)] focus:outline-none"
                  autoFocus
                  id="new-project-name"
                />
                <input
                  type="text"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Descripción (opcional)"
                  className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-input)] px-3 py-1.5 text-xs text-[var(--color-text-secondary)] placeholder:text-[var(--color-text-secondary)] focus:border-[var(--color-primary)] focus:outline-none"
                  id="new-project-desc"
                />
                <button
                  onClick={handleCreate}
                  disabled={isLoading || !newName.trim()}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-[var(--color-primary)] py-1.5 text-xs font-medium text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
                  id="new-project-submit"
                >
                  {isLoading && <Loader2 className="h-3 w-3 animate-spin" />}
                  {isLoading ? 'Creando...' : 'Crear Proyecto'}
                </button>
                {error && <p className="text-[10px] text-[var(--color-error)] cursor-pointer" onClick={clearError}>{error}</p>}
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // Modo completo (sidebar original)
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
          <FolderOpen className="h-4 w-4" />
          Proyectos
        </h3>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="p-1 text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors"
          title="Nuevo proyecto"
        >
          {isAdding ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        </button>
      </div>

      {isAdding && (
        <div className="space-y-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-input)] p-3">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nombre del proyecto"
            className="w-full bg-transparent text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:outline-none"
            autoFocus
          />
          <textarea
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            placeholder="Descripción (opcional)"
            className="w-full bg-transparent text-xs text-[var(--color-text-secondary)] placeholder:text-[var(--color-text-secondary)] focus:outline-none resize-none"
            rows={2}
          />
          <button
            onClick={handleCreate}
            disabled={isLoading || !newName.trim()}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-[var(--color-primary)] py-1.5 text-xs font-medium text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
          >
            {isLoading && <Loader2 className="h-3 w-3 animate-spin" />}
            {isLoading ? 'Creando...' : 'Crear Proyecto'}
          </button>
          {error && <p className="text-[10px] text-[var(--color-error)]" onClick={clearError}>{error}</p>}
        </div>
      )}

      <div className="space-y-1">
        {projects.length === 0 && !isLoading && (
          <p className="text-xs text-[var(--color-text-secondary)] italic px-1">
            No hay proyectos creados.
          </p>
        )}
        {projects.map((p) => (
          <div
            key={p.id}
            className="group flex items-center justify-between rounded-lg px-2 py-1.5 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-input)] hover:text-[var(--color-text-primary)] transition-all cursor-default"
          >
            <span className="truncate">{p.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
