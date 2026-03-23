import { Outlet, NavLink } from 'react-router-dom';
import { MessageSquare, BarChart3 } from './icons';
import SidebarHistory from '../components/common/SidebarHistory';

export default function MainLayout() {
  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Sidebar */}
      <aside className="flex w-64 flex-col border-r border-[var(--color-border)] bg-[var(--color-bg-sidebar)]">
        {/* Logo */}
        <div className="flex items-center gap-2 px-5 py-4">
          <BarChart3 className="h-7 w-7 text-[var(--color-primary)]" />
          <span className="text-lg font-bold tracking-tight">GenDash</span>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1 px-3 pt-2">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-input)] hover:text-white'
              }`
            }
          >
            <MessageSquare className="h-4 w-4" />
            Chat
          </NavLink>
          <NavLink
            to="/gallery"
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-input)] hover:text-white'
              }`
            }
          >
            <BarChart3 className="h-4 w-4" />
            Galería
          </NavLink>
        </nav>

        {/* Chat history */}
        <div className="flex-1 overflow-y-auto px-3 pt-4">
          <SidebarHistory />
        </div>
      </aside>

      {/* Main content */}
      <main className="flex flex-1 flex-col overflow-hidden bg-[var(--color-bg-main)]">
        <Outlet />
      </main>
    </div>
  );
}
