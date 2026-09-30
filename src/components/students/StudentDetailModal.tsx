import React from 'react';
import {
  X,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Award,
  AlertCircle,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  Printer
} from 'lucide-react';
import { Student, Classroom, Assessment, Grade, AttendanceRecord, Teacher } from '../../types';
import { calculateStudentAverage, calculateStudentAttendance } from '../../utils/calculations';

interface StudentDetailModalProps {
  student: Student;
  classroom?: Classroom;
  allClasses: Classroom[];
  assessments: Assessment[];
  grades: Grade[];
  attendanceRecords: AttendanceRecord[];
  onClose: () => void;
  onOpenReportCard: (student: Student) => void;
}

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({
  student,
  classroom,
  allClasses,
  assessments,
  grades,
  attendanceRecords,
  onClose,
  onOpenReportCard,
}) => {
  const currentClass = classroom || allClasses.find((c) => c.id === student.classId);
  const classAssessments = assessments.filter((a) => a.classId === student.classId);
  const studentGrades = grades.filter(
    (g) => g.studentId === student.id && classAssessments.some((a) => a.id === g.assessmentId)
  );

  const average = calculateStudentAverage(student.id, classAssessments, grades);
  const attendance = calculateStudentAttendance(student.id, attendanceRecords);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-100 my-8">
        {/* Header avec avatar & identité */}
        <div className="relative bg-linear-to-r from-slate-900 to-indigo-950 p-6 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-300 hover:text-white rounded-full hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            {student.avatarUrl ? (
              <img
                src={student.avatarUrl}
                alt={`${student.firstName} ${student.lastName}`}
                className="w-20 h-20 rounded-2xl object-cover ring-4 ring-white/20 shadow-lg"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-indigo-600 text-white font-black text-2xl flex items-center justify-center shadow-lg">
                {student.firstName[0]}
                {student.lastName[0]}
              </div>
            )}

            <div className="text-center sm:text-left flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1.5 justify-center sm:justify-start">
                <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-white/20 text-indigo-200 backdrop-blur-md">
                  {currentClass?.name} • {currentClass?.level}
                </span>
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-black tracking-wider backdrop-blur-md ${
                  student.group === '2' ? 'bg-blue-500/30 text-blue-200 border border-blue-400/30' : 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/30'
                }`}>
                  {student.group === '2' ? 'الفوج 2 (Groupe 2 - TD)' : 'الفوج 1 (Groupe 1 - TD)'}
                </span>
              </div>
              <h2 className="text-2xl font-black tracking-tight">
                {student.lastName.toUpperCase()} {student.firstName}
              </h2>
              <p className="text-xs text-slate-300 mt-1 flex items-center justify-center sm:justify-start gap-3">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Né(e) le {new Date(student.birthDate).toLocaleDateString('fr-FR')}
                </span>
                <span>• Genre : {student.gender}</span>
              </p>
            </div>

            <button
              onClick={() => onOpenReportCard(student)}
              className="mt-2 sm:mt-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-indigo-950 text-xs font-bold shadow-md hover:bg-indigo-50 transition cursor-pointer shrink-0"
            >
              <Printer className="w-3.5 h-3.5 text-indigo-600" />
              <span>Voir Bulletin</span>
            </button>
          </div>
        </div>

        {/* Corps de la modale */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Métriques élève */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Moyenne</span>
              <span
                className={`text-2xl font-black ${
                  average !== null && average < 10 ? 'text-rose-600' : 'text-indigo-600'
                }`}
              >
                {average !== null ? `${average}` : '—'}
                <span className="text-xs font-medium text-slate-400">/20</span>
              </span>
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Évaluations</span>
              <span className="text-2xl font-black text-slate-800">
                {studentGrades.filter((g) => g.score !== null).length}
              </span>
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Assiduité</span>
              <span className="text-2xl font-black text-emerald-600">
                {attendance.attendanceRate}%
              </span>
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Absences / Retards</span>
              <span className="text-2xl font-black text-amber-600">
                {attendance.absentCount} / {attendance.lateCount}
              </span>
            </div>
          </div>

          {/* Coordonnées & Contacts */}
          <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 space-y-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Coordonnées & Responsables légaux
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-700">
                <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Téléphone parents : <strong>{student.parentPhone}</strong></span>
              </div>
              {student.parentEmail && (
                <div className="flex items-center gap-2 text-slate-700">
                  <Mail className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>Email parents : <strong>{student.parentEmail}</strong></span>
                </div>
              )}
              {student.studentEmail && (
                <div className="flex items-center gap-2 text-slate-700">
                  <Mail className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>Email élève : {student.studentEmail}</span>
                </div>
              )}
              {student.address && (
                <div className="flex items-center gap-2 text-slate-700 sm:col-span-2">
                  <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>Adresse : {student.address}</span>
                </div>
              )}
            </div>
          </div>

          {/* Observations pédagogiques */}
          {student.observations && (
            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/60">
              <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-1">
                Remarques & Suivi pédagogique
              </h4>
              <p className="text-xs text-amber-800 leading-relaxed">
                {student.observations}
              </p>
            </div>
          )}

          {/* Relevé des notes obtenues */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Notes et devoirs ({studentGrades.length})
              </h4>
            </div>

            {studentGrades.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-3 text-center bg-slate-50 rounded-xl">
                Aucune note enregistrée pour le moment.
              </p>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2">Évaluation</th>
                      <th className="px-3 py-2">Date</th>
                      <th className="px-3 py-2 text-center">Coef.</th>
                      <th className="px-3 py-2 text-right">Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {studentGrades.map((g) => {
                      const ass = assessments.find((a) => a.id === g.assessmentId);
                      return (
                        <tr key={g.id} className="hover:bg-slate-50">
                          <td className="px-3 py-2 font-medium text-slate-800">
                            {ass?.title || 'Devoir'}
                            {g.comment && (
                              <span className="block text-[11px] text-slate-500 italic">
                                « {g.comment} »
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-slate-500">
                            {ass ? new Date(ass.date).toLocaleDateString('fr-FR') : '—'}
                          </td>
                          <td className="px-3 py-2 text-center font-semibold text-slate-600">
                            {ass?.coefficient}
                          </td>
                          <td className="px-3 py-2 text-right font-bold">
                            {g.isAbsent ? (
                              <span className="text-rose-500">Absent</span>
                            ) : g.score !== null ? (
                              <span
                                className={`${
                                  g.score < 10 ? 'text-rose-600' : 'text-emerald-700'
                                } font-black`}
                              >
                                {g.score} / {ass?.maxScore || 20}
                              </span>
                            ) : (
                              <span className="text-slate-400">Non noté</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 rounded-xl transition cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
