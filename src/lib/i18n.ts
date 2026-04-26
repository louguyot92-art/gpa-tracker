import { useState, useCallback } from 'react';

type Lang = 'fr' | 'en';

const strings = {
  fr: {
    // Nav
    appName: 'GPA Tracker',
    logout: 'Déconnexion',
    // Auth
    login: 'Se connecter',
    register: "S'inscrire",
    email: 'Adresse courriel',
    password: 'Mot de passe',
    noAccount: "Pas encore de compte ?",
    hasAccount: 'Déjà un compte ?',
    loginError: 'Identifiants incorrects.',
    registerError: "Erreur lors de l'inscription.",
    // Sessions
    sessions: 'Mes sessions',
    newSession: 'Nouvelle session',
    editSession: 'Modifier la session',
    sessionName: 'Nom de la session',
    priorGpa: 'GPA antérieur (optionnel)',
    priorCredits: 'Crédits antérieurs (optionnel)',
    noSessions: 'Aucune session',
    noSessionsDesc: "Créez votre première session pour commencer.",
    // Courses
    courses: 'Cours',
    newCourse: 'Nouveau cours',
    editCourse: 'Modifier le cours',
    courseName: 'Nom du cours',
    credits: 'Crédits',
    gradingMode: 'Mode de notation',
    absolute: 'Absolu',
    curved: 'Relatif (courbe)',
    noCourses: 'Aucun cours',
    noCoursesDesc: 'Ajoutez un cours à cette session.',
    // Components
    components: 'Composantes',
    newComponent: 'Nouvelle composante',
    editComponent: 'Modifier la composante',
    componentName: 'Nom (ex: Intra, Final)',
    weight: 'Poids (%)',
    maxScore: 'Note max',
    score: 'Note obtenue',
    groupAvg: 'Moyenne du groupe',
    noComponents: 'Aucune composante',
    noComponentsDesc: 'Ajoutez les composantes de ce cours.',
    // GPA
    sessionGpa: 'GPA session',
    cumulativeGpa: 'GPA cumulatif',
    totalWeight: 'Poids total',
    weightWarning: 'Le poids total doit être 100%.',
    weightOver: 'Poids dépassé !',
    notGraded: 'Pas encore noté',
    // Simulator
    simulator: 'Simulateur',
    simTitle: 'Simuler les notes manquantes',
    projectedGrade: 'Note projetée',
    projectedGpa: 'GPA projeté',
    // Actions
    save: 'Enregistrer',
    cancel: 'Annuler',
    delete: 'Supprimer',
    edit: 'Modifier',
    back: 'Retour',
    confirmDelete: 'Confirmer la suppression',
    confirmDeleteDesc: 'Cette action est irréversible.',
    // Misc
    curved_tag: 'Relatif',
    absolute_tag: 'Absolu',
    credits_suffix: 'cr.',
    pending: 'En attente',
  },
  en: {
    appName: 'GPA Tracker',
    logout: 'Sign out',
    login: 'Sign in',
    register: 'Create account',
    email: 'Email address',
    password: 'Password',
    noAccount: "Don't have an account?",
    hasAccount: 'Already have an account?',
    loginError: 'Invalid email or password.',
    registerError: 'Error creating account.',
    sessions: 'My sessions',
    newSession: 'New session',
    editSession: 'Edit session',
    sessionName: 'Session name',
    priorGpa: 'Prior GPA (optional)',
    priorCredits: 'Prior credits (optional)',
    noSessions: 'No sessions',
    noSessionsDesc: 'Create your first session to get started.',
    courses: 'Courses',
    newCourse: 'New course',
    editCourse: 'Edit course',
    courseName: 'Course name',
    credits: 'Credits',
    gradingMode: 'Grading mode',
    absolute: 'Absolute',
    curved: 'Curved (relative)',
    noCourses: 'No courses',
    noCoursesDesc: 'Add a course to this session.',
    components: 'Components',
    newComponent: 'New component',
    editComponent: 'Edit component',
    componentName: 'Name (e.g. Midterm, Final)',
    weight: 'Weight (%)',
    maxScore: 'Max score',
    score: 'Your score',
    groupAvg: 'Group average',
    noComponents: 'No components',
    noComponentsDesc: 'Add the components for this course.',
    sessionGpa: 'Session GPA',
    cumulativeGpa: 'Cumulative GPA',
    totalWeight: 'Total weight',
    weightWarning: 'Total weight must equal 100%.',
    weightOver: 'Weight exceeded!',
    notGraded: 'Not yet graded',
    simulator: 'Simulator',
    simTitle: 'Simulate missing grades',
    projectedGrade: 'Projected grade',
    projectedGpa: 'Projected GPA',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    back: 'Back',
    confirmDelete: 'Confirm deletion',
    confirmDeleteDesc: 'This action cannot be undone.',
    curved_tag: 'Curved',
    absolute_tag: 'Absolute',
    credits_suffix: 'cr.',
    pending: 'Pending',
  },
} as const;

export type StringKey = keyof typeof strings.fr;

const STORAGE_KEY = 'gpa_lang';

function getSavedLang(): Lang {
  const saved = localStorage.getItem(STORAGE_KEY);
  return (saved === 'en' || saved === 'fr') ? saved : 'fr';
}

export function useLang() {
  const [lang, setLangState] = useState<Lang>(getSavedLang);

  const setLang = useCallback((l: Lang) => {
    localStorage.setItem(STORAGE_KEY, l);
    setLangState(l);
  }, []);

  const t = useCallback(
    (key: StringKey): string => strings[lang][key],
    [lang]
  );

  return { lang, setLang, t };
}
