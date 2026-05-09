import type { IChartService, ChartMetadataUpdate } from '../interfaces';
import type { ChartAsset, Project, Plotly, PlotlyChartConfig } from '../../models/types';
import { apiRequest } from './apiClient';

interface ChartResponseDto {
  chart_id: string;
  query: string;
  sql: string;
  plotly_json: Record<string, unknown>;
  plotly_code?: string;
  chart_type?: string;
  project_id?: string;
  created_at: string;
}

interface ProjectResponseDto {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

interface ProjectListResponseDto {
  projects: ProjectResponseDto[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toPlotlyConfig(value: unknown): PlotlyChartConfig | null {
  if (!isRecord(value)) return null;
  const data = value.data;
  if (!Array.isArray(data)) return null;
  const layout = isRecord(value.layout) ? (value.layout as Partial<Plotly.Layout>) : undefined;
  return { data: data as Plotly.Data[], layout };
}

function extractChartTitle(config: PlotlyChartConfig, fallbackType: string): string {
  const title = (config.layout as { title?: unknown } | undefined)?.title;
  if (typeof title === 'string' && title.trim()) return title;
  if (title && typeof title === 'object' && 'text' in title) {
    const text = (title as { text?: unknown }).text;
    if (typeof text === 'string' && text.trim()) return text;
  }
  return fallbackType ? `Visualización ${fallbackType}` : 'Visualización generada';
}

function mapDtoToAsset(dto: ChartResponseDto): ChartAsset {
  const config = toPlotlyConfig(dto.plotly_json) || { data: [] };
  return {
    id: dto.chart_id,
    title: extractChartTitle(config, dto.chart_type || 'Gráfico'),
    type: dto.chart_type || 'bar',
    config,
    prompt: dto.query,
    createdAt: new Date(dto.created_at),
    projectId: dto.project_id,
  };
}

export class ApiChartService implements IChartService {
  async getAllCharts(): Promise<ChartAsset[]> {
    const response = await apiRequest<ChartResponseDto[]>('/api/v1/charts');
    return response.map(mapDtoToAsset);
  }

  async getChartsByProject(projectId: string): Promise<ChartAsset[]> {
    const response = await apiRequest<ChartResponseDto[]>(`/api/v1/projects/${projectId}/charts`);
    return response.map(mapDtoToAsset);
  }

  async getChartById(id: string): Promise<ChartAsset | null> {
    try {
      const response = await apiRequest<ChartResponseDto>(`/api/v1/charts/${id}`);
      return mapDtoToAsset(response);
    } catch {
      return null;
    }
  }

  async getProjects(): Promise<Project[]> {
    const response = await apiRequest<ProjectListResponseDto>('/api/v1/projects');
    return response.projects.map((p) => ({
      id: p.id,
      name: p.name,
    }));
  }

  async updateChartMetadata(chartId: string, updates: ChartMetadataUpdate): Promise<ChartAsset> {
    // El backend ya tiene un endpoint para esto: PATCH /api/v1/charts/{id}/metadata
    // Este método lo invocará el store o el componente directamente.
    // Aquí implementamos la lógica para cumplir con la interfaz.
    const payload = {
      title: updates.title,
      xaxis_title: updates.xAxisTitle,
      yaxis_title: updates.yAxisTitle,
    };
    
    await apiRequest<{ chart_id: string; plotly_json: Record<string, unknown> }>(
      `/api/v1/charts/${chartId}/metadata`,
      {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }
    );

    // Obtenemos el chart completo de nuevo para asegurar consistencia
    const updated = await this.getChartById(chartId);
    if (!updated) throw new Error('Failed to retrieve updated chart');
    return updated;
  }

  async createProject(name: string, description?: string): Promise<Project> {
    const response = await apiRequest<ProjectResponseDto>('/api/v1/projects', {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    });
    return {
      id: response.id,
      name: response.name,
      description: undefined, // El DTO backend no tiene descripción en la respuesta simple
    };
  }

  async assignChartToProject(chartId: string, projectId: string): Promise<void> {
    await apiRequest(`/api/v1/projects/${projectId}/charts/${chartId}`, {
      method: 'POST',
    });
  }

  async removeChartFromProject(chartId: string, projectId: string): Promise<void> {
    await apiRequest(`/api/v1/projects/${projectId}/charts/${chartId}`, {
      method: 'DELETE',
    });
  }

  async deleteProject(projectId: string): Promise<void> {
    await apiRequest(`/api/v1/projects/${projectId}`, {
      method: 'DELETE',
    });
  }
}
