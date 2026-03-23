import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useChatStore } from '../../hooks/useChatStore';
import { Plus, MessageSquare } from '../../layouts/icons';

export default function SidebarHistory() {
  const navigate = useNavigate();
  const location = useLocation();
  const { sessions, activeSessionId, fetchSessions } = useChatStore();

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleNewChat = () => {
    useChatStore.setState({ activeSessionId: null });
    navigate('/');
  };

  return (
    <div className="flex flex-col gap-1">
      {/* New Chat button */}
      <button
        onClick={handleNewChat}
        className="flex items-center gap-2 rounded-lg border border-dashed border-[var(--color-border)] px-3 py-2 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
        id="new-chat-btn"
      >
        <Plus className="h-4 w-4" />
        Nuevo chat
      </button>

      {/* Session list */}
      <div className="mt-2 flex flex-col gap-0.5">
        {sessions.map((session) => {
          const isActive =
            session.id === activeSessionId &&
            location.pathname.startsWith('/chat');

          return (
            <button
              key={session.id}
              onClick={() => navigate(`/chat/${session.id}`)}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                isActive
                  ? 'bg-[var(--color-bg-input)] text-white'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-input)]/50 hover:text-white'
              }`}
            >
              <MessageSquare className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{session.title}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
