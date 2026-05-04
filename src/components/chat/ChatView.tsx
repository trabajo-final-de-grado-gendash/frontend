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
    isLoading,
    error,
    fetchSessions,
    setActiveSession,
    createSession,
    sendMessage,
    regenerateChart,
    clearError,
  } = useChatStore();

  const activeSession = sessions.find((s) => s.id === activeSessionId);

  // Cargar sesiones al montar
  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Sincronizar URL param con sesión activa
  useEffect(() => {
    if (sessionId && sessionId !== activeSessionId) {
      setActiveSession(sessionId);
    } else if (!sessionId && activeSessionId) {
      useChatStore.setState({ activeSessionId: null });
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

  // Empty state (no active session)
  if (!activeSession) {
    return (
      <div className="flex flex-1 flex-col min-h-0">
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
          <img src="/logo.png" alt="GenDash" className="h-48 w-48 scale-150 object-contain mix-blend-screen opacity-90 drop-shadow-2xl" />
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
            GenDash
          </h1>
          <p className="max-w-md text-center text-sm text-[var(--color-text-secondary)]">
            Escribe una consulta en lenguaje natural para generar gráficos de
            Business Intelligence. Ejemplo: <em>"Mostrar ventas por región"</em>
          </p>
          {error && (
            <div className="w-full max-w-xl rounded-2xl border border-red-700/70 bg-red-950/40 px-4 py-3 text-sm text-red-100">
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
          {isLoading && (
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
