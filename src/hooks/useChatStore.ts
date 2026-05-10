import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { ChatSession, ChatMessage, ChartAsset, QuotedChartRef, Plotly, PlotlyChartConfig } from '../models/types';
import { ApiChatService } from '../services/repositories/ApiChatService';
import type { IChatService } from '../services/interfaces';
import { postRegenerateChart } from '../services/repositories/ApiResultService';
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
  isGenerating: boolean;
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
  isGenerating: false,
  error: null,

  fetchSessions: async () => {
    set({ error: null });
    try {
      const sessions = await chatService.getSessions();
      set({ sessions });
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },

  setActiveSession: async (id: string) => {
    set({ activeSessionId: id, error: null });
    // No ponemos isLoading: true aquí para evitar el parpadeo de la burbuja "Generando..."
    // al entrar a un chat viejo.
    try {
      const session = await chatService.getSessionById(id);
      if (session) {
        set((state) => ({
          sessions: state.sessions.map(s => s.id === id ? session : s),
          isLoading: false
        }));
      } else {
        // Sesión nueva: existe localmente pero aún no fue persistida en el backend
        // (lazy creation — el backend la creará al primer generate)
        const localSession = get().sessions.find(s => s.id === id);
        if (localSession) {
          set({ isLoading: false });
        } else {
          set({ error: 'Sesión no encontrada', isLoading: false });
        }
      }
    } catch (e) {
      // Si es un 404, verificar si existe localmente
      const localSession = get().sessions.find(s => s.id === id);
      if (localSession) {
        set({ isLoading: false });
      } else {
        set({ error: (e as Error).message, isLoading: false });
      }
    }
  },

  createSession: async (_message?: string) => {
    // Generación puramente local (lazy)
    const session = await chatService.createSession();
    set((state) => ({
      sessions: [session, ...state.sessions],
      activeSessionId: session.id,
      isLoading: false
    }));
    return session.id;
  },

  sendMessage: async (message: string, sessionId?: string) => {
    const { activeSessionId } = get();
    const targetSessionId = sessionId ?? activeSessionId;

    if (!targetSessionId) {
      set({ error: 'No hay sesión activa' });
      return null;
    }

    // --- Actualización optimista del mensaje del usuario ---
    const now = new Date();
    const optimisticUserMessage: ChatMessage = {
      id: `optimistic-${uuidv4()}`,
      role: 'user',
      content: message,
      timestamp: now,
      status: 'success',
    };

    set((state) => ({
      sessions: state.sessions.map(s =>
        s.id === targetSessionId
          ? { ...s, messages: [...s.messages, optimisticUserMessage], updatedAt: now }
          : s
      ),
      isLoading: true,
      isGenerating: true,
      error: null
    }));
    // --------------------------------------------------------

    try {
      await chatService.sendMessage(targetSessionId, message);
      // Refrescamos la sesión completa desde el backend para tener el historial oficial
      const updatedSession = await chatService.getSessionById(targetSessionId);
      if (updatedSession) {
        set((state) => ({
          sessions: state.sessions.map(s => s.id === targetSessionId ? updatedSession : s),
          isLoading: false,
          isGenerating: false
        }));
        return updatedSession.messages.at(-1) || null;
      }
      set({ isLoading: false, isGenerating: false });
      return null;
    } catch (e) {
      set({ error: (e as Error).message, isLoading: false, isGenerating: false });
      return null;
    }
  },

  regenerateChart: async (quotedChart: QuotedChartRef, prompt: string) => {
    const { activeSessionId } = get();
    if (!activeSessionId) {
      set({ error: 'No hay sesión activa' });
      return;
    }

    // --- Actualización optimista del mensaje del usuario con la cita ---
    const now = new Date();
    const optimisticUserMessage: ChatMessage = {
      id: `optimistic-${uuidv4()}`,
      role: 'user',
      content: prompt,
      timestamp: now,
      status: 'success',
      quotedChartRef: {
        chartId: quotedChart.chartId,
        chartType: quotedChart.chartType,
        title: quotedChart.title
      }
    };

    set((state) => ({
      sessions: state.sessions.map(s =>
        s.id === activeSessionId
          ? { ...s, messages: [...s.messages, optimisticUserMessage], updatedAt: now }
          : s
      ),
      isLoading: true,
      isGenerating: true,
      error: null
    }));
    // --------------------------------------------------------------------

    try {
      // 1. Llamada al backend — devuelve el MISMO chart_id actualizado
      const response = await postRegenerateChart(quotedChart.chartId, { 
        prompt, 
        session_id: activeSessionId 
      });

      // 2. Actualizar el ChartAsset en el store PRIMERO (in-place)
      //    Así el chart del mensaje original se actualiza visualmente de inmediato
      const plotlyConfig = toPlotlyConfig(response.plotly_json);
      const updatedChart: ChartAsset = {
        id: response.chart_id,
        title: plotlyConfig
          ? extractChartTitle(plotlyConfig, response.chart_type)
          : `Visualización ${response.chart_type}`,
        type: response.chart_type ?? quotedChart.chartType,
        config: plotlyConfig ?? { data: [] },
        prompt: prompt,
        createdAt: new Date(),
      };
      useChartStore.getState().directUpdate(updatedChart);

      // 3. Refrescar la sesión DESPUÉS — trae el nuevo mensaje de texto descriptivo
      //    (el backend ya no guarda chart_id en el mensaje del regenerate)
      const updatedSession = await chatService.getSessionById(activeSessionId);
      if (updatedSession) {
        set((state) => ({
          sessions: state.sessions.map(s => s.id === activeSessionId ? updatedSession : s),
        }));
      }

    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Error al regenerar el gráfico.' });
    } finally {
      set({ isLoading: false, isGenerating: false });
    }
  },

  clearError: () => set({ error: null }),
}));
