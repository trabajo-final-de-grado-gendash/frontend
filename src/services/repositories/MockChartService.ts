import { v4 as uuidv4 } from 'uuid';
import type { IChartService } from '../interfaces';
import type { ChartAsset, ChartGroup } from '../../models/types';
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
