import type { Course, Component } from '../types';
import { computeCourseScore } from '../lib/grades';
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

function IcoEdit() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
}
function IcoTrash() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>;
}
function IcoChevron() {
  return <svg style={{ color: 'var(--text3)', flexShrink: 0 }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>;
}

export function CourseCard({ course, components, t, onClick, onEdit, onDelete }: Props) {
  const score = course.grade_override ? null : computeCourseScore(course, components);
  const graded = components.filter(c => c.score !== null || c.letter_grade).length;
  const totalWeight = components.reduce((s, c) => s + c.weight, 0);

  return (
    <div className="course-card" onClick={onClick}>
      <div className="course-card-info">
        <div className="course-card-name">{course.name}</div>
        <div className="course-card-meta">
          <span>{course.credits} {t('credits_suffix')}</span>
          {components.length > 0 && (
            <>
              <span className="meta-dot" />
              <span>{graded}/{components.length} {t('pending').toLowerCase() !== 'pending' ? 'éval.' : 'eval.'}</span>
            </>
          )}
          {totalWeight > 0 && totalWeight < 100 && (
            <>
              <span className="meta-dot" />
              <span style={{ color: 'var(--warning)' }}>{totalWeight}% défini</span>
            </>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        {(score !== null || course.grade_override) && (
          <div style={{ textAlign: 'right' }}>
            <GradeBadge
              score={course.grade_override ? null : score}
              letter={course.grade_override}
              pending={t('pending')}
              customScale={course.grade_scale}
            />
            {score !== null && (
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text3)', marginTop: 3 }}>
                {score.toFixed(1)}%
              </div>
            )}
          </div>
        )}
        <div className="inline-actions" onClick={e => e.stopPropagation()}>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onEdit} title={t('edit')}><IcoEdit /></button>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onDelete} title={t('delete')} style={{ color: 'var(--danger)' }}><IcoTrash /></button>
        </div>
        <IcoChevron />
      </div>
    </div>
  );
}
