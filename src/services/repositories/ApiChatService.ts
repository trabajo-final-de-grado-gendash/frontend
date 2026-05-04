import { v4 as uuidv4 } from 'uuid';
import type { IChatService } from '../interfaces';
import type { ChatSession, ChatMessage, ChartAsset, Plotly, PlotlyChartConfig } from '../../models/types';
import { apiRequest, ApiRequestError } from './apiClient';
import {
  getSessionByIdState,
  getSessionsState,
  saveChartState,
  saveSessionState,
} from './ApiLocalState';

interface GenerateRequestDto {
  query: string;
  session_id?: string;
}

type GenerateResponseType = 'visualization' | 'clarification' | 'message';

interface GenerateResponseDto {
  response_type: GenerateResponseType;
  session_id: string;
  chart_id?: string | null;
  message?: string | null;
  plotly_json?: Record<string, unknown> | null;
  chart_type?: string | null;
}

interface SessionHistoryItemDto {
  role: 'user' | 'system';
  content: string;
  response_type?: GenerateResponseType | null;
  timestamp: string;
}

interface SessionHistoryResponseDto {
  session_id: string;
  messages: SessionHistoryItemDto[];
}

interface ResultResponseDto {
  chart_id: string;
  query: string;
  plotly_json: Record<string, unknown>;
  chart_type?: string | null;
  created_at: string;
}

function toAssistantErrorContent(reason: string): string {
  return `No pude responder esta consulta.\n\n${reason}`;
}

function buildSessionTitle(content: string): string {
  const trimmed = content.trim();
  if (!trimmed) return 'Nueva conversacion';
  return trimmed.length > 40 ? `${trimmed.slice(0, 40)}...` : trimmed;
}

function mapHistoryRole(role: SessionHistoryItemDto['role']): ChatMessage['role'] {
  return role === 'user' ? 'user' : 'assistant';
}

function extractChartTitle(config: PlotlyChartConfig, fallbackType: string): string {
  const title = (config.layout as { title?: unknown } | undefined)?.title;

  if (typeof title === 'string' && title.trim()) {
    return title;
  }

  if (title && typeof title === 'object' && 'text' in title) {
    const text = (title as { text?: unknown }).text;
    if (typeof text === 'string' && text.trim()) {
      return text;
    }
  }

  return fallbackType ? `Visualizacion ${fallbackType}` : 'Visualizacion generada';
}

function inferChartType(config: PlotlyChartConfig): string {
  const firstTrace = config.data[0] as { type?: unknown } | undefined;
  if (firstTrace && typeof firstTrace.type === 'string' && firstTrace.type.trim()) {
    return firstTrace.type;
  }
  return 'chart';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toPlotlyConfig(value: unknown): PlotlyChartConfig | null {
  if (!isRecord(value)) {
    return null;
  }

  const data = value.data;
  if (!Array.isArray(data)) {
    return null;
  }

  const layoutCandidate = value.layout;
  const layout = isRecord(layoutCandidate)
    ? (layoutCandidate as Partial<Plotly.Layout>)
    : undefined;

  return {
    data: data as Plotly.Data[],
    layout,
  };
}

function toHistoryMessages(items: SessionHistoryItemDto[]): ChatMessage[] {
  return items.map((item) => ({
    id: uuidv4(),
    role: mapHistoryRole(item.role),
    content: item.content,
    timestamp: new Date(item.timestamp),
    status: 'success',
  }));
}

async function fetchChart(chartId: string): Promise<ResultResponseDto | null> {
  try {
    return await apiRequest<ResultResponseDto>(`/api/v1/charts/${chartId}`);
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

export class ApiChatService implements IChatService {
  async getSessions(): Promise<ChatSession[]> {
    return getSessionsState().sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  async getSessionById(id: string): Promise<ChatSession | null> {
    const existing = getSessionByIdState(id);
    if (existing && existing.messages.length > 0) {
      return existing;
    }

    try {
      const history = await apiRequest<SessionHistoryResponseDto>(`/api/v1/sessions/${id}/history`);
      const messages = toHistoryMessages(history.messages);
      const createdAt = messages[0]?.timestamp ?? existing?.createdAt ?? new Date();
      const updatedAt = messages.at(-1)?.timestamp ?? existing?.updatedAt ?? createdAt;
      const firstUserMessage = messages.find((message) => message.role === 'user');

      const session: ChatSession = {
        id: history.session_id,
        title: existing?.title ?? buildSessionTitle(firstUserMessage?.content ?? 'Nueva conversacion'),
        createdAt,
        updatedAt,
        messages,
      };

      saveSessionState(session);
      return session;
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 404) {
        return existing;
      }
      throw error;
    }
  }

  async createSession(initialMessage: string): Promise<ChatSession> {
    const now = new Date();
    const session: ChatSession = {
      id: uuidv4(),
      title: buildSessionTitle(initialMessage),
      createdAt: now,
      updatedAt: now,
      messages: [],
    };

    saveSessionState(session);
    return session;
  }

  async sendMessage(sessionId: string, message: string): Promise<ChatMessage> {
    const now = new Date();
    const existing = getSessionByIdState(sessionId);

    const session: ChatSession = existing ?? {
      id: sessionId,
      title: buildSessionTitle(message),
      createdAt: now,
      updatedAt: now,
      messages: [],
    };

    const userMessage: ChatMessage = {
      id: uuidv4(),
      role: 'user',
      content: message,
      timestamp: now,
      status: 'success',
    };

    const userUpdatedSession: ChatSession = {
      ...session,
      messages: [...session.messages, userMessage],
      updatedAt: now,
    };

    saveSessionState(userUpdatedSession);

    const payload: GenerateRequestDto = {
      query: message,
      session_id: session.id,
    };

    let nextSessionId = session.id;
    let assistantMessage: ChatMessage;

    try {
      const response = await apiRequest<GenerateResponseDto>('/api/v1/generate', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      nextSessionId = response.session_id;

      const chartAsset = await this.buildChartAsset(response, message);

      const assistantContent = response.message?.trim()
        ? response.message
        : chartAsset
          ? `Aqui tienes la visualizacion: **${chartAsset.title}**`
          : 'Respuesta generada por el backend.';

      assistantMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: assistantContent,
        timestamp: new Date(),
        status: 'success',
        chartAssetId: chartAsset?.id,
      };
    } catch (error) {
      const reason = error instanceof Error
        ? error.message
        : 'Ocurrio un error inesperado al contactar la API.';

      assistantMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: toAssistantErrorContent(reason),
        timestamp: new Date(),
        status: 'error',
      };
    }

    const nextSession: ChatSession = {
      ...userUpdatedSession,
      id: nextSessionId,
      messages: [...userUpdatedSession.messages, assistantMessage],
      updatedAt: assistantMessage.timestamp,
    };

    saveSessionState(nextSession);

    return assistantMessage;
  }

  private async buildChartAsset(
    response: GenerateResponseDto,
    prompt: string,
  ): Promise<ChartAsset | null> {
    if (response.response_type !== 'visualization') {
      return null;
    }

    let chartPayload: ResultResponseDto | null = null;
    if (response.chart_id) {
      chartPayload = await fetchChart(response.chart_id);
    }

    const plotlyConfig = toPlotlyConfig(response.plotly_json ?? chartPayload?.plotly_json);
    if (!plotlyConfig) {
      return null;
    }

    const type = response.chart_type ?? chartPayload?.chart_type ?? inferChartType(plotlyConfig);
    const chart: ChartAsset = {
      id: response.chart_id ?? chartPayload?.chart_id ?? uuidv4(),
      title: extractChartTitle(plotlyConfig, type),
      type,
      config: plotlyConfig,
      prompt: chartPayload?.query ?? prompt,
      createdAt: chartPayload?.created_at ? new Date(chartPayload.created_at) : new Date(),
    };

    saveChartState(chart);
    return chart;
  }
}
