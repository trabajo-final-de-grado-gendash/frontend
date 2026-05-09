import { v4 as uuidv4 } from 'uuid';
import type { IChatService } from '../interfaces';
import type { ChatSession, ChatMessage, ChartAsset, PlotlyChartConfig } from '../../models/types';
import type Plotly from 'plotly.js';
import { apiRequest, ApiRequestError } from './apiClient';
import { useChartStore } from '../../hooks/useChartStore';


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

interface SessionSummaryDto {
  session_id: string;
  title: string;
  created_at: string;
}

interface SessionListResponseDto {
  sessions: SessionSummaryDto[];
}

interface SessionHistoryItemDto {
  role: 'user' | 'system';
  content: string;
  response_type?: GenerateResponseType | null;
  timestamp: string;
  chart_id?: string | null;
  plotly_json?: Record<string, unknown> | null;
}

interface SessionHistoryResponseDto {
  session_id: string;
  messages: SessionHistoryItemDto[];
}

function toAssistantErrorContent(reason: string): string {
  return `No pude responder esta consulta.\n\n${reason}`;
}

function mapHistoryItemToMessage(item: SessionHistoryItemDto): ChatMessage {
  return {
    id: uuidv4(),
    role: item.role === 'user' ? 'user' : 'assistant',
    content: item.content,
    timestamp: new Date(item.timestamp),
    status: 'success',
    chartAssetId: item.chart_id ?? undefined,
  };
}

/** Convierte un item del historial con plotly_json en un ChartAsset para pre-poblar el store */
function mapHistoryItemToChartAsset(item: SessionHistoryItemDto): ChartAsset | null {
  if (!item.chart_id || !item.plotly_json) return null;
  const raw = item.plotly_json;
  const data = Array.isArray(raw.data) ? (raw.data as Plotly.Data[]) : [];
  const layout = (raw.layout && typeof raw.layout === 'object')
    ? (raw.layout as Partial<Plotly.Layout>)
    : undefined;
  const config: PlotlyChartConfig = { data, layout };
  const title = typeof (layout as { title?: unknown } | undefined)?.title === 'string'
    ? (layout as { title: string }).title
    : String((layout as { title?: { text?: unknown } } | undefined)?.title?.text ?? '');
  return {
    id: item.chart_id,
    title: title || 'Visualización',
    type: 'bar', // El tipo real está en la tabla charts pero no viene en el historial; no es crítico para render
    config,
    prompt: '',
    createdAt: new Date(item.timestamp),
  };
}

export class ApiChatService implements IChatService {
  async getSessions(): Promise<ChatSession[]> {
    try {
      const response = await apiRequest<SessionListResponseDto>('/api/v1/sessions');
      return response.sessions.map((s) => ({
        id: s.session_id,
        title: s.title,
        createdAt: new Date(s.created_at),
        updatedAt: new Date(s.created_at), // Backend doesn't have updatedAt for session summary yet
        messages: [],
      }));
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
      return [];
    }
  }

  async getSessionById(id: string): Promise<ChatSession | null> {
    try {
      const history = await apiRequest<SessionHistoryResponseDto>(`/api/v1/sessions/${id}/history`);
      const messages = history.messages.map(mapHistoryItemToMessage);

      // Bug 2: Pre-poblar el chart store con los charts del historial
      // Esto evita que cada ChartContainer haga un fetch individual a /api/v1/charts/{id}
      history.messages.forEach((item) => {
        const asset = mapHistoryItemToChartAsset(item);
        if (asset) useChartStore.getState().directUpdate(asset);
      });

      return {
        id: history.session_id,
        title: messages.find(m => m.role === 'user')?.content.slice(0, 40) || 'Sesión',
        createdAt: messages[0]?.timestamp ?? new Date(),
        updatedAt: messages.at(-1)?.timestamp ?? new Date(),
        messages,
      };
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 404) return null;
      throw error;
    }
  }

  async createSession(): Promise<ChatSession> {
    const id = uuidv4();
    const now = new Date();
    return {
      id,
      title: 'Nueva Sesión',
      createdAt: now,
      updatedAt: now,
      messages: [],
    };
  }

  async sendMessage(sessionId: string, message: string): Promise<ChatMessage> {
    const payload: GenerateRequestDto = {
      query: message,
      session_id: sessionId,
    };

    try {
      const response = await apiRequest<GenerateResponseDto>('/api/v1/generate', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      // Si es una visualización, el store se encargará de refrescar los charts
      // El mensaje que devolvemos aquí es para actualizar la UI inmediatamente
      return {
        id: uuidv4(),
        role: 'assistant',
        content: response.message || 'Procesado correctamente.',
        timestamp: new Date(),
        status: 'success',
        chartAssetId: response.chart_id || undefined,
      };
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Error de comunicación con el servidor.';
      return {
        id: uuidv4(),
        role: 'assistant',
        content: toAssistantErrorContent(reason),
        timestamp: new Date(),
        status: 'error',
      };
    }
  }
}
