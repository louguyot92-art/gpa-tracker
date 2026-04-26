import type { Component, Course, GradeEntry } from '../types';

export const GRADE_SCALE: GradeEntry[] = [
  { min: 92, letter: 'A+', gpa: 4.3 },
  { min: 86, letter: 'A',  gpa: 4.0 },
  { min: 82, letter: 'A-', gpa: 3.7 },
  { min: 78, letter: 'B+', gpa: 3.3 },
  { min: 74, letter: 'B',  gpa: 3.0 },
  { min: 70, letter: 'B-', gpa: 2.7 },
  { min: 66, letter: 'C+', gpa: 2.3 },
  { min: 63, letter: 'C',  gpa: 2.0 },
  { min: 60, letter: 'C-', gpa: 1.7 },
  { min: 56, letter: 'D+', gpa: 1.3 },
  { min: 53, letter: 'D',  gpa: 1.0 },
  { min: 0,  letter: 'E',  gpa: 0.0 },
];

export function getGrade(pct: number, customScale?: GradeEntry[] | null): GradeEntry {
  const scale = customScale && customScale.length > 0
    ? [...customScale].sort((a, b) => b.min - a.min)
    : GRADE_SCALE;
  for (const entry of scale) {
    if (pct >= entry.min) return entry;
  }
  return scale[scale.length - 1];
}

export function computeCourseScore(
  course: Course,
  components: Component[],
  simOverrides: Record<string, number> = {}
): number | null {
  if (components.length === 0) return null;

  let weightedSum = 0;
  let weightUsed = 0;

  for (const comp of components) {
    const rawScore = simOverrides[comp.id] !== undefined
      ? simOverrides[comp.id]
      : comp.score;

    if (rawScore === null || rawScore === undefined) continue;

    const pct = (rawScore / comp.max_score) * 100;
    weightedSum += pct * (comp.weight / 100);
    weightUsed += comp.weight / 100;
  }

  if (weightUsed === 0) return null;

  let myScore = weightedSum / weightUsed;

  if (course.grading_mode === 'curved') {
    let groupWeightedSum = 0;
    let groupWeightUsed = 0;

    for (const comp of components) {
      const hasScore = (simOverrides[comp.id] !== undefined) || (comp.score !== null);
      if (!hasScore) continue;
      if (comp.group_avg === null) continue;

      const groupPct = (comp.group_avg / comp.max_score) * 100;
      groupWeightedSum += groupPct * (comp.weight / 100);
      groupWeightUsed += comp.weight / 100;
    }

    if (groupWeightUsed > 0) {
      const groupScore = groupWeightedSum / groupWeightUsed;
      // B- (70) = group average; shift the entire scale
      const shift = groupScore - 70;
      myScore = myScore - shift;
    }
  }

  return Math.min(100, Math.max(0, myScore));
}

export function computeSessionGpa(
  courses: Course[],
  componentsByCourse: Record<string, Component[]>
): number | null {
  let totalPoints = 0;
  let totalCredits = 0;

  for (const course of courses) {
    const comps = componentsByCourse[course.id] ?? [];
    const score = computeCourseScore(course, comps);
    if (score === null) continue;
    const grade = getGrade(score, course.grade_scale);
    totalPoints += grade.gpa * course.credits;
    totalCredits += course.credits;
  }

  if (totalCredits === 0) return null;
  return totalPoints / totalCredits;
}

export function computeCumulativeGpa(
  sessionGpa: number | null,
  sessionCredits: number,
  priorGpa: number | null,
  priorCredits: number | null
): number | null {
  if (sessionGpa === null) return null;

  const pGpa = priorGpa ?? 0;
  const pCredits = priorCredits ?? 0;
  const totalCredits = pCredits + sessionCredits;

  if (totalCredits === 0) return null;

  return (pGpa * pCredits + sessionGpa * sessionCredits) / totalCredits;
}
