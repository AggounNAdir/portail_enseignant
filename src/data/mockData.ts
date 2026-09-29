import { Teacher, Classroom, Student, Assessment, Grade, AttendanceSession, AttendanceRecord } from '../types';

export const initialTeacher: Teacher = {
  id: 'teacher-main',
  name: 'Nadir Aggoun',
  email: 'aggounnadir8@gmail.com',
  school: 'Mon Établissement',
  subject: 'Matière Principale',
  avatarUrl: '',
};

// Base vierge par défaut (aucune donnée de test)
export const initialClasses: Classroom[] = [];
export const initialStudents: Student[] = [];
export const initialAssessments: Assessment[] = [];
export const initialGrades: Grade[] = [];
export const initialAttendanceSessions: AttendanceSession[] = [];
export const initialAttendanceRecords: AttendanceRecord[] = [];

// Données d'exemple facultatives (disponibles uniquement sur demande dans les paramètres)
export const sampleDemoClasses: Classroom[] = [
  {
    id: 'demo-class-1',
    name: '3ème B',
    level: '3ème',
    subject: 'Mathématiques',
    academicYear: '2024-2025',
    room: 'Salle 102',
    color: '#3B82F6',
    description: 'Classe de 3ème générale',
  },
  {
    id: 'demo-class-2',
    name: '4ème A',
    level: '4ème',
    subject: 'Mathématiques',
    academicYear: '2024-2025',
    room: 'Salle 102',
    color: '#10B981',
    description: 'Classe de 4ème',
  }
];

export const sampleDemoStudents: Student[] = [
  {
    id: 'demo-std-1',
    classId: 'demo-class-1',
    firstName: 'Lucas',
    lastName: 'Moreau',
    birthDate: '2010-04-12',
    gender: 'M',
    studentEmail: 'lucas.moreau@eleve.fr',
    parentPhone: '06 12 34 56 78',
    parentEmail: 'parents.moreau@email.fr',
    address: '14 Rue des Lilas, 75000 Paris',
    observations: 'Bonne participation',
    createdAt: '2024-09-02',
  },
  {
    id: 'demo-std-2',
    classId: 'demo-class-1',
    firstName: 'Emma',
    lastName: 'Dubois',
    birthDate: '2010-07-23',
    gender: 'F',
    studentEmail: 'emma.dubois@eleve.fr',
    parentPhone: '06 23 45 67 89',
    parentEmail: 'parents.dubois@email.fr',
    address: '28 Avenue Gambetta, 75000 Paris',
    observations: 'Travail sérieux et régulier',
    createdAt: '2024-09-02',
  }
];
