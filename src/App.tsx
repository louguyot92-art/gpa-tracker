import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import { useLang } from './lib/i18n';
import type { Session, Course } from './types';
import { Auth } from './pages/Auth';
import { Dashboard } from './pages/Dashboard';
import { SessionView } from './pages/SessionView';
import { CourseDetail } from './pages/CourseDetail';

type View =
  | { page: 'dashboard' }
  | { page: 'session'; session: Session }
  | { page: 'course'; session: Session; course: Course };

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [view, setView] = useState<View>({ page: 'dashboard' });
  const { lang, setLang, t } = useLang();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setAuthLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session) setView({ page: 'dashboard' });
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  if (authLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text3)' }}>
        …
      </div>
    );
  }

  if (!user) {
    return <Auth t={t} lang={lang} setLang={setLang} />;
  }

  return (
    <div className="app-layout">
      <nav className="nav">
        <div className="container nav-inner">
          <button
            className="nav-brand"
            onClick={() => setView({ page: 'dashboard' })}
            style={{ background: 'none', border: 'none' }}
          >
            GPA <span>Tracker</span>
          </button>
          <div className="nav-actions">
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')}
            >
              {lang === 'fr' ? 'EN' : 'FR'}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
              {t('logout')}
            </button>
          </div>
        </div>
      </nav>

      {view.page === 'dashboard' && (
        <Dashboard
          t={t}
          userId={user.id}
          onSelectSession={session => setView({ page: 'session', session })}
        />
      )}

      {view.page === 'session' && (
        <SessionView
          session={view.session}
          t={t}
          userId={user.id}
          onBack={() => setView({ page: 'dashboard' })}
          onSelectCourse={course => setView({ page: 'course', session: view.session, course })}
        />
      )}

      {view.page === 'course' && (
        <CourseDetail
          course={view.course}
          t={t}
          lang={lang}
          userId={user.id}
          onBack={() => setView({ page: 'session', session: view.session })}
        />
      )}
    </div>
  );
}
