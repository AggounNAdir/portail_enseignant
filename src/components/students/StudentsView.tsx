import React, { useState, useMemo } from 'react';
import {
  Users,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Eye,
  Edit,
  Trash2,
  Phone,
  Mail,
  Calendar,
  AlertCircle,
  FileSpreadsheet,
  X,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { Student, Classroom, Assessment, Grade, AttendanceRecord } from '../../types';
import { calculateStudentAverage, exportStudentsToCSV, parseStudentsCSV } from '../../utils/calculations';
import { StudentDetailModal } from './StudentDetailModal';
import { useLanguage } from '../../i18n/LanguageContext';

interface StudentsViewProps {
  students: Student[];
  classes: Classroom[];
  selectedClassId: string;
  onSelectClassId: (id: string) => void;
  assessments: Assessment[];
  grades: Grade[];
  attendanceRecords: AttendanceRecord[];
  onAddStudent: (newStudent: Omit<Student, 'id' | 'createdAt'>) => void;
  onUpdateStudent: (updated: Student) => void;
  onDeleteStudent: (studentId: string) => void;
  onImportStudents: (imported: Student[]) => void;
  onOpenReportCard: (student: Student) => void;
}

export const StudentsView: React.FC<StudentsViewProps> = ({
  students,
  classes,
  selectedClassId,
  onSelectClassId,
  assessments,
  grades,
  attendanceRecords,
  onAddStudent,
  onUpdateStudent,
  onDeleteStudent,
  onImportStudents,
  onOpenReportCard,
}) => {
  const { t, language, isRTL } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDifficultyOnly, setFilterDifficultyOnly] = useState(false);
  const [groupFilter, setGroupFilter] = useState<'all' | '1' | '2'>('all');

  // Modales
  const [addEditModalOpen, setAddEditModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [detailStudent, setDetailStudent] = useState<Student | null>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);

  // Formulaire ajout / édition
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    classId: classes[0]?.id || '',
    birthDate: '2010-01-01',
    gender: 'M' as 'M' | 'F' | 'Autre',
    avatarUrl: '',
    studentEmail: '',
    parentPhone: '',
    parentEmail: '',
    address: '',
    observations: '',
    group: '1' as '1' | '2',
  });

  // State pour l'import CSV
  const [csvFileContent, setCsvFileContent] = useState<string>('');
  const [importTargetClassId, setImportTargetClassId] = useState<string>(
    selectedClassId !== 'all' ? selectedClassId : classes[0]?.id || ''
  );
  const [importResult, setImportResult] = useState<{ success: Student[]; errors: string[] } | null>(null);

  // Filtrage des élèves
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      // Filtre classe
      if (selectedClassId !== 'all' && s.classId !== selectedClassId) {
        return false;
      }
      // Filtre groupe TD
      if (groupFilter !== 'all') {
        const studentGrp = s.group || '1';
        if (studentGrp !== groupFilter) return false;
      }
      // Filtre recherche textuelle
      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const fullName = `${s.firstName} ${s.lastName}`.toLowerCase();
        const reversedName = `${s.lastName} ${s.firstName}`.toLowerCase();
        const matchesName = fullName.includes(q) || reversedName.includes(q);
        const matchesPhone = s.parentPhone.toLowerCase().includes(q);
        const matchesEmail = (s.parentEmail || '').toLowerCase().includes(q) || (s.studentEmail || '').toLowerCase().includes(q);
        if (!matchesName && !matchesPhone && !matchesEmail) return false;
      }
      // Filtre moyenne < 10
      if (filterDifficultyOnly) {
        const avg = calculateStudentAverage(s.id, assessments, grades);
        if (avg === null || avg >= 10) return false;
      }
      return true;
    });
  }, [students, selectedClassId, groupFilter, searchQuery, filterDifficultyOnly, assessments, grades]);

  // Répartition automatique de la classe en 2 groupes TD 50/50
  const handleSplitClassInto2Groups = () => {
    const classIdToSplit = selectedClassId !== 'all' ? selectedClassId : classes[0]?.id;
    if (!classIdToSplit) {
      alert(language === 'ar' ? 'يرجى اختيار قسم أولاً لتوزيع تلاميذه.' : 'Veuillez d’abord sélectionner une classe.');
      return;
    }

    const classObj = classes.find((c) => c.id === classIdToSplit);
    const targetStudents = students.filter((s) => s.classId === classIdToSplit);

    if (targetStudents.length === 0) {
      alert(language === 'ar' ? 'لا يوجد تلاميذ في هذا القسم.' : 'Cette classe ne contient aucun élève.');
      return;
    }

    const confirmMsg =
      language === 'ar'
        ? `هل تريد تقسيم تلاميذ قسم "${classObj?.name}" (${targetStudents.length} تلميذ) إلى فوجين بالتساوي بحسب الترتيب الأبجدي؟\n- النصف الأول: الفوج 1\n- النصف الثاني: الفوج 2`
        : `Voulez-vous répartir automatiquement les ${targetStudents.length} élèves de la classe "${classObj?.name}" en 2 groupes TD égaux selon l’ordre alphabétique ?\n- Première moitié : Groupe 1 (الفوج 1)\n- Deuxième moitié : Groupe 2 (الفوج 2)`;

    if (!window.confirm(confirmMsg)) return;

    // Tri alphabétique par Nom puis Prénom
    const sorted = [...targetStudents].sort((a, b) => {
      const nameComp = a.lastName.localeCompare(b.lastName, 'fr', { sensitivity: 'base' });
      if (nameComp !== 0) return nameComp;
      return a.firstName.localeCompare(b.firstName, 'fr', { sensitivity: 'base' });
    });

    const half = Math.ceil(sorted.length / 2);
    sorted.forEach((st, idx) => {
      const assigned: '1' | '2' = idx < half ? '1' : '2';
      if (st.group !== assigned) {
        onUpdateStudent({ ...st, group: assigned });
      }
    });

    alert(
      language === 'ar'
        ? `تم تقسيم التلاميذ بنجاح!\n- الفوج 1: ${half} تلميذ\n- الفوج 2: ${sorted.length - half} تلميذ`
        : `Répartition effectuée avec succès !\n- Groupe 1 : ${half} élèves\n- Groupe 2 : ${sorted.length - half} élèves`
    );
  };

  // Bascule rapide de groupe pour un élève (G1 <-> G2)
  const handleToggleStudentGroup = (s: Student) => {
    const nextGroup: '1' | '2' = (s.group || '1') === '1' ? '2' : '1';
    onUpdateStudent({ ...s, group: nextGroup });
  };

  // Ouverture formulaire Ajout
  const handleOpenAdd = () => {
    setEditingStudent(null);
    setFormData({
      firstName: '',
      lastName: '',
      classId: selectedClassId !== 'all' ? selectedClassId : (classes[0]?.id || ''),
      birthDate: '2010-01-01',
      gender: 'M',
      avatarUrl: '',
      studentEmail: '',
      parentPhone: '06 ',
      parentEmail: '',
      address: '',
      observations: '',
      group: '1',
    });
    setAddEditModalOpen(true);
  };

  // Ouverture formulaire Édition
  const handleOpenEdit = (s: Student) => {
    setEditingStudent(s);
    setFormData({
      firstName: s.firstName,
      lastName: s.lastName,
      classId: s.classId,
      birthDate: s.birthDate,
      gender: s.gender,
      avatarUrl: s.avatarUrl || '',
      studentEmail: s.studentEmail || '',
      parentPhone: s.parentPhone,
      parentEmail: s.parentEmail || '',
      address: s.address || '',
      observations: s.observations || '',
      group: s.group || '1',
    });
    setAddEditModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.classId) return;

    if (editingStudent) {
      onUpdateStudent({
        ...editingStudent,
        ...formData,
      });
    } else {
      onAddStudent(formData);
    }
    setAddEditModalOpen(false);
  };

  const handleDelete = (s: Student) => {
    if (window.confirm(`Confirmez-vous la suppression de l'élève ${s.firstName} ${s.lastName} ?`)) {
      onDeleteStudent(s.id);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const currentCls = classes.find((c) => c.id === selectedClassId);
    const csvContent = exportStudentsToCSV(filteredStudents, currentCls);
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `eleves_${currentCls ? currentCls.name : 'tous'}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Télécharger modèle CSV
  const handleDownloadTemplateCSV = () => {
    const templateContent = [
      'Nom;Prénom;Classe;Date de Naissance;Genre;Email Élève;Téléphone Parents;Email Parents;Adresse;Observations',
      'Dupont;Jean;3ème B;2010-05-14;M;jean.dupont@eleve.fr;06 11 22 33 44;parents.dupont@gmail.com;12 Rue de la Paix, 75000 Paris;Très bon travail',
      'Martin;Sophie;3ème B;2010-09-22;F;sophie.martin@eleve.fr;06 22 33 44 55;famille.martin@orange.fr;5 Avenue Victor Hugo, 75000 Paris;Élève studieuse',
    ].join('\n');

    const blob = new Blob(['\uFEFF' + templateContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'modele_import_eleves_profpilot.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Traitement fichier importé
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvFileContent(text);
      const parsed = parseStudentsCSV(text, importTargetClassId);
      setImportResult(parsed);
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = () => {
    if (importResult && importResult.success.length > 0) {
      onImportStudents(importResult.success);
      setImportModalOpen(false);
      setImportResult(null);
      setCsvFileContent('');
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <Users className="w-7 h-7 text-indigo-600" />
            <span>Gestion des Élèves</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Gérez vos effectifs, coordonnées des responsables, photos et importez vos listes en masse.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleSplitClassInto2Groups}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-bold text-xs transition cursor-pointer"
            title={language === 'ar' ? 'تقسيم القسم إلى فوجين بالتساوي للأعمال الموجهة' : 'Diviser la classe en 2 groupes TD 50/50'}
          >
            <Users className="w-4 h-4 text-purple-600" />
            <span>{language === 'ar' ? 'تقسيم لفوجين TD (50/50)' : 'Diviser en 2 groupes TD'}</span>
          </button>

          <button
            onClick={() => setImportModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition cursor-pointer"
            title="Importer une liste d'élèves CSV"
          >
            <Upload className="w-4 h-4 text-slate-600" />
            <span>Importer CSV</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition cursor-pointer"
            title="Exporter les élèves au format CSV"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Exporter CSV</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter un élève</span>
          </button>
        </div>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Recherche par nom */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={language === 'ar' ? 'بحث عن تلميذ بالاسم أو اللقب...' : 'Rechercher par nom, prénom, email ou téléphone parent...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filtres par classe, groupe TD et difficulté */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Filtre Classe */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedClassId}
              onChange={(e) => onSelectClassId(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Toutes les classes</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.level})
                </option>
              ))}
            </select>
          </div>

          {/* Filtre Groupe TD (الفوج 1 / الفوج 2) */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl gap-1">
            <button
              type="button"
              onClick={() => setGroupFilter('all')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                groupFilter === 'all'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {language === 'ar' ? 'الكل' : 'Tous'}
            </button>
            <button
              type="button"
              onClick={() => setGroupFilter('1')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1 ${
                groupFilter === '1'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-emerald-700'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>{language === 'ar' ? 'فوج 1' : 'G1'}</span>
            </button>
            <button
              type="button"
              onClick={() => setGroupFilter('2')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1 ${
                groupFilter === '2'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-blue-700'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              <span>{language === 'ar' ? 'فوج 2' : 'G2'}</span>
            </button>
          </div>

          <button
            onClick={() => setFilterDifficultyOnly(!filterDifficultyOnly)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border ${
              filterDifficultyOnly
                ? 'bg-rose-50 text-rose-700 border-rose-300 shadow-2xs'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            <span>Moyenne &lt; 10/20</span>
          </button>
        </div>
      </div>

      {/* Liste / Tableau des élèves */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-3.5 border-b border-slate-100 flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
          <span>{filteredStudents.length} élève{filteredStudents.length > 1 ? 's' : ''} trouvé{filteredStudents.length > 1 ? 's' : ''}</span>
          <span>Année scolaire en cours</span>
        </div>

        {filteredStudents.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-700">Aucun élève trouvé</p>
            <p className="text-xs text-slate-400 mt-1">
              Modifiez vos critères de recherche ou ajoutez un premier élève.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 font-bold text-xs uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Élève</th>
                  <th className="py-3.5 px-4">Classe</th>
                  <th className="py-3.5 px-4">Moyenne</th>
                  <th className="py-3.5 px-4 hidden md:table-cell">Contact Parents</th>
                  <th className="py-3.5 px-4 hidden lg:table-cell">Date Naissance</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((student) => {
                  const studentClass = classes.find((c) => c.id === student.classId);
                  const average = calculateStudentAverage(student.id, assessments, grades);

                  return (
                    <tr
                      key={student.id}
                      className="hover:bg-slate-50/80 transition group"
                    >
                      {/* Identité */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {student.avatarUrl ? (
                            <img
                              src={student.avatarUrl}
                              alt={student.firstName}
                              className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-100 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">
                              {student.firstName[0]}
                              {student.lastName[0]}
                            </div>
                          )}
                          <div>
                            <span
                              onClick={() => setDetailStudent(student)}
                              className="font-bold text-slate-900 group-hover:text-indigo-600 cursor-pointer block"
                            >
                              {student.lastName.toUpperCase()} {student.firstName}
                            </span>
                            <span className="text-xs text-slate-400 block truncate max-w-xs">
                              {student.studentEmail || `Genre : ${student.gender}`}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Classe et Groupe TD */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1.5">
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold"
                            style={{
                              backgroundColor: `${studentClass?.color || '#3b82f6'}15`,
                              color: studentClass?.color || '#3b82f6',
                            }}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: studentClass?.color || '#3b82f6' }}
                            />
                            {studentClass?.name || 'Non affecté'}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleToggleStudentGroup(student)}
                            title={language === 'ar' ? 'انقر لتغيير الفوج (الفوج 1 ⇄ الفوج 2)' : 'Cliquer pour changer de groupe TD (G1 ⇄ G2)'}
                            className={`px-2 py-0.5 rounded-md text-[11px] font-black border transition cursor-pointer ${
                              student.group === '2'
                                ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            }`}
                          >
                            {student.group === '2' ? (language === 'ar' ? 'فوج 2' : 'G2 (فوج 2)') : (language === 'ar' ? 'فوج 1' : 'G1 (فوج 1)')}
                          </button>
                        </div>
                      </td>

                      {/* Moyenne */}
                      <td className="py-3 px-4">
                        {average !== null ? (
                          <span
                            className={`font-black text-sm px-2.5 py-1 rounded-lg ${
                              average < 10
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {average} <span className="text-[10px] font-semibold">/20</span>
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Pas de note</span>
                        )}
                      </td>

                      {/* Contact Parents */}
                      <td className="py-3 px-4 hidden md:table-cell text-xs text-slate-600">
                        <div className="flex items-center gap-1.5 font-medium">
                          <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{student.parentPhone}</span>
                        </div>
                        {student.parentEmail && (
                          <div className="flex items-center gap-1.5 text-slate-400 truncate max-w-xs mt-0.5">
                            <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{student.parentEmail}</span>
                          </div>
                        )}
                      </td>

                      {/* Date de naissance */}
                      <td className="py-3 px-4 hidden lg:table-cell text-xs text-slate-500">
                        {new Date(student.birthDate).toLocaleDateString('fr-FR')}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setDetailStudent(student)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                            title="Dossier complet élève"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(student)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                            title="Modifier les coordonnées"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(student)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Supprimer l'élève"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Dossier Élève */}
      {detailStudent && (
        <StudentDetailModal
          student={detailStudent}
          allClasses={classes}
          assessments={assessments}
          grades={grades}
          attendanceRecords={attendanceRecords}
          onClose={() => setDetailStudent(null)}
          onOpenReportCard={(s) => {
            setDetailStudent(null);
            onOpenReportCard(s);
          }}
        />
      )}

      {/* Modal Ajout / Modification Élève */}
      {addEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden border border-slate-100 my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-900">
                {editingStudent ? "Modifier l'élève" : 'Ajouter un nouvel élève'}
              </h3>
              <button
                onClick={() => setAddEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Nom de famille *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Moreau"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Prénom *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Lucas"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Classe *
                  </label>
                  <select
                    value={formData.classId}
                    onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  >
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name} ({cls.level})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Date de naissance
                  </label>
                  <input
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Genre
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'M' | 'F' | 'Autre' })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="M">Masculin (M)</option>
                    <option value="F">Féminin (F)</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    {language === 'ar' ? 'فوج الأعمال الموجهة (TD/TP)' : 'Groupe TD / TP'}
                  </label>
                  <select
                    value={formData.group}
                    onChange={(e) => setFormData({ ...formData, group: e.target.value as '1' | '2' })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold"
                  >
                    <option value="1">{language === 'ar' ? 'الفوج 1 (Groupe 1)' : 'Groupe 1 (الفوج 1)'}</option>
                    <option value="2">{language === 'ar' ? 'الفوج 2 (Groupe 2)' : 'Groupe 2 (الفوج 2)'}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Téléphone Parents *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="06 12 34 56 78"
                    value={formData.parentPhone}
                    onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Email Parents
                  </label>
                  <input
                    type="email"
                    placeholder="parents@exemple.com"
                    value={formData.parentEmail}
                    onChange={(e) => setFormData({ ...formData, parentEmail: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Email Élève
                  </label>
                  <input
                    type="email"
                    placeholder="eleve@education.fr"
                    value={formData.studentEmail}
                    onChange={(e) => setFormData({ ...formData, studentEmail: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    URL Photo de profil
                  </label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={formData.avatarUrl}
                    onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Adresse postale
                </label>
                <input
                  type="text"
                  placeholder="Numéro, rue, code postal, ville"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Observations / Informations médicales ou PAI
                </label>
                <textarea
                  rows={2}
                  placeholder="Remarques pédagogiques, tiers-temps, dyslexie, etc."
                  value={formData.observations}
                  onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAddEditModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition"
                >
                  {editingStudent ? 'Sauvegarder' : 'Ajouter l’élève'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Import CSV */}
      {importModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-100">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                <Upload className="w-5 h-5 text-indigo-600" />
                <span>Importer une liste d'élèves (CSV)</span>
              </h3>
              <button
                onClick={() => setImportModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Classe de destination
                </label>
                <select
                  value={importTargetClassId}
                  onChange={(e) => {
                    setImportTargetClassId(e.target.value);
                    if (csvFileContent) {
                      setImportResult(parseStudentsCSV(csvFileContent, e.target.value));
                    }
                  }}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                >
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} ({cls.level})
                    </option>
                  ))}
                </select>
              </div>

              {/* Télécharger modèle */}
              <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-indigo-900">Besoin d'un modèle type ?</p>
                  <p className="text-[11px] text-indigo-700">Téléchargez le format CSV standard compatible Excel.</p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadTemplateCSV}
                  className="px-3 py-1.5 bg-white text-indigo-700 text-xs font-bold rounded-lg border border-indigo-300 hover:bg-indigo-50 shadow-2xs cursor-pointer"
                >
                  Télécharger Modèle
                </button>
              </div>

              {/* Sélecteur de fichier */}
              <div className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-2xl p-6 text-center transition">
                <FileSpreadsheet className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                <label className="cursor-pointer block">
                  <span className="text-sm font-bold text-indigo-600 hover:underline">
                    Cliquez pour choisir un fichier CSV
                  </span>
                  <span className="text-xs text-slate-500 block mt-1">
                    Prend en charge séparateurs virgule (,) ou point-virgule (;)
                  </span>
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Aperçu du parsing */}
              {importResult && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-800">
                      {importResult.success.length} élève(s) détecté(s) avec succès
                    </span>
                  </div>

                  {importResult.errors.length > 0 && (
                    <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                      <p className="font-bold">Avertissements ({importResult.errors.length}) :</p>
                      <ul className="list-disc pl-4 text-[11px] mt-1 space-y-0.5">
                        {importResult.errors.slice(0, 3).map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {importResult.success.length > 0 && (
                    <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 text-xs">
                      {importResult.success.map((s, idx) => (
                        <div key={idx} className="p-2 flex items-center justify-between">
                          <span className="font-semibold text-slate-800">
                            {s.lastName.toUpperCase()} {s.firstName}
                          </span>
                          <span className="text-slate-400">{s.parentPhone}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setImportModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  disabled={!importResult || importResult.success.length === 0}
                  onClick={handleConfirmImport}
                  className="px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-md transition"
                >
                  Valider l'importation ({importResult?.success.length || 0})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
