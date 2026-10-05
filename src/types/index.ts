export interface Teacher {
  id: string;
  name: string;
  email: string;
  school: string;
  subject: string;
  avatarUrl?: string;
}

export type ClassLevel = 
  // التعليم الابتدائي (Primaire)
  | '1AP (السنة الأولى ابتدائي)'
  | '2AP (السنة الثانية ابتدائي)'
  | '3AP (السنة الثالثة ابتدائي)'
  | '4AP (السنة الرابعة ابتدائي)'
  | '5AP (السنة الخامسة ابتدائي)'
  // التعليم المتوسط (CEM)
  | '1AM (السنة الأولى متوسط)'
  | '2AM (السنة الثانية متوسط)'
  | '3AM (السنة الثالثة متوسط)'
  | '4AM (السنة الرابعة متوسط - BEM)'
  // التعليم الثانوي (Lycée)
  | '1AS (الأولى ثانوي - ج.م علوم وتكنولوجيا)'
  | '1AS (الأولى ثانوي - ج.م آداب)'
  | '2AS (الثانية ثانوي - علوم تجريبية)'
  | '2AS (الثانية ثانوي - رياضيات)'
  | '2AS (الثانية ثانوي - تقني رياضي)'
  | '2AS (الثانية ثانوي - تسيير واقتصاد)'
  | '2AS (الثانية ثانوي - آداب وفلسفة)'
  | '2AS (الثانية ثانوي - لغات أجنبية)'
  | '3AS (الثالثة ثانوي - بكالوريا علوم تجريبية)'
  | '3AS (الثالثة ثانوي - بكالوريا رياضيات)'
  | '3AS (الثالثة ثانوي - بكالوريا تقني رياضي)'
  | '3AS (الثالثة ثانوي - بكالوريا تسيير واقتصاد)'
  | '3AS (الثالثة ثانوي - بكالوريا آداب وفلسفة)'
  | '3AS (الثالثة ثانوي - بكالوريا لغات أجنبية)'
  // Systèmes internationaux / Enseignement général
  | '6ème'
  | '5ème'
  | '4ème'
  | '3ème'
  | 'Seconde'
  | 'Première'
  | 'Terminale'
  | 'BTS / Supérieur'
  | 'Autre niveau';

export interface Classroom {
  id: string;
  name: string;
  level: ClassLevel;
  subject: string;
  academicYear: string;
  room?: string;
  color: string;
  description?: string;
}

export interface Student {
  id: string;
  classId: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  gender: 'M' | 'F' | 'Autre';
  avatarUrl?: string;
  studentEmail?: string;
  parentPhone: string;
  parentEmail?: string;
  address?: string;
  observations?: string;
  group?: '1' | '2'; // الفوج 1 أو الفوج 2 للأعمال الموجهة TD والتطبيقية TP
  nationalId?: string; // رقم التعريف الوطني المدرسي (NIN)
  registrationNumber?: string; // رقم التسجيل
  isRepeating?: boolean; // الإعادة (نعم / لا)
  boardingStatus?: string; // الصفة (ن.داخلي / خارجي / داخلي)
  createdAt: string;
}

export type AssessmentType = 
  | 'التقويم المستمر'
  | 'الفرض 1'
  | 'الفرض 2'
  | 'الاختبار الثلاثي'
  | 'استجواب كتابي'
  | 'واجب منزلي'
  | 'أعمال تطبيقية'
  | 'DS'
  | 'Contrôle'
  | 'DM'
  | 'Interrogation'
  | 'TP'
  | 'Oral'
  | 'Projet';

export interface Assessment {
  id: string;
  classId: string;
  subject: string;
  title: string;
  date: string;
  coefficient: number;
  maxScore: number; // default 20
  type: AssessmentType;
  targetGroup?: 'all' | '1' | '2'; // لكامل القسم أو لفوج معين
  description?: string;
}

export interface Grade {
  id: string;
  assessmentId: string;
  studentId: string;
  score: number | null; // null if absent/excused
  isAbsent: boolean;
  isExcused: boolean;
  comment?: string;
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface AttendanceRecord {
  id: string;
  sessionId: string;
  studentId: string;
  status: AttendanceStatus;
  lateMinutes?: number;
  justification?: string;
}

export interface AttendanceSession {
  id: string;
  classId: string;
  date: string;
  period: string; // e.g. "08h00 - 09h00"
  subject: string;
  group?: 'all' | '1' | '2'; // جلسة عادية للقسم كاملاً أو حصة TD للفوج 1 / 2
  notes?: string;
}

export interface StudentAttendanceSummary {
  studentId: string;
  totalSessions: number;
  presentCount: number;
  absentCount: number;
  unexcusedAbsenceCount: number;
  lateCount: number;
  totalLateMinutes: number;
  attendanceRate: number; // in percentage
}

export interface StudentStats {
  studentId: string;
  average: number | null;
  gradesCount: number;
  rank: number;
  attendanceRate: number;
  absencesCount: number;
  unexcusedAbsences: number;
  latesCount: number;
}

export interface ClassStats {
  classId: string;
  studentCount: number;
  classAverage: number | null;
  highestAverage: number | null;
  lowestAverage: number | null;
  overallAttendanceRate: number;
  assessmentsCount: number;
}

export interface ReportCardSubjectRow {
  subject: string;
  studentAverage: number | null;
  classAverage: number | null;
  minAverage: number | null;
  maxAverage: number | null;
  coefficient: number;
  gradesCount: number;
  teacherComment: string;
}

export interface FullReportCard {
  student: Student;
  classroom: Classroom;
  teacher: Teacher;
  term: string;
  schoolYear: string;
  subjectRows: ReportCardSubjectRow[];
  studentOverallAverage: number | null;
  classOverallAverage: number | null;
  rank: number;
  totalStudents: number;
  attendance: {
    totalAbsences: number;
    unexcusedAbsences: number;
    latesCount: number;
  };
  councilAppreciation: string;
  honorMention?: 'Félicitations' | 'Compliments' | 'Encouragements' | 'Avertissement de travail' | 'Avertissement de conduite' | string | null;
  honorMentionAr?: string;
}

export type NavTab = 
  | 'dashboard' 
  | 'classes' 
  | 'students' 
  | 'grades' 
  | 'attendance' 
  | 'reports' 
  | 'analytics' 
  | 'settings';
