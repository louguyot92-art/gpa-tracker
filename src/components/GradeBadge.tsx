import type { GradeEntry } from '../types';
import { getGrade } from '../lib/grades';

interface Props {
  score: number | null;
  pending?: string;
  customScale?: GradeEntry[] | null;
  letter?: string | null;
}

function gradeColors(letter: string): { bg: string; fg: string } {
  const l = letter[0];
  if (l === 'A') return { bg: 'var(--success-sub)', fg: 'var(--success)' };
  if (l === 'B') return { bg: 'var(--accent-sub)',  fg: 'var(--accent)'  };
  if (l === 'C') return { bg: 'var(--warning-sub)', fg: 'var(--warning)' };
  return               { bg: 'var(--danger-sub)',  fg: 'var(--danger)'  };
}

export function GradeBadge({ score, pending = '—', customScale, letter: letterOverride }: Props) {
  if (letterOverride) {
    const { bg, fg } = gradeColors(letterOverride);
    return (
      <span className="grade-badge" style={{ background: bg, color: fg }}>
        {letterOverride}
      </span>
    );
  }

  if (score === null) {
    return (
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text3)' }}>
        {pending}
      </span>
    );
  }

  const grade = getGrade(score, customScale);
  const { bg, fg } = gradeColors(grade.letter);

  return (
    <span
      className="grade-badge"
      style={{ background: bg, color: fg }}
      title={`${score.toFixed(1)}% → ${grade.letter} (${grade.gpa.toFixed(1)})`}
    >
      {grade.letter}
    </span>
  );
}
