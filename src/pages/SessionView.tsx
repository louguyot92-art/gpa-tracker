import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import type { Session, Course, Component } from '../types';
import { CourseCard } from '../components/CourseCard';
import { Modal } from '../components/Modal';
import {
  computeSessionGpa,
  computeCumulativeGpa,
} from '../lib/grades';
import type { StringKey } from '../lib/i18n';

interface Props {
  session: Session;
  t: (k: StringKey) => string;
  userId: string;
  onBack: () => void;
  onSelectCourse: (c: Course) => void;
}

interface CourseForm {
  name: string;
  credits: string;
  grading_mode: 'absolute' | 'curved';
}

const EMPTY_COURSE: CourseForm = { name: '', credits: '3', grading_mode: 'absolute' };

export function SessionView({ session, t, userId, onBack, onSelectCourse }: Props) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [compsByCourse, setCompsByCourse] = useState<Record<string, Component[]>>({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Course | null>(null);
  const [form, setForm] = useState<CourseForm>(EMPTY_COURSE);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, [session.id]);

  async function loadData() {
    setLoading(true);
    const { data: coursesData } = await supabase
      .from('courses')
      .select('*')
      .eq('session_id', session.id)
      .order('created_at', { ascending: true });

    const loadedCourses = coursesData ?? [];
    setCourses(loadedCourses);

    if (loadedCourses.length > 0) {
      const ids = loadedCourses.map(c => c.id);
      const { data: compsData } = await supabase
        .from('components')
        .select('*')
        .in('course_id', ids);

      const map: Record<string, Component[]> = {};
      for (const comp of (compsData ?? [])) {
        if (!map[comp.course_id]) map[comp.course_id] = [];
        map[comp.course_id].push(comp);
      }
      setCompsByCourse(map);
    }

    setLoading(false);
  }

  const sessionGpa = useMemo(
    () => computeSessionGpa(courses, compsByCourse),
    [courses, compsByCourse]
  );

  const sessionCredits = courses.reduce((s, c) => s + c.credits, 0);

  const cumulativeGpa = useMemo(
    () => computeCumulativeGpa(
      sessionGpa,
      sessionCredits,
      session.prior_gpa,
      session.prior_credits
    ),
    [sessionGpa, sessionCredits, session]
  );

  function openCreate() {
    setEditTarget(null);
    setForm(EMPTY_COURSE);
    setShowModal(true);
  }

  function openEdit(c: Course, e: React.MouseEvent) {
    e.stopPropagation();
    setEditTarget(c);
    setForm({ name: c.name, credits: c.credits.toString(), grading_mode: c.grading_mode });
    setShowModal(true);
  }

  async function handleDelete(c: Course, e: React.MouseEvent) {
    e.stopPropagation();
    if (!window.confirm(t('confirmDeleteDesc'))) return;
    await supabase.from('courses').delete().eq('id', c.id);
    setCourses(prev => prev.filter(x => x.id !== c.id));
    setCompsByCourse(prev => { const next = { ...prev }; delete next[c.id]; return next; });
  }

  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);

    const payload = {
      name: form.name.trim(),
      credits: parseFloat(form.credits) || 3,
      grading_mode: form.grading_mode,
      session_id: session.id,
      user_id: userId,
    };

    if (editTarget) {
      const { data } = await supabase
        .from('courses')
        .update(payload)
        .eq('id', editTarget.id)
        .select()
        .single();
      if (data) setCourses(prev => prev.map(c => c.id === editTarget.id ? data : c));
    } else {
      const { data } = await supabase
        .from('courses')
        .insert(payload)
        .select()
        .single();
      if (data) setCourses(prev => [...prev, data]);
    }

    setSaving(false);
    setShowModal(false);
  }

  const formatGpa = (v: number | null) =>
    v !== null ? v.toFixed(2) : '—';

  return (
    <>
      <div className="page page-enter">
        <div className="container">
          <button className="back-btn" onClick={onBack}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            {t('back')}
          </button>

          <div className="page-header">
            <div>
              <h1 className="page-title">{session.name}</h1>
            </div>
            <button className="btn btn-primary" onClick={openCreate}>
              + {t('newCourse')}
            </button>
          </div>

          <div className="stats-strip">
            <div className={`stat-card${sessionGpa !== null ? ' highlight' : ''}`}>
              <div className="top-line" />
              <div className="stat-label">{t('sessionGpa')}</div>
              <div className="stat-value">{formatGpa(sessionGpa)}</div>
              <div className="stat-sub">{sessionCredits} {t('credits_suffix')}</div>
            </div>
            <div className={`stat-card${cumulativeGpa !== null ? ' highlight' : ''}`}>
              <div className="top-line" />
              <div className="stat-label">{t('cumulativeGpa')}</div>
              <div className="stat-value">{formatGpa(cumulativeGpa)}</div>
              <div className="stat-sub">{sessionCredits} {t('credits_suffix')}</div>
            </div>
            {session.prior_gpa !== null && (
              <div className="stat-card highlight">
                <div className="top-line" />
                <div className="stat-label">GPA ant.</div>
                <div className="stat-value">{session.prior_gpa.toFixed(2)}</div>
                <div className="stat-sub">{session.prior_credits ?? 0} {t('credits_suffix')}</div>
              </div>
            )}
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', color: 'var(--text3)', padding: 48 }}>…</div>
          ) : courses.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon" style={{ fontSize: 32, color: 'var(--text3)' }}>—</div>
              <div className="empty-state-title">{t('noCourses')}</div>
              <p>{t('noCoursesDesc')}</p>
            </div>
          ) : (
            <div className="course-grid">
              {courses.map(c => (
                <CourseCard
                  key={c.id}
                  course={c}
                  components={compsByCourse[c.id] ?? []}
                  t={t}
                  onClick={() => onSelectCourse(c)}
                  onEdit={e => openEdit(c, e)}
                  onDelete={e => handleDelete(c, e)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <Modal
          title={editTarget ? t('editCourse') : t('newCourse')}
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
            <label>{t('courseName')}</label>
            <input
              className="input"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1) }))}
              placeholder="ex: Comptabilité financière"
              autoFocus
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="field">
              <label>{t('credits')}</label>
              <input
                className="input"
                type="number"
                min="1"
                max="9"
                step="1"
                value={form.credits}
                onChange={e => setForm(f => ({ ...f, credits: e.target.value }))}
              />
            </div>
            <div className="field">
              <label>{t('gradingMode')}</label>
              <select
                className="input"
                value={form.grading_mode}
                onChange={e => setForm(f => ({ ...f, grading_mode: e.target.value as 'absolute' | 'curved' }))}
              >
                <option value="absolute">{t('absolute')}</option>
                <option value="curved">{t('curved')}</option>
              </select>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
