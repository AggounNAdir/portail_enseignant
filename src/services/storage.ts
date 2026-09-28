import {
  Teacher,
  Classroom,
  Student,
  Assessment,
  Grade,
  AttendanceSession,
  AttendanceRecord
} from '../types';
import {
  initialTeacher,
  initialClasses,
  initialStudents,
  initialAssessments,
  initialGrades,
  initialAttendanceSessions,
  initialAttendanceRecords
} from '../data/mockData';

const STORAGE_KEYS = {
  TEACHER: 'profpilot_teacher',
  CLASSES: 'profpilot_classes',
  STUDENTS: 'profpilot_students',
  ASSESSMENTS: 'profpilot_assessments',
  GRADES: 'profpilot_grades',
  ATTENDANCE_SESSIONS: 'profpilot_attendance_sessions',
  ATTENDANCE_RECORDS: 'profpilot_attendance_records',
  AUTH: 'profpilot_auth_token',
};

// Vérifie et initialise le stockage s'il est vide
export function initStorage() {
  if (!localStorage.getItem(STORAGE_KEYS.TEACHER)) {
    localStorage.setItem(STORAGE_KEYS.TEACHER, JSON.stringify(initialTeacher));
  }
  if (!localStorage.getItem(STORAGE_KEYS.CLASSES)) {
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(initialClasses));
  }
  if (!localStorage.getItem(STORAGE_KEYS.STUDENTS)) {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(initialStudents));
  }
  if (!localStorage.getItem(STORAGE_KEYS.ASSESSMENTS)) {
    localStorage.setItem(STORAGE_KEYS.ASSESSMENTS, JSON.stringify(initialAssessments));
  }
  if (!localStorage.getItem(STORAGE_KEYS.GRADES)) {
    localStorage.setItem(STORAGE_KEYS.GRADES, JSON.stringify(initialGrades));
  }
  if (!localStorage.getItem(STORAGE_KEYS.ATTENDANCE_SESSIONS)) {
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE_SESSIONS, JSON.stringify(initialAttendanceSessions));
  }
  if (!localStorage.getItem(STORAGE_KEYS.ATTENDANCE_RECORDS)) {
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE_RECORDS, JSON.stringify(initialAttendanceRecords));
  }
}

// Helpers de lecture
export function getStoredTeacher(): Teacher {
  initStorage();
  try {
    const data = localStorage.getItem(STORAGE_KEYS.TEACHER);
    return data ? JSON.parse(data) : initialTeacher;
  } catch {
    return initialTeacher;
  }
}

export function saveTeacher(teacher: Teacher): void {
  localStorage.setItem(STORAGE_KEYS.TEACHER, JSON.stringify(teacher));
}

export function getStoredClasses(): Classroom[] {
  initStorage();
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CLASSES);
    return data ? JSON.parse(data) : initialClasses;
  } catch {
    return initialClasses;
  }
}

export function saveClasses(classes: Classroom[]): void {
  localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(classes));
}

export function getStoredStudents(): Student[] {
  initStorage();
  try {
    const data = localStorage.getItem(STORAGE_KEYS.STUDENTS);
    return data ? JSON.parse(data) : initialStudents;
  } catch {
    return initialStudents;
  }
}

export function saveStudents(students: Student[]): void {
  localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
}

export function getStoredAssessments(): Assessment[] {
  initStorage();
  try {
    const data = localStorage.getItem(STORAGE_KEYS.ASSESSMENTS);
    return data ? JSON.parse(data) : initialAssessments;
  } catch {
    return initialAssessments;
  }
}

export function saveAssessments(assessments: Assessment[]): void {
  localStorage.setItem(STORAGE_KEYS.ASSESSMENTS, JSON.stringify(assessments));
}

export function getStoredGrades(): Grade[] {
  initStorage();
  try {
    const data = localStorage.getItem(STORAGE_KEYS.GRADES);
    return data ? JSON.parse(data) : initialGrades;
  } catch {
    return initialGrades;
  }
}

export function saveGrades(grades: Grade[]): void {
  localStorage.setItem(STORAGE_KEYS.GRADES, JSON.stringify(grades));
}

export function getStoredAttendanceSessions(): AttendanceSession[] {
  initStorage();
  try {
    const data = localStorage.getItem(STORAGE_KEYS.ATTENDANCE_SESSIONS);
    return data ? JSON.parse(data) : initialAttendanceSessions;
  } catch {
    return initialAttendanceSessions;
  }
}

export function saveAttendanceSessions(sessions: AttendanceSession[]): void {
  localStorage.setItem(STORAGE_KEYS.ATTENDANCE_SESSIONS, JSON.stringify(sessions));
}

export function getStoredAttendanceRecords(): AttendanceRecord[] {
  initStorage();
  try {
    const data = localStorage.getItem(STORAGE_KEYS.ATTENDANCE_RECORDS);
    return data ? JSON.parse(data) : initialAttendanceRecords;
  } catch {
    return initialAttendanceRecords;
  }
}

export function saveAttendanceRecords(records: AttendanceRecord[]): void {
  localStorage.setItem(STORAGE_KEYS.ATTENDANCE_RECORDS, JSON.stringify(records));
}

// Authentification Enseignant
export function isUserAuthenticated(): boolean {
  return localStorage.getItem(STORAGE_KEYS.AUTH) === 'true';
}

export function setAuthenticated(val: boolean): void {
  if (val) {
    localStorage.setItem(STORAGE_KEYS.AUTH, 'true');
  } else {
    localStorage.removeItem(STORAGE_KEYS.AUTH);
  }
}

// Export / Import global des données
export function exportAllDataAsJSON(): string {
  const payload = {
    exportDate: new Date().toISOString(),
    version: '1.0.0',
    teacher: getStoredTeacher(),
    classes: getStoredClasses(),
    students: getStoredStudents(),
    assessments: getStoredAssessments(),
    grades: getStoredGrades(),
    attendanceSessions: getStoredAttendanceSessions(),
    attendanceRecords: getStoredAttendanceRecords(),
  };
  return JSON.stringify(payload, null, 2);
}

export function importAllDataFromJSON(jsonString: string): boolean {
  try {
    const parsed = JSON.parse(jsonString);
    if (parsed.classes && parsed.students && parsed.assessments) {
      if (parsed.teacher) saveTeacher(parsed.teacher);
      saveClasses(parsed.classes);
      saveStudents(parsed.students);
      saveAssessments(parsed.assessments);
      if (parsed.grades) saveGrades(parsed.grades);
      if (parsed.attendanceSessions) saveAttendanceSessions(parsed.attendanceSessions);
      if (parsed.attendanceRecords) saveAttendanceRecords(parsed.attendanceRecords);
      return true;
    }
    return false;
  } catch (e) {
    console.error('Erreur import JSON', e);
    return false;
  }
}

export function resetAllDataToDemo(): void {
  localStorage.setItem(STORAGE_KEYS.TEACHER, JSON.stringify(initialTeacher));
  localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(initialClasses));
  localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(initialStudents));
  localStorage.setItem(STORAGE_KEYS.ASSESSMENTS, JSON.stringify(initialAssessments));
  localStorage.setItem(STORAGE_KEYS.GRADES, JSON.stringify(initialGrades));
  localStorage.setItem(STORAGE_KEYS.ATTENDANCE_SESSIONS, JSON.stringify(initialAttendanceSessions));
  localStorage.setItem(STORAGE_KEYS.ATTENDANCE_RECORDS, JSON.stringify(initialAttendanceRecords));
}
