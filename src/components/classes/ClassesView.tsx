import React, { useState } from 'react';
import {
  GraduationCap,
  Plus,
  Edit2,
  Trash2,
  Users,
  Award,
  CheckCircle2,
  Calendar,
  School,
  X
} from 'lucide-react';
import { Classroom, ClassLevel, Student, Assessment, Grade, AttendanceRecord } from '../../types';
import { calculateClassStats } from '../../utils/calculations';

interface ClassesViewProps {
  classes: Classroom[];
  students: Student[];
  assessments: Assessment[];
  grades: Grade[];
  attendanceRecords: AttendanceRecord[];
  onAddClass: (newClass: Omit<Classroom, 'id'>) => void;
  onUpdateClass: (updated: Classroom) => void;
  onDeleteClass: (classId: string) => void;
  onSelectClassAndNavigateToStudents: (classId: string) => void;
}

const PRESET_COLORS = [
  '#3B82F6', // Bleu
  '#10B981', // Vert émeraude
  '#8B5CF6', // Violet
  '#F59E0B', // Ambre
  '#EC4899', // Rose
  '#06B6D4', // Cyan
  '#6366F1', // Indigo
  '#14B8A6', // Teal
];

const AVAILABLE_LEVELS: ClassLevel[] = [
  // التعليم الابتدائي (Primaire)
  '1AP (السنة الأولى ابتدائي)',
  '2AP (السنة الثانية ابتدائي)',
  '3AP (السنة الثالثة ابتدائي)',
  '4AP (السنة الرابعة ابتدائي)',
  '5AP (السنة الخامسة ابتدائي)',
  // التعليم المتوسط (CEM)
  '1AM (السنة الأولى متوسط)',
  '2AM (السنة الثانية متوسط)',
  '3AM (السنة الثالثة متوسط)',
  '4AM (السنة الرابعة متوسط - BEM)',
  // التعليم الثانوي (Lycée)
  '1AS (الأولى ثانوي - ج.م علوم وتكنولوجيا)',
  '1AS (الأولى ثانوي - ج.م آداب)',
  '2AS (الثانية ثانوي - علوم تجريبية)',
  '2AS (الثانية ثانوي - رياضيات)',
  '2AS (الثانية ثانوي - تقني رياضي)',
  '2AS (الثانية ثانوي - تسيير واقتصاد)',
  '2AS (الثانية ثانوي - آداب وفلسفة)',
  '2AS (الثانية ثانوي - لغات أجنبية)',
  '3AS (الثالثة ثانوي - بكالوريا علوم تجريبية)',
  '3AS (الثالثة ثانوي - بكالوريا رياضيات)',
  '3AS (الثالثة ثانوي - بكالوريا تقني رياضي)',
  '3AS (الثالثة ثانوي - بكالوريا تسيير واقتصاد)',
  '3AS (الثالثة ثانوي - بكالوريا آداب وفلسفة)',
  '3AS (الثالثة ثانوي - بكالوريا لغات أجنبية)',
  // Enseignement général / international
  '6ème',
  '5ème',
  '4ème',
  '3ème',
  'Seconde',
  'Première',
  'Terminale',
  'Autre niveau',
];

export const ClassesView: React.FC<ClassesViewProps> = ({
  classes,
  students,
  assessments,
  grades,
  attendanceRecords,
  onAddClass,
  onUpdateClass,
  onDeleteClass,
  onSelectClassAndNavigateToStudents,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<Classroom | null>(null);

  // Formulaire d'édition / création
  const [formData, setFormData] = useState({
    name: '',
    level: '3ème' as ClassLevel,
    subject: 'Mathématiques',
    academicYear: '2024-2025',
    room: '',
    color: '#3B82F6',
    description: '',
  });

  const handleOpenCreate = () => {
    setEditingClass(null);
    setFormData({
      name: '',
      level: '3ème',
      subject: 'Mathématiques',
      academicYear: '2024-2025',
      room: '',
      color: PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)],
      description: '',
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (cls: Classroom) => {
    setEditingClass(cls);
    setFormData({
      name: cls.name,
      level: cls.level,
      subject: cls.subject,
      academicYear: cls.academicYear,
      room: cls.room || '',
      color: cls.color || '#3B82F6',
      description: cls.description || '',
    });
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingClass) {
      onUpdateClass({
        ...editingClass,
        ...formData,
      });
    } else {
      onAddClass(formData);
    }
    setModalOpen(false);
  };

  const handleDelete = (cls: Classroom) => {
    const classStudentsCount = students.filter((s) => s.classId === cls.id).length;
    const confirmMessage = classStudentsCount > 0
      ? `Êtes-vous sûr de vouloir supprimer la classe "${cls.name}" ? Elle contient ${classStudentsCount} élève(s). Ces élèves et leurs notes seront également affectés.`
      : `Êtes-vous sûr de vouloir supprimer la classe "${cls.name}" ?`;

    if (window.confirm(confirmMessage)) {
      onDeleteClass(cls.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête de section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <GraduationCap className="w-7 h-7 text-indigo-600" />
            <span>Gestion des Classes</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Configurez vos différentes classes, niveaux, matières enseignées et salles de cours.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-600/20 transition cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvelle Classe</span>
        </button>
      </div>

      {/* Grille des classes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.map((cls) => {
          const stats = calculateClassStats(cls.id, students, assessments, grades, attendanceRecords);

          return (
            <div
              key={cls.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between"
            >
              {/* Bandeau de couleur personnalisable */}
              <div
                className="h-3 w-full"
                style={{ backgroundColor: cls.color }}
              />

              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-700 mb-1">
                        {cls.level}
                      </span>
                      <h3 className="text-xl font-extrabold text-slate-900">{cls.name}</h3>
                      <p className="text-sm font-medium text-slate-500">{cls.subject}</p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(cls)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                        title="Modifier la classe"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(cls)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        title="Supprimer la classe"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {cls.description && (
                    <p className="mt-3 text-xs text-slate-600 line-clamp-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      {cls.description}
                    </p>
                  )}

                  {/* Infos pratiques */}
                  <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {cls.academicYear}
                    </span>
                    {cls.room && (
                      <span className="flex items-center gap-1">
                        <School className="w-3.5 h-3.5 text-slate-400" />
                        {cls.room}
                      </span>
                    )}
                  </div>
                </div>

                {/* Métriques clés */}
                <div className="mt-6 pt-4 border-t border-slate-100">
                  <div className="grid grid-cols-3 gap-2 text-center mb-4">
                    <div className="bg-slate-50 p-2 rounded-xl">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Élèves</span>
                      <span className="text-lg font-black text-slate-900">{stats.studentCount}</span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-xl">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Moyenne</span>
                      <span className="text-lg font-black text-indigo-600">
                        {stats.classAverage !== null ? `${stats.classAverage}` : '—'}
                      </span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-xl">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Présence</span>
                      <span className="text-lg font-black text-emerald-600">
                        {stats.overallAttendanceRate}%
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => onSelectClassAndNavigateToStudents(cls.id)}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold rounded-xl text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition cursor-pointer"
                  >
                    <Users className="w-4 h-4" />
                    <span>Voir les élèves de cette classe</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Créer / Modifier une classe */}
      {modalOpen && (
        <div className="modal-safe-overlay">
          <div className="relative bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[calc(100dvh-6rem)] my-0 animate-fade-in">
            <div className="sticky top-0 bg-white z-20 flex items-center justify-between px-6 py-4 border-b border-slate-100 shadow-2xs shrink-0">
              <h3 className="font-bold text-lg text-slate-900">
                {editingClass ? 'Modifier la classe' : 'Créer une nouvelle classe'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nom de la classe *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 3ème B, Terminale S1, Seconde 4..."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Niveau
                  </label>
                  <select
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: e.target.value as ClassLevel })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  >
                    {AVAILABLE_LEVELS.map((lvl) => (
                      <option key={lvl} value={lvl}>{lvl}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Année scolaire
                  </label>
                  <input
                    type="text"
                    placeholder="2024-2025"
                    value={formData.academicYear}
                    onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Matière enseignée
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Mathématiques"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Salle de cours (optionnel)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Salle 204"
                    value={formData.room}
                    onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Couleur d'identification
                </label>
                <div className="flex items-center gap-2">
                  {PRESET_COLORS.map((col) => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setFormData({ ...formData, color: col })}
                      className={`w-7 h-7 rounded-full transition-transform cursor-pointer ${
                        formData.color === col ? 'ring-2 ring-offset-2 ring-indigo-600 scale-110' : 'opacity-80 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: col }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Description / Remarques pédagogiques
                </label>
                <textarea
                  rows={2}
                  placeholder="Informations sur la classe, objectifs du cycle..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="sticky bottom-0 bg-white z-20 flex items-center justify-end gap-3 pt-3 pb-1 border-t border-slate-100 shadow-xs">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition cursor-pointer"
                >
                  {editingClass ? 'Enregistrer les modifications' : 'Créer la classe'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
