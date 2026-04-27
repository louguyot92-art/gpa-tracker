import { useState, useRef, useEffect } from 'react';
import type { Component, GradeEntry } from '../types';
import type { StringKey } from '../lib/i18n';
import { GRADE_SCALE } from '../lib/grades';
import { GradeBadge } from './GradeBadge';

function gradeColors(letter: string): { bg: string; fg: string } {
  const l = letter[0];
  if (l === 'A') return { bg: 'var(--success-sub)', fg: 'var(--success)' };
  if (l === 'B') return { bg: 'var(--accent-sub)',  fg: 'var(--accent)'  };
  if (l === 'C') return { bg: 'var(--warning-sub)', fg: 'var(--warning)' };
  return               { bg: 'var(--danger-sub)',  fg: 'var(--danger)'  };
}

function IcoEdit() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
}
function IcoTrash() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>;
}

interface Props {
  component: Component;
  gradeScale: GradeEntry[] | null;
  t: (k: StringKey) => string;
  onEdit: () => void;
  onDelete: () => void;
  onLetterChange: (letter: string) => void;
  showGroupAvg: boolean;
}

export function ComponentRow({ component, gradeScale, t, onEdit, onDelete, onLetterChange }: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  const isLetter = !!component.letter_grade;
  const pct = !isLetter && component.score !== null
    ? (component.score / component.max_score) * 100
    : null;

  const scale = gradeScale && gradeScale.length > 0
    ? [...gradeScale].sort((a, b) => b.min - a.min)
    : GRADE_SCALE;

  useEffect(() => {
    if (!pickerOpen) return;
    function onClickOutside(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [pickerOpen]);

  return (
    <div className="comp-row">
      {/* Name */}
      <div>
        <div className="comp-name">{component.name}</div>
        {component.group_avg !== null && (
          <div className="comp-sub">Moy. groupe : {component.group_avg}/{component.max_score}</div>
        )}
      </div>

      {/* Weight */}
      <div className="comp-weight">{component.weight}%</div>

      {/* Score */}
      <div className="comp-score" style={{ color: pct !== null ? undefined : 'var(--text3)' }}>
        {!isLetter && component.score !== null
          ? `${component.score}/${component.max_score}`
          : isLetter ? '' : '—'}
      </div>

      {/* Grade */}
      <div className="comp-grade">
        {isLetter ? (
          <div style={{ position: 'relative' }} ref={pickerRef}>
            <button
              className="grade-badge"
              style={{
                ...gradeColors(component.letter_grade!),
                border: 'none', cursor: 'pointer', fontWeight: 600,
              }}
              onClick={() => setPickerOpen(v => !v)}
            >
              {component.letter_grade}
            </button>
            {pickerOpen && (
              <div style={{
                position: 'absolute', right: 0, top: 'calc(100% + 6px)',
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 10, padding: 10,
                display: 'flex', flexWrap: 'wrap', gap: 5, width: 200,
                boxShadow: 'var(--sh-lg)', zIndex: 50,
              }}>
                {scale.map(entry => {
                  const c = gradeColors(entry.letter);
                  const isSelected = entry.letter === component.letter_grade;
                  return (
                    <button key={entry.letter} style={{
                      background: isSelected ? c.fg : c.bg,
                      color: isSelected ? 'white' : c.fg,
                      border: `2px solid ${isSelected ? c.fg : 'transparent'}`,
                      borderRadius: 6, padding: '3px 7px',
                      fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 12,
                      cursor: 'pointer', minWidth: 34, textAlign: 'center',
                    }} onClick={() => { onLetterChange(entry.letter); setPickerOpen(false); }}>
                      {entry.letter}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ) : pct !== null ? (
          <GradeBadge score={pct} />
        ) : (
          <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>
            {t('pending').toLowerCase()}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="comp-actions inline-actions">
        <button className="btn btn-ghost btn-icon btn-sm" onClick={onEdit} title={t('edit')}><IcoEdit /></button>
        <button className="btn btn-ghost btn-icon btn-sm" onClick={onDelete} title={t('delete')} style={{ color: 'var(--danger)' }}><IcoTrash /></button>
      </div>
    </div>
  );
}
