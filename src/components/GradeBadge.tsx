import type { GradeEntry } from '../types';
import { getGrade } from '../lib/grades';

interface Props {
  score: number | null;
  pending?: string;
  customScale?: GradeEntry[] | null;
  letter?: string | null;
}

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

export function GradeBadge({ score, pending = '—', customScale, letter: letterOverride }: Props) {
  if (letterOverride) {
    const colors = COLOR_MAP[letterOverride] ?? colorForLetter(letterOverride);
    return (
      <span className="grade-badge" style={{ background: colors.bg, color: colors.color }}>
        {letterOverride}
      </span>
    );
  }

  if (score === null) {
    return (
      <span className="grade-badge" style={{ background: 'var(--surface2)', color: 'var(--text3)' }}>
        {pending}
      </span>
    );
  }

  const grade = getGrade(score, customScale);
  const colors = COLOR_MAP[grade.letter] ?? colorForLetter(grade.letter);

  return (
    <span
      className="grade-badge"
      style={{ background: colors.bg, color: colors.color }}
      title={`${score.toFixed(1)}% → ${grade.letter} (${grade.gpa.toFixed(1)})`}
    >
      {grade.letter}
    </span>
  );
}
