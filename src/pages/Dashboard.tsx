import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import type { Session, Course, Component } from '../types';
import { Modal } from '../components/Modal';
import { computeSessionGpa, computeCumulativeGpa } from '../lib/grades';
import type { StringKey } from '../lib/i18n';

interface Props {
  t: (k: StringKey) => string;
  userId: string;
  onSelectSession: (s: Session) => void;
}

interface SessionForm {
  name: string;
  prior_gpa: string;
  prior_credits: string;
}

const EMPTY_FORM: SessionForm = { name: '', prior_gpa: '', prior_credits: '' };

export function Dashboard({ t, userId, onSelectSession }: Props) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [coursesBySession, setCoursesBySession] = useState<Record<string, Course[]>>({});
  const [compsByCourse, setCompsByCourse] = useState<Record<string, Component[]>>({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Session | null>(null);
  const [form, setForm] = useState<SessionForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);

    const { data: sessionsData } = await supabase
      .from('sessions')
      .select('*')
      .order('created_at', { ascending: false });

    const loadedSessions: Session[] = sessionsData ?? [];
    setSessions(loadedSessions);

    if (loadedSessions.length === 0) { setLoading(false); return; }

    const sessionIds = loadedSessions.map(s => s.id);
    const { data: coursesData } = await supabase
      .from('courses')
      .select('*')
      .in('session_id', sessionIds);

    const loadedCourses: Course[] = coursesData ?? [];
    const cbs: Record<string, Course[]> = {};
    for (const c of loadedCourses) {
      if (!cbs[c.session_id]) cbs[c.session_id] = [];
      cbs[c.session_id].push(c);
    }
    setCoursesBySession(cbs);

    if (loadedCourses.length === 0) { setLoading(false); return; }

    const courseIds = loadedCourses.map(c => c.id);
    const { data: compsData } = await supabase
      .from('components')
      .select('*')
      .in('course_id', courseIds);

    const cbc: Record<string, Component[]> = {};
    for (const comp of (compsData ?? [])) {
      if (!cbc[comp.course_id]) cbc[comp.course_id] = [];
      cbc[comp.course_id].push(comp);
    }
    setCompsByCourse(cbc);
    setLoading(false);
  }

  // GPA per session
  const sessionGpas = useMemo(() => {
    const result: Record<string, number | null> = {};
    for (const s of sessions) {
      const courses = coursesBySession[s.id] ?? [];
      result[s.id] = computeSessionGpa(courses, compsByCourse);
    }
    return result;
  }, [sessions, coursesBySession, compsByCourse]);

  // Global cumulative GPA across all sessions
  const globalGpa = useMemo(() => {
    const sorted = [...sessions].sort((a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    let cumGpa: number | null = null;
    let cumCredits = 0;

    for (const s of sorted) {
      const courses = coursesBySession[s.id] ?? [];
      const sessionCredits = courses.reduce((sum, c) => sum + c.credits, 0);
      const sGpa = sessionGpas[s.id] ?? null;

      // Start with prior if first session
      if (cumGpa === null && s.prior_gpa !== null) {
        cumGpa = s.prior_gpa;
        cumCredits = s.prior_credits ?? 0;
      }

      if (sGpa !== null && sessionCredits > 0) {
        cumGpa = computeCumulativeGpa(sGpa, sessionCredits, cumGpa, cumCredits) ?? cumGpa;
        cumCredits += sessionCredits;
      }
    }
    return { gpa: cumGpa, credits: cumCredits };
  }, [sessions, coursesBySession, sessionGpas]);

  function openCreate() {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  }

  function openEdit(s: Session, e: React.MouseEvent) {
    e.stopPropagation();
    setEditTarget(s);
    setForm({
      name: s.name,
      prior_gpa: s.prior_gpa?.toString() ?? '',
      prior_credits: s.prior_credits?.toString() ?? '',
    });
    setShowModal(true);
  }

  async function handleDelete(s: Session, e: React.MouseEvent) {
    e.stopPropagation();
    if (!window.confirm(t('confirmDeleteDesc'))) return;
    await supabase.from('sessions').delete().eq('id', s.id);
    setSessions(prev => prev.filter(x => x.id !== s.id));
  }

  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);

    const payload = {
      name: form.name.trim(),
      prior_gpa: form.prior_gpa !== '' ? parseFloat(form.prior_gpa) : null,
      prior_credits: form.prior_credits !== '' ? parseFloat(form.prior_credits) : null,
      user_id: userId,
    };

    if (editTarget) {
      const { data } = await supabase
        .from('sessions').update(payload).eq('id', editTarget.id).select().single();
      if (data) setSessions(prev => prev.map(s => s.id === editTarget.id ? data : s));
    } else {
      const { data } = await supabase
        .from('sessions').insert(payload).select().single();
      if (data) setSessions(prev => [data, ...prev]);
    }

    setSaving(false);
    setShowModal(false);
    loadAll();
  }

  const hasStats = globalGpa.gpa !== null || globalGpa.credits > 0;

  return (
    <>
      <div className="page">
        <div className="container">

          {/* Global stats banner */}
          {!loading && hasStats && (
            <div className="stats-strip" style={{ marginBottom: 24 }}>
              {globalGpa.gpa !== null && (
                <div className="stat-card">
                  <div className="stat-label">GPA cumulatif</div>
                  <div className="stat-value">{globalGpa.gpa.toFixed(2)}</div>
                  <div className="stat-sub">{globalGpa.credits} {t('credits_suffix')} au total</div>
                </div>
              )}
              <div className="stat-card">
                <div className="stat-label">Sessions</div>
                <div className="stat-value">{sessions.length}</div>
                <div className="stat-sub">
                  {Object.values(coursesBySession).reduce((s, c) => s + c.length, 0)} cours
                </div>
              </div>
            </div>
          )}

          <div className="page-header">
            <h1 className="page-title">{t('sessions')}</h1>
            <button className="btn btn-primary" onClick={openCreate}>
              + {t('newSession')}
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', color: 'var(--text3)', padding: 48 }}>…</div>
          ) : sessions.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon" style={{ fontSize: 32, color: 'var(--text3)' }}>—</div>
              <div className="empty-state-title">{t('noSessions')}</div>
              <p>{t('noSessionsDesc')}</p>
            </div>
          ) : (
            <div className="course-grid">
              {sessions.map(s => {
                const sGpa = sessionGpas[s.id];
                const courses = coursesBySession[s.id] ?? [];
                const credits = courses.reduce((sum, c) => sum + c.credits, 0);
                const graded = courses.filter(c =>
                  (compsByCourse[c.id] ?? []).some(comp => comp.score !== null)
                ).length;

                return (
                  <div key={s.id} className="course-card" onClick={() => onSelectSession(s)}>
                    <div className="course-card-info">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                        <div className="course-card-name">{s.name}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                          {sGpa !== null ? (
                            <span style={{
                              fontFamily: 'DM Mono, monospace',
                              fontSize: 20,
                              fontWeight: 500,
                              color: sGpa >= 3.7 ? 'var(--success)' : sGpa >= 2.7 ? 'var(--accent)' : sGpa >= 2.0 ? 'var(--warning)' : 'var(--danger)',
                            }}>
                              {sGpa.toFixed(2)}
                            </span>
                          ) : (
                            <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 18, color: 'var(--text3)' }}>—</span>
                          )}
                          <div className="inline-actions" onClick={e => e.stopPropagation()}>
                            <button className="btn btn-ghost btn-sm" onClick={e => openEdit(s, e)} title={t('edit')}>✎</button>
                            <button className="btn btn-ghost btn-sm" onClick={e => handleDelete(s, e)} title={t('delete')} style={{ color: 'var(--danger)' }}>✕</button>
                          </div>
                        </div>
                      </div>

                      <div style={{ marginTop: 10 }}>
                        <div className="progress-bar-wrap" style={{ height: 4 }}>
                          <div className="progress-bar-fill" style={{
                            width: sGpa !== null ? `${(sGpa / 4.3) * 100}%` : '0%',
                            background: sGpa === null ? 'var(--border)'
                              : sGpa >= 3.7 ? 'var(--success)'
                              : sGpa >= 2.7 ? 'var(--accent)'
                              : sGpa >= 2.0 ? 'var(--warning)'
                              : 'var(--danger)',
                          }} />
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
                        <span style={{ fontSize: 12, color: 'var(--text3)' }}>
                          {courses.length > 0 ? `${courses.length} cours · ${credits} ${t('credits_suffix')}` : 'Aucun cours'}
                        </span>
                        {graded > 0 && courses.length > 0 && (
                          <span style={{ fontSize: 12, color: 'var(--text3)' }}>
                            {graded}/{courses.length} notés
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <Modal
          title={editTarget ? t('editSession') : t('newSession')}
          onClose={() => setShowModal(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>{t('cancel')}</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving || !form.name.trim()}>
                {saving ? '…' : t('save')}
              </button>
            </>
          }
        >
          <div className="field">
            <label>{t('sessionName')}</label>
            <input
              className="input"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1) }))}
              placeholder="ex: Automne 2025"
              autoFocus
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="field">
              <label>{t('priorGpa')}</label>
              <input
                className="input"
                type="number"
                min="0"
                max="4.3"
                step="0.01"
                value={form.prior_gpa}
                onChange={e => setForm(f => ({ ...f, prior_gpa: e.target.value }))}
                placeholder="ex: 3.20"
              />
            </div>
            <div className="field">
              <label>{t('priorCredits')}</label>
              <input
                className="input"
                type="number"
                min="0"
                step="1"
                value={form.prior_credits}
                onChange={e => setForm(f => ({ ...f, prior_credits: e.target.value }))}
                placeholder="ex: 30"
              />
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
