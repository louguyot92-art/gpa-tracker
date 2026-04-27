import { useState, useMemo } from 'react';
import type { Course, Component } from '../types';
import { computeCourseScore, getGrade } from '../lib/grades';
import { GradeBadge } from './GradeBadge';
import type { StringKey } from '../lib/i18n';

interface Props {
  course: Course;
  components: Component[];
  t: (k: StringKey) => string;
}

export function Simulator({ course, components, t }: Props) {
  const pending = components.filter(c => c.score === null && !c.letter_grade);

  const [overrides, setOverrides] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    for (const c of pending) {
      init[c.id] = c.max_score * 0.75;
    }
    return init;
  });

  const projectedScore = useMemo(
    () => computeCourseScore(course, components, overrides),
    [course, components, overrides]
  );

  if (pending.length === 0) return null;

  const grade = projectedScore !== null ? getGrade(projectedScore, course.grade_scale) : null;

  return (
    <div className="simulator">
      <div className="simulator-title">{t('simTitle')}</div>
      {pending.map(comp => {
        const val = overrides[comp.id] ?? comp.max_score * 0.75;
        const pct = (val / comp.max_score) * 100;
        return (
          <div className="sim-row" key={comp.id}>
            <div className="sim-row-label">
              <span>{comp.name} ({comp.weight}%)</span>
              <span>{val.toFixed(1)} / {comp.max_score} &nbsp;({pct.toFixed(0)}%)</span>
            </div>
            <input
              type="range"
              min={0}
              max={comp.max_score}
              step={0.5}
              value={val}
              onChange={e => setOverrides(prev => ({ ...prev, [comp.id]: parseFloat(e.target.value) }))}
            />
          </div>
        );
      })}
      <div className="sim-result">
        <div className="sim-result-label">
          {t('projectedGrade')}
          {projectedScore !== null && (
            <div style={{ fontSize: 12, color: 'var(--text3)', fontFamily: 'DM Mono, monospace' }}>
              {projectedScore.toFixed(1)}%
            </div>
          )}
        </div>
        <div className="sim-result-value">
          <GradeBadge score={projectedScore} customScale={course.grade_scale} />
          {grade && (
            <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 15, fontWeight: 500 }}>
              {grade.gpa.toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
