import { Routes, Route, Navigate } from 'react-router-dom';
import { useSession } from './hooks/useSession';
import { ScheduleProvider, useScheduleContext } from './contexts/ScheduleContext';
import { ChatProvider } from './contexts/ChatContext';
import LoginPage from './features/auth/LoginPage';
import RegisterPage from './features/auth/RegisterPage';
import Sidebar from './features/sidebar/Sidebar';
import SchedulePage from './features/calendar/SchedulePage';
import WorkersPage from './features/workers/WorkersPage';
import TemplatesPage from './features/templates/TemplatesPage';
import AriaPanel from './features/chat/AriaPanel';

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
