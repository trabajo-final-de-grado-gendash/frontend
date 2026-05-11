import { create } from 'zustand';
import type { ChartAsset, Project } from '../models/types';
import { ApiChartService } from '../services/repositories/ApiChartService';
import type { IChartService, ChartMetadataUpdate } from '../services/interfaces';

const chartService: IChartService = new ApiChartService();

interface ChartState {
  charts: ChartAsset[];
  projects: Project[];
  selectedProjectId: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchCharts: () => Promise<void>;
  fetchProjects: () => Promise<void>;
  getChartById: (id: string) => Promise<ChartAsset | null>;
  updateChartMetadata: (chartId: string, updates: ChartMetadataUpdate) => Promise<ChartAsset | null>;
  filterByProject: (projectId: string | null) => void;
  createProject: (name: string, description?: string) => Promise<Project | null>;
  deleteProject: (projectId: string) => Promise<void>;
  assignChartToProject: (chartId: string, projectId: string) => Promise<void>;
  removeChartFromProject: (chartId: string, projectId: string) => Promise<void>;
  /** Actualiza un ChartAsset en el store Zustand reactivamente. */
  directUpdate: (chart: ChartAsset) => void;
  clearError: () => void;
}

export const useChartStore = create<ChartState>((set, get) => ({
  charts: [],
  projects: [],
  selectedProjectId: null,
  isLoading: false,
  error: null,

  fetchCharts: async () => {
    set({ isLoading: true, error: null });
    try {
      const charts = await chartService.getAllCharts();
      set({ charts, isLoading: false });
    } catch (e) {
      set({ error: (e as Error).message, isLoading: false });
    }
  },

  fetchProjects: async () => {
    try {
      const projects = await chartService.getProjects();
      set({ projects });
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },

  getChartById: async (id: string) => {
    try {
      return await chartService.getChartById(id);
    } catch {
      return null;
    }
  },

  updateChartMetadata: async (chartId: string, updates: ChartMetadataUpdate) => {
    set({ isLoading: true, error: null });
    try {
      const updatedChart = await chartService.updateChartMetadata(chartId, updates);
      const charts = await chartService.getAllCharts();
      set({ charts, isLoading: false });
      return updatedChart;
    } catch (e) {
      set({ error: (e as Error).message, isLoading: false });
      return null;
    }
  },

  filterByProject: (projectId: string | null) => {
    set({ selectedProjectId: projectId });
  },

  createProject: async (name: string, description?: string) => {
    set({ isLoading: true, error: null });
    try {
      const project = await chartService.createProject(name, description);
      await get().fetchProjects();
      set({ isLoading: false });
      return project;
    } catch (e) {
      set({ error: (e as Error).message, isLoading: false });
      return null;
    }
  },

  assignChartToProject: async (chartId: string, projectId: string) => {
    try {
      await chartService.assignChartToProject(chartId, projectId);
      await get().fetchCharts();
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },

  removeChartFromProject: async (chartId: string, projectId: string) => {
    try {
      await chartService.removeChartFromProject(chartId, projectId);
      await get().fetchCharts();
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },

  deleteProject: async (projectId: string) => {
    set({ isLoading: true, error: null });
    try {
      await chartService.deleteProject(projectId);
      // Quitar proyecto del estado local y limpiar filtro si era el seleccionado
      set((state) => ({
        projects: state.projects.filter((p) => p.id !== projectId),
        selectedProjectId: state.selectedProjectId === projectId ? null : state.selectedProjectId,
        // Actualizar charts: los charts de ese proyecto quedan sin proyecto
        charts: state.charts.map((c) =>
          c.projectId === projectId ? { ...c, projectId: undefined } : c
        ),
        isLoading: false,
      }));
    } catch (e) {
      set({ error: (e as Error).message, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),

  directUpdate: (chart: ChartAsset) => {
    set((state) => {
      const idx = state.charts.findIndex((c) => c.id === chart.id);
      if (idx === -1) {
        return { charts: [...state.charts, chart] };
      }
      const next = [...state.charts];
      next[idx] = chart;
      return { charts: next };
    });
  },
}));
