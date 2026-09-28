import React from 'react';
import {
  GraduationCap,
  Users,
  Award,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Clock,
  ClipboardCheck,
  PlusCircle,
  FileText,
  Sparkles
} from 'lucide-react';
import { Classroom, Student, Assessment, Grade, AttendanceRecord, NavTab } from '../../types';
import { calculateStudentAverage, calculateClassStats, getGradeDistribution } from '../../utils/calculations';

interface DashboardViewProps {
  classes: Classroom[];
  students: Student[];
  assessments: Assessment[];
  grades: Grade[];
  attendanceRecords: AttendanceRecord[];
  onNavigate: (tab: NavTab) => void;
  onSelectClass: (classId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  classes,
  students,
  assessments,
  grades,
  attendanceRecords,
  onNavigate,
  onSelectClass,
}) => {
  // Calcul global
  const totalStudents = students.length;
  const totalClasses = classes.length;
  const totalAssessments = assessments.length;

  // Calcul moyenne générale globale
  const allStudentAverages = students
    .map((s) => calculateStudentAverage(s.id, assessments, grades))
    .filter((a): a is number => a !== null);

  const globalAverage =
    allStudentAverages.length > 0
      ? Number((allStudentAverages.reduce((sum, v) => sum + v, 0) / allStudentAverages.length).toFixed(2))
      : null;

  // Taux de présence global
  const totalAttendanceCount = attendanceRecords.length;
  const presentCount = attendanceRecords.filter((r) => r.status === 'present' || r.status === 'late').length;
  const globalAttendanceRate =
    totalAttendanceCount > 0 ? Math.round((presentCount / totalAttendanceCount) * 100) : 100;

  // Élèves en difficulté (moyenne < 10)
  const studentsNeedingSupport = students
    .map((s) => {
      const avg = calculateStudentAverage(s.id, assessments, grades);
      const studentClass = classes.find((c) => c.id === s.classId);
      return { student: s, avg, studentClass };
    })
    .filter((item) => item.avg !== null && item.avg < 10)
    .sort((a, b) => (a.avg ?? 0) - (b.avg ?? 0));

  // Distribution globale des notes
  const gradeDistribution = [
    { label: '< 8', count: 0, color: 'bg-rose-500' },
    { label: '8-9.9', count: 0, color: 'bg-amber-500' },
    { label: '10-11.9', count: 0, color: 'bg-yellow-500' },
    { label: '12-13.9', count: 0, color: 'bg-blue-500' },
    { label: '14-15.9', count: 0, color: 'bg-indigo-500' },
    { label: '16-20', count: 0, color: 'bg-emerald-500' },
  ];

  for (const avg of allStudentAverages) {
    if (avg < 8) gradeDistribution[0].count++;
    else if (avg < 10) gradeDistribution[1].count++;
    else if (avg < 12) gradeDistribution[2].count++;
    else if (avg < 14) gradeDistribution[3].count++;
    else if (avg < 16) gradeDistribution[4].count++;
    else gradeDistribution[5].count++;
  }

  const maxDistCount = Math.max(...gradeDistribution.map((d) => d.count), 1);

  return (
    <div className="space-y-6">
      {/* En-tête de bienvenue */}
      <div className="bg-linear-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-indigo-200 text-xs font-semibold backdrop-blur-md mb-3 border border-white/10">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Tableau de bord enseignant • Année scolaire en cours</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Bienvenue sur votre espace de gestion
          </h1>
          <p className="mt-2 text-indigo-100 text-sm sm:text-base leading-relaxed">
            Suivez en temps réel les progrès de vos élèves, saisissez les évaluations, réalisez l’appel en quelques clics et éditez vos bulletins scolaires conformes.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('attendance')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-indigo-950 font-bold text-sm shadow-md hover:bg-indigo-50 transition cursor-pointer"
            >
              <ClipboardCheck className="w-4 h-4 text-emerald-600" />
              <span>Faire l'appel du jour</span>
            </button>
            <button
              onClick={() => onNavigate('grades')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-700/80 hover:bg-indigo-700 text-white font-semibold text-sm backdrop-blur-md border border-white/20 transition cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Saisir une évaluation</span>
            </button>
            <button
              onClick={() => onNavigate('reports')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-white font-semibold text-sm border border-white/10 transition cursor-pointer"
            >
              <FileText className="w-4 h-4 text-indigo-300" />
              <span>Générer les bulletins</span>
            </button>
          </div>
        </div>
      </div>

      {/* Cartes KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Classes */}
        <div
          onClick={() => onNavigate('classes')}
          className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Classes Actives
            </span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{totalClasses}</span>
            <span className="text-xs text-slate-500 font-medium">classes gérées</span>
          </div>
          <div className="mt-2 text-xs text-indigo-600 font-medium flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
            <span>Gérer les classes</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Élèves */}
        <div
          onClick={() => onNavigate('students')}
          className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Élèves
            </span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{totalStudents}</span>
            <span className="text-xs text-slate-500 font-medium">élèves inscrits</span>
          </div>
          <div className="mt-2 text-xs text-blue-600 font-medium flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
            <span>Voir l'annuaire & fiches</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Moyenne Générale */}
        <div
          onClick={() => onNavigate('grades')}
          className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Moyenne Générale
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">
              {globalAverage !== null ? `${globalAverage}` : '—'}
            </span>
            <span className="text-sm font-bold text-slate-400">/ 20</span>
          </div>
          <div className="mt-2 text-xs text-amber-700 font-medium flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Sur {totalAssessments} évaluations saisies</span>
          </div>
        </div>

        {/* Taux d'Assiduité */}
        <div
          onClick={() => onNavigate('attendance')}
          className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Assiduité Globale
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{globalAttendanceRate}%</span>
            <span className="text-xs text-slate-500 font-medium">présence moyenne</span>
          </div>
          <div className="mt-2 text-xs text-emerald-600 font-medium flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
            <span>Historique d'appel</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* Grille : Aperçu des classes & Distribution des notes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne gauche (2/3) : Mes classes */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Vue d'ensemble par classe</h2>
                <p className="text-xs text-slate-500">
                  Moyenne, effectif et assiduité pour chaque groupe scolaire
                </p>
              </div>
              <button
                onClick={() => onNavigate('classes')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
              >
                <span>Toutes les classes</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {classes.map((cls) => {
                const stats = calculateClassStats(
                  cls.id,
                  students,
                  assessments,
                  grades,
                  attendanceRecords
                );
                return (
                  <div
                    key={cls.id}
                    onClick={() => {
                      onSelectClass(cls.id);
                      onNavigate('students');
                    }}
                    className="p-4 rounded-xl border border-slate-200 hover:border-indigo-400 bg-slate-50/50 hover:bg-white transition-all cursor-pointer group shadow-2xs"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs"
                          style={{ backgroundColor: cls.color }}
                        />
                        <div>
                          <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                            {cls.name}
                          </h3>
                          <span className="text-xs text-slate-500 font-medium">
                            {cls.level} • {cls.subject}
                          </span>
                        </div>
                      </div>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-200/70 text-slate-700 font-semibold">
                        {cls.room || 'Salle std'}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-2 pt-3 border-t border-slate-200/60 text-center">
                      <div>
                        <span className="text-[11px] text-slate-500 block">Élèves</span>
                        <span className="text-base font-bold text-slate-800">
                          {stats.studentCount}
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-500 block">Moyenne</span>
                        <span
                          className={`text-base font-bold ${
                            stats.classAverage !== null && stats.classAverage < 10
                              ? 'text-rose-600'
                              : 'text-indigo-600'
                          }`}
                        >
                          {stats.classAverage !== null ? `${stats.classAverage}` : '—'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-500 block">Présence</span>
                        <span className="text-base font-bold text-emerald-600">
                          {stats.overallAttendanceRate}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Graphique de distribution des moyennes */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Répartition des moyennes des élèves (/20)
                </h2>
                <p className="text-xs text-slate-500">
                  Distribution par tranches de notes sur l'ensemble des élèves
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              {gradeDistribution.map((item) => {
                const percentage =
                  allStudentAverages.length > 0
                    ? Math.round((item.count / allStudentAverages.length) * 100)
                    : 0;
                return (
                  <div key={item.label} className="flex items-center gap-3 text-xs">
                    <span className="w-14 font-semibold text-slate-600 shrink-0">
                      {item.label}
                    </span>
                    <div className="flex-1 bg-slate-100 rounded-full h-4 overflow-hidden relative">
                      <div
                        className={`h-full rounded-full ${item.color} transition-all duration-500`}
                        style={{ width: `${Math.max(percentage, item.count > 0 ? 6 : 0)}%` }}
                      />
                    </div>
                    <span className="w-16 text-right font-bold text-slate-700 shrink-0">
                      {item.count} élève{item.count > 1 ? 's' : ''} ({percentage}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Colonne droite (1/3) : Alertes & Activités */}
        <div className="space-y-6">
          {/* Élèves à accompagner */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h3 className="font-bold text-slate-900 text-sm">Vigilance pédagogique</h3>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                {studentsNeedingSupport.length} élève{studentsNeedingSupport.length > 1 ? 's' : ''}
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Élèves ayant une moyenne inférieure à 10/20
            </p>

            {studentsNeedingSupport.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <span>Tous les élèves ont actuellement une moyenne supérieure à 10. Félicitations !</span>
              </div>
            ) : (
              <div className="space-y-2.5">
                {studentsNeedingSupport.slice(0, 5).map(({ student, avg, studentClass }) => (
                  <div
                    key={student.id}
                    onClick={() => {
                      onSelectClass(student.classId);
                      onNavigate('students');
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 transition cursor-pointer border border-slate-200/60"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                        {student.firstName[0]}
                        {student.lastName[0]}
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-bold text-slate-800 truncate">
                          {student.lastName} {student.firstName}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {studentClass?.name || 'Classe'}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-black text-rose-600 bg-rose-50 px-2 py-1 rounded-md border border-rose-200 shrink-0">
                      {avg} / 20
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Derniers devoirs enregistrés */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-900 text-sm">Évaluations récentes</h3>
              <button
                onClick={() => onNavigate('grades')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
              >
                Gérer
              </button>
            </div>

            <div className="space-y-3">
              {assessments.slice(-4).reverse().map((ass) => {
                const cls = classes.find((c) => c.id === ass.classId);
                return (
                  <div
                    key={ass.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 truncate max-w-[180px]">
                        {ass.title}
                      </span>
                      <span className="px-1.5 py-0.5 rounded font-bold text-[10px] bg-indigo-50 text-indigo-700">
                        Coef. {ass.coefficient}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-slate-500 text-[11px]">
                      <span>{cls?.name} • {ass.type}</span>
                      <span>{new Date(ass.date).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
