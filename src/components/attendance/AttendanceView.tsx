import React, { useState, useMemo } from 'react';
import {
  ClipboardCheck,
  CheckCircle,
  XCircle,
  Clock,
  ShieldCheck,
  Calendar,
  Save,
  Users,
  Search,
  AlertTriangle,
  History,
  Check,
  Sparkles
} from 'lucide-react';
import { Classroom, Student, AttendanceSession, AttendanceRecord, AttendanceStatus } from '../../types';
import { calculateStudentAttendance } from '../../utils/calculations';

interface AttendanceViewProps {
  classes: Classroom[];
  students: Student[];
  sessions: AttendanceSession[];
  records: AttendanceRecord[];
  selectedClassId: string;
  onSelectClassId: (id: string) => void;
  onSaveSession: (
    session: Omit<AttendanceSession, 'id'>,
    records: { studentId: string; status: AttendanceStatus; lateMinutes?: number; justification?: string }[]
  ) => void;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({
  classes,
  students,
  sessions,
  records,
  selectedClassId,
  onSelectClassId,
  onSaveSession,
}) => {
  const activeClassId = selectedClassId !== 'all' ? selectedClassId : (classes[0]?.id || '');
  const activeClass = classes.find((c) => c.id === activeClassId);

  const classStudents = useMemo(() => {
    return students.filter((s) => s.classId === activeClassId);
  }, [students, activeClassId]);

  // Mode : 'call' (faire l'appel) ou 'history' (historique & statistiques)
  const [activeTab, setActiveTab] = useState<'call' | 'history'>('call');

  // Paramètres de la séance d'appel en cours
  const [sessionDate, setSessionDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [sessionPeriod, setSessionPeriod] = useState<string>('08h30 - 09h30');
  const [sessionSubject, setSessionSubject] = useState<string>(activeClass?.subject || 'Mathématiques');
  const [sessionNotes, setSessionNotes] = useState<string>('');

  // État de l'appel pour les élèves
  const [rollCallState, setRollCallState] = useState<
    Record<string, { status: AttendanceStatus; lateMinutes?: number; justification?: string }>
  >({});

  const [savedSuccess, setSavedSuccess] = useState(false);

  // Initialiser l'état par défaut (présent pour tout le monde ou recharger)
  React.useEffect(() => {
    const initialState: Record<string, { status: AttendanceStatus; lateMinutes?: number; justification?: string }> = {};
    for (const student of classStudents) {
      initialState[student.id] = { status: 'present' };
    }
    setRollCallState(initialState);
  }, [classStudents, activeClassId]);

  // Modifier le statut d'un élève
  const setStudentStatus = (studentId: string, status: AttendanceStatus) => {
    setRollCallState((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        status,
        lateMinutes: status === 'late' ? (prev[studentId]?.lateMinutes || 10) : undefined,
      },
    }));
  };

  const setStudentLateMinutes = (studentId: string, minutes: number) => {
    setRollCallState((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { status: 'late' }),
        status: 'late',
        lateMinutes: minutes,
      },
    }));
  };

  const setStudentJustification = (studentId: string, justification: string) => {
    setRollCallState((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { status: 'absent' }),
        justification,
      },
    }));
  };

  // Marquer toute la classe présente en 1 clic
  const handleMarkAllPresent = () => {
    const next: Record<string, { status: AttendanceStatus; lateMinutes?: number; justification?: string }> = {};
    for (const student of classStudents) {
      next[student.id] = { status: 'present' };
    }
    setRollCallState(next);
  };

  // Enregistrer la séance d'appel
  const handleSaveCall = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeClassId) return;

    const payloadRecords = classStudents.map((s) => {
      const state = rollCallState[s.id] || { status: 'present' };
      return {
        studentId: s.id,
        status: state.status,
        lateMinutes: state.lateMinutes,
        justification: state.justification,
      };
    });

    onSaveSession(
      {
        classId: activeClassId,
        date: sessionDate,
        period: sessionPeriod,
        subject: sessionSubject,
        notes: sessionNotes.trim() || undefined,
      },
      payloadRecords
    );

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  // Calcul du résumé de la séance en direct
  const liveSummary = useMemo(() => {
    let present = 0;
    let absent = 0;
    let late = 0;
    let excused = 0;

    for (const student of classStudents) {
      const st = rollCallState[student.id]?.status || 'present';
      if (st === 'present') present++;
      else if (st === 'absent') absent++;
      else if (st === 'late') late++;
      else if (st === 'excused') excused++;
    }

    return { present, absent, late, excused, total: classStudents.length };
  }, [classStudents, rollCallState]);

  // Historique des sessions de la classe active
  const classSessions = useMemo(() => {
    return sessions
      .filter((s) => s.classId === activeClassId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [sessions, activeClassId]);

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <ClipboardCheck className="w-7 h-7 text-emerald-600" />
            <span>Feuille d'Appel & Assiduité</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Faites l'appel pour chaque cours, suivez les retards et analysez les motifs d'absences.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Sélecteur de classe */}
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

          {/* Onglets Appel vs Historique */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1">
            <button
              onClick={() => setActiveTab('call')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'call'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Faire l'appel
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Historique & Bilan
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'call' ? (
        <form onSubmit={handleSaveCall} className="space-y-6">
          {/* Configuration du créneau horaire */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Date de la séance
                </label>
                <input
                  type="date"
                  required
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Créneau horaire
                </label>
                <input
                  type="text"
                  placeholder="08h30 - 09h30"
                  value={sessionPeriod}
                  onChange={(e) => setSessionPeriod(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Matière / Cours
                </label>
                <input
                  type="text"
                  value={sessionSubject}
                  onChange={(e) => setSessionSubject(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Notes de séance
                </label>
                <input
                  type="text"
                  placeholder="Ex: TP en salle informatique, contrôle..."
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Barre de contrôle rapide et compteurs de présence */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <span className="font-bold text-slate-500 uppercase tracking-wider">
                  Effectif {liveSummary.total} élèves :
                </span>
                <span className="px-2.5 py-1 rounded-lg font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {liveSummary.present} Présents
                </span>
                <span className="px-2.5 py-1 rounded-lg font-bold bg-rose-50 text-rose-700 border border-rose-200">
                  {liveSummary.absent} Absents
                </span>
                <span className="px-2.5 py-1 rounded-lg font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  {liveSummary.late} Retards
                </span>
                <span className="px-2.5 py-1 rounded-lg font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  {liveSummary.excused} Excusés
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleMarkAllPresent}
                  className="px-3.5 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-300 text-xs font-bold rounded-xl transition cursor-pointer shadow-2xs"
                >
                  Tout le monde présent
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Enregistrer l'appel</span>
                </button>
              </div>
            </div>

            {savedSuccess && (
              <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2 animate-fade-in">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Appel de cours enregistré avec succès pour {activeClass?.name} !</span>
              </div>
            )}
          </div>

          {/* Grille des élèves pour l'appel */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="divide-y divide-slate-100">
              {classStudents.map((student, idx) => {
                const currentStatus = rollCallState[student.id]?.status || 'present';
                const currentLate = rollCallState[student.id]?.lateMinutes || 10;
                const currentJustif = rollCallState[student.id]?.justification || '';

                return (
                  <div
                    key={student.id}
                    className={`p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition ${
                      currentStatus === 'absent'
                        ? 'bg-rose-50/40'
                        : currentStatus === 'late'
                        ? 'bg-amber-50/40'
                        : currentStatus === 'excused'
                        ? 'bg-blue-50/30'
                        : 'hover:bg-slate-50/60'
                    }`}
                  >
                    {/* Identité élève */}
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-slate-400 w-6">
                        {idx + 1}.
                      </span>
                      {student.avatarUrl ? (
                        <img
                          src={student.avatarUrl}
                          alt={student.firstName}
                          className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-100 shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                          {student.firstName[0]}
                          {student.lastName[0]}
                        </div>
                      )}
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">
                          {student.lastName.toUpperCase()} {student.firstName}
                        </h4>
                        <span className="text-xs text-slate-400">
                          Responsable : {student.parentPhone}
                        </span>
                      </div>
                    </div>

                    {/* Boutons d'état d'appel */}
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Présent */}
                      <button
                        type="button"
                        onClick={() => setStudentStatus(student.id, 'present')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                          currentStatus === 'present'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Présent</span>
                      </button>

                      {/* Absent */}
                      <button
                        type="button"
                        onClick={() => setStudentStatus(student.id, 'absent')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                          currentStatus === 'absent'
                            ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Absent</span>
                      </button>

                      {/* En Retard */}
                      <button
                        type="button"
                        onClick={() => setStudentStatus(student.id, 'late')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                          currentStatus === 'late'
                            ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Retard</span>
                      </button>

                      {/* Excusé */}
                      <button
                        type="button"
                        onClick={() => setStudentStatus(student.id, 'excused')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                          currentStatus === 'excused'
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Excusé</span>
                      </button>
                    </div>

                    {/* Champs conditionnels pour retards ou justifications */}
                    {(currentStatus === 'late' || currentStatus === 'absent' || currentStatus === 'excused') && (
                      <div className="flex items-center gap-2 w-full md:w-auto">
                        {currentStatus === 'late' && (
                          <div className="flex items-center gap-1">
                            {[5, 10, 15, 20, 30].map((mins) => (
                              <button
                                key={mins}
                                type="button"
                                onClick={() => setStudentLateMinutes(student.id, mins)}
                                className={`px-2 py-1 rounded-md text-[10px] font-bold border transition cursor-pointer ${
                                  currentLate === mins
                                    ? 'bg-amber-600 text-white border-amber-600'
                                    : 'bg-white text-amber-700 border-amber-200'
                                }`}
                              >
                                {mins} min
                              </button>
                            ))}
                          </div>
                        )}

                        <input
                          type="text"
                          placeholder={currentStatus === 'late' ? 'Motif retard...' : 'Motif ou justification...'}
                          value={currentJustif}
                          onChange={(e) => setStudentJustification(student.id, e.target.value)}
                          className="w-full md:w-48 text-xs py-1 px-2.5 border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </form>
      ) : (
        /* Onglet Historique & Statistiques d'Assiduité */
        <div className="space-y-6">
          {/* Bilan récapitulatif par élève */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Bilan d'assiduité par élève ({activeClass?.name})
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Taux de présence individuel, décompte des absences justifiées/injustifiées et retards
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3">Élève</th>
                    <th className="py-3 px-3 text-center">Séances Suivies</th>
                    <th className="py-3 px-3 text-center">Taux Assiduité</th>
                    <th className="py-3 px-3 text-center">Absences Injustifiées</th>
                    <th className="py-3 px-3 text-center">Total Absences</th>
                    <th className="py-3 px-3 text-center">Nombre de Retards</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {classStudents.map((student) => {
                    const att = calculateStudentAttendance(student.id, records);
                    const isAtRisk = att.attendanceRate < 85 || att.unexcusedAbsenceCount >= 2;

                    return (
                      <tr key={student.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-bold text-slate-900">
                          {student.lastName.toUpperCase()} {student.firstName}
                          {isAtRisk && (
                            <span className="ml-2 inline-flex items-center text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                              Alerte absentéisme
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center text-slate-600 font-medium">
                          {att.presentCount} / {att.totalSessions}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`font-black px-2 py-0.5 rounded-full ${
                              att.attendanceRate >= 90
                                ? 'bg-emerald-50 text-emerald-700'
                                : att.attendanceRate >= 75
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-rose-50 text-rose-700'
                            }`}
                          >
                            {att.attendanceRate}%
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-rose-600">
                          {att.unexcusedAbsenceCount}
                        </td>
                        <td className="py-2.5 px-3 text-center font-medium text-slate-700">
                          {att.absentCount}
                        </td>
                        <td className="py-2.5 px-3 text-center font-medium text-amber-600">
                          {att.lateCount} ({att.totalLateMinutes} min cumulées)
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Liste des séances d'appel passées */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Historique des séances d'appel enregistrées ({classSessions.length})
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Consultez les détails des appels précédents
            </p>

            {classSessions.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-6 text-center">
                Aucune séance d'appel enregistrée pour cette classe.
              </p>
            ) : (
              <div className="space-y-3">
                {classSessions.map((session) => {
                  const sessionRecords = records.filter((r) => r.sessionId === session.id);
                  const absents = sessionRecords.filter((r) => r.status === 'absent' || r.status === 'excused');
                  const lates = sessionRecords.filter((r) => r.status === 'late');

                  return (
                    <div
                      key={session.id}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white transition text-xs"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                            <Calendar className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 text-sm">
                              Séance du {new Date(session.date).toLocaleDateString('fr-FR')} • {session.period}
                            </span>
                            <span className="text-slate-500 block">
                              Matière : {session.subject} {session.notes ? `(« ${session.notes} »)` : ''}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 rounded bg-rose-50 text-rose-700 font-bold border border-rose-200">
                            {absents.length} absent(s)
                          </span>
                          <span className="px-2 py-1 rounded bg-amber-50 text-amber-700 font-bold border border-amber-200">
                            {lates.length} retard(s)
                          </span>
                        </div>
                      </div>

                      {/* Détail des élèves absents ou en retard */}
                      {(absents.length > 0 || lates.length > 0) && (
                        <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex flex-wrap gap-2 text-[11px]">
                          {absents.map((r) => {
                            const st = classStudents.find((s) => s.id === r.studentId);
                            return (
                              <span
                                key={r.id}
                                className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-medium"
                              >
                                {st?.firstName} {st?.lastName} ({r.status === 'excused' ? 'Excusé' : 'Absent'}{r.justification ? ` : ${r.justification}` : ''})
                              </span>
                            );
                          })}
                          {lates.map((r) => {
                            const st = classStudents.find((s) => s.id === r.studentId);
                            return (
                              <span
                                key={r.id}
                                className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-medium"
                              >
                                {st?.firstName} {st?.lastName} (+{r.lateMinutes || 5} min)
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
