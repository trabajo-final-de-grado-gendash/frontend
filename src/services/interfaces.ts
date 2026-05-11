import type { ChatSession, ChatMessage, ChartAsset, Project } from '../models/types';

export interface ChartMetadataUpdate {
  title: string;
  xAxisTitle: string;
  yAxisTitle: string;
}

/**
 * Chat Service Interface.
 * Abstracts all chat operations.
 */
export interface IChatService {
  getSessions(): Promise<ChatSession[]>;
  getSessionById(id: string): Promise<ChatSession | null>;
  createSession(initialMessage?: string): Promise<ChatSession>;
  sendMessage(sessionId: string, message: string): Promise<ChatMessage>;
}

/**
 * Chart Service Interface.
 * Abstracts all chart and project (folder) operations.
 */
export interface IChartService {
  getAllCharts(): Promise<ChartAsset[]>;
  getChartsByProject(projectId: string): Promise<ChartAsset[]>;
  getChartById(id: string): Promise<ChartAsset | null>;
  getProjects(): Promise<Project[]>;
  updateChartMetadata(chartId: string, updates: ChartMetadataUpdate): Promise<ChartAsset>;
  createProject(name: string, description?: string): Promise<Project>;
  assignChartToProject(chartId: string, projectId: string): Promise<void>;
  removeChartFromProject(chartId: string, projectId: string): Promise<void>;
  deleteProject(projectId: string): Promise<void>;
}
