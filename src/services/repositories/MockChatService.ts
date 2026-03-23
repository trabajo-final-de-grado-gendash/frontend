import { v4 as uuidv4 } from 'uuid';
import type { IChatService } from '../interfaces';
import type { ChatSession, ChatMessage, ChartAsset } from '../../models/types';

// ---------------------------------------------------------------------------
// Mock chart configs that the "AI" will return
// ---------------------------------------------------------------------------
const MOCK_CHART_CONFIGS: Pick<ChartAsset, 'title' | 'type' | 'config'>[] = [
  {
    title: 'Ventas por Región',
    type: 'bar',
    config: {
      data: [
        {
          x: ['Norte', 'Sur', 'Este', 'Oeste'],
          y: [4200, 3100, 2700, 3800],
          type: 'bar' as const,
          marker: { color: ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd'] },
        },
      ],
      layout: {
        title: { text: 'Ventas por Región (Q1 2026)' },
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        font: { color: '#f8fafc' },
      },
    },
  },
  {
    title: 'Tendencia Mensual',
    type: 'line',
    config: {
      data: [
        {
          x: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
          y: [1200, 1900, 3000, 2500, 3200, 4100],
          type: 'scatter' as const,
          mode: 'lines+markers' as const,
          marker: { color: '#22c55e' },
          line: { shape: 'spline' as const },
        },
      ],
      layout: {
        title: { text: 'Tendencia de Ingresos Mensuales' },
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        font: { color: '#f8fafc' },
      },
    },
  },
  {
    title: 'Distribución por Categoría',
    type: 'pie',
    config: {
      data: [
        {
          labels: ['Electrónica', 'Ropa', 'Alimentos', 'Hogar'],
          values: [35, 25, 20, 20],
          type: 'pie' as const,
          marker: { colors: ['#6366f1', '#8b5cf6', '#22c55e', '#f59e0b'] },
        },
      ],
      layout: {
        title: { text: 'Distribución de Ventas por Categoría' },
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        font: { color: '#f8fafc' },
      },
    },
  },
];

// ---------------------------------------------------------------------------
// In-memory storage
// ---------------------------------------------------------------------------
let sessions: ChatSession[] = [];
let charts: ChartAsset[] = [];

/** Expose charts array for MockChartService */
export function getMockCharts(): ChartAsset[] {
  return charts;
}

export function setMockCharts(c: ChartAsset[]): void {
  charts = c;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function pickRandomChart(): Pick<ChartAsset, 'title' | 'type' | 'config'> {
  return MOCK_CHART_CONFIGS[Math.floor(Math.random() * MOCK_CHART_CONFIGS.length)];
}

// ---------------------------------------------------------------------------
// MockChatService
// ---------------------------------------------------------------------------
export class MockChatService implements IChatService {
  async getSessions(): Promise<ChatSession[]> {
    await delay(200);
    return [...sessions].sort(
      (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
    );
  }

  async getSessionById(id: string): Promise<ChatSession | null> {
    await delay(100);
    return sessions.find((s) => s.id === id) ?? null;
  }

  async createSession(initialMessage: string): Promise<ChatSession> {
    await delay(150);

    const sessionId = uuidv4();
    const now = new Date();

    const userMsg: ChatMessage = {
      id: uuidv4(),
      role: 'user',
      content: initialMessage,
      timestamp: now,
      status: 'success',
    };

    const session: ChatSession = {
      id: sessionId,
      title: initialMessage.slice(0, 40) + (initialMessage.length > 40 ? '…' : ''),
      createdAt: now,
      updatedAt: now,
      messages: [userMsg],
    };

    sessions = [...sessions, session];
    return session;
  }

  async sendMessage(sessionId: string, message: string): Promise<ChatMessage> {
    const session = sessions.find((s) => s.id === sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);

    // Add user message
    const userMsg: ChatMessage = {
      id: uuidv4(),
      role: 'user',
      content: message,
      timestamp: new Date(),
      status: 'success',
    };
    session.messages = [...session.messages, userMsg];

    // Simulate AI thinking delay (1-2s)
    await delay(1000 + Math.random() * 1000);

    // Randomly decide if we return a chart or just text (70% chart, 30% text)
    const shouldReturnChart = Math.random() < 0.7;

    let assistantMsg: ChatMessage;

    if (shouldReturnChart) {
      const chartTemplate = pickRandomChart();
      const chartAsset: ChartAsset = {
        id: uuidv4(),
        title: chartTemplate.title,
        type: chartTemplate.type,
        config: chartTemplate.config,
        prompt: message,
        createdAt: new Date(),
      };
      charts = [...charts, chartAsset];

      assistantMsg = {
        id: uuidv4(),
        role: 'assistant',
        content: `Aquí tienes el gráfico de **${chartTemplate.title}** basado en tu consulta.`,
        timestamp: new Date(),
        chartAssetId: chartAsset.id,
        status: 'success',
      };
    } else {
      assistantMsg = {
        id: uuidv4(),
        role: 'assistant',
        content: `Basándome en tu consulta "${message}", no encontré datos suficientes para generar un gráfico, pero puedo decirte que los indicadores generales se mantienen estables. ¿Podrías ser más específico?`,
        timestamp: new Date(),
        status: 'success',
      };
    }

    session.messages = [...session.messages, assistantMsg];
    session.updatedAt = new Date();

    return assistantMsg;
  }
}
