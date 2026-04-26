import type { Component } from '../types';
import type { StringKey } from '../lib/i18n';

interface Props {
  component: Component;
  t: (k: StringKey) => string;
  onEdit: () => void;
  onDelete: () => void;
  showGroupAvg: boolean;
}

export function ComponentRow({ component, t, onEdit, onDelete }: Props) {
  const pct = component.score !== null
    ? (component.score / component.max_score) * 100
    : null;

  const barColor = pct === null ? 'var(--border)'
    : pct >= 86 ? 'var(--success)'
    : pct >= 70 ? 'var(--accent)'
    : pct >= 60 ? 'var(--warning)'
    : 'var(--danger)';

  return (
    <div style={{
      padding: '14px 20px',
      borderBottom: '1px solid var(--border)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ fontWeight: 500, fontSize: 15 }}>{component.name}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          {component.score !== null ? (
            <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 14, color: 'var(--text)' }}>
              {component.score} / {component.max_score}
            </span>
          ) : (
            <span style={{ fontSize: 13, color: 'var(--text3)' }}>{t('pending')}</span>
          )}
          <div className="inline-actions">
            <button className="btn btn-ghost btn-sm" onClick={onEdit} title={t('edit')}>✎</button>
            <button className="btn btn-ghost btn-sm" onClick={onDelete} title={t('delete')} style={{ color: 'var(--danger)' }}>✕</button>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 10 }}>
        <div className="progress-bar-wrap" style={{ height: 4 }}>
          <div
            className="progress-bar-fill"
            style={{ width: pct !== null ? `${pct}%` : '0%', background: barColor }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
        <span style={{ fontSize: 12, color: 'var(--text3)' }}>{component.weight}% du cours</span>
        {pct !== null && (
          <span style={{ fontSize: 12, color: 'var(--text3)', fontFamily: 'DM Mono, monospace' }}>
            {Math.round(pct)}%
          </span>
        )}
      </div>
    </div>
  );
}
