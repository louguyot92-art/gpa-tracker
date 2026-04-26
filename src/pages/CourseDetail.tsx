import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { Course, Component, GradeEntry } from '../types';
import { ComponentRow } from '../components/ComponentRow';
import { Simulator } from '../components/Simulator';
import { GradeBadge } from '../components/GradeBadge';
import { GradeScaleEditor } from '../components/GradeScaleEditor';
import { Modal } from '../components/Modal';
import { computeCourseScore, getGrade } from '../lib/grades';
import type { StringKey } from '../lib/i18n';

interface Props {
  course: Course;
  t: (k: StringKey) => string;
  lang: 'fr' | 'en';
  userId: string;
  onBack: () => void;
}

interface CompForm {
  name: string;
  weight: string;
  max_score: string;
  score: string;
  group_avg: string;
}

const EMPTY_FORM: CompForm = { name: '', weight: '', max_score: '100', score: '', group_avg: '' };

export function CourseDetail({ course, t, lang, userId, onBack }: Props) {
  const [courseData, setCourseData] = useState<Course>(course);
  const [components, setComponents] = useState<Component[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Component | null>(null);
  const [form, setForm] = useState<CompForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [showScaleEditor, setShowScaleEditor] = useState(false);
  const [pendingScale, setPendingScale] = useState<GradeEntry[] | null>(course.grade_scale);
  const [savingScale, setSavingScale] = useState(false);

  useEffect(() => {
    loadComponents();
  }, [course.id]);

  async function loadComponents() {
    setLoading(true);
    const { data } = await supabase
      .from('components')
      .select('*')
      .eq('course_id', course.id)
      .order('created_at', { ascending: true });
    setComponents(data ?? []);
    setLoading(false);
  }

  const totalWeight = components.reduce((s, c) => s + c.weight, 0);

  const score = useMemo(
    () => computeCourseScore(courseData, components),
    [courseData, components]
  );

  const grade = score !== null ? getGrade(score, courseData.grade_scale) : null;

  function openCreate() {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  }

  function openEdit(comp: Component) {
    setEditTarget(comp);
    setForm({
      name: comp.name,
      weight: comp.weight.toString(),
      max_score: comp.max_score.toString(),
      score: comp.score?.toString() ?? '',
      group_avg: comp.group_avg?.toString() ?? '',
    });
    setShowModal(true);
  }

  async function handleDelete(comp: Component) {
    if (!window.confirm(t('confirmDeleteDesc'))) return;
    await supabase.from('components').delete().eq('id', comp.id);
    setComponents(prev => prev.filter(c => c.id !== comp.id));
  }

  async function handleSave() {
    if (!form.name.trim() || !form.weight) return;
    setSaving(true);

    const payload = {
      name: form.name.trim(),
      weight: parseFloat(form.weight),
      max_score: parseFloat(form.max_score) || 100,
      score: form.score !== '' ? parseFloat(form.score) : null,
      group_avg: form.group_avg !== '' ? parseFloat(form.group_avg) : null,
      course_id: course.id,
      user_id: userId,
    };

    if (editTarget) {
      const { data } = await supabase
        .from('components')
        .update(payload)
        .eq('id', editTarget.id)
        .select()
        .single();
      if (data) setComponents(prev => prev.map(c => c.id === editTarget.id ? data : c));
    } else {
      const { data } = await supabase
        .from('components')
        .insert(payload)
        .select()
        .single();
      if (data) setComponents(prev => [...prev, data]);
    }

    setSaving(false);
    setShowModal(false);
  }

  async function handleSaveScale() {
    setSavingScale(true);
    const { data } = await supabase
      .from('courses')
      .update({ grade_scale: pendingScale })
      .eq('id', course.id)
      .select()
      .single();
    if (data) setCourseData(data);
    setSavingScale(false);
    setShowScaleEditor(false);
  }

  const handleScaleChange = useCallback((scale: GradeEntry[] | null) => {
    setPendingScale(scale);
  }, []);

  const weightOk = Math.abs(totalWeight - 100) < 0.01;
  const weightOver = totalWeight > 100;
  const hasCustomScale = courseData.grade_scale && courseData.grade_scale.length > 0;

  return (
    <>
      <div className="page">
        <div className="container">
          <button className="back-btn" onClick={onBack}>
            ← {t('back')}
          </button>

          <div className="page-header">
            <div>
              <h1 className="page-title">{courseData.name}</h1>
              <div className="page-subtitle">
                {courseData.credits} {t('credits_suffix')}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {score !== null && (
                <div style={{ textAlign: 'right' }}>
                  <GradeBadge score={score} customScale={courseData.grade_scale} />
                  <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 13, color: 'var(--text2)', marginTop: 2 }}>
                    {score.toFixed(1)}% · {grade?.gpa.toFixed(2)}
                  </div>
                </div>
              )}
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => { setPendingScale(courseData.grade_scale); setShowScaleEditor(true); }}
                title={lang === 'fr' ? 'Grille de notation' : 'Grading scale'}
              >
                {lang === 'fr' ? 'Grille' : 'Scale'}
              </button>
              <button className="btn btn-primary" onClick={openCreate}>
                + {t('newComponent')}
              </button>
            </div>
          </div>

          {/* Weight bar */}
          <div className="weight-bar-container">
            <div className="weight-bar-label">
              <span>{t('totalWeight')}</span>
              <span className={weightOk ? 'weight-ok' : weightOver ? 'weight-over' : ''}>
                {totalWeight.toFixed(0)}% / 100%
                {weightOver && ` · ${t('weightOver')}`}
                {!weightOk && !weightOver && components.length > 0 && ` · ${t('weightWarning')}`}
              </span>
            </div>
            <div className="progress-bar-wrap">
              <div
                className="progress-bar-fill"
                style={{
                  width: `${Math.min(totalWeight, 100)}%`,
                  background: weightOver ? 'var(--danger)' : weightOk ? 'var(--success)' : 'var(--accent)',
                }}
              />
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', color: 'var(--text3)', padding: 48 }}>…</div>
          ) : components.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon" style={{ fontSize: 32, color: 'var(--text3)' }}>—</div>
              <div className="empty-state-title">{t('noComponents')}</div>
              <p>{t('noComponentsDesc')}</p>
            </div>
          ) : (
            <>
              <div className="card-section" style={{ marginBottom: 20 }}>
                {components.map(comp => (
                  <ComponentRow
                    key={comp.id}
                    component={comp}
                    t={t}
                    onEdit={() => openEdit(comp)}
                    onDelete={() => handleDelete(comp)}
                    showGroupAvg={courseData.grading_mode === 'curved'}
                  />
                ))}
              </div>

              <Simulator course={courseData} components={components} t={t} />
            </>
          )}
        </div>
      </div>

      {/* Grade scale modal */}
      {showScaleEditor && (
        <Modal
          title={lang === 'fr' ? 'Grille de notation' : 'Grading scale'}
          onClose={() => setShowScaleEditor(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setShowScaleEditor(false)}>{t('cancel')}</button>
              <button className="btn btn-primary" onClick={handleSaveScale} disabled={savingScale}>
                {savingScale ? '…' : t('save')}
              </button>
            </>
          }
        >
          <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 4 }}>
            {lang === 'fr'
              ? 'Définissez les seuils de la grille de ce cours. La note minimale pour chaque lettre doit être en pourcentage (0–100).'
              : 'Set the grade thresholds for this course. The minimum score for each letter should be a percentage (0–100).'}
          </p>
          <GradeScaleEditor
            scale={courseData.grade_scale}
            onChange={handleScaleChange}
            lang={lang}
          />
        </Modal>
      )}

      {/* Component modal */}
      {showModal && (
        <Modal
          title={editTarget ? t('editComponent') : t('newComponent')}
          onClose={() => setShowModal(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>{t('cancel')}</button>
              <button
                className="btn btn-primary"
                onClick={handleSave}
                disabled={saving || !form.name.trim() || !form.weight}
              >
                {saving ? '…' : t('save')}
              </button>
            </>
          }
        >
          <div className="field">
            <label>{t('componentName')}</label>
            <input
              className="input"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1) }))}
              placeholder="ex: Intra, Final, Quiz…"
              autoFocus
            />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
              {(lang === 'fr'
                ? ['Intra', 'Final', 'Quiz', 'Devoir', 'Travail de groupe', 'Participation', 'Présentation', 'Cas', 'Rapport']
                : ['Midterm', 'Final', 'Quiz', 'Assignment', 'Group work', 'Participation', 'Presentation', 'Case study']
              ).map(s => (
                <button
                  key={s}
                  type="button"
                  className="tag"
                  style={{ cursor: 'pointer', background: form.name === s ? 'var(--accent)' : undefined, color: form.name === s ? 'white' : undefined }}
                  onClick={() => setForm(f => ({ ...f, name: s }))}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="field">
              <label>{t('weight')} (%)</label>
              <input
                className="input"
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={form.weight}
                onChange={e => setForm(f => ({ ...f, weight: e.target.value }))}
                placeholder="ex: 40"
              />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 6 }}>
                {[5, 10, 15, 20, 25, 30, 40, 50].map(w => (
                  <button
                    key={w}
                    type="button"
                    className="tag"
                    style={{ cursor: 'pointer', background: form.weight === String(w) ? 'var(--accent)' : undefined, color: form.weight === String(w) ? 'white' : undefined }}
                    onClick={() => setForm(f => ({ ...f, weight: String(w) }))}
                  >
                    {w}%
                  </button>
                ))}
              </div>
            </div>
            <div className="field">
              <label>{t('maxScore')}</label>
              <input
                className="input"
                type="number"
                min="1"
                step="1"
                value={form.max_score}
                onChange={e => setForm(f => ({ ...f, max_score: e.target.value }))}
                placeholder="ex: 100"
              />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="field">
              <label>{t('score')} (sur {form.max_score || '?'})</label>
              <input
                className="input"
                type="number"
                min="0"
                max={form.max_score || undefined}
                step="0.5"
                value={form.score}
                onChange={e => setForm(f => ({ ...f, score: e.target.value }))}
                placeholder={t('pending')}
              />
            </div>
            {courseData.grading_mode === 'curved' && (
              <div className="field">
                <label>{t('groupAvg')}</label>
                <input
                  className="input"
                  type="number"
                  min="0"
                  max={form.max_score || undefined}
                  step="0.5"
                  value={form.group_avg}
                  onChange={e => setForm(f => ({ ...f, group_avg: e.target.value }))}
                  placeholder="—"
                />
              </div>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}
