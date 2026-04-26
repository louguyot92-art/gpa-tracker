import { useState } from 'react';
import { supabase } from '../lib/supabase';
import type { StringKey } from '../lib/i18n';

interface Props {
  t: (k: StringKey) => string;
  lang: 'fr' | 'en';
  setLang: (l: 'fr' | 'en') => void;
}

export function Auth({ t, lang, setLang }: Props) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) setError(t('loginError'));
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) {
          setError(error.message);
        } else if (data.user && !data.session) {
          // Email confirmation required
          setInfo(lang === 'fr'
            ? 'Compte créé ! Vérifie ton courriel pour confirmer ton inscription.'
            : 'Account created! Check your email to confirm your registration.'
          );
        }
        // If data.session exists, onAuthStateChange in App.tsx handles the redirect
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-title">
            GPA <span style={{ color: 'var(--accent)' }}>Tracker</span>
          </div>
          <div className="auth-logo-sub">HEC Montréal</div>
        </div>

        {info ? (
          <div style={{
            background: 'var(--success-light)',
            color: 'var(--success)',
            padding: '16px',
            borderRadius: 'var(--radius)',
            fontSize: 14,
            lineHeight: 1.5,
            textAlign: 'center',
          }}>
            {info}
          </div>
        ) : (
          <form className="auth-form" onSubmit={handleSubmit}>
            {error && <div className="auth-error">{error}</div>}
            <div className="field">
              <label>{t('email')}</label>
              <input
                className="input"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="field">
              <label>{t('password')}</label>
              <input
                className="input"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                minLength={6}
              />
            </div>
            <button
              className="btn btn-primary"
              type="submit"
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center', padding: '10px' }}
            >
              {loading ? '…' : (mode === 'login' ? t('login') : t('register'))}
            </button>
          </form>
        )}

        {!info && (
          <div className="auth-switch">
            {mode === 'login' ? t('noAccount') : t('hasAccount')}{' '}
            <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setInfo(''); }}>
              {mode === 'login' ? t('register') : t('login')}
            </button>
          </div>
        )}

        {info && (
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <button
              className="btn btn-secondary"
              onClick={() => { setInfo(''); setMode('login'); }}
            >
              {t('login')}
            </button>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')}
          >
            {lang === 'fr' ? 'EN' : 'FR'}
          </button>
        </div>
      </div>
    </div>
  );
}
