import { create } from 'zustand';
import type { ChartAsset, ChartGroup } from '../models/types';
import { MockChartService } from '../services/repositories/MockChartService';
import type { IChartService, ChartMetadataUpdate } from '../services/interfaces';

const chartService: IChartService = new MockChartService();

interface ChartState {
  charts: ChartAsset[];
  groups: ChartGroup[];
  selectedGroupId: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchCharts: () => Promise<void>;
  fetchGroups: () => Promise<void>;
  getChartById: (id: string) => Promise<ChartAsset | null>;
  updateChartMetadata: (chartId: string, updates: ChartMetadataUpdate) => Promise<ChartAsset | null>;
  filterByGroup: (groupId: string | null) => void;
  createGroup: (name: string, description?: string) => Promise<ChartGroup | null>;
  assignChartToGroup: (chartId: string, groupId: string) => Promise<void>;
  removeChartFromGroup: (chartId: string) => Promise<void>;
  clearError: () => void;
}

export const useChartStore = create<ChartState>((set) => ({
  charts: [],
  groups: [],
  selectedGroupId: null,
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

  fetchGroups: async () => {
    try {
      const groups = await chartService.getGroups();
      set({ groups });
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

  filterByGroup: (groupId: string | null) => {
    set({ selectedGroupId: groupId });
  },

  createGroup: async (name: string, description?: string) => {
    set({ isLoading: true, error: null });
    try {
      const group = await chartService.createGroup(name, description);
      const groups = await chartService.getGroups();
      set({ groups, isLoading: false });
      return group;
    } catch (e) {
      set({ error: (e as Error).message, isLoading: false });
      return null;
    }
  },

  assignChartToGroup: async (chartId: string, groupId: string) => {
    try {
      await chartService.assignChartToGroup(chartId, groupId);
      const charts = await chartService.getAllCharts();
      set({ charts });
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },

  removeChartFromGroup: async (chartId: string) => {
    try {
      await chartService.removeChartFromGroup(chartId);
      const charts = await chartService.getAllCharts();
      set({ charts });
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },

  clearError: () => set({ error: null }),
}));
