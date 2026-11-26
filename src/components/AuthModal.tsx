import { useEffect, useState, FormEvent } from 'react';
import { Lock, X, ShieldCheck } from 'lucide-react';
import { Lang } from '../types.ts';
import { UI_COPY } from '../i18n/translations.ts';

interface AuthModalProps {
  open: boolean;
  lang: Lang;
  onClose: () => void;
  onAuthenticated: (token: string) => void;
}

export function AuthModal({
  open,
  lang,
  onClose,
  onAuthenticated,
}: AuthModalProps) {
  const t = UI_COPY[lang];
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [username, setUsername] = useState('Jimmy');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError('');
    setPassword('');
    setConfirmPassword('');
    fetch('/api/auth/status')
      .then((r) => r.json())
      .then((d) => setConfigured(Boolean(d.configured)))
      .catch(() => setConfigured(true));
  }, [open]);

  if (!open) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (configured === false) {
      if (password.length < 6) {
        setError(
          lang === 'ar'
            ? 'يجب أن تتكون كلمة المرور من 6 أحرف على الأقل.'
            : 'Passcode must be at least 6 characters.'
        );
        return;
      }
      if (password !== confirmPassword) {
        setError(
          lang === 'ar' ? 'كلمتا المرور غير متطابقتين.' : 'Passcodes do not match.'
        );
        return;
      }
    }

    setLoading(true);
    try {
      const endpoint = configured === false ? '/api/auth/claim' : '/api/auth/login';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.token) {
        setError(data.error || 'Authentication failed.');
        setLoading(false);
        return;
      }
      onAuthenticated(data.token);
      onClose();
    } catch {
      setError(
        lang === 'ar' ? 'تعذر الاتصال بالخادم.' : 'Unable to reach authentication server.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="glass-elevated w-full max-w-md rounded-2xl border border-slate-200/80 dark:border-white/15 p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200/70 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            {configured === false ? (
              <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            ) : (
              <Lock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            )}
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {configured === false ? t.authClaimTitle : t.authTitle}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {configured === false && (
          <p className="mt-4 text-xs leading-relaxed text-slate-600 dark:text-slate-300 bg-amber-500/10 border border-amber-500/25 rounded-lg p-3">
            {t.authClaimDesc}
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              {t.authUsername}
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-lg bg-white dark:bg-slate-900/90 border border-slate-300 dark:border-white/15 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              {t.authPassword}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoFocus
              className="w-full px-3.5 py-2.5 rounded-lg bg-white dark:bg-slate-900/90 border border-slate-300 dark:border-white/15 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {configured === false && (
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                {t.authConfirmPassword}
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-lg bg-white dark:bg-slate-900/90 border border-slate-300 dark:border-white/15 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          )}

          {error && (
            <div className="text-xs text-rose-600 dark:text-rose-400 bg-rose-500/10 border border-rose-500/25 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              {t.authCancel}
            </button>
            <button
              type="submit"
              disabled={loading || configured === null}
              className="px-5 py-2 rounded-lg bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 text-sm font-semibold hover:bg-slate-800 dark:hover:bg-amber-400 disabled:opacity-50 transition-colors cursor-pointer"
            >
              {configured === false ? t.authClaimBtn : t.authLoginBtn}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
