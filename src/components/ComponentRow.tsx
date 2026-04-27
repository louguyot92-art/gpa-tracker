import { useState, useRef, useEffect } from 'react';
import type { Component, GradeEntry } from '../types';
import type { StringKey } from '../lib/i18n';
import { GRADE_SCALE } from '../lib/grades';

const COLOR_MAP: Record<string, { bg: string; color: string }> = {
  'A+': { bg: '#dcfce7', color: '#15803d' },
  'A':  { bg: '#dcfce7', color: '#15803d' },
  'A-': { bg: '#dcfce7', color: '#15803d' },
  'B+': { bg: '#dbeafe', color: '#1d4ed8' },
  'B':  { bg: '#dbeafe', color: '#1d4ed8' },
  'B-': { bg: '#dbeafe', color: '#1d4ed8' },
  'C+': { bg: '#fef9c3', color: '#a16207' },
  'C':  { bg: '#fef9c3', color: '#a16207' },
  'C-': { bg: '#fef9c3', color: '#a16207' },
  'D+': { bg: '#ffedd5', color: '#c2410c' },
  'D':  { bg: '#ffedd5', color: '#c2410c' },
  'E':  { bg: '#fee2e2', color: '#dc2626' },
};

function colorForLetter(letter: string) {
  if (letter.startsWith('A')) return { bg: '#dcfce7', color: '#15803d' };
  if (letter.startsWith('B')) return { bg: '#dbeafe', color: '#1d4ed8' };
  if (letter.startsWith('C')) return { bg: '#fef9c3', color: '#a16207' };
  if (letter.startsWith('D')) return { bg: '#ffedd5', color: '#c2410c' };
  return { bg: '#fee2e2', color: '#dc2626' };
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

  const barColor = pct === null ? 'var(--border)'
    : pct >= 86 ? 'var(--success)'
    : pct >= 70 ? 'var(--accent)'
    : pct >= 60 ? 'var(--warning)'
    : 'var(--danger)';

  const letterColors = isLetter
    ? (COLOR_MAP[component.letter_grade!] ?? colorForLetter(component.letter_grade!))
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
    <div className="comp-row" style={{
      padding: '14px 20px',
      borderBottom: '1px solid var(--border)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ fontWeight: 500, fontSize: 15 }}>{component.name}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          {isLetter ? (
            <div style={{ position: 'relative' }} ref={pickerRef}>
              <button
                className="grade-badge"
                style={{
                  background: letterColors!.bg,
                  color: letterColors!.color,
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
                onClick={() => setPickerOpen(v => !v)}
                title="Changer la lettre"
              >
                {component.letter_grade}
              </button>
              {pickerOpen && (
                <div style={{
                  position: 'absolute',
                  right: 0,
                  top: 'calc(100% + 6px)',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  padding: '10px',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 6,
                  width: 200,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                  zIndex: 50,
                }}>
                  {scale.map(entry => {
                    const c = COLOR_MAP[entry.letter] ?? colorForLetter(entry.letter);
                    const isSelected = entry.letter === component.letter_grade;
                    return (
                      <button
                        key={entry.letter}
                        style={{
                          background: isSelected ? c.color : c.bg,
                          color: isSelected ? 'white' : c.color,
                          border: isSelected ? `2px solid ${c.color}` : '2px solid transparent',
                          borderRadius: 6,
                          padding: '4px 8px',
                          fontFamily: 'DM Mono, monospace',
                          fontWeight: 600,
                          fontSize: 13,
                          cursor: 'pointer',
                          minWidth: 36,
                          textAlign: 'center',
                        }}
                        onClick={() => {
                          onLetterChange(entry.letter);
                          setPickerOpen(false);
                        }}
                      >
                        {entry.letter}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : component.score !== null ? (
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

      {!isLetter && (
        <div style={{ marginTop: 10 }}>
          <div className="progress-bar-wrap" style={{ height: 4 }}>
            <div
              className="progress-bar-fill"
              style={{ width: pct !== null ? `${pct}%` : '0%', background: barColor }}
            />
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: isLetter ? 4 : 5 }}>
        <span style={{ fontSize: 12, color: 'var(--text3)' }}>{component.weight}% du cours</span>
        {!isLetter && pct !== null && (
          <span style={{ fontSize: 12, color: 'var(--text3)', fontFamily: 'DM Mono, monospace' }}>
            {Math.round(pct)}%
          </span>
        )}
      </div>
    </div>
  );
}
