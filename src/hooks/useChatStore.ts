import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { ChatSession, ChatMessage, ChartAsset, QuotedChartRef, Plotly, PlotlyChartConfig } from '../models/types';
import { ApiChatService } from '../services/repositories/ApiChatService';
import type { IChatService } from '../services/interfaces';
import { postRegenerateChart } from '../services/repositories/ApiResultService';
import {
  getSessionByIdState,
  saveSessionState,
  saveChartState,
} from '../services/repositories/ApiLocalState';
import { useChartStore } from './useChartStore';


const chatService: IChatService = new ApiChatService();

// ── Utilidades internas ───────────────────────────────────────────────────────

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toPlotlyConfig(value: unknown): PlotlyChartConfig | null {
  if (!isRecord(value)) return null;
  const data = value.data;
  if (!Array.isArray(data)) return null;
  const layout = isRecord(value.layout)
    ? (value.layout as Partial<Plotly.Layout>)
    : undefined;
  return { data: data as Plotly.Data[], layout };
}

function extractChartTitle(config: PlotlyChartConfig, fallbackType: string): string {
  const title = (config.layout as { title?: unknown } | undefined)?.title;
  if (typeof title === 'string' && title.trim()) return title;
  if (title && typeof title === 'object' && 'text' in title) {
    const text = (title as { text?: unknown }).text;
    if (typeof text === 'string' && text.trim()) return text;
  }
  return fallbackType ? `Visualización ${fallbackType}` : 'Visualización regenerada';
}

// ── Store ─────────────────────────────────────────────────────────────────────

interface ChatState {
  sessions: ChatSession[];
  activeSessionId: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchSessions: () => Promise<void>;
  setActiveSession: (id: string) => Promise<void>;
  createSession: (message: string) => Promise<string>;
  sendMessage: (message: string, sessionId?: string) => Promise<ChatMessage | null>;
  regenerateChart: (quotedChart: QuotedChartRef, prompt: string) => Promise<void>;
  clearError: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  sessions: [],
  activeSessionId: null,
  isLoading: false,
  error: null,

  fetchSessions: async () => {
    set({ isLoading: true, error: null });
    try {
      const sessions = await chatService.getSessions();
      set({ sessions, isLoading: false });
    } catch (e) {
      set({ error: (e as Error).message, isLoading: false });
    }
  },

  setActiveSession: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const session = await chatService.getSessionById(id);
      if (session) {
        set({ activeSessionId: id, isLoading: false });
      } else {
        set({ error: 'Sesión no encontrada', isLoading: false });
      }
    } catch (e) {
      set({ error: (e as Error).message, isLoading: false });
    }
  },

  createSession: async (message: string) => {
    set({ isLoading: true, error: null });
    try {
      const session = await chatService.createSession(message);
      const sessions = await chatService.getSessions();
      set({ sessions, activeSessionId: session.id, isLoading: false });
      return session.id;
    } catch (e) {
      set({ error: (e as Error).message, isLoading: false });
      return '';
    }
  },

  sendMessage: async (message: string, sessionId?: string) => {
    const { activeSessionId } = get();
    const targetSessionId = sessionId ?? activeSessionId;

    if (!targetSessionId) {
      set({ error: 'No hay sesión activa' });
      return null;
    }

    set({ isLoading: true, error: null });
    try {
      const assistantMsg = await chatService.sendMessage(targetSessionId, message);
      const sessions = await chatService.getSessions();
      set({ sessions, isLoading: false });
      return assistantMsg;
    } catch (e) {
      set({ error: (e as Error).message, isLoading: false });
      return null;
    }
  },

  /**
   * El backend devuelve el MISMO result_id con el plotly_json actualizado,
   * por lo que actualizar el ChartAsset en local state con ese id hace que
   * TODOS los mensajes del chat que referencien ese chartAssetId se refresquen
   * automáticamente. No se crea un nuevo mensaje de assistant con gráfico.
   *
   * Flujo:
   *  1. Agrega mensaje del usuario con quotedChartRef (indicador estilo reply).
   *  2. Llama a POST /regenerate.
   *  3. Actualiza el ChartAsset existente en local state (mismo id).
   *  4. Refresca el store — el gráfico en el chat original se actualiza solo.
   */
  regenerateChart: async (quotedChart: QuotedChartRef, prompt: string) => {
    const { activeSessionId } = get();
    if (!activeSessionId) {
      set({ error: 'No hay sesión activa' });
      return;
    }

    set({ isLoading: true, error: null });

    const now = new Date();
    const existingSession = getSessionByIdState(activeSessionId);
    if (!existingSession) {
      set({ error: 'Sesión no encontrada', isLoading: false });
      return;
    }

    // 1. Mensaje del usuario con referencia al gráfico citado
    const userMessage: ChatMessage = {
      id: uuidv4(),
      role: 'user',
      content: prompt,
      timestamp: now,
      status: 'success',
      quotedChartRef: { title: quotedChart.title, chartType: quotedChart.chartType },
    };

    const sessionWithUser: ChatSession = {
      ...existingSession,
      messages: [...existingSession.messages, userMessage],
      updatedAt: now,
    };
    saveSessionState(sessionWithUser);

    try {
      // 2. Llamada al backend — devuelve el MISMO result_id
      const response = await postRegenerateChart(quotedChart.resultId, { prompt });

      // 3. Actualizar el ChartAsset con el mismo id en local state.
      //    Todos los <ChartContainer> que usen ese chartId se re-renderizan.
      const plotlyConfig = toPlotlyConfig(response.plotly_json);

      // Preservar el prompt original del chart (el que lo generó inicialmente)
      const originalPrompt =
        existingSession.messages.find((m) => m.chartAssetId === quotedChart.resultId)?.content
        ?? prompt;

      const updatedChart: ChartAsset = {
        id: response.result_id,
        title: plotlyConfig
          ? extractChartTitle(plotlyConfig, response.chart_type)
          : `Visualización ${response.chart_type}`,
        type: response.chart_type ?? quotedChart.chartType,
        config: plotlyConfig ?? { data: [] },
        prompt: originalPrompt,
        createdAt: new Date(),
      };
      saveChartState(updatedChart);               // persiste en ApiLocalState
      useChartStore.getState().directUpdate(updatedChart); // notifica reactivamente a ChartContainer

    } catch (e) {
      // Error visible en el chat (cubre 404 si el result_id no existe en BD)
      const reason = e instanceof Error ? e.message : 'Error al regenerar el gráfico.';

      const currentSession = getSessionByIdState(activeSessionId) ?? sessionWithUser;
      const errorMsg: ChatMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: reason,
        timestamp: new Date(),
        status: 'error',
      };
      saveSessionState({
        ...currentSession,
        messages: [...currentSession.messages, errorMsg],
        updatedAt: errorMsg.timestamp,
      });
    }

    // Refrescar el store con el estado actualizado de local state
    const sessions = await chatService.getSessions();
    set({ sessions, isLoading: false });
  },

  clearError: () => set({ error: null }),
}));
