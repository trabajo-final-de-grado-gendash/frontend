import { useState } from 'react';
import { useChartStore } from '../../hooks/useChartStore';
import type { ChartAsset } from '../../models/types';
import { FolderPlus } from '../../layouts/icons';

interface GroupManagerProps {
  chart: ChartAsset;
  onClose: () => void;
}

export default function GroupManager({ chart, onClose }: GroupManagerProps) {
  const { groups, fetchGroups, createGroup, assignChartToGroup, removeChartFromGroup } =
    useChartStore();
  const [newGroupName, setNewGroupName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;
    setIsCreating(true);
    const group = await createGroup(newGroupName.trim());
    if (group) {
      await assignChartToGroup(chart.id, group.id);
      await fetchGroups();
    }
    setNewGroupName('');
    setIsCreating(false);
    onClose();
  };

  const handleAssign = async (groupId: string) => {
    await assignChartToGroup(chart.id, groupId);
    onClose();
  };

  const handleRemove = async () => {
    await removeChartFromGroup(chart.id);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-[var(--color-bg-card)] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-4 text-base font-bold">Asignar grupo</h3>
        <p className="mb-3 text-xs text-[var(--color-text-secondary)] truncate">
          Gráfico: {chart.title}
        </p>

        {/* Existing groups */}
        <div className="mb-4 flex flex-col gap-1">
          {chart.groupId && (
            <button
              onClick={handleRemove}
              className="rounded-lg bg-red-900/30 px-3 py-2 text-left text-sm text-[var(--color-error)] hover:bg-red-900/50"
            >
              ✕ Quitar del grupo actual
            </button>
          )}
          {groups.map((g) => (
            <button
              key={g.id}
              onClick={() => handleAssign(g.id)}
              className={`rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                chart.groupId === g.id
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'bg-[var(--color-bg-input)] text-[var(--color-text-secondary)] hover:text-white'
              }`}
            >
              {g.name}
            </button>
          ))}
        </div>

        {/* Create new group */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="Nombre del nuevo grupo"
            className="flex-1 rounded-lg bg-[var(--color-bg-input)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
            onKeyDown={(e) => e.key === 'Enter' && handleCreateGroup()}
          />
          <button
            onClick={handleCreateGroup}
            disabled={isCreating || !newGroupName.trim()}
            className="flex items-center gap-1 rounded-lg bg-[var(--color-primary)] px-3 py-2 text-sm text-white transition-colors hover:bg-[var(--color-primary-hover)] disabled:opacity-40"
          >
            <FolderPlus className="h-4 w-4" />
          </button>
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full rounded-lg bg-[var(--color-bg-input)] py-2 text-sm text-[var(--color-text-secondary)] hover:text-white"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
