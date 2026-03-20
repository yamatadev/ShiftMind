import { Routes, Route, Navigate } from 'react-router-dom';
import { useSession } from './hooks/useSession';
import { ScheduleProvider, useScheduleContext } from './contexts/ScheduleContext';
import { ChatProvider } from './contexts/ChatContext';
import LoginPage from './features/auth/LoginPage';
import RegisterPage from './features/auth/RegisterPage';
import Sidebar from './features/sidebar/Sidebar';
import SchedulePage from './pages/SchedulePage';
import WorkersPage from './pages/WorkersPage';
import TemplatesPage from './pages/TemplatesPage';

function AriaPanel() {
  return (
    <aside className="w-80 border-l border-border bg-surface shrink-0 flex flex-col">
      <div className="p-4 border-b border-border">
        <h2 className="font-heading font-semibold text-text-primary">Aria</h2>
        <p className="text-xs text-text-secondary">AI scheduling assistant</p>
      </div>
      <div className="flex-1 p-4 text-sm text-text-secondary">
        Chat panel coming soon.
      </div>
    </aside>
  );
}

function AppShellInner() {
  const { refetch } = useScheduleContext();

  return (
    <ChatProvider scheduleRefetch={refetch}>
      <div className="flex h-screen bg-base">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Routes>
            <Route path="/" element={<SchedulePage />} />
            <Route path="/workers" element={<WorkersPage />} />
            <Route path="/templates" element={<TemplatesPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
        <AriaPanel />
      </div>
    </ChatProvider>
  );
}

function AppShell() {
  return (
    <ScheduleProvider>
      <AppShellInner />
    </ScheduleProvider>
  );
}

export default function App() {
  const { isLoggedIn, login } = useSession();

  if (!isLoggedIn) {
    return (
      <Routes>
        <Route path="/register" element={<RegisterPage onLogin={login} />} />
        <Route path="*" element={<LoginPage onLogin={login} />} />
      </Routes>
    );
  }

  return <AppShell />;
}
