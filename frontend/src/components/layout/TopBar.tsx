import { useAuthContext } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

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
      className="fixed top-0 left-0 right-0 bg-background border-b border-border flex items-center px-6 z-10"
      style={{ height: 64 }}
    >
      {/* Logo */}
      <div className="font-semibold text-foreground text-base" style={{ width: 220 }}>
        EMS
      </div>

      {/* Search placeholder — replaced by GlobalSearchBar in plan 02-04 */}
      <div className="flex-1 mx-6">
        <div className="max-w-md mx-auto" id="global-search-container">
          <input
            type="text"
            placeholder="Search engagements, requests..."
            disabled
            className="w-full h-9 rounded-md border border-border px-3 text-sm text-muted-foreground bg-secondary cursor-not-allowed"
            aria-label="Global search (coming soon)"
          />
        </div>
      </div>

      {/* User menu */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold"
            aria-hidden="true"
          >
            {initials}
          </div>
          <span className="text-sm text-foreground">{user?.display_name}</span>
        </div>
        <button
          onClick={handleLogout}
          className="text-sm text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-md hover:bg-muted transition-colors"
        >
          Log Out
        </button>
      </div>
    </header>
  );
}
