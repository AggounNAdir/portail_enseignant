import React, { useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  Award,
  Users,
  AlertTriangle,
  CheckCircle2,
  PieChart,
  Calendar,
  Sparkles
} from 'lucide-react';
import { Classroom, Student, Assessment, Grade, AttendanceRecord } from '../../types';
import { calculateStudentAverage, calculateClassStats, getGradeDistribution, calculateStudentAttendance } from '../../utils/calculations';

interface AnalyticsViewProps {
  classes: Classroom[];
  students: Student[];
  assessments: Assessment[];
  grades: Grade[];
  attendanceRecords: AttendanceRecord[];
  selectedClassId: string;
  onSelectClassId: (id: string) => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  classes,
  students,
  assessments,
  grades,
  attendanceRecords,
  selectedClassId,
  onSelectClassId,
}) => {
  const activeClassId = selectedClassId !== 'all' ? selectedClassId : (classes[0]?.id || '');
  const activeClass = classes.find((c) => c.id === activeClassId);

  const classStudents = useMemo(() => {
    return students.filter((s) => s.classId === activeClassId);
  }, [students, activeClassId]);

  const classAssessments = useMemo(() => {
    return assessments.filter((a) => a.classId === activeClassId);
  }, [assessments, activeClassId]);

  // Statistiques de la classe
  const classStats = useMemo(() => {
    if (!activeClassId) return null;
    return calculateClassStats(activeClassId, students, assessments, grades, attendanceRecords);
  }, [activeClassId, students, assessments, grades, attendanceRecords]);

  // Distribution des notes
  const distribution = useMemo(() => {
    if (!activeClassId) return [];
    return getGradeDistribution(activeClassId, students, assessments, grades);
  }, [activeClassId, students, assessments, grades]);

  // Évolution moyenne par devoir
  const assessmentTrends = useMemo(() => {
    return classAssessments.map((ass) => {
      const assGrades = grades.filter((g) => g.assessmentId === ass.id && g.score !== null && !g.isAbsent);
      const avg =
        assGrades.length > 0
          ? Number((assGrades.reduce((sum, g) => sum + (g.score || 0), 0) / assGrades.length).toFixed(2))
          : 0;

      return {
        id: ass.id,
        title: ass.title,
        date: ass.date,
        avg,
        maxScore: ass.maxScore,
        count: assGrades.length,
      };
    });
  }, [classAssessments, grades]);

  // Classement des élèves
  const studentRankings = useMemo(() => {
    return classStudents
      .map((st) => {
        const avg = calculateStudentAverage(st.id, classAssessments, grades);
        const att = calculateStudentAttendance(st.id, attendanceRecords);
        return { student: st, avg, att };
      })
      .sort((a, b) => (b.avg ?? -1) - (a.avg ?? -1));
  }, [classStudents, classAssessments, grades, attendanceRecords]);

  const maxDist = Math.max(...distribution.map((d) => d.count), 1);

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-indigo-600" />
            <span>Statistiques & Bilan Pédagogique</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Analyses détaillées des performances, progression par devoir et corrélation assiduité / notes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase">Classe :</span>
          <select
            value={activeClassId}
            onChange={(e) => onSelectClassId(e.target.value)}
            className="bg-slate-50 border border-slate-300 text-slate-800 text-sm font-bold rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500"
          >
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name} ({cls.level})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Cartes KPI de la classe */}
      {classStats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Moyenne de classe
            </span>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-3xl font-black text-indigo-600">
                {classStats.classAverage !== null ? `${classStats.classAverage}` : '—'}
              </span>
              <span className="text-xs font-bold text-slate-400">/ 20</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Min: {classStats.lowestAverage ?? '—'} | Max: {classStats.highestAverage ?? '—'}
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Effectif Élèves
            </span>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-3xl font-black text-slate-900">
                {classStats.studentCount}
              </span>
              <span className="text-xs font-semibold text-slate-400">élèves</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Tous inscrits pour l'année</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Taux de Présence
            </span>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-3xl font-black text-emerald-600">
                {classStats.overallAttendanceRate}%
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Assiduité générale</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Total Évaluations
            </span>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-3xl font-black text-amber-600">
                {classStats.assessmentsCount}
              </span>
              <span className="text-xs font-semibold text-slate-400">devoirs</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Comptabilisés ce trimestre</p>
          </div>
        </div>
      )}

      {/* Graphiques : Évolution des moyennes par devoir & Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Évolution par devoir */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Moyenne par évaluation ({activeClass?.name})
              </h3>
              <p className="text-xs text-slate-500">
                Suivi de la difficulté des devoirs et contrôles
              </p>
            </div>
            <TrendingUp className="w-5 h-5 text-indigo-600" />
          </div>

          {assessmentTrends.length === 0 ? (
            <p className="text-xs text-slate-400 py-10 text-center">
              Aucune évaluation créée pour cette classe.
            </p>
          ) : (
            <div className="space-y-4 pt-2">
              {assessmentTrends.map((trend) => {
                const percentage = Math.round((trend.avg / trend.maxScore) * 100);
                return (
                  <div key={trend.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800 truncate max-w-[200px]">
                        {trend.title}
                      </span>
                      <span className="font-black text-indigo-700">
                        {trend.avg} / {trend.maxScore}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          trend.avg < 10
                            ? 'bg-rose-500'
                            : trend.avg < 14
                            ? 'bg-indigo-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Histogramme de distribution */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Courbe de Gauss / Histogramme
              </h3>
              <p className="text-xs text-slate-500">
                Répartition des élèves par tranche de notes
              </p>
            </div>
            <PieChart className="w-5 h-5 text-indigo-600" />
          </div>

          <div className="h-56 flex items-end justify-between gap-3 pt-6 px-2 border-b border-slate-200">
            {distribution.map((bucket) => {
              const heightPercent = maxDist > 0 ? (bucket.count / maxDist) * 100 : 0;
              return (
                <div key={bucket.label} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-xs font-bold text-slate-700">
                    {bucket.count > 0 ? bucket.count : ''}
                  </span>
                  <div
                    className="w-full rounded-t-lg transition-all duration-500"
                    style={{
                      backgroundColor: bucket.color,
                      height: `${Math.max(heightPercent, 8)}%`,
                    }}
                  />
                  <span className="text-[10px] font-bold text-slate-500 text-center whitespace-nowrap">
                    {bucket.label}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="text-center text-[11px] text-slate-400 mt-3">
            Intervalles de notes (/20)
          </p>
        </div>
      </div>

      {/* Tableau détaillé : Performance & Assiduité par élève */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 mb-1">
          Bilan individuel croisé ({activeClass?.name})
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Classement général et croisement note / assiduité
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Rang</th>
                <th className="py-2.5 px-3">Élève</th>
                <th className="py-2.5 px-3 text-center">Moyenne Générale</th>
                <th className="py-2.5 px-3 text-center">Taux Assiduité</th>
                <th className="py-2.5 px-3 text-center">Absences Injustifiées</th>
                <th className="py-2.5 px-3">Statut Pédagogique</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {studentRankings.map(({ student, avg, att }, rank) => {
                let badge = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                let label = 'Parcours régulier';

                if (avg !== null && avg >= 16) {
                  badge = 'bg-indigo-50 text-indigo-700 border-indigo-200';
                  label = 'Félicitations';
                } else if (avg !== null && avg < 10) {
                  badge = 'bg-rose-50 text-rose-700 border-rose-200';
                  label = 'Soutien recommandé';
                } else if (att.unexcusedAbsenceCount >= 2) {
                  badge = 'bg-amber-50 text-amber-700 border-amber-200';
                  label = 'Suivi assiduité';
                }

                return (
                  <tr key={student.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-bold text-slate-400">{rank + 1}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">
                      {student.lastName.toUpperCase()} {student.firstName}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {avg !== null ? (
                        <span
                          className={`font-black text-xs px-2 py-0.5 rounded ${
                            avg < 10 ? 'text-rose-600' : 'text-slate-900'
                          }`}
                        >
                          {avg} / 20
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-slate-700">
                      {att.attendanceRate}%
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-rose-600">
                      {att.unexcusedAbsenceCount}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold border ${badge}`}>
                        {label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
