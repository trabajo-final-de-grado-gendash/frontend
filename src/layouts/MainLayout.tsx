import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Plus, BarChart3 } from './icons';
import SidebarHistory from '../components/common/SidebarHistory';
import { useTheme } from '../hooks/useTheme';
import { useChatStore } from '../hooks/useChatStore';

function SunIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <line x1="12" y1="2" x2="12" y2="4" /><line x1="12" y1="20" x2="12" y2="22" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="2" y1="12" x2="4" y2="12" /><line x1="20" y1="12" x2="22" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

export default function MainLayout() {
  const { isDark, toggle } = useTheme();
  const navigate = useNavigate();

  const handleNewChat = () => {
    useChatStore.getState().setActiveSession(null);
    navigate('/', { replace: true });
  };

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Sidebar */}
      <aside className="flex w-64 flex-col border-r border-[var(--color-border)] bg-[var(--color-bg-sidebar)]">
        {/* Logo */}
        <div 
          className="flex items-center gap-3 px-5 py-4 cursor-pointer" 
          onClick={handleNewChat}
          title="Nuevo chat"
        >
          <img src="/logo.png" alt="BIGenIA" className="h-14 w-14 scale-150 object-contain drop-shadow-lg -ml-1" />
          <span className="text-xl font-bold tracking-tight z-10">BIGenIA</span>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1 px-3 pt-2">
          <button
            onClick={handleNewChat}
            className="flex items-center gap-3 rounded-lg border border-dashed border-[var(--color-border)] px-3 py-2 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] cursor-pointer"
            id="new-chat-btn"
          >
            <Plus className="h-4 w-4" />
            Nuevo chat
          </button>
          <NavLink
            to="/gallery"
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-input)] hover:text-[var(--color-text-primary)]'
              }`
            }
          >
            <BarChart3 className="h-4 w-4" />
            Galería
          </NavLink>
        </nav>

        {/* Chat history */}
        <div className="flex-1 overflow-y-auto px-3 pt-4">
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
            Conversaciones
          </p>
          <SidebarHistory />
        </div>

        {/* Theme toggle */}
        <div className="border-t border-[var(--color-border)] px-3 py-3">
          <button
            onClick={toggle}
            id="theme-toggle"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg-input)] hover:text-[var(--color-text-primary)]"
            title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          >
            {isDark ? <SunIcon /> : <MoonIcon />}
            {isDark ? 'Modo claro' : 'Modo oscuro'}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex flex-1 flex-col overflow-hidden bg-[var(--color-bg-main)]">
        <Outlet />
      </main>
    </div>
  );
}
