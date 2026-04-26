export interface Session {
  id: string;
  user_id: string;
  name: string;
  prior_gpa: number | null;
  prior_credits: number | null;
  created_at: string;
}

export interface Course {
  id: string;
  session_id: string;
  user_id: string;
  name: string;
  credits: number;
  grading_mode: 'absolute' | 'curved';
  grade_scale: GradeEntry[] | null;
  created_at: string;
}

export interface Component {
  id: string;
  course_id: string;
  user_id: string;
  name: string;
  weight: number;
  max_score: number;
  score: number | null;
  group_avg: number | null;
  created_at: string;
}

export interface GradeEntry {
  min: number;
  letter: string;
  gpa: number;
}
