import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useChatStore } from '../../hooks/useChatStore';
import { MessageSquare } from '../../layouts/icons';

export default function SidebarHistory() {
  const navigate = useNavigate();
  const location = useLocation();
  const { sessions, activeSessionId, fetchSessions } = useChatStore();

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return (
    <div className="flex flex-col gap-0.5">
      {sessions.map((session) => {
        const isActive =
          session.id === activeSessionId &&
          location.pathname.startsWith('/chat');

        return (
          <button
            key={session.id}
            onClick={() => navigate(`/chat/${session.id}`)}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm cursor-pointer transition-colors ${
              isActive
                ? 'bg-[var(--color-bg-input)] text-[var(--color-text-primary)] font-medium'
                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-input)]/50 hover:text-[var(--color-text-primary)]'
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{session.title}</span>
          </button>
        );
      })}
    </div>
  );
}
