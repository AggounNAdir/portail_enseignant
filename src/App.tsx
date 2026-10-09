import React, { useState, useEffect, useRef } from 'react';
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
import {
  pushWorkspaceToCloud,
  listenToCloudWorkspace,
  fetchInitialCloudWorkspace,
  getStoredSyncKey,
  setStoredSyncKey,
  isCloudSyncEnabled,
  setCloudSyncEnabled,
  CloudWorkspacePayload
} from './services/firebase';
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
import { CloudSyncModal } from './components/sync/CloudSyncModal';
import { InstallPcModal } from './components/install/InstallPcModal';

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

  // Cloud Sync Temps Réel par Clé/Code de liaison
  const [syncKey, setSyncKey] = useState<string>(getStoredSyncKey);
  const [isSyncActive, setIsSyncActive] = useState<boolean>(isCloudSyncEnabled);
  const [cloudSyncModalOpen, setCloudSyncModalOpen] = useState(false);
  const isRemoteSyncRef = useRef(false);

  // Installation sur PC
  const [installPcModalOpen, setInstallPcModalOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // Écouter l'événement d'installation PWA native
  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleTriggerInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setInstallPcModalOpen(false);
    }
  };

  // Navigation & Sélections
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [preselectedStudentForReport, setPreselectedStudentForReport] = useState<Student | null>(null);

  // UI Modales & Responsive
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);

  // Synchronisation Cloud initiale au démarrage si active
  useEffect(() => {
    if (!isSyncActive || !syncKey) return;

    let isMounted = true;
    (async () => {
      try {
        const cloudData = await fetchInitialCloudWorkspace(syncKey);
        if (!isMounted) return;

        if (cloudData && (cloudData.classes.length > 0 || cloudData.students.length > 0)) {
          isRemoteSyncRef.current = true;
          if (cloudData.teacher) {
            setTeacher(cloudData.teacher);
            saveTeacher(cloudData.teacher);
          }
          setClasses(cloudData.classes);
          saveClasses(cloudData.classes);
          setStudents(cloudData.students);
          saveStudents(cloudData.students);
          setAssessments(cloudData.assessments || []);
          saveAssessments(cloudData.assessments || []);
          setGrades(cloudData.grades || []);
          saveGrades(cloudData.grades || []);
          setSessions(cloudData.attendanceSessions || []);
          saveAttendanceSessions(cloudData.attendanceSessions || []);
          setRecords(cloudData.attendanceRecords || []);
          saveAttendanceRecords(cloudData.attendanceRecords || []);

          setTimeout(() => {
            isRemoteSyncRef.current = false;
          }, 600);
        } else {
          // Premier envoi vers le Cloud
          pushWorkspaceToCloud(syncKey, {
            teacher,
            classes,
            students,
            assessments,
            grades,
            attendanceSessions: sessions,
            attendanceRecords: records,
          });
        }
      } catch (err) {
        console.error("Erreur sync Cloud initiale:", err);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [isSyncActive, syncKey]);

  // Écouteur temps réel (onSnapshot) : dès que l'autre appareil modifie quelque chose, on l'applique ici !
  useEffect(() => {
    if (!isSyncActive || !syncKey) return;

    const unsubListener = listenToCloudWorkspace(syncKey, (remote) => {
      isRemoteSyncRef.current = true;
      if (remote.teacher) {
        setTeacher(remote.teacher);
        saveTeacher(remote.teacher);
      }
      setClasses(remote.classes);
      saveClasses(remote.classes);
      setStudents(remote.students);
      saveStudents(remote.students);
      setAssessments(remote.assessments || []);
      saveAssessments(remote.assessments || []);
      setGrades(remote.grades || []);
      saveGrades(remote.grades || []);
      setSessions(remote.attendanceSessions || []);
      saveAttendanceSessions(remote.attendanceSessions || []);
      setRecords(remote.attendanceRecords || []);
      saveAttendanceRecords(remote.attendanceRecords || []);

      setTimeout(() => {
        isRemoteSyncRef.current = false;
      }, 600);
    });

    return () => unsubListener();
  }, [isSyncActive, syncKey]);

  // Synchronisation sortante : dès qu'une modification locale survient, on la pousse vers le Cloud
  useEffect(() => {
    if (!isSyncActive || !syncKey || isRemoteSyncRef.current) return;
    pushWorkspaceToCloud(syncKey, {
      teacher,
      classes,
      students,
      assessments,
      grades,
      attendanceSessions: sessions,
      attendanceRecords: records,
    });
  }, [teacher, classes, students, assessments, grades, sessions, records, isSyncActive, syncKey]);

  const handleActivateSync = async (newKey: string) => {
    const clean = setStoredSyncKey(newKey);
    setSyncKey(clean);
    setCloudSyncEnabled(true);
    setIsSyncActive(true);

    const cloudData = await fetchInitialCloudWorkspace(clean);
    if (cloudData) {
      isRemoteSyncRef.current = true;
      if (cloudData.teacher) {
        setTeacher(cloudData.teacher);
        saveTeacher(cloudData.teacher);
      }
      setClasses(cloudData.classes || []);
      saveClasses(cloudData.classes || []);
      setStudents(cloudData.students || []);
      saveStudents(cloudData.students || []);
      setAssessments(cloudData.assessments || []);
      saveAssessments(cloudData.assessments || []);
      setGrades(cloudData.grades || []);
      saveGrades(cloudData.grades || []);
      setSessions(cloudData.attendanceSessions || []);
      saveAttendanceSessions(cloudData.attendanceSessions || []);
      setRecords(cloudData.attendanceRecords || []);
      saveAttendanceRecords(cloudData.attendanceRecords || []);

      setTimeout(() => {
        isRemoteSyncRef.current = false;
      }, 600);
    } else {
      pushWorkspaceToCloud(clean, {
        teacher,
        classes,
        students,
        assessments,
        grades,
        attendanceSessions: sessions,
        attendanceRecords: records,
        ownerEmail: teacher.email,
      });
    }
  };

  const handleDeactivateSync = () => {
    setCloudSyncEnabled(false);
    setIsSyncActive(false);
  };

  // Création d'un nouveau compte Enseignant
  const handleCreateAccount = (newTeacher: Teacher, startBlank: boolean, passcode?: string) => {
    updateTeacher(newTeacher);

    // Clé Cloud personnalisée pour le professeur
    const baseKey = newTeacher.name
      .split(' ')
      .pop()
      ?.toUpperCase()
      .replace(/[^A-Z0-9]/g, '') || 'PROF';
    const generatedSyncKey = `${baseKey}-${new Date().getFullYear()}`;

    const clean = setStoredSyncKey(generatedSyncKey);
    setSyncKey(clean);
    setCloudSyncEnabled(true);
    setIsSyncActive(true);

    if (startBlank) {
      setClasses([]);
      saveClasses([]);
      setStudents([]);
      saveStudents([]);
      setAssessments([]);
      saveAssessments([]);
      setGrades([]);
      saveGrades([]);
      setSessions([]);
      saveAttendanceSessions([]);
      setRecords([]);
      saveAttendanceRecords([]);
      setSelectedClassId('all');
      setCurrentTab('classes');

      pushWorkspaceToCloud(clean, {
        ownerEmail: newTeacher.email,
        passcode: passcode,
        teacher: newTeacher,
        classes: [],
        students: [],
        assessments: [],
        grades: [],
        attendanceSessions: [],
        attendanceRecords: [],
      });
    } else {
      loadOptionalSampleData();
      const loadedClasses = getStoredClasses();
      const loadedStudents = getStoredStudents();
      setClasses(loadedClasses);
      setStudents(loadedStudents);
      setSelectedClassId('all');
      setCurrentTab('dashboard');

      pushWorkspaceToCloud(clean, {
        ownerEmail: newTeacher.email,
        passcode: passcode,
        teacher: newTeacher,
        classes: loadedClasses,
        students: loadedStudents,
        assessments: [],
        grades: [],
        attendanceSessions: [],
        attendanceRecords: [],
      });
    }
  };

  const handleLoginSuccess = async (email: string, customSyncKey?: string) => {
    setIsAuthenticated(true);
    if (customSyncKey) {
      await handleActivateSync(customSyncKey);
    }
  };

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
        isSyncActive={isSyncActive}
        syncKey={syncKey}
        onOpenCloudSync={() => setCloudSyncModalOpen(true)}
        onOpenInstallPc={() => setInstallPcModalOpen(true)}
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
          onOpenInstallPc={() => setInstallPcModalOpen(true)}
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
              isSyncActive={isSyncActive}
              syncKey={syncKey}
              onOpenCloudSync={() => setCloudSyncModalOpen(true)}
              onOpenAuthModal={() => setAuthModalOpen(true)}
            />
          )}
        </main>
      </div>

      {/* Modale d'authentification & Création de Compte Enseignant */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        teacher={teacher}
        onLoginSuccess={handleLoginSuccess}
        onCreateAccount={handleCreateAccount}
        onLoadDemo={handleLoadSampleData}
      />

      {/* Modale de Synchronisation Cloud Téléphone ⇄ PC */}
      <CloudSyncModal
        isOpen={cloudSyncModalOpen}
        onClose={() => setCloudSyncModalOpen(false)}
        syncKey={syncKey}
        isSyncActive={isSyncActive}
        onActivateSync={handleActivateSync}
        onDeactivateSync={handleDeactivateSync}
      />

      {/* Guide & Installation sur PC */}
      <InstallPcModal
        isOpen={installPcModalOpen}
        onClose={() => setInstallPcModalOpen(false)}
        deferredPrompt={deferredPrompt}
        onTriggerInstall={handleTriggerInstall}
      />
    </div>
  );
}
