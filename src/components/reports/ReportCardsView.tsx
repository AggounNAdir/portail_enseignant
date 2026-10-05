import React, { useState, useMemo } from 'react';
import {
  Award,
  Printer,
  Download,
  Filter,
  CheckCircle2,
  Calendar,
  Building,
  User,
  GraduationCap,
  Sparkles,
  FileText
} from 'lucide-react';
import { Classroom, Student, Assessment, Grade, AttendanceRecord, Teacher } from '../../types';
import { generateFullReportCard } from '../../utils/calculations';

interface ReportCardsViewProps {
  classes: Classroom[];
  students: Student[];
  assessments: Assessment[];
  grades: Grade[];
  attendanceRecords: AttendanceRecord[];
  teacher: Teacher;
  selectedClassId: string;
  onSelectClassId: (id: string) => void;
  preselectedStudent?: Student | null;
}

export const ReportCardsView: React.FC<ReportCardsViewProps> = ({
  classes,
  students,
  assessments,
  grades,
  attendanceRecords,
  teacher,
  selectedClassId,
  onSelectClassId,
  preselectedStudent,
}) => {
  const activeClassId = selectedClassId !== 'all' ? selectedClassId : (classes[0]?.id || '');
  const activeClass = classes.find((c) => c.id === activeClassId);

  const classStudents = useMemo(() => {
    return students.filter((s) => s.classId === activeClassId);
  }, [students, activeClassId]);

  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    preselectedStudent?.id || classStudents[0]?.id || 'all'
  );

  const [selectedTerm, setSelectedTerm] = useState<string>('Trimestre 1');

  // Quand la classe ou l'élève présélectionné change
  React.useEffect(() => {
    if (preselectedStudent && preselectedStudent.classId === activeClassId) {
      setSelectedStudentId(preselectedStudent.id);
    } else if (classStudents.length > 0 && selectedStudentId !== 'all' && !classStudents.some((s) => s.id === selectedStudentId)) {
      setSelectedStudentId(classStudents[0].id);
    }
  }, [activeClassId, classStudents, preselectedStudent]);

  // Générer les bulletins
  const reportCards = useMemo(() => {
    if (!activeClass) return [];

    const targetStudents =
      selectedStudentId === 'all'
        ? classStudents
        : classStudents.filter((s) => s.id === selectedStudentId);

    return targetStudents.map((st) =>
      generateFullReportCard(
        st,
        activeClass,
        teacher,
        selectedTerm,
        students,
        assessments,
        grades,
        attendanceRecords
      )
    );
  }, [activeClass, selectedStudentId, classStudents, teacher, selectedTerm, students, assessments, grades, attendanceRecords]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* En-tête de configuration (Masqué à l'impression) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 no-print">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <Award className="w-7 h-7 text-indigo-600" />
            <span>Bulletins Scolaires Officiels</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Génération automatique des bulletins périodiques avec appréciations, moyennes et assiduité, prêts pour impression et export PDF.
          </p>
        </div>

        {/* Contrôles de filtrage & impression */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Sélecteur de classe */}
          <div>
            <select
              value={activeClassId}
              onChange={(e) => onSelectClassId(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-800 text-xs font-bold rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-indigo-500"
            >
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} ({cls.level})
                </option>
              ))}
            </select>
          </div>

          {/* Sélecteur d'élève */}
          <div>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-800 text-xs font-bold rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Tous les élèves ({classStudents.length})</option>
              {classStudents.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.lastName.toUpperCase()} {st.firstName}
                </option>
              ))}
            </select>
          </div>

          {/* Sélecteur de période */}
          <div>
            <select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-800 text-xs font-bold rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Trimestre 1">Trimestre 1</option>
              <option value="Trimestre 2">Trimestre 2</option>
              <option value="Trimestre 3">Trimestre 3</option>
              <option value="Semestre 1">Semestre 1</option>
              <option value="Semestre 2">Semestre 2</option>
            </select>
          </div>

          {/* Bouton Impression PDF */}
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimer / Télécharger PDF</span>
          </button>
        </div>
      </div>

      {/* Zone de rendu des Bulletins */}
      {reportCards.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 no-print">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800 text-base">Aucun élève sélectionné</h3>
          <p className="text-xs text-slate-400 mt-1">
            Sélectionnez une classe comportant des élèves inscrits.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {reportCards.map((rc, idx) => (
            <div
              key={rc.student.id}
              className="bulletin-page bg-white rounded-2xl border border-slate-300 p-8 shadow-md max-w-4xl mx-auto text-slate-900 page-break"
            >
              {/* En-tête officiel de l'Éducation */}
              <div className="border-b-2 border-slate-900 pb-4 mb-6">
                <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4">
                  <div className="text-center sm:text-left">
                    <span className="text-[11px] font-black uppercase tracking-widest text-slate-700 block">
                      RÉPUBLIQUE FRANÇAISE
                    </span>
                    <span className="text-xs font-semibold text-slate-600 block">
                      Ministère de l'Éducation Nationale
                    </span>
                    <h2 className="text-lg font-black tracking-tight text-slate-900 mt-1">
                      {rc.teacher.school}
                    </h2>
                    <p className="text-xs text-slate-500">
                      Année Scolaire {rc.schoolYear}
                    </p>
                  </div>

                  <div className="text-center sm:text-right border-2 border-slate-900 px-4 py-2 rounded-xl bg-slate-50">
                    <span className="text-xs font-black uppercase tracking-wider block text-slate-600">
                      BULLETIN SCOLAIRE OFFICIEL
                    </span>
                    <span className="text-base font-extrabold text-indigo-900 block">
                      {rc.term.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Bandeau d'identité de l'élève */}
                <div className="mt-5 p-4 rounded-xl bg-slate-100/80 border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Élève</span>
                    <span className="text-sm font-black text-slate-900">
                      {rc.student.lastName.toUpperCase()} {rc.student.firstName}
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      Né(e) le {new Date(rc.student.birthDate).toLocaleDateString('fr-FR')}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Classe & Effectif</span>
                    <span className="text-sm font-bold text-slate-900">
                      {rc.classroom.name} ({rc.classroom.level})
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      Effectif : {rc.totalStudents} élèves
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Professeur Principal</span>
                    <span className="text-sm font-bold text-slate-900">
                      {rc.teacher.name}
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      {rc.teacher.subject}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tableau des matières et appréciations */}
              <div className="mb-6">
                <table className="w-full text-xs text-left border-collapse border border-slate-300">
                  <thead>
                    <tr className="bg-slate-200/90 text-slate-800 font-bold uppercase tracking-wider border-b border-slate-300">
                      <th className="py-2.5 px-3 border-r border-slate-300 w-1/4">Discipline</th>
                      <th className="py-2.5 px-2 border-r border-slate-300 text-center w-20">Moy. Élève</th>
                      <th className="py-2.5 px-2 border-r border-slate-300 text-center w-28">Moy. Classe [Min - Max]</th>
                      <th className="py-2.5 px-3">Appréciation de l'enseignant</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300">
                    {rc.subjectRows.map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50/50">
                        <td className="py-3 px-3 border-r border-slate-300 font-bold text-slate-900 align-top">
                          {row.subject}
                          <span className="block text-[10px] font-normal text-slate-500">
                            {rc.teacher.name} • {row.gradesCount} évaluation(s)
                          </span>
                        </td>

                        <td className="py-3 px-2 border-r border-slate-300 text-center font-black text-sm align-top">
                          {row.studentAverage !== null ? (
                            <span
                              className={row.studentAverage < 10 ? 'text-rose-600' : 'text-slate-900'}
                            >
                              {row.studentAverage}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        <td className="py-3 px-2 border-r border-slate-300 text-center text-slate-600 align-top">
                          <span className="font-bold text-slate-800">
                            {row.classAverage !== null ? `${row.classAverage}` : '—'}
                          </span>
                          {row.minAverage !== null && row.maxAverage !== null && (
                            <span className="block text-[10px] text-slate-400">
                              [{row.minAverage} - {row.maxAverage}]
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-3 text-slate-700 leading-relaxed text-xs align-top">
                          {row.teacherComment}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Bilan Général & Assiduité */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                {/* Moyennes Générales & Rang */}
                <div className="p-4 rounded-xl border border-slate-300 bg-slate-50/60">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-2">
                    BILAN DES MOYENNES
                  </span>
                  <div className="flex items-center justify-between text-xs">
                    <span>Moyenne générale de l'élève :</span>
                    <span className="font-black text-base text-indigo-700">
                      {rc.studentOverallAverage !== null ? `${rc.studentOverallAverage} / 20` : '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs mt-1">
                    <span>Moyenne générale de la classe :</span>
                    <span className="font-bold text-slate-700">
                      {rc.classOverallAverage !== null ? `${rc.classOverallAverage} / 20` : '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs mt-1 pt-1 border-t border-slate-200">
                    <span>Rang dans la classe :</span>
                    <span className="font-bold text-slate-800">
                      {rc.rank} sur {rc.totalStudents} élèves
                    </span>
                  </div>
                </div>

                {/* Assiduité & Vie Scolaire */}
                <div className="p-4 rounded-xl border border-slate-300 bg-slate-50/60">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-2">
                    VIE SCOLAIRE & ASSIDUITÉ
                  </span>
                  <div className="flex items-center justify-between text-xs">
                    <span>Absences totales :</span>
                    <span className="font-bold text-slate-800">{rc.attendance.totalAbsences} demi-journée(s)</span>
                  </div>
                  <div className="flex items-center justify-between text-xs mt-1">
                    <span>Dont non justifiées :</span>
                    <span className={`font-bold ${rc.attendance.unexcusedAbsences > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
                      {rc.attendance.unexcusedAbsences}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs mt-1 pt-1 border-t border-slate-200">
                    <span>Retards constatés :</span>
                    <span className="font-bold text-slate-800">{rc.attendance.latesCount}</span>
                  </div>
                </div>
              </div>

              {/* Mention d'honneur & Appréciation Globale du Conseil */}
              <div className="p-4 rounded-xl border-2 border-indigo-200 bg-indigo-50/30 mb-8">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black uppercase tracking-wider text-indigo-950">
                    APPRÉCIATION GLOBALE DU CONSEIL DE CLASSE
                  </span>
                  {(rc.honorMention || rc.honorMentionAr) && (
                    <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-indigo-600 text-white shadow-xs flex items-center gap-1.5">
                      <span>★</span>
                      <span>{rc.honorMentionAr ? `${rc.honorMentionAr} • ${rc.honorMention}` : rc.honorMention}</span>
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-800 leading-relaxed italic">
                  « {rc.councilAppreciation} »
                </p>
              </div>

              {/* Signatures */}
              <div className="pt-4 border-t border-slate-300 grid grid-cols-3 gap-4 text-center text-xs">
                <div>
                  <span className="font-bold text-slate-600 block mb-12">Le Professeur Principal</span>
                  <span className="font-semibold text-slate-800">{rc.teacher.name}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-600 block mb-12">Le Chef d'Établissement</span>
                  <span className="text-[11px] text-slate-400 italic">Signature & Cachet</span>
                </div>
                <div>
                  <span className="font-bold text-slate-600 block mb-12">Les Responsables Légaux</span>
                  <span className="text-[11px] text-slate-400 italic">Pris connaissance le : ___/___/20__</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
