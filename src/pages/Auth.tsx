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
          setInfo(lang === 'fr'
            ? 'Compte créé ! Vérifie ton courriel pour confirmer ton inscription.'
            : 'Account created! Check your email to confirm your registration.'
          );
        }
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-layout page-enter">
      {/* Left brand panel */}
      <div className="auth-brand">
        <div className="brand-gpa">3.87</div>
        <div className="brand-label">GPA Tracker</div>
        <div className="brand-tagline">
          {lang === 'fr'
            ? 'Suivez vos notes, simulez vos résultats, atteignez vos objectifs.'
            : 'Track your grades, simulate results, reach your goals.'}
        </div>
      </div>

      {/* Right form panel */}
      <div className="auth-side">
        <div className="auth-card">
          <div className="auth-title">
            {mode === 'login'
              ? (lang === 'fr' ? 'Connexion' : 'Sign in')
              : (lang === 'fr' ? 'Créer un compte' : 'Create account')}
          </div>
          <div className="auth-sub">
            {mode === 'login'
              ? (lang === 'fr' ? 'Bienvenue de retour.' : 'Welcome back.')
              : (lang === 'fr' ? 'Commencez à suivre vos notes.' : 'Start tracking your grades.')}
          </div>

          {info ? (
            <div style={{
              background: 'var(--success-sub)', color: 'var(--success)',
              padding: '14px 16px', borderRadius: 'var(--r)',
              fontSize: 13, lineHeight: 1.5, textAlign: 'center',
            }}>
              {info}
            </div>
          ) : (
            <form className="auth-form" onSubmit={handleSubmit}>
              {error && <div className="auth-error">{error}</div>}
              <div className="field">
                <label>{t('email')}</label>
                <input className="input" type="email" value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="vous@exemple.com" required autoComplete="email" />
              </div>
              <div className="field">
                <label>{t('password')}</label>
                <input className="input" type="password" value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" required
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  minLength={6} />
              </div>
              <button className="btn btn-primary" type="submit" disabled={loading}
                style={{ justifyContent: 'center', padding: '11px 16px', fontSize: 14, marginTop: 4 }}>
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
              <button className="btn btn-secondary"
                onClick={() => { setInfo(''); setMode('login'); }}>
                {t('login')}
              </button>
            </div>
          )}

          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <button className="btn btn-ghost btn-sm"
              onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')}>
              {lang === 'fr' ? 'EN' : 'FR'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
