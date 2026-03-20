import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, Info } from 'lucide-react';

interface LoginPageProps {
  onLogin: () => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showMessage, setShowMessage] = useState(false);

  function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setShowMessage(true);
  }

  function handleDemo() {
    onLogin();
    navigate('/');
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden font-heading" style={{ background: '#111110' }}>
      {/* Ghost schedule grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gridTemplateRows: 'repeat(3, 1fr)',
        }}
      >
        {Array.from({ length: 21 }).map((_, i) => (
          <div
            key={i}
            style={{
              border: '1px solid rgba(45, 90, 61, 0.04)',
            }}
          />
        ))}
      </div>

      {/* Radial green glow behind card */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        style={{
          width: '700px',
          height: '700px',
          background: 'radial-gradient(circle, rgba(45, 90, 61, 0.15) 0%, transparent 70%)',
        }}
      />

      {/* Top bar */}
      <header className="relative z-10 flex items-center justify-between px-8 py-5">
        <img src="/logo-white.svg" alt="ShiftMind" className="h-8" />
        <span className="text-white/50 text-sm tracking-wide">Sunrise Senior Living</span>
      </header>

      {/* Centered card */}
      <div className="relative z-10 flex items-center justify-center" style={{ minHeight: 'calc(100vh - 140px)' }}>
        <div className="w-full max-w-md mx-4 bg-black/80 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-8">
          <h1 className="text-2xl font-bold text-white mb-1">Welcome back</h1>
          <p className="text-white/40 text-sm mb-8">Your team is counting on you.</p>

          {/* Form fields — fade out when showMessage */}
          <form
            onSubmit={handleSignIn}
            className="transition-all duration-500"
            style={{
              opacity: showMessage ? 0 : 1,
              maxHeight: showMessage ? 0 : '400px',
              overflow: 'hidden',
            }}
          >
            <div className="mb-4">
              <label className="block text-white/50 text-[10px] uppercase tracking-widest mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-white/20 transition-colors"
                placeholder="you@company.com"
              />
            </div>
            <div className="mb-6">
              <label className="block text-white/50 text-[10px] uppercase tracking-widest mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-white/20 transition-colors"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 rounded-lg text-sm font-semibold text-white transition-colors"
              style={{ background: '#2D5A3D' }}
            >
              Sign In
            </button>
          </form>

          {/* Info message — fade in when showMessage */}
          <div
            className="transition-all duration-500"
            style={{
              opacity: showMessage ? 1 : 0,
              maxHeight: showMessage ? '300px' : 0,
              overflow: 'hidden',
            }}
          >
            <div className="rounded-xl border border-[#2D5A3D]/30 bg-[#2D5A3D]/10 p-5 mb-4">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-[#2D5A3D] shrink-0 mt-0.5" />
                <div>
                  <p className="text-white font-semibold text-sm mb-1">Almost there</p>
                  <p className="text-white/50 text-sm leading-relaxed">
                    Credential login isn't available yet — we're still building it out. Jump into the demo below to explore everything ShiftMind can do.
                  </p>
                </div>
              </div>
            </div>
            <button
              disabled
              className="w-full py-3 rounded-lg text-sm font-semibold text-white/30 bg-white/[0.06] cursor-not-allowed mb-4"
            >
              Sign In
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-white/[0.08]" />
            <span className="text-white/25 text-xs">or</span>
            <div className="flex-1 h-px bg-white/[0.08]" />
          </div>

          {/* Demo button */}
          <button
            onClick={handleDemo}
            className="w-full py-3 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all"
            style={{
              background: showMessage ? 'transparent' : 'rgba(255,255,255,0.04)',
              border: showMessage ? '1px solid #2D5A3D' : '1px solid rgba(255,255,255,0.08)',
              boxShadow: showMessage ? '0 0 20px rgba(45, 90, 61, 0.3), inset 0 0 20px rgba(45, 90, 61, 0.05)' : 'none',
            }}
          >
            <LogIn className="w-4 h-4" />
            Enter as Demo User
          </button>

          {/* Create account link */}
          <p className="text-center mt-6">
            <button
              onClick={() => navigate('/register')}
              className="text-white/30 text-sm hover:text-white/50 transition-colors"
            >
              Create an account
            </button>
          </p>
        </div>
      </div>

      {/* Bottom right text */}
      <div className="absolute bottom-4 right-6 z-10">
        <span className="text-white/20 text-xs">Powered by Aria AI</span>
      </div>
    </div>
  );
}
