import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Session } from '../types';
import { Modal } from '../components/Modal';
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
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Session | null>(null);
  const [form, setForm] = useState<SessionForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSessions();
  }, []);

  async function loadSessions() {
    setLoading(true);
    const { data } = await supabase
      .from('sessions')
      .select('*')
      .order('created_at', { ascending: false });
    setSessions(data ?? []);
    setLoading(false);
  }

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
        .from('sessions')
        .update(payload)
        .eq('id', editTarget.id)
        .select()
        .single();
      if (data) setSessions(prev => prev.map(s => s.id === editTarget.id ? data : s));
    } else {
      const { data } = await supabase
        .from('sessions')
        .insert(payload)
        .select()
        .single();
      if (data) setSessions(prev => [data, ...prev]);
    }

    setSaving(false);
    setShowModal(false);
  }

  return (
    <>
      <div className="page">
        <div className="container">
          <div className="page-header">
            <div>
              <h1 className="page-title">{t('sessions')}</h1>
            </div>
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
              {sessions.map(s => (
                <div key={s.id} className="course-card" onClick={() => onSelectSession(s)}>
                  <div className="course-card-info">
                    <div className="course-card-name">{s.name}</div>
                    {(s.prior_gpa !== null || s.prior_credits !== null) && (
                      <div className="course-card-meta">
                        {s.prior_gpa !== null && <span>GPA ant. {s.prior_gpa.toFixed(2)}</span>}
                        {s.prior_credits !== null && <><span>·</span><span>{s.prior_credits} {t('credits_suffix')}</span></>}
                      </div>
                    )}
                  </div>
                  <div className="course-card-right">
                    <div className="inline-actions" onClick={e => e.stopPropagation()}>
                      <button className="btn btn-ghost btn-sm" onClick={e => openEdit(s, e)} title={t('edit')}>✎</button>
                      <button className="btn btn-ghost btn-sm" onClick={e => handleDelete(s, e)} title={t('delete')} style={{ color: 'var(--danger)' }}>✕</button>
                    </div>
                  </div>
                </div>
              ))}
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
