import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useChatStore } from '../../hooks/useChatStore';
import { MessageSquare, MoreVertical, Trash2 } from '../../layouts/icons';

export default function SidebarHistory() {
  const navigate = useNavigate();
  const location = useLocation();
  const { sessions, activeSessionId, fetchSessions, deleteSession } = useChatStore();
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Close menu on click outside
  useEffect(() => {
    if (!menuOpenId) return;
    const handleClickOutside = () => setMenuOpenId(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, [menuOpenId]);

  const handleDelete = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    await deleteSession(sessionId);
    if (activeSessionId === sessionId) {
      navigate('/', { replace: true });
    }
    setMenuOpenId(null);
  };

  const toggleMenu = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    setMenuOpenId(menuOpenId === sessionId ? null : sessionId);
  };

  return (
    <div className="flex flex-col gap-0.5 pb-4">
      {sessions.map((session) => {
        const isActive =
          session.id === activeSessionId &&
          location.pathname.startsWith('/chat');
        const isMenuOpen = menuOpenId === session.id;

        return (
          <div key={session.id} className="group relative">
            <button
              onClick={() => navigate(`/chat/${session.id}`)}
              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm cursor-pointer transition-colors ${
                isActive
                  ? 'bg-[var(--color-bg-input)] text-[var(--color-text-primary)] font-medium'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-input)]/50 hover:text-[var(--color-text-primary)]'
              }`}
            >
              <MessageSquare className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate pr-6">{session.title}</span>
            </button>

            {/* Menu trigger */}
            <button
              onClick={(e) => toggleMenu(e, session.id)}
              className={`absolute right-1 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-md text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-input)] hover:text-[var(--color-text-primary)] transition-opacity cursor-pointer ${
                isMenuOpen ? 'opacity-100 bg-[var(--color-bg-input)]' : 'opacity-0 group-hover:opacity-100'
              }`}
            >
              <MoreVertical className="h-4 w-4" />
            </button>

            {/* Dropdown Menu */}
            {isMenuOpen && (
              <div 
                className="absolute right-1 top-9 z-50 w-32 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] p-1 shadow-xl animate-in fade-in zoom-in duration-100"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={(e) => handleDelete(e, session.id)}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Eliminar chat
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
