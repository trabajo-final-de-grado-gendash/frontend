import { v4 as uuidv4 } from 'uuid';
import type { IChartService, ChartMetadataUpdate } from '../interfaces';
import type { ChartAsset, ChartGroup, Plotly } from '../../models/types';
import {
  getChartByIdState,
  getChartsState,
  getGroupsState,
  saveChartsState,
  saveGroupsState,
} from './ApiLocalState';

export class ApiChartService implements IChartService {
  async getAllCharts(): Promise<ChartAsset[]> {
    return getChartsState().sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getChartsByGroup(groupId: string): Promise<ChartAsset[]> {
    return getChartsState().filter((chart) => chart.groupId === groupId);
  }

  async getChartById(id: string): Promise<ChartAsset | null> {
    return getChartByIdState(id);
  }

  async getGroups(): Promise<ChartGroup[]> {
    return getGroupsState();
  }

  async updateChartMetadata(chartId: string, updates: ChartMetadataUpdate): Promise<ChartAsset> {
    const allCharts = getChartsState();
    const chartIndex = allCharts.findIndex((chart) => chart.id === chartId);

    if (chartIndex === -1) {
      throw new Error(`Chart ${chartId} not found`);
    }

    const title = updates.title.trim();
    const xAxisTitle = updates.xAxisTitle.trim();
    const yAxisTitle = updates.yAxisTitle.trim();

    if (!title) {
      throw new Error('El titulo del grafico es obligatorio');
    }

    const chart = allCharts[chartIndex];
    const layout = { ...(chart.config.layout ?? {}) } as Partial<Plotly.Layout>;
    const xaxis = (layout.xaxis ?? {}) as Partial<Plotly.LayoutAxis>;
    const yaxis = (layout.yaxis ?? {}) as Partial<Plotly.LayoutAxis>;

    layout.title = { text: title };

    const nextXAxis = { ...xaxis } as Partial<Plotly.LayoutAxis>;
    const nextYAxis = { ...yaxis } as Partial<Plotly.LayoutAxis>;

    if (xAxisTitle) {
      nextXAxis.title = { text: xAxisTitle, standoff: 10 };
      nextXAxis.automargin = true;
    } else {
      delete (nextXAxis as { title?: unknown }).title;
    }

    if (yAxisTitle) {
      nextYAxis.title = { text: yAxisTitle, standoff: 10 };
      nextYAxis.automargin = true;
    } else {
      delete (nextYAxis as { title?: unknown }).title;
    }

    layout.xaxis = nextXAxis;
    layout.yaxis = nextYAxis;

    const updatedChart: ChartAsset = {
      ...chart,
      title,
      config: {
        ...chart.config,
        layout,
      },
    };

    const nextCharts = [...allCharts];
    nextCharts[chartIndex] = updatedChart;
    saveChartsState(nextCharts);

    return updatedChart;
  }

  async createGroup(name: string, description?: string): Promise<ChartGroup> {
    const trimmedName = name.trim();
    if (!trimmedName) {
      throw new Error('El nombre del grupo es obligatorio');
    }

    const group: ChartGroup = {
      id: uuidv4(),
      name: trimmedName,
      description: description?.trim() || undefined,
    };

    const groups = getGroupsState();
    saveGroupsState([...groups, group]);
    return group;
  }

  async assignChartToGroup(chartId: string, groupId: string): Promise<void> {
    const charts = getChartsState();
    const index = charts.findIndex((chart) => chart.id === chartId);

    if (index === -1) {
      throw new Error(`Chart ${chartId} not found`);
    }

    const nextCharts = [...charts];
    nextCharts[index] = {
      ...nextCharts[index],
      groupId,
    };

    saveChartsState(nextCharts);
  }

  async removeChartFromGroup(chartId: string): Promise<void> {
    const charts = getChartsState();
    const index = charts.findIndex((chart) => chart.id === chartId);

    if (index === -1) {
      throw new Error(`Chart ${chartId} not found`);
    }

    const nextCharts = [...charts];
    nextCharts[index] = {
      ...nextCharts[index],
      groupId: undefined,
    };

    saveChartsState(nextCharts);
  }
}
