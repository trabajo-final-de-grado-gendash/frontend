import type { ChatSession, ChatMessage, ChartAsset, ChartGroup } from '../models/types';

/**
 * Chat Service Interface.
 * Abstracts all chat operations. Currently implemented by MockChatService.
 * In the future, swap with ApiChatService for real backend integration.
 */
export interface IChatService {
  getSessions(): Promise<ChatSession[]>;
  getSessionById(id: string): Promise<ChatSession | null>;
  createSession(initialMessage: string): Promise<ChatSession>;
  sendMessage(sessionId: string, message: string): Promise<ChatMessage>;
}

/**
 * Chart Service Interface.
 * Abstracts all chart and group operations. Currently implemented by MockChartService.
 * In the future, swap with ApiChartService for real backend integration.
 */
export interface IChartService {
  getAllCharts(): Promise<ChartAsset[]>;
  getChartsByGroup(groupId: string): Promise<ChartAsset[]>;
  getChartById(id: string): Promise<ChartAsset | null>;
  getGroups(): Promise<ChartGroup[]>;
  createGroup(name: string, description?: string): Promise<ChartGroup>;
  assignChartToGroup(chartId: string, groupId: string): Promise<void>;
  removeChartFromGroup(chartId: string): Promise<void>;
}
