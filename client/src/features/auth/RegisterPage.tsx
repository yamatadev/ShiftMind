import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, ArrowLeft } from 'lucide-react';

interface RegisterPageProps {
  onLogin: () => void;
}

export default function RegisterPage({ onLogin }: RegisterPageProps) {
  const navigate = useNavigate();
  const [notifyEmail, setNotifyEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function handleDemo() {
    onLogin();
    navigate('/');
  }

  function handleNotify(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
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

      {/* Centered card */}
      <div className="relative z-10 flex items-center justify-center min-h-screen">
        <div className="w-full max-w-lg mx-4 bg-black/80 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-8">
          {/* Icon */}
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center mb-6"
            style={{ background: 'rgba(45, 90, 61, 0.15)' }}
          >
            <UserPlus className="w-6 h-6" style={{ color: '#2D5A3D' }} />
          </div>

          <h1 className="text-2xl font-bold text-white mb-2">We're not quite ready yet</h1>
          <p className="text-white/40 text-sm leading-relaxed mb-8">
            Account registration is coming soon. In the meantime, please contact your administrator for access or try the demo to explore ShiftMind's features.
          </p>

          {/* Notify Me */}
          <form onSubmit={handleNotify} className="mb-6">
            <label className="block text-white/50 text-[10px] uppercase tracking-widest mb-2">
              Get notified when registration opens
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                value={notifyEmail}
                onChange={(e) => setNotifyEmail(e.target.value)}
                className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-white/20 transition-colors"
                placeholder="you@company.com"
              />
              <button
                type="submit"
                disabled={submitted}
                className="px-5 py-3 rounded-lg text-sm font-semibold text-white transition-colors shrink-0"
                style={{
                  background: submitted ? 'rgba(255,255,255,0.06)' : '#2D5A3D',
                  cursor: submitted ? 'default' : 'pointer',
                }}
              >
                {submitted ? 'Noted!' : 'Notify Me'}
              </button>
            </div>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-white/[0.08]" />
            <span className="text-white/25 text-xs">or</span>
            <div className="flex-1 h-px bg-white/[0.08]" />
          </div>

          {/* Demo button */}
          <button
            onClick={handleDemo}
            className="w-full py-3 rounded-lg text-sm font-semibold text-white transition-colors"
            style={{ background: '#2D5A3D' }}
          >
            Try the Demo Instead
          </button>

          {/* Back to sign in */}
          <p className="text-center mt-6">
            <button
              onClick={() => navigate('/login')}
              className="text-white/30 text-sm hover:text-white/50 transition-colors inline-flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Sign In
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
