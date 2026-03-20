import { Routes, Route, Navigate } from 'react-router-dom';
import { useSession } from './hooks/useSession';
import { ScheduleProvider, useScheduleContext } from './contexts/ScheduleContext';
import { ChatProvider } from './contexts/ChatContext';

// Placeholder pages — will be replaced by real implementations
function LoginPage({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="min-h-screen bg-base flex items-center justify-center">
      <div className="bg-surface p-8 rounded-xl shadow-sm border border-border max-w-sm w-full">
        <h1 className="text-2xl font-heading font-bold text-text-primary mb-6">ShiftMind</h1>
        <button
          onClick={onLogin}
          className="w-full bg-primary text-white py-2 px-4 rounded-lg font-medium hover:opacity-90 transition-opacity"
        >
          Sign In
        </button>
      </div>
    </div>
  );
}

function RegisterPage({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="min-h-screen bg-base flex items-center justify-center">
      <div className="bg-surface p-8 rounded-xl shadow-sm border border-border max-w-sm w-full">
        <h1 className="text-2xl font-heading font-bold text-text-primary mb-6">Create Account</h1>
        <button
          onClick={onLogin}
          className="w-full bg-primary text-white py-2 px-4 rounded-lg font-medium hover:opacity-90 transition-opacity"
        >
          Register
        </button>
      </div>
    </div>
  );
}

function SchedulePage() {
  return <div className="p-6"><h2 className="text-xl font-heading font-semibold">Schedule</h2><p className="text-text-secondary mt-2">Schedule view coming soon.</p></div>;
}

function WorkersPage() {
  return <div className="p-6"><h2 className="text-xl font-heading font-semibold">Workers</h2><p className="text-text-secondary mt-2">Workers view coming soon.</p></div>;
}

function TemplatesPage() {
  return <div className="p-6"><h2 className="text-xl font-heading font-semibold">Templates</h2><p className="text-text-secondary mt-2">Templates view coming soon.</p></div>;
}

function Sidebar({ onLogout }: { onLogout: () => void }) {
  return (
    <aside className="w-56 bg-sidebar text-white flex flex-col shrink-0">
      <div className="p-4 border-b border-white/10">
        <h1 className="text-lg font-heading font-bold">ShiftMind</h1>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        <a href="/" className="block px-3 py-2 rounded-lg hover:bg-white/10 text-sm font-medium">Schedule</a>
        <a href="/workers" className="block px-3 py-2 rounded-lg hover:bg-white/10 text-sm font-medium">Workers</a>
        <a href="/templates" className="block px-3 py-2 rounded-lg hover:bg-white/10 text-sm font-medium">Templates</a>
      </nav>
      <div className="p-3 border-t border-white/10">
        <button
          onClick={onLogout}
          className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 text-sm text-white/70"
        >
          Sign Out
        </button>
      </div>
    </aside>
  );
}

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

function MainContent() {
  return (
    <main className="flex-1 overflow-auto">
      <Routes>
        <Route path="/" element={<SchedulePage />} />
        <Route path="/workers" element={<WorkersPage />} />
        <Route path="/templates" element={<TemplatesPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </main>
  );
}

function AppShellInner({ onLogout }: { onLogout: () => void }) {
  const { refetch } = useScheduleContext();

  return (
    <ChatProvider scheduleRefetch={refetch}>
      <div className="flex h-screen bg-base">
        <Sidebar onLogout={onLogout} />
        <MainContent />
        <AriaPanel />
      </div>
    </ChatProvider>
  );
}

function AppShell({ onLogout }: { onLogout: () => void }) {
  return (
    <ScheduleProvider>
      <AppShellInner onLogout={onLogout} />
    </ScheduleProvider>
  );
}

export default function App() {
  const { isLoggedIn, login, logout } = useSession();

  if (!isLoggedIn) {
    return (
      <Routes>
        <Route path="/register" element={<RegisterPage onLogin={login} />} />
        <Route path="*" element={<LoginPage onLogin={login} />} />
      </Routes>
    );
  }

  return <AppShell onLogout={logout} />;
}
