import { useAuthContext } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { GlobalSearchBar } from '@/components/search/GlobalSearchBar';

export function TopBar() {
  const { user, logout } = useAuthContext();
  const navigate = useNavigate();

  const initials = user?.display_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? '?';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header
      className="fixed top-0 left-0 right-0 bg-white border-b border-[var(--c-border)] flex items-center px-6 z-10"
      style={{ height: 64 }}
    >
      {/* Wordmark */}
      <div
        className="font-sans font-semibold text-[14px] text-[var(--c-text-1)] shrink-0"
        style={{ width: 220 }}
      >
        <span className="font-mono text-[var(--c-accent-600)] tracking-tight">EMS</span>
      </div>

      {/* Global search */}
      <GlobalSearchBar />

      {/* User menu */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-full bg-[var(--c-accent-600)] text-white flex items-center justify-center font-mono text-[11px] font-medium"
            aria-hidden="true"
          >
            {initials}
          </div>
          <span className="text-[13px] text-[var(--c-text-1)] hidden sm:block font-sans">
            {user?.display_name}
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="text-[13px] text-[var(--c-text-2)] hover:text-[var(--c-text-1)] px-3 py-1.5 rounded-[var(--r-md)] hover:bg-[var(--c-sunken)] transition-[color,background-color] duration-150"
        >
          Log out
        </button>
      </div>
    </header>
  );
}
