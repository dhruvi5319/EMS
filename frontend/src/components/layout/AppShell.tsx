import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

export function AppShell() {
  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <Sidebar />
      <main
        className="p-8"
        style={{ marginLeft: 220, paddingTop: 64 + 32 }}
      >
        <div className="max-w-[1280px] mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
