// Data Models for BI Chat Frontend

export interface ChatSession {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  messages: ChatMessage[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  chartAssetId?: string;
  status: 'loading' | 'success' | 'error';
  /** Referencia al gráfico citado al enviar este mensaje (estilo reply). Solo en mensajes de usuario. */
  quotedChartRef?: { title: string; chartType: string };
}

export interface ChartAsset {
  id: string;
  title: string;
  type: string; // e.g., 'bar', 'line', 'pie', 'scatter'
  config: PlotlyChartConfig;
  prompt: string;
  createdAt: Date;
  groupId?: string;
}

export interface PlotlyChartConfig {
  data: Plotly.Data[];
  layout?: Partial<Plotly.Layout>;
}

export interface ChartGroup {
  id: string;
  name: string;
  description?: string;
}

export interface QuotedChartRef {
  resultId: string;
  title: string;
  chartType: string;
}

// Re-export Plotly types for convenience
import type Plotly from 'plotly.js';
export type { Plotly };
