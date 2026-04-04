import { v4 as uuidv4 } from 'uuid';
import type { IChartService, ChartMetadataUpdate } from '../interfaces';
import type { ChartAsset, ChartGroup, Plotly } from '../../models/types';
import { getMockCharts, setMockCharts } from './MockChatService';

// ---------------------------------------------------------------------------
// In-memory group storage
// ---------------------------------------------------------------------------
let groups: ChartGroup[] = [];

// ---------------------------------------------------------------------------
// MockChartService
// ---------------------------------------------------------------------------
export class MockChartService implements IChartService {
  async getAllCharts(): Promise<ChartAsset[]> {
    return [...getMockCharts()].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
  }

  async getChartsByGroup(groupId: string): Promise<ChartAsset[]> {
    return getMockCharts().filter((c) => c.groupId === groupId);
  }

  async getChartById(id: string): Promise<ChartAsset | null> {
    return getMockCharts().find((c) => c.id === id) ?? null;
  }

  async getGroups(): Promise<ChartGroup[]> {
    return [...groups];
  }

  async updateChartMetadata(chartId: string, updates: ChartMetadataUpdate): Promise<ChartAsset> {
    const allCharts = getMockCharts();
    const chart = allCharts.find((c) => c.id === chartId);

    if (!chart) throw new Error(`Chart ${chartId} not found`);

    const title = updates.title.trim();
    const xAxisTitle = updates.xAxisTitle.trim();
    const yAxisTitle = updates.yAxisTitle.trim();

    if (!title) {
      throw new Error('El título del gráfico es obligatorio');
    }

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

    chart.title = title;
    chart.config = {
      ...chart.config,
      layout,
    };

    setMockCharts([...allCharts]);
    return chart;
  }

  async createGroup(name: string, description?: string): Promise<ChartGroup> {
    const group: ChartGroup = {
      id: uuidv4(),
      name,
      description,
    };
    groups = [...groups, group];
    return group;
  }

  async assignChartToGroup(chartId: string, groupId: string): Promise<void> {
    const allCharts = getMockCharts();
    const chart = allCharts.find((c) => c.id === chartId);
    if (!chart) throw new Error(`Chart ${chartId} not found`);
    chart.groupId = groupId;
    setMockCharts([...allCharts]);
  }

  async removeChartFromGroup(chartId: string): Promise<void> {
    const allCharts = getMockCharts();
    const chart = allCharts.find((c) => c.id === chartId);
    if (!chart) throw new Error(`Chart ${chartId} not found`);
    chart.groupId = undefined;
    setMockCharts([...allCharts]);
  }
}
