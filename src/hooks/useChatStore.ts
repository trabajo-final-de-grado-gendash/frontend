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

// ── Constantes ────────────────────────────────────────────────────────────────

// ── Store ─────────────────────────────────────────────────────────────────────

interface ChatState {
  sessions: ChatSession[];
  activeSessionId: string | null;
  loadingSessions: Record<string, boolean>;
  generatingSessions: Record<string, boolean>;
  error: string | null;

  // Helpers
  isSessionLoading: (sessionId: string) => boolean;
  isSessionGenerating: (sessionId: string) => boolean;

  // Actions
  fetchSessions: () => Promise<void>;
  setActiveSession: (id: string | null) => Promise<void>;
  createSession: (message: string) => Promise<string>;
  sendMessage: (message: string, sessionId?: string) => Promise<ChatMessage | null>;
  regenerateChart: (quotedChart: QuotedChartRef, prompt: string) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  clearError: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  sessions: [],
  activeSessionId: null,
  loadingSessions: {},
  generatingSessions: {},
  error: null,

  isSessionLoading: (sessionId: string) => !!get().loadingSessions[sessionId],
  isSessionGenerating: (sessionId: string) => !!get().generatingSessions[sessionId],

  fetchSessions: async () => {
    set({ error: null });
    try {
      const backendSessions = await chatService.getSessions();
      set((state) => {
        // Conservar sesiones locales que aún no fueron persistidas en el backend
        const backendIds = new Set(backendSessions.map(s => s.id));
        const localOnly = state.sessions.filter(s => !backendIds.has(s.id));
        return { sessions: [...localOnly, ...backendSessions] };
      });
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },

  setActiveSession: async (id: string | null) => {
    set({ activeSessionId: id, error: null });
    if (!id) return;
    
    try {
      const session = await chatService.getSessionById(id);
      if (session) {
        set((state) => ({
          sessions: state.sessions.map(s => s.id === id ? session : s),
        }));
      } else {
        const localSession = get().sessions.find(s => s.id === id);
        if (!localSession) {
          set({ error: 'Sesión no encontrada' });
        }
      }
    } catch (e) {
      const localSession = get().sessions.find(s => s.id === id);
      if (!localSession) {
        set({ error: (e as Error).message });
      }
    }
  },

  createSession: async () => {
    const session = await chatService.createSession();
    set((state) => ({
      sessions: [session, ...state.sessions],
      activeSessionId: session.id,
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
      loadingSessions: { ...state.loadingSessions, [targetSessionId]: true },
      generatingSessions: { ...state.generatingSessions, [targetSessionId]: true },
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
          loadingSessions: { ...state.loadingSessions, [targetSessionId]: false },
          generatingSessions: { ...state.generatingSessions, [targetSessionId]: false },
        }));
        return updatedSession.messages.at(-1) || null;
      }
      set((state) => ({
        loadingSessions: { ...state.loadingSessions, [targetSessionId]: false },
        generatingSessions: { ...state.generatingSessions, [targetSessionId]: false },
      }));
      return null;
    } catch (e) {
      set((state) => ({
        error: (e as Error).message,
        loadingSessions: { ...state.loadingSessions, [targetSessionId]: false },
        generatingSessions: { ...state.generatingSessions, [targetSessionId]: false },
      }));
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
      loadingSessions: { ...state.loadingSessions, [activeSessionId]: true },
      generatingSessions: { ...state.generatingSessions, [activeSessionId]: true },
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
      set((state) => ({
        loadingSessions: { ...state.loadingSessions, [activeSessionId]: false },
        generatingSessions: { ...state.generatingSessions, [activeSessionId]: false },
      }));
    }
  },
  
  deleteSession: async (sessionId: string) => {
    try {
      await chatService.deleteSession(sessionId);
      set((state) => {
        const newSessions = state.sessions.filter((s) => s.id !== sessionId);
        const newActiveId = state.activeSessionId === sessionId ? null : state.activeSessionId;
        return {
          sessions: newSessions,
          activeSessionId: newActiveId,
        };
      });
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },

  clearError: () => set({ error: null }),
}));
