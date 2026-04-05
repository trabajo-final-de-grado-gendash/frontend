import type { ChatMessage, ChatSession, ChartAsset, ChartGroup } from '../../models/types';

const STORAGE_KEY = 'gendash.api.local-state.v1';

interface PersistedChatMessage extends Omit<ChatMessage, 'timestamp'> {
  timestamp: string;
}

interface PersistedChatSession extends Omit<ChatSession, 'createdAt' | 'updatedAt' | 'messages'> {
  createdAt: string;
  updatedAt: string;
  messages: PersistedChatMessage[];
}

interface PersistedChartAsset extends Omit<ChartAsset, 'createdAt'> {
  createdAt: string;
}

interface PersistedState {
  sessions: PersistedChatSession[];
  charts: PersistedChartAsset[];
  groups: ChartGroup[];
}

let isInitialized = false;
let sessions: ChatSession[] = [];
let charts: ChartAsset[] = [];
let groups: ChartGroup[] = [];

function canUseLocalStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function toDate(value: string | Date | undefined): Date {
  if (value instanceof Date) {
    return new Date(value);
  }

  if (!value) {
    return new Date();
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function cloneMessage(message: ChatMessage): ChatMessage {
  return {
    ...message,
    timestamp: new Date(message.timestamp),
  };
}

function cloneSession(session: ChatSession): ChatSession {
  return {
    ...session,
    createdAt: new Date(session.createdAt),
    updatedAt: new Date(session.updatedAt),
    messages: session.messages.map(cloneMessage),
  };
}

function cloneChart(chart: ChartAsset): ChartAsset {
  return {
    ...chart,
    createdAt: new Date(chart.createdAt),
  };
}

function toPersistedState(): PersistedState {
  return {
    sessions: sessions.map((session) => ({
      ...session,
      createdAt: session.createdAt.toISOString(),
      updatedAt: session.updatedAt.toISOString(),
      messages: session.messages.map((message) => ({
        ...message,
        timestamp: message.timestamp.toISOString(),
      })),
    })),
    charts: charts.map((chart) => ({
      ...chart,
      createdAt: chart.createdAt.toISOString(),
    })),
    groups: groups.map((group) => ({ ...group })),
  };
}

function fromPersistedState(value: PersistedState): void {
  sessions = value.sessions.map((session) => ({
    ...session,
    createdAt: toDate(session.createdAt),
    updatedAt: toDate(session.updatedAt),
    messages: session.messages.map((message) => ({
      ...message,
      timestamp: toDate(message.timestamp),
    })),
  }));

  charts = value.charts.map((chart) => ({
    ...chart,
    createdAt: toDate(chart.createdAt),
  }));

  groups = value.groups.map((group) => ({ ...group }));
}

function readPersistedState(): PersistedState | null {
  if (!canUseLocalStorage()) {
    return null;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as PersistedState;
  } catch {
    return null;
  }
}

function persistState(): void {
  if (!canUseLocalStorage()) {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(toPersistedState()));
}

function ensureInitialized(): void {
  if (isInitialized) {
    return;
  }

  const persisted = readPersistedState();
  if (persisted) {
    fromPersistedState(persisted);
  }

  isInitialized = true;
}

export function getSessionsState(): ChatSession[] {
  ensureInitialized();
  return sessions.map(cloneSession);
}

export function getSessionByIdState(id: string): ChatSession | null {
  ensureInitialized();
  const session = sessions.find((item) => item.id === id);
  return session ? cloneSession(session) : null;
}

export function saveSessionState(session: ChatSession): void {
  ensureInitialized();

  const next = cloneSession(session);
  const index = sessions.findIndex((item) => item.id === next.id);

  if (index === -1) {
    sessions = [...sessions, next];
  } else {
    const copy = [...sessions];
    copy[index] = next;
    sessions = copy;
  }

  persistState();
}

export function saveSessionsState(nextSessions: ChatSession[]): void {
  ensureInitialized();
  sessions = nextSessions.map(cloneSession);
  persistState();
}

export function getChartsState(): ChartAsset[] {
  ensureInitialized();
  return charts.map(cloneChart);
}

export function getChartByIdState(id: string): ChartAsset | null {
  ensureInitialized();
  const chart = charts.find((item) => item.id === id);
  return chart ? cloneChart(chart) : null;
}

export function saveChartState(chart: ChartAsset): void {
  ensureInitialized();

  const next = cloneChart(chart);
  const index = charts.findIndex((item) => item.id === next.id);

  if (index === -1) {
    charts = [...charts, next];
  } else {
    const copy = [...charts];
    copy[index] = next;
    charts = copy;
  }

  persistState();
}

export function saveChartsState(nextCharts: ChartAsset[]): void {
  ensureInitialized();
  charts = nextCharts.map(cloneChart);
  persistState();
}

export function getGroupsState(): ChartGroup[] {
  ensureInitialized();
  return groups.map((group) => ({ ...group }));
}

export function saveGroupsState(nextGroups: ChartGroup[]): void {
  ensureInitialized();
  groups = nextGroups.map((group) => ({ ...group }));
  persistState();
}
