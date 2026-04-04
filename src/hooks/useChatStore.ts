import { create } from 'zustand';
import type { ChatSession, ChatMessage } from '../models/types';
import { MockChatService } from '../services/repositories/MockChatService';
import type { IChatService } from '../services/interfaces';

const chatService: IChatService = new MockChatService();

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
      set({
        sessions,
        activeSessionId: session.id,
        isLoading: false,
      });
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
      // Refresh sessions to get updated messages
      const sessions = await chatService.getSessions();
      set({ sessions, isLoading: false });
      return assistantMsg;
    } catch (e) {
      set({ error: (e as Error).message, isLoading: false });
      return null;
    }
  },

  clearError: () => set({ error: null }),
}));
