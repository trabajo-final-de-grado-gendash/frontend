import type { IChartService, ChartMetadataUpdate } from '../interfaces';
import type { ChartAsset, Project, Plotly } from '../../models/types';

let charts: ChartAsset[] = [];
let projects: Project[] = [];

// MockChartService
// This service is kept for testing purposes only. It is NOT used in production.
export class MockChartService implements IChartService {
  async getAllCharts(): Promise<ChartAsset[]> {
    return charts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getChartsByProject(projectId: string): Promise<ChartAsset[]> {
    return charts.filter((c) => c.projectId === projectId);
  }

  async getChartById(id: string): Promise<ChartAsset | null> {
    return charts.find((c) => c.id === id) ?? null;
  }

  async getProjects(): Promise<Project[]> {
    return projects;
  }

  async updateChartMetadata(chartId: string, updates: ChartMetadataUpdate): Promise<ChartAsset> {
    const chart = charts.find((c) => c.id === chartId);
    if (!chart) throw new Error('Chart not found');
    const updatedLayout = {
      ...chart.config.layout,
      title: updates.title,
      xaxis: { ...(chart.config.layout?.xaxis as object | undefined), title: updates.xAxisTitle },
      yaxis: { ...(chart.config.layout?.yaxis as object | undefined), title: updates.yAxisTitle },
    } as Partial<Plotly.Layout>;
    const updated = { ...chart, title: updates.title, config: { ...chart.config, layout: updatedLayout } };
    charts = charts.map((c) => (c.id === chartId ? updated : c));
    return updated;
  }

  async createProject(name: string, description?: string): Promise<Project> {
    const project: Project = { id: crypto.randomUUID(), name, description };
    projects = [...projects, project];
    return project;
  }

  async assignChartToProject(chartId: string, projectId: string): Promise<void> {
    charts = charts.map((c) => (c.id === chartId ? { ...c, projectId } : c));
  }

  async removeChartFromProject(chartId: string, _projectId: string): Promise<void> {
    charts = charts.map((c) => (c.id === chartId ? { ...c, projectId: undefined } : c));
  }

  async deleteProject(projectId: string): Promise<void> {
    projects = projects.filter((p) => p.id !== projectId);
    charts = charts.map((c) => (c.projectId === projectId ? { ...c, projectId: undefined } : c));
  }
}
