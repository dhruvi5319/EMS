import { LayoutDashboard, FileText, Briefcase, ClipboardList, BarChart2 } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const NAV_ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard' },
  { label: 'Requests', icon: FileText, to: '/requests' },
  { label: 'Engagements', icon: Briefcase, to: '/engagements' },
  { label: 'Review Queue', icon: ClipboardList, to: '/review-queue' },
  { label: 'Reports', icon: BarChart2, to: '/reports' },
];

export function Sidebar() {
  return (
    <aside
      className="fixed left-0 top-0 h-full bg-secondary border-r border-border"
      style={{ width: 220, paddingTop: 64 }}
      aria-label="Main navigation"
    >
      <nav className="py-4">
        {NAV_ITEMS.map(({ label, icon: Icon, to }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-2 h-10 pl-4 pr-4 text-sm transition-colors cursor-pointer ${
                isActive
                  ? 'text-primary bg-muted border-l-4 border-primary pl-3'
                  : 'text-foreground hover:bg-muted border-l-4 border-transparent'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={16}
                  className={isActive ? 'text-primary' : 'text-muted-foreground'}
                />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
