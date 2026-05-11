import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useChatStore } from '../../hooks/useChatStore';
import type { ChatMessage, QuotedChartRef } from '../../models/types';
import ChatInput from './ChatInput';
import ChatMessageComponent from './ChatMessage';


export default function ChatView() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Estado de cita activa — UI ephemeral, no va al store global
  const [quotedChart, setQuotedChart] = useState<QuotedChartRef | null>(null);

  const {
    sessions,
    activeSessionId,
    error,
    isSessionLoading,
    isSessionGenerating,
    fetchSessions,
    setActiveSession,
    createSession,
    sendMessage,
    regenerateChart,
    clearError,
  } = useChatStore();

  const isLoading = isSessionLoading(activeSessionId ?? '');
  const isGenerating = isSessionGenerating(activeSessionId ?? '');

  const activeSession = sessions.find((s) => s.id === activeSessionId);

  // Cargar sesiones al montar
  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Sincronizar URL param con sesión activa
  useEffect(() => {
    if (sessionId) {
      if (sessionId !== activeSessionId) {
        setActiveSession(sessionId);
      }
    } else if (activeSessionId !== null) {
      setActiveSession(null);
    }
  }, [sessionId, activeSessionId, setActiveSession]);

  // Auto-scroll al último mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSession?.messages, isLoading]);

  const handleSubmit = async (message: string) => {
    clearError();

    // ── Flujo 2: Edición Generativa (TFG-57) ────────────────────────────────
    if (quotedChart) {
      const cited = quotedChart;
      setQuotedChart(null); // Limpiar chip de inmediato
      // La regeneración no usa pendingMessage porque agrega un mensaje real localmente
      await regenerateChart(cited, message);
      return;
    }

    // ── Flujo normal: generar nueva visualización ────────────────────────────
    if (!activeSessionId) {
      const newId = await createSession(message);
      if (newId) {
        navigate(`/chat/${newId}`, { replace: true });
        await sendMessage(message, newId);
      }
    } else {
      await sendMessage(message);
    }
  };

  const transientErrorMessage: ChatMessage | null = error
    ? {
      id: `transient-error-${activeSessionId ?? 'none'}`,
      role: 'assistant',
      content: error,
      timestamp: new Date(),
      status: 'error',
    }
    : null;

  // Empty state (no active session or empty session)
  if (!activeSession || activeSession.messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col min-h-0">
        <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8 overflow-y-auto">
          <div className="flex flex-col items-center gap-3">
            <img src="/logo.png" alt="BIGENIA" className="h-32 w-32 object-contain empty-state-logo" />
            <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">
              BIGENIA
            </h1>
            <p className="max-w-xl text-center text-base text-[var(--color-text-secondary)]">
              Tu asistente de Business Intelligence. Puedo generar gráficos y visualizaciones a partir de la base de datos de una tienda de música digital.
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-8 w-full max-w-4xl mt-4">
            <div className="flex-1 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-6">
              <h2 className="text-sm font-semibold text-[var(--color-text-primary)] uppercase tracking-wider mb-4">
                Información Disponible
              </h2>
              <ul className="grid grid-cols-2 gap-y-4 gap-x-4 text-sm text-[var(--color-text-secondary)]">
                <li className="flex flex-col">
                  <strong className="text-[var(--color-text-primary)]">Álbumes</strong>
                  <span className="text-xs opacity-70 mt-0.5">Colecciones musicales</span>
                </li>
                <li className="flex flex-col">
                  <strong className="text-[var(--color-text-primary)]">Artistas</strong>
                  <span className="text-xs opacity-70 mt-0.5">Creadores e intérpretes</span>
                </li>
                <li className="flex flex-col">
                  <strong className="text-[var(--color-text-primary)]">Clientes</strong>
                  <span className="text-xs opacity-70 mt-0.5">Compradores registrados</span>
                </li>
                <li className="flex flex-col">
                  <strong className="text-[var(--color-text-primary)]">Empleados</strong>
                  <span className="text-xs opacity-70 mt-0.5">Personal de la tienda</span>
                </li>
                <li className="flex flex-col">
                  <strong className="text-[var(--color-text-primary)]">Géneros</strong>
                  <span className="text-xs opacity-70 mt-0.5">Estilos de música</span>
                </li>
                <li className="flex flex-col">
                  <strong className="text-[var(--color-text-primary)]">Facturas</strong>
                  <span className="text-xs opacity-70 mt-0.5">Historial de ventas</span>
                </li>
                <li className="flex flex-col">
                  <strong className="text-[var(--color-text-primary)]">Detalle Facturas</strong>
                  <span className="text-xs opacity-70 mt-0.5">Ítems por cada venta</span>
                </li>
                <li className="flex flex-col">
                  <strong className="text-[var(--color-text-primary)]">Formatos</strong>
                  <span className="text-xs opacity-70 mt-0.5">Tipos de archivo (MP3)</span>
                </li>
                <li className="flex flex-col">
                  <strong className="text-[var(--color-text-primary)]">Playlists</strong>
                  <span className="text-xs opacity-70 mt-0.5">Listas de reproducción</span>
                </li>
                <li className="flex flex-col">
                  <strong className="text-[var(--color-text-primary)]">Canciones</strong>
                  <span className="text-xs opacity-70 mt-0.5">Pistas del catálogo</span>
                </li>
              </ul>
            </div>

            <div className="flex-1 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-6">
              <h2 className="text-sm font-semibold text-[var(--color-text-primary)] uppercase tracking-wider mb-4">
                Ejemplos de Consultas
              </h2>
              <ul className="flex flex-col gap-3 text-sm text-[var(--color-text-secondary)]">
                <li className="flex items-start gap-2">
                  <span className="mt-1 flex h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0"></span>
                  <span>"Mostrar las ventas totales por país"</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 flex h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0"></span>
                  <span>"¿Cuáles son los 10 artistas más vendidos?"</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 flex h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0"></span>
                  <span>"Gráfico de canciones por género"</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 flex h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0"></span>
                  <span>"Evolución de ventas por mes en 2024"</span>
                </li>
              </ul>
            </div>
          </div>

          {error && (
            <div className="w-full max-w-xl rounded-2xl border border-red-700/70 bg-red-950/40 px-4 py-3 text-sm text-red-100 mt-4">
              {error}
            </div>
          )}
        </div>
        <ChatInput
          onSubmit={handleSubmit}
          isLoading={isLoading}
          quotedChart={quotedChart}
          onClearQuote={() => setQuotedChart(null)}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col min-h-0">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl py-6">
          {activeSession.messages.map((msg) => (
            <ChatMessageComponent
              key={msg.id}
              message={msg}
              onQuote={(ref) => setQuotedChart(ref)}
            />
          ))}
          {transientErrorMessage && (
            <ChatMessageComponent message={transientErrorMessage} />
          )}
          {isGenerating && (
            <ChatMessageComponent
              message={{
                id: 'loading-indicator',
                role: 'assistant',
                content: '',
                timestamp: new Date(),
                status: 'loading',
              }}
            />
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input con chip de cita */}
      <ChatInput
        onSubmit={handleSubmit}
        isLoading={isLoading}
        quotedChart={quotedChart}
        onClearQuote={() => setQuotedChart(null)}
      />
    </div>
  );
}
