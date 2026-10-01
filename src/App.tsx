import React, { useState, useEffect } from 'react';
import {
  Teacher,
  Classroom,
  Student,
  Assessment,
  Grade,
  AttendanceSession,
  AttendanceRecord,
  NavTab
} from './types';
import {
  initStorage,
  getStoredTeacher,
  saveTeacher,
  getStoredClasses,
  saveClasses,
  getStoredStudents,
  saveStudents,
  getStoredAssessments,
  saveAssessments,
  getStoredGrades,
  saveGrades,
  getStoredAttendanceSessions,
  saveAttendanceSessions,
  getStoredAttendanceRecords,
  saveAttendanceRecords,
  exportAllDataAsJSON,
  importAllDataFromJSON,
  clearAllApplicationData,
  loadOptionalSampleData,
  isUserAuthenticated,
  setAuthenticated
} from './services/storage';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { DashboardView } from './components/dashboard/DashboardView';
import { ClassesView } from './components/classes/ClassesView';
import { StudentsView } from './components/students/StudentsView';
import { GradesView } from './components/grades/GradesView';
import { AttendanceView } from './components/attendance/AttendanceView';
import { ReportCardsView } from './components/reports/ReportCardsView';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { SettingsView } from './components/settings/SettingsView';
import { AuthModal } from './components/auth/AuthModal';

export default function App() {
  // Initialisation du stockage au premier montage
  useEffect(() => {
    initStorage();
  }, []);

  // États principaux de l'application
  const [teacher, setTeacher] = useState<Teacher>(getStoredTeacher);
  const [classes, setClasses] = useState<Classroom[]>(getStoredClasses);
  const [students, setStudents] = useState<Student[]>(getStoredStudents);
  const [assessments, setAssessments] = useState<Assessment[]>(getStoredAssessments);
  const [grades, setGrades] = useState<Grade[]>(getStoredGrades);
  const [sessions, setSessions] = useState<AttendanceSession[]>(getStoredAttendanceSessions);
  const [records, setRecords] = useState<AttendanceRecord[]>(getStoredAttendanceRecords);

  // Navigation & Sélections
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [preselectedStudentForReport, setPreselectedStudentForReport] = useState<Student | null>(null);

  // UI Modales & Responsive
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);

  // Synchronisation automatique vers localStorage à chaque mise à jour
  const updateTeacher = (newTeacher: Teacher) => {
    setTeacher(newTeacher);
    saveTeacher(newTeacher);
  };

  // Gestion des classes
  const handleAddClass = (newClassData: Omit<Classroom, 'id'>) => {
    const newClass: Classroom = {
      ...newClassData,
      id: `class-${Date.now()}`,
    };
    const updated = [...classes, newClass];
    setClasses(updated);
    saveClasses(updated);
  };

  const handleUpdateClass = (updatedClass: Classroom) => {
    const updated = classes.map((c) => (c.id === updatedClass.id ? updatedClass : c));
    setClasses(updated);
    saveClasses(updated);
  };

  const handleDeleteClass = (classId: string) => {
    const updatedClasses = classes.filter((c) => c.id !== classId);
    setClasses(updatedClasses);
    saveClasses(updatedClasses);

    // Supprimer également les élèves de cette classe
    const updatedStudents = students.filter((s) => s.classId !== classId);
    setStudents(updatedStudents);
    saveStudents(updatedStudents);

    // Supprimer les devoirs de cette classe
    const deletedAssessmentIds = new Set(
      assessments.filter((a) => a.classId === classId).map((a) => a.id)
    );
    const updatedAssessments = assessments.filter((a) => a.classId !== classId);
    setAssessments(updatedAssessments);
    saveAssessments(updatedAssessments);

    const updatedGrades = grades.filter((g) => !deletedAssessmentIds.has(g.assessmentId));
    setGrades(updatedGrades);
    saveGrades(updatedGrades);

    if (selectedClassId === classId) {
      setSelectedClassId('all');
    }
  };

  // Gestion des élèves
  const handleAddStudent = (newStudentData: Omit<Student, 'id' | 'createdAt'>) => {
    const newStudent: Student = {
      ...newStudentData,
      id: `std-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    const updated = [...students, newStudent];
    setStudents(updated);
    saveStudents(updated);
  };

  const handleUpdateStudent = (updatedStudent: Student) => {
    const updated = students.map((s) => (s.id === updatedStudent.id ? updatedStudent : s));
    setStudents(updated);
    saveStudents(updated);
  };

  const handleDeleteStudent = (studentId: string) => {
    const updated = students.filter((s) => s.id !== studentId);
    setStudents(updated);
    saveStudents(updated);

    // Nettoyer les notes et présences associées
    const updatedGrades = grades.filter((g) => g.studentId !== studentId);
    setGrades(updatedGrades);
    saveGrades(updatedGrades);

    const updatedRecords = records.filter((r) => r.studentId !== studentId);
    setRecords(updatedRecords);
    saveAttendanceRecords(updatedRecords);
  };

  const handleImportStudents = (imported: Student[], replaceClass?: boolean) => {
    let updated: Student[];
    if (replaceClass && imported.length > 0) {
      const targetClassId = imported[0].classId;
      const remaining = students.filter((s) => s.classId !== targetClassId);
      updated = [...remaining, ...imported];
    } else {
      updated = [...students, ...imported];
    }
    setStudents(updated);
    saveStudents(updated);
  };

  const handleDeleteMultipleStudents = (studentIds: string[]) => {
    const idsSet = new Set(studentIds);
    const updated = students.filter((s) => !idsSet.has(s.id));
    setStudents(updated);
    saveStudents(updated);

    const updatedGrades = grades.filter((g) => !idsSet.has(g.studentId));
    setGrades(updatedGrades);
    saveGrades(updatedGrades);

    const updatedRecords = records.filter((r) => !idsSet.has(r.studentId));
    setRecords(updatedRecords);
    saveAttendanceRecords(updatedRecords);
  };

  const handleClearClassStudents = (classId: string) => {
    const studentsToDelete = students.filter((s) => s.classId === classId);
    const idsSet = new Set(studentsToDelete.map((s) => s.id));
    const updated = students.filter((s) => s.classId !== classId);
    setStudents(updated);
    saveStudents(updated);

    const updatedGrades = grades.filter((g) => !idsSet.has(g.studentId));
    setGrades(updatedGrades);
    saveGrades(updatedGrades);

    const updatedRecords = records.filter((r) => !idsSet.has(r.studentId));
    setRecords(updatedRecords);
    saveAttendanceRecords(updatedRecords);
  };

  // Gestion des devoirs
  const handleAddAssessment = (newAssData: Omit<Assessment, 'id'>) => {
    const newAss: Assessment = {
      ...newAssData,
      id: `ass-${Date.now()}`,
    };
    const updated = [...assessments, newAss];
    setAssessments(updated);
    saveAssessments(updated);
  };

  const handleUpdateAssessment = (updatedAss: Assessment) => {
    const updated = assessments.map((a) => (a.id === updatedAss.id ? updatedAss : a));
    setAssessments(updated);
    saveAssessments(updated);
  };

  const handleDeleteAssessment = (assessmentId: string) => {
    const updatedAssessments = assessments.filter((a) => a.id !== assessmentId);
    setAssessments(updatedAssessments);
    saveAssessments(updatedAssessments);

    const updatedGrades = grades.filter((g) => g.assessmentId !== assessmentId);
    setGrades(updatedGrades);
    saveGrades(updatedGrades);
  };

  // Sauvegarde des notes
  const handleSaveGrades = (incomingGrades: Grade[]) => {
    const incomingMap = new Map(incomingGrades.map((g) => [`${g.assessmentId}_${g.studentId}`, g]));
    const nextGrades = grades.map((g) => {
      const key = `${g.assessmentId}_${g.studentId}`;
      if (incomingMap.has(key)) {
        const replacement = incomingMap.get(key)!;
        incomingMap.delete(key);
        return replacement;
      }
      return g;
    });

    // Ajouter les nouvelles notes créées
    incomingMap.forEach((g) => {
      nextGrades.push(g);
    });

    setGrades(nextGrades);
    saveGrades(nextGrades);
  };

  // Sauvegarde d'un appel de cours
  const handleSaveAttendanceSession = (
    sessionData: Omit<AttendanceSession, 'id'>,
    recordsData: { studentId: string; status: any; lateMinutes?: number; justification?: string }[]
  ) => {
    const newSessionId = `sess-${Date.now()}`;
    const newSession: AttendanceSession = {
      ...sessionData,
      id: newSessionId,
    };

    const newRecords: AttendanceRecord[] = recordsData.map((r, i) => ({
      id: `att-${Date.now()}-${i}`,
      sessionId: newSessionId,
      studentId: r.studentId,
      status: r.status,
      lateMinutes: r.lateMinutes,
      justification: r.justification,
    }));

    const updatedSessions = [...sessions, newSession];
    const updatedRecords = [...records, ...newRecords];

    setSessions(updatedSessions);
    setRecords(updatedRecords);
    saveAttendanceSessions(updatedSessions);
    saveAttendanceRecords(updatedRecords);
  };

  // Export / Import JSON
  const handleExportJSON = () => {
    const jsonStr = exportAllDataAsJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `profpilot_sauvegarde_complete_${new Date().toISOString().split('T')[0]}.json`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportJSON = (jsonString: string): boolean => {
    const ok = importAllDataFromJSON(jsonString);
    if (ok) {
      setTeacher(getStoredTeacher());
      setClasses(getStoredClasses());
      setStudents(getStoredStudents());
      setAssessments(getStoredAssessments());
      setGrades(getStoredGrades());
      setSessions(getStoredAttendanceSessions());
      setRecords(getStoredAttendanceRecords());
    }
    return ok;
  };

  const handleClearAllData = () => {
    clearAllApplicationData();
    setClasses([]);
    setStudents([]);
    setAssessments([]);
    setGrades([]);
    setSessions([]);
    setRecords([]);
    setSelectedClassId('all');
  };

  const handleLoadSampleData = () => {
    loadOptionalSampleData();
    setClasses(getStoredClasses());
    setStudents(getStoredStudents());
    setSelectedClassId('all');
  };

  // Raccourci vers bulletin depuis une ligne élève
  const handleOpenReportCardForStudent = (student: Student) => {
    setSelectedClassId(student.classId);
    setPreselectedStudentForReport(student);
    setCurrentTab('reports');
  };

  // Nombre d'évaluations totales
  const totalAssessmentsCount = assessments.length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
      {/* Barre de navigation supérieure */}
      <Navbar
        teacher={teacher}
        classes={classes}
        selectedClassId={selectedClassId}
        onSelectClassId={setSelectedClassId}
        onNavigate={setCurrentTab}
        onOpenTeacherModal={() => setCurrentTab('settings')}
        onLogout={() => setAuthModalOpen(true)}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Barre latérale gauche */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          classesCount={classes.length}
          studentsCount={students.length}
          assessmentsCount={totalAssessmentsCount}
          isOpenMobile={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
          onExportJSON={handleExportJSON}
        />

        {/* Zone de contenu principale */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 overflow-y-auto">
          {currentTab === 'dashboard' && (
            <DashboardView
              classes={classes}
              students={students}
              assessments={assessments}
              grades={grades}
              attendanceRecords={records}
              onNavigate={setCurrentTab}
              onSelectClass={(clsId) => {
                setSelectedClassId(clsId);
              }}
            />
          )}

          {currentTab === 'classes' && (
            <ClassesView
              classes={classes}
              students={students}
              assessments={assessments}
              grades={grades}
              attendanceRecords={records}
              onAddClass={handleAddClass}
              onUpdateClass={handleUpdateClass}
              onDeleteClass={handleDeleteClass}
              onSelectClassAndNavigateToStudents={(clsId) => {
                setSelectedClassId(clsId);
                setCurrentTab('students');
              }}
            />
          )}

          {currentTab === 'students' && (
            <StudentsView
              students={students}
              classes={classes}
              selectedClassId={selectedClassId}
              onSelectClassId={setSelectedClassId}
              assessments={assessments}
              grades={grades}
              attendanceRecords={records}
              onAddStudent={handleAddStudent}
              onUpdateStudent={handleUpdateStudent}
              onDeleteStudent={handleDeleteStudent}
              onDeleteMultipleStudents={handleDeleteMultipleStudents}
              onClearClassStudents={handleClearClassStudents}
              onImportStudents={handleImportStudents}
              onOpenReportCard={handleOpenReportCardForStudent}
            />
          )}

          {currentTab === 'grades' && (
            <GradesView
              classes={classes}
              students={students}
              assessments={assessments}
              grades={grades}
              selectedClassId={selectedClassId}
              onSelectClassId={setSelectedClassId}
              onAddAssessment={handleAddAssessment}
              onUpdateAssessment={handleUpdateAssessment}
              onDeleteAssessment={handleDeleteAssessment}
              onSaveGrades={handleSaveGrades}
            />
          )}

          {currentTab === 'attendance' && (
            <AttendanceView
              classes={classes}
              students={students}
              sessions={sessions}
              records={records}
              selectedClassId={selectedClassId}
              onSelectClassId={setSelectedClassId}
              onSaveSession={handleSaveAttendanceSession}
            />
          )}

          {currentTab === 'reports' && (
            <ReportCardsView
              classes={classes}
              students={students}
              assessments={assessments}
              grades={grades}
              attendanceRecords={records}
              teacher={teacher}
              selectedClassId={selectedClassId}
              onSelectClassId={setSelectedClassId}
              preselectedStudent={preselectedStudentForReport}
            />
          )}

          {currentTab === 'analytics' && (
            <AnalyticsView
              classes={classes}
              students={students}
              assessments={assessments}
              grades={grades}
              attendanceRecords={records}
              selectedClassId={selectedClassId}
              onSelectClassId={setSelectedClassId}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsView
              teacher={teacher}
              onUpdateTeacher={updateTeacher}
              onExportJSON={handleExportJSON}
              onImportJSON={handleImportJSON}
              onClearAllData={handleClearAllData}
              onLoadSampleData={handleLoadSampleData}
            />
          )}
        </main>
      </div>

      {/* Modale d'authentification */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        teacher={teacher}
        onLoginSuccess={(email) => {
          setIsAuthenticated(true);
        }}
      />
    </div>
  );
}
