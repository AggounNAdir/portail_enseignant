import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Plus,
  Calendar,
  Award,
  Filter,
  Trash2,
  Edit2,
  Save,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  X,
  TrendingUp,
  Users
} from 'lucide-react';
import { Classroom, Student, Assessment, Grade, AssessmentType } from '../../types';
import { calculateStudentAverage } from '../../utils/calculations';
import { useLanguage } from '../../i18n/LanguageContext';

interface GradesViewProps {
  classes: Classroom[];
  students: Student[];
  assessments: Assessment[];
  grades: Grade[];
  selectedClassId: string;
  onSelectClassId: (id: string) => void;
  onAddAssessment: (newAssessment: Omit<Assessment, 'id'>) => void;
  onUpdateAssessment: (updated: Assessment) => void;
  onDeleteAssessment: (assessmentId: string) => void;
  onSaveGrades: (updatedGrades: Grade[]) => void;
}

export interface AssessmentTypeOption {
  type: AssessmentType;
  titleSuggestion: string;
  labelFr: string;
  labelAr: string;
  defaultCoef: number;
  badge: string;
}

export const CEM_TYPES: AssessmentTypeOption[] = [
  {
    type: 'التقويم المستمر',
    titleSuggestion: 'التقويم المستمر',
    labelFr: 'التقويم المستمر — Évaluation continue (Discipline, Cahier, Oral)',
    labelAr: 'التقويم المستمر (مواظبة، كراس، مشاركة)',
    defaultCoef: 1,
    badge: 'bg-emerald-100 text-emerald-800'
  },
  {
    type: 'الفرض 1',
    titleSuggestion: 'الفرض الأول',
    labelFr: 'الفرض الأول — Devoir Surveillé 1',
    labelAr: 'الفرض الأول (الفصل)',
    defaultCoef: 1,
    badge: 'bg-blue-100 text-blue-800'
  },
  {
    type: 'الفرض 2',
    titleSuggestion: 'الفرض الثاني',
    labelFr: 'الفرض الثاني — Devoir Surveillé 2 (Optionnel)',
    labelAr: 'الفرض الثاني (اختياري)',
    defaultCoef: 1,
    badge: 'bg-sky-100 text-sky-800'
  },
  {
    type: 'الاختبار الثلاثي',
    titleSuggestion: 'الاختبار الثلاثي',
    labelFr: 'الاختبار الثلاثي — Composition / Examen',
    labelAr: 'الاختبار الثلاثي (المعامل 2)',
    defaultCoef: 2,
    badge: 'bg-purple-100 text-purple-800'
  },
  {
    type: 'استجواب كتابي',
    titleSuggestion: 'استجواب كتابي',
    labelFr: 'استجواب كتابي — Interrogation courte',
    labelAr: 'استجواب كتابي سريع',
    defaultCoef: 0.5,
    badge: 'bg-amber-100 text-amber-800'
  },
  {
    type: 'أعمال تطبيقية',
    titleSuggestion: 'أعمال تطبيقية (مخبر)',
    labelFr: 'أعمال تطبيقية — Travaux Pratiques / TP',
    labelAr: 'أعمال تطبيقية / مخبر',
    defaultCoef: 1,
    badge: 'bg-teal-100 text-teal-800'
  },
  {
    type: 'واجب منزلي',
    titleSuggestion: 'واجب منزلي',
    labelFr: 'واجب منزلي — Devoir à la maison',
    labelAr: 'واجب منزلي',
    defaultCoef: 0.5,
    badge: 'bg-indigo-100 text-indigo-800'
  }
];

export const GradesView: React.FC<GradesViewProps> = ({
  classes,
  students,
  assessments,
  grades,
  selectedClassId,
  onSelectClassId,
  onAddAssessment,
  onUpdateAssessment,
  onDeleteAssessment,
  onSaveGrades,
}) => {
  const { t, language, isRTL } = useLanguage();
  // Classe active (si 'all', sélectionner la 1ère classe pour la saisie)
  const activeClassId = selectedClassId !== 'all' ? selectedClassId : (classes[0]?.id || '');
  const activeClass = classes.find((c) => c.id === activeClassId);

  // Devoir sélectionné pour la grille de saisie rapide
  const classAssessments = useMemo(() => {
    return assessments.filter((a) => a.classId === activeClassId);
  }, [assessments, activeClassId]);

  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string>(
    classAssessments[0]?.id || ''
  );

  // Synchroniser le devoir sélectionné quand la classe change
  React.useEffect(() => {
    if (classAssessments.length > 0 && !classAssessments.some((a) => a.id === selectedAssessmentId)) {
      setSelectedAssessmentId(classAssessments[0].id);
    }
  }, [classAssessments, selectedAssessmentId]);

  const selectedAssessment = classAssessments.find((a) => a.id === selectedAssessmentId);

  // Élèves de la classe active
  const classStudents = useMemo(() => {
    return students.filter((s) => s.classId === activeClassId);
  }, [students, activeClassId]);

  // Filtre groupe TD pour la saisie des notes (Tous / G1 / G2)
  const [gradeGroupFilter, setGradeGroupFilter] = useState<'all' | '1' | '2'>('all');

  const displayStudents = useMemo(() => {
    if (gradeGroupFilter === 'all') return classStudents;
    return classStudents.filter((s) => (s.group || '1') === gradeGroupFilter);
  }, [classStudents, gradeGroupFilter]);

  // État local des notes pour le devoir sélectionné (permet une saisie fluide sans lag)
  const [localGrades, setLocalGrades] = useState<Record<string, { score: string; isAbsent: boolean; isExcused: boolean; comment: string }>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState(false);

  // Charger les notes du devoir sélectionné dans le state local
  React.useEffect(() => {
    if (!selectedAssessmentId) return;

    const map: Record<string, { score: string; isAbsent: boolean; isExcused: boolean; comment: string }> = {};
    for (const student of classStudents) {
      const g = grades.find((gr) => gr.assessmentId === selectedAssessmentId && gr.studentId === student.id);
      map[student.id] = {
        score: g && g.score !== null ? String(g.score) : '',
        isAbsent: g?.isAbsent || false,
        isExcused: g?.isExcused || false,
        comment: g?.comment || '',
      };
    }
    setLocalGrades(map);
    setHasChanges(false);
  }, [selectedAssessmentId, classStudents, grades]);

  // Modal Création / Édition de Devoir
  const [assessmentModalOpen, setAssessmentModalOpen] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState<Assessment | null>(null);
  const [assessmentForm, setAssessmentForm] = useState({
    title: 'التقويم المستمر',
    type: 'التقويم المستمر' as AssessmentType,
    subject: activeClass?.subject || 'المادة التعليمية',
    date: new Date().toISOString().split('T')[0],
    coefficient: 1,
    maxScore: 20,
    description: '',
  });

  const handleTypeSelect = (selectedType: AssessmentType) => {
    const match = CEM_TYPES.find((c) => c.type === selectedType);
    if (match) {
      setAssessmentForm((prev) => ({
        ...prev,
        type: selectedType,
        coefficient: match.defaultCoef,
        maxScore: 20,
        title:
          prev.title.trim() === '' ||
          CEM_TYPES.some((c) => c.titleSuggestion === prev.title || c.labelFr.includes(prev.title))
            ? match.titleSuggestion
            : prev.title,
      }));
    } else {
      setAssessmentForm((prev) => ({ ...prev, type: selectedType }));
    }
  };

  const handleOpenAddAssessment = () => {
    setEditingAssessment(null);
    setAssessmentForm({
      title: 'التقويم المستمر',
      type: 'التقويم المستمر',
      subject: activeClass?.subject || 'المادة التعليمية',
      date: new Date().toISOString().split('T')[0],
      coefficient: 1,
      maxScore: 20,
      description: '',
    });
    setAssessmentModalOpen(true);
  };

  const handleOpenEditAssessment = (ass: Assessment) => {
    setEditingAssessment(ass);
    setAssessmentForm({
      title: ass.title,
      type: ass.type,
      subject: ass.subject,
      date: ass.date,
      coefficient: ass.coefficient,
      maxScore: ass.maxScore,
      description: ass.description || '',
    });
    setAssessmentModalOpen(true);
  };

  const handleAssessmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assessmentForm.title.trim()) return;

    if (editingAssessment) {
      onUpdateAssessment({
        ...editingAssessment,
        ...assessmentForm,
      });
    } else {
      onAddAssessment({
        ...assessmentForm,
        classId: activeClassId,
      });
    }
    setAssessmentModalOpen(false);
  };

  const handleDeleteAssessment = (ass: Assessment) => {
    if (window.confirm(`Supprimer l'évaluation "${ass.title}" et toutes ses notes associées ?`)) {
      onDeleteAssessment(ass.id);
    }
  };

  // Gestion des changements de notes locales
  const handleScoreChange = (studentId: string, val: string) => {
    setLocalGrades((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { isAbsent: false, isExcused: false, comment: '' }),
        score: val,
        isAbsent: false, // Dès qu'une note est tapée, l'élève n'est plus absent
      },
    }));
    setHasChanges(true);
  };

  const handleToggleAbsent = (studentId: string) => {
    setLocalGrades((prev) => {
      const current = prev[studentId] || { score: '', isAbsent: false, isExcused: false, comment: '' };
      const nextAbsent = !current.isAbsent;
      return {
        ...prev,
        [studentId]: {
          ...current,
          isAbsent: nextAbsent,
          score: nextAbsent ? '' : current.score,
        },
      };
    });
    setHasChanges(true);
  };

  const handleCommentChange = (studentId: string, comment: string) => {
    setLocalGrades((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { score: '', isAbsent: false, isExcused: false }),
        comment,
      },
    }));
    setHasChanges(true);
  };

  // Sauvegarder toutes les notes saisies
  const handleSaveAllGrades = () => {
    if (!selectedAssessmentId) return;

    const updatedList: Grade[] = [];
    for (const student of classStudents) {
      const entry = localGrades[student.id];
      if (!entry) continue;

      const numScore = entry.score !== '' && !isNaN(Number(entry.score)) ? Number(entry.score) : null;
      const existing = grades.find(
        (g) => g.assessmentId === selectedAssessmentId && g.studentId === student.id
      );

      updatedList.push({
        id: existing?.id || `gr-${Date.now()}-${student.id}`,
        assessmentId: selectedAssessmentId,
        studentId: student.id,
        score: entry.isAbsent ? null : numScore,
        isAbsent: entry.isAbsent,
        isExcused: entry.isExcused,
        comment: entry.comment.trim() || undefined,
      });
    }

    onSaveGrades(updatedList);
    setHasChanges(false);
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 3000);
  };

  // Calcul des statistiques du devoir sélectionné
  const assessmentStats = useMemo(() => {
    if (!selectedAssessment) return null;
    const scores: number[] = [];

    for (const student of classStudents) {
      const entry = localGrades[student.id];
      if (entry && entry.score !== '' && !entry.isAbsent && !isNaN(Number(entry.score))) {
        scores.push(Number(entry.score));
      }
    }

    if (scores.length === 0) return null;

    const avg = Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2));
    const min = Math.min(...scores);
    const max = Math.max(...scores);
    const passCount = scores.filter((s) => s >= 10).length;
    const passRate = Math.round((passCount / scores.length) * 100);

    return {
      count: scores.length,
      avg,
      min,
      max,
      passRate,
    };
  }, [selectedAssessment, classStudents, localGrades]);

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-7 h-7 text-indigo-600" />
            <span>Notes & Évaluations</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Gérez vos devoirs surveillés, interrogations et saisissez rapidement les notes par classe.
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

          <button
            onClick={handleOpenAddAssessment}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{language === 'ar' ? '+ إضافة تقييم / فرض' : '+ Nouveau Devoir'}</span>
          </button>
        </div>
      </div>

      {/* Bannière Spécifique CEM Algérie */}
      <div className="bg-linear-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-2xl p-4 sm:p-5 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md border border-emerald-500/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-black shrink-0 border border-emerald-400/30 text-sm">
            CEM
          </div>
          <div>
            <h4 className="font-bold text-sm sm:text-base text-white flex items-center gap-2">
              <span>{language === 'ar' ? 'نظام التقويم الرسمي للتعليم المتوسط (الجزائر)' : 'Système Officiel CEM Algérie'}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 font-semibold">
                {language === 'ar' ? 'رسمي ومعتمد' : 'Conforme MEN'}
              </span>
            </h4>
            <p className="text-xs text-emerald-100/90 mt-0.5">
              {language === 'ar'
                ? 'المعدل الفصلي للمادة = [التقويم المستمر + الفرض + (الاختبار × 2)] ÷ 4'
                : 'Moyenne Trimestrielle = [Contrôle Continu + Devoir + (Examen × 2)] ÷ 4'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2.5 py-1 rounded-lg bg-white/10 text-emerald-200 border border-white/10 font-semibold">
            {language === 'ar' ? 'التقويم (1)' : 'Éval. (1)'}
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-white/10 text-emerald-200 border border-white/10 font-semibold">
            {language === 'ar' ? 'الفرض (1)' : 'Devoir (1)'}
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-white/10 text-emerald-200 border border-white/10 font-semibold">
            {language === 'ar' ? 'الاختبار (2)' : 'Examen (2)'}
          </span>
        </div>
      </div>

      {/* Grille : Liste des Devoirs + Saisie Grille */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Colonne gauche (4/12) : Liste des devoirs de la classe */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <span>Devoirs de {activeClass?.name}</span>
                <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-600 font-semibold">
                  {classAssessments.length}
                </span>
              </h3>
            </div>

            {classAssessments.length === 0 ? (
              <div className="text-center py-10 px-4">
                <FileSpreadsheet className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700">Aucun devoir créé</p>
                <p className="text-[11px] text-slate-400 mt-1 mb-3">
                  Créez une première évaluation pour cette classe.
                </p>
                <button
                  onClick={handleOpenAddAssessment}
                  className="px-3 py-1.5 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg hover:bg-indigo-100"
                >
                  Créer un devoir
                </button>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
                {classAssessments.map((ass) => {
                  const isSelected = ass.id === selectedAssessmentId;
                  return (
                    <div
                      key={ass.id}
                      onClick={() => setSelectedAssessmentId(ass.id)}
                      className={`p-3.5 rounded-xl border transition cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-50/70 border-indigo-400 shadow-2xs'
                          : 'bg-slate-50/50 hover:bg-white border-slate-200'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 pr-2">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white border border-slate-200 text-slate-700">
                              {ass.type}
                            </span>
                            <span className="text-[11px] font-bold text-indigo-600">
                              Coef. {ass.coefficient}
                            </span>
                          </div>
                          <h4 className="font-bold text-sm text-slate-900 truncate">
                            {ass.title}
                          </h4>
                          <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(ass.date).toLocaleDateString('fr-FR')} • Barème /{ass.maxScore}
                          </p>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditAssessment(ass);
                            }}
                            className="p-1 text-slate-400 hover:text-indigo-600 rounded"
                            title="Modifier"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteAssessment(ass);
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded"
                            title="Supprimer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Colonne droite (8/12) : Grille de saisie des notes */}
        <div className="lg:col-span-8 space-y-4">
          {selectedAssessment ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              {/* Entête du devoir en cours de saisie */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-5 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700">
                      {selectedAssessment.type}
                    </span>
                    <span className="text-xs font-bold text-slate-500">
                      Coefficient : {selectedAssessment.coefficient}
                    </span>
                    <span className="text-xs text-slate-400">• Note sur {selectedAssessment.maxScore}</span>
                  </div>
                  <h2 className="text-lg font-extrabold text-slate-900 mt-1">
                    {selectedAssessment.title}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Saisie des notes pour la classe {activeClass?.name} ({classStudents.length} élèves)
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {savedFeedback && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 animate-fade-in">
                      <CheckCircle2 className="w-4 h-4" />
                      Enregistré !
                    </span>
                  )}

                  <button
                    onClick={handleSaveAllGrades}
                    disabled={!hasChanges}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold shadow-md transition cursor-pointer ${
                      hasChanges
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <Save className="w-4 h-4" />
                    <span>Enregistrer les notes</span>
                  </button>
                </div>
              </div>

              {/* Barre de stats instantanées du devoir */}
              {assessmentStats && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4 p-3 bg-slate-50 rounded-xl border border-slate-200/70 text-center text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Moyenne</span>
                    <span className="text-base font-black text-indigo-600">{assessmentStats.avg} / 20</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Note Min / Max</span>
                    <span className="text-base font-bold text-slate-700">
                      {assessmentStats.min} / {assessmentStats.max}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Copies Notées</span>
                    <span className="text-base font-bold text-slate-700">
                      {assessmentStats.count} / {classStudents.length}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Taux Réussite (≥10)</span>
                    <span className="text-base font-bold text-emerald-600">{assessmentStats.passRate}%</span>
                  </div>
                </div>
              )}

              {/* Filtre Groupe TD et Tableau de saisie rapide */}
              <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2">
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
                  <button
                    type="button"
                    onClick={() => setGradeGroupFilter('all')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                      gradeGroupFilter === 'all'
                        ? 'bg-white text-indigo-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {language === 'ar' ? 'الكل' : 'Tous'} ({classStudents.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setGradeGroupFilter('1')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
                      gradeGroupFilter === '1'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-emerald-700'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>{language === 'ar' ? 'الفوج 1 (G1)' : 'Groupe 1 (G1)'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setGradeGroupFilter('2')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
                      gradeGroupFilter === '2'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-blue-700'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    <span>{language === 'ar' ? 'الفوج 2 (G2)' : 'Groupe 2 (G2)'}</span>
                  </button>
                </div>

                <span className="text-xs text-slate-500 font-medium">
                  {displayStudents.length} {language === 'ar' ? 'تلميذ في القائمة' : 'élèves affichés'}
                </span>
              </div>

              {/* Tableau de saisie rapide */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Élève</th>
                      <th className="py-2.5 px-3 w-28 text-center">Note /{selectedAssessment.maxScore}</th>
                      <th className="py-2.5 px-3 w-24 text-center">Statut</th>
                      <th className="py-2.5 px-3">Appréciation rapide</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {displayStudents.map((student) => {
                      const entry = localGrades[student.id] || {
                        score: '',
                        isAbsent: false,
                        isExcused: false,
                        comment: '',
                      };

                      return (
                        <tr key={student.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 block text-xs">
                                {student.lastName.toUpperCase()} {student.firstName}
                              </span>
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-black border ${
                                student.group === '2'
                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              }`}>
                                {student.group === '2' ? 'فوج 2' : 'فوج 1'}
                              </span>
                            </div>
                          </td>

                          {/* Champ de note */}
                          <td className="py-2.5 px-3 text-center">
                            <input
                              type="number"
                              min={0}
                              max={selectedAssessment.maxScore}
                              step={0.25}
                              disabled={entry.isAbsent}
                              value={entry.score}
                              onChange={(e) => handleScoreChange(student.id, e.target.value)}
                              placeholder={entry.isAbsent ? 'ABS' : '—'}
                              className={`w-20 text-center font-black text-sm py-1.5 px-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 transition ${
                                entry.isAbsent
                                  ? 'bg-rose-50 border-rose-200 text-rose-500 cursor-not-allowed font-bold'
                                  : entry.score !== '' && Number(entry.score) < 10
                                  ? 'bg-rose-50/50 border-rose-300 text-rose-700'
                                  : 'bg-white border-slate-300 text-slate-900'
                              }`}
                            />
                          </td>

                          {/* Toggle Absent */}
                          <td className="py-2.5 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleToggleAbsent(student.id)}
                              className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition cursor-pointer ${
                                entry.isAbsent
                                  ? 'bg-rose-600 text-white border-rose-600'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-200'
                              }`}
                            >
                              {entry.isAbsent ? 'Absent' : 'Présent'}
                            </button>
                          </td>

                          {/* Commentaire sur la copie */}
                          <td className="py-2.5 px-3">
                            <input
                              type="text"
                              placeholder="Ex: Bon raisonnement, attention au soin..."
                              value={entry.comment}
                              onChange={(e) => handleCommentChange(student.id, e.target.value)}
                              className="w-full text-xs py-1.5 px-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Raccourci bas de page pour enregistrer */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  {hasChanges ? 'Modifications non enregistrées' : 'Toutes les notes sont à jour'}
                </span>
                <button
                  onClick={handleSaveAllGrades}
                  disabled={!hasChanges}
                  className={`inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold shadow-md transition cursor-pointer ${
                    hasChanges
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Save className="w-4 h-4" />
                  <span>Enregistrer les notes</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <FileSpreadsheet className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-bold text-slate-800 text-base">Sélectionnez une évaluation</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Choisissez une évaluation dans la liste de gauche ou créez-en une nouvelle pour commencer la saisie des notes.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Tableau récapitulatif des moyennes de toute la classe */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Récapitulatif général de la classe ({activeClass?.name})
            </h3>
            <p className="text-xs text-slate-500">
              Moyennes pondérées individuelles calculées automatiquement selon les coefficients des devoirs
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-3">Rang</th>
                <th className="py-3 px-3">Élève</th>
                {classAssessments.map((a) => (
                  <th key={a.id} className="py-3 px-2 text-center" title={a.title}>
                    <span className="block truncate max-w-[80px]">{a.title}</span>
                    <span className="text-[10px] text-slate-400 font-normal">C.{a.coefficient}</span>
                  </th>
                ))}
                <th className="py-3 px-3 text-right">Moyenne Générale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {classStudents
                .map((student) => {
                  const avg = calculateStudentAverage(student.id, classAssessments, grades);
                  return { student, avg };
                })
                .sort((a, b) => (b.avg ?? -1) - (a.avg ?? -1))
                .map(({ student, avg }, rank) => (
                  <tr key={student.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-bold text-slate-400">{rank + 1}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">
                      {student.lastName.toUpperCase()} {student.firstName}
                    </td>
                    {classAssessments.map((a) => {
                      const g = grades.find((gr) => gr.assessmentId === a.id && gr.studentId === student.id);
                      return (
                        <td key={a.id} className="py-2.5 px-2 text-center">
                          {g ? (
                            g.isAbsent ? (
                              <span className="text-[11px] font-bold text-rose-500">ABS</span>
                            ) : g.score !== null ? (
                              <span
                                className={`font-semibold ${
                                  g.score < 10 ? 'text-rose-600' : 'text-slate-800'
                                }`}
                              >
                                {g.score}
                              </span>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="py-2.5 px-3 text-right">
                      {avg !== null ? (
                        <span
                          className={`font-black text-xs px-2.5 py-1 rounded-md ${
                            avg < 10
                              ? 'bg-rose-50 text-rose-700'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {avg} / 20
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Non calculée</span>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Devoir (Création / Modification) */}
      {assessmentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-100">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-900">
                {editingAssessment ? "Modifier l'évaluation" : 'Créer une nouvelle évaluation'}
              </h3>
              <button
                onClick={() => setAssessmentModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssessmentSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Intitulé du devoir *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: DS 1 : Théorème de Thalès"
                  value={assessmentForm.title}
                  onChange={(e) => setAssessmentForm({ ...assessmentForm, title: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    {language === 'ar' ? 'نوع التقييم (نظام CEM الجزائري)' : 'Type de devoir (Système CEM Algérie)'}
                  </label>
                  <select
                    value={assessmentForm.type}
                    onChange={(e) => handleTypeSelect(e.target.value as AssessmentType)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
                  >
                    <optgroup label={language === 'ar' ? 'نظام التعليم المتوسط الجزائري (CEM)' : 'Système Officiel CEM Algérie'}>
                      {CEM_TYPES.map((c) => (
                        <option key={c.type} value={c.type}>
                          {language === 'ar' ? c.labelAr : c.labelFr}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label={language === 'ar' ? 'أنواع أخرى' : 'Autres types'}>
                      <option value="DS">Devoir Surveillé (DS)</option>
                      <option value="Contrôle">Contrôle</option>
                      <option value="DM">Devoir Maison</option>
                      <option value="Interrogation">Interrogation</option>
                      <option value="TP">TP / Pratique</option>
                      <option value="Oral">Oral</option>
                      <option value="Projet">Projet</option>
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Date de l'épreuve
                  </label>
                  <input
                    type="date"
                    value={assessmentForm.date}
                    onChange={(e) => setAssessmentForm({ ...assessmentForm, date: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Coefficient *
                  </label>
                  <input
                    type="number"
                    min={0.5}
                    step={0.5}
                    required
                    value={assessmentForm.coefficient}
                    onChange={(e) => setAssessmentForm({ ...assessmentForm, coefficient: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Note Maximale (Barème)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={100}
                    value={assessmentForm.maxScore}
                    onChange={(e) => setAssessmentForm({ ...assessmentForm, maxScore: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Matière
                </label>
                <input
                  type="text"
                  value={assessmentForm.subject}
                  onChange={(e) => setAssessmentForm({ ...assessmentForm, subject: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Description / Compétences évaluées
                </label>
                <textarea
                  rows={2}
                  placeholder="Notions abordées, barème détaillé..."
                  value={assessmentForm.description}
                  onChange={(e) => setAssessmentForm({ ...assessmentForm, description: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAssessmentModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition"
                >
                  {editingAssessment ? 'Enregistrer' : 'Créer le devoir'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
