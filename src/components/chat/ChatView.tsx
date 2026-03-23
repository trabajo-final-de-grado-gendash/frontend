import { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useChatStore } from '../../hooks/useChatStore';
import ChatInput from './ChatInput';
import ChatMessageComponent from './ChatMessage';
import { BarChart3 } from '../../layouts/icons';

export default function ChatView() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    sessions,
    activeSessionId,
    isLoading,
    error,
    fetchSessions,
    setActiveSession,
    createSession,
    sendMessage,
    clearError,
  } = useChatStore();

  const activeSession = sessions.find((s) => s.id === activeSessionId);

  // Load sessions on mount
  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Sync URL param to active session
  useEffect(() => {
    if (sessionId && sessionId !== activeSessionId) {
      setActiveSession(sessionId);
    }
  }, [sessionId, activeSessionId, setActiveSession]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSession?.messages]);

  const handleSubmit = async (message: string) => {
    clearError();
    if (!activeSessionId) {
      // Create new session
      const newId = await createSession(message);
      if (newId) {
        navigate(`/chat/${newId}`, { replace: true });
        // Send the actual AI response
        await sendMessage(message);
      }
    } else {
      await sendMessage(message);
    }
  };

  // Empty state (no active session)
  if (!activeSession) {
    return (
      <div className="flex flex-1 flex-col">
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
          <BarChart3 className="h-16 w-16 text-[var(--color-primary)] opacity-60" />
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
            GenDash
          </h1>
          <p className="max-w-md text-center text-sm text-[var(--color-text-secondary)]">
            Escribe una consulta en lenguaje natural para generar gráficos de
            Business Intelligence. Ejemplo: <em>"Mostrar ventas por región"</em>
          </p>
        </div>
        <ChatInput onSubmit={handleSubmit} isLoading={isLoading} />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      {/* Error banner */}
      {error && (
        <div className="border-b border-red-800 bg-red-900/30 px-4 py-2 text-sm text-[var(--color-error)]">
          {error}
          <button
            onClick={clearError}
            className="ml-3 underline hover:no-underline"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl py-6">
          {activeSession.messages.map((msg) => (
            <ChatMessageComponent key={msg.id} message={msg} />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <ChatInput onSubmit={handleSubmit} isLoading={isLoading} />
    </div>
  );
}
