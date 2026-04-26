import type { Course, Component } from '../types';
import { computeCourseScore, getGrade } from '../lib/grades';
import { GradeBadge } from './GradeBadge';
import type { StringKey } from '../lib/i18n';

interface Props {
  course: Course;
  components: Component[];
  t: (k: StringKey) => string;
  onClick: () => void;
  onEdit: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
}

export function CourseCard({ course, components, t, onClick, onEdit, onDelete }: Props) {
  const score = computeCourseScore(course, components);

  const barColor = score === null ? 'var(--border)'
    : score >= 86 ? 'var(--success)'
    : score >= 70 ? 'var(--accent)'
    : score >= 60 ? 'var(--warning)'
    : 'var(--danger)';

  return (
    <div className="course-card" onClick={onClick}>
      <div className="course-card-info">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div className="course-card-name">{course.name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <GradeBadge score={score} pending={t('pending')} customScale={course.grade_scale} />
            <div className="inline-actions" onClick={e => e.stopPropagation()}>
              <button className="btn btn-ghost btn-sm" onClick={onEdit} title={t('edit')}>✎</button>
              <button className="btn btn-ghost btn-sm" onClick={onDelete} title={t('delete')} style={{ color: 'var(--danger)' }}>✕</button>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 10 }}>
          <div className="progress-bar-wrap" style={{ height: 4 }}>
            <div
              className="progress-bar-fill"
              style={{ width: score !== null ? `${score}%` : '0%', background: barColor }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
          <span style={{ fontSize: 12, color: 'var(--text3)' }}>{course.credits} {t('credits_suffix')}</span>
          {score !== null && (
            <span style={{ fontSize: 12, color: 'var(--text3)', fontFamily: 'DM Mono, monospace' }}>
              {score.toFixed(1)}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
