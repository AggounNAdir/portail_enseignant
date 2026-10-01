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
import { GroupManagerModal } from './GroupManagerModal';
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
  onDeleteMultipleStudents?: (studentIds: string[]) => void;
  onClearClassStudents?: (classId: string) => void;
  onImportStudents: (imported: Student[], replaceClass?: boolean) => void;
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
  onDeleteMultipleStudents,
  onClearClassStudents,
  onImportStudents,
  onOpenReportCard,
}) => {
  const { t, language, isRTL } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDifficultyOnly, setFilterDifficultyOnly] = useState(false);
  const [groupFilter, setGroupFilter] = useState<'all' | '1' | '2'>('all');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  // Modales
  const [addEditModalOpen, setAddEditModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [detailStudent, setDetailStudent] = useState<Student | null>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [groupManagerModalOpen, setGroupManagerModalOpen] = useState(false);

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
  const [pasteMode, setPasteMode] = useState<boolean>(false);
  const [pastedCSV, setPastedCSV] = useState<string>('');
  const [replaceClassOnImport, setReplaceClassOnImport] = useState<boolean>(true);
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

  // Détection des élèves dont le nom est un chiffre (issu d'une importation précédente erronée)
  const hasCorruptedNames = useMemo(() => {
    return filteredStudents.some(
      (s) => /^\d+$/.test(s.lastName.trim()) || /^\d+$/.test(s.firstName.trim())
    );
  }, [filteredStudents]);

  // Vider les élèves de la classe sélectionnée
  const handleClearCurrentClass = () => {
    if (selectedClassId === 'all') {
      alert(language === 'ar' ? 'يرجى تحديد قسم معين لحذف تلاميذه.' : 'Veuillez sélectionner une classe spécifique.');
      return;
    }
    const currentClass = classes.find((c) => c.id === selectedClassId);
    const classStudents = students.filter((s) => s.classId === selectedClassId);
    if (classStudents.length === 0) return;

    const msg =
      language === 'ar'
        ? `هل تريد مسح جميع تلاميذ قسم (${currentClass?.name}) البالغ عددهم ${classStudents.length} تلميذ للتخلص من الأرقام القديمة وإعادة استيرادهم بالأسماء السليمة؟`
        : `Voulez-vous supprimer tous les élèves de la classe ${currentClass?.name} (${classStudents.length} élèves) pour nettoyer les erreurs et réimporter ?`;

    if (window.confirm(msg)) {
      if (onClearClassStudents) {
        onClearClassStudents(selectedClassId);
      } else if (onDeleteMultipleStudents) {
        onDeleteMultipleStudents(classStudents.map((s) => s.id));
      } else {
        classStudents.forEach((s) => onDeleteStudent(s.id));
      }
      setSelectedStudentIds([]);
    }
  };

  // Suppression groupée des élèves sélectionnés
  const handleBulkDelete = () => {
    if (selectedStudentIds.length === 0) return;
    const msg =
      language === 'ar'
        ? `هل أنت متأكد من حذف ${selectedStudentIds.length} تلميذ محدد؟`
        : `Confirmez-vous la suppression de ces ${selectedStudentIds.length} élèves ?`;
    if (window.confirm(msg)) {
      if (onDeleteMultipleStudents) {
        onDeleteMultipleStudents(selectedStudentIds);
      } else {
        selectedStudentIds.forEach((id) => onDeleteStudent(id));
      }
      setSelectedStudentIds([]);
    }
  };

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

  // Sélection multiple d'élèves pour attribution de groupe manuelle
  const handleToggleSelectStudent = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllVisible = () => {
    if (selectedStudentIds.length === filteredStudents.length && filteredStudents.length > 0) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(filteredStudents.map((s) => s.id));
    }
  };

  const handleBulkAssignGroup = (targetGroup: '1' | '2') => {
    if (selectedStudentIds.length === 0) return;
    selectedStudentIds.forEach((id) => {
      const st = students.find((s) => s.id === id);
      if (st && (st.group || '1') !== targetGroup) {
        onUpdateStudent({ ...st, group: targetGroup });
      }
    });
    alert(
      language === 'ar'
        ? `تم تعيين ${selectedStudentIds.length} تلميذ إلى ${targetGroup === '1' ? 'الفوج 1' : 'الفوج 2'} بنجاح!`
        : `${selectedStudentIds.length} élève(s) assigné(s) au Groupe ${targetGroup} avec succès !`
    );
    setSelectedStudentIds([]);
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

  // Télécharger modèle CSV (compatible Algérie CEM et format standard)
  const handleDownloadTemplateCSV = () => {
    const templateContent = [
      'الترتيب,رقم التعريف,رقم التسجيل,اللقب,الاسم,الجنس,تاريخ الميلاد,الإعادة,الصفة,السن,الملاحظات',
      '1,1101315011146700,325,أحنوش,تزيري,أنثى,2013-10-31,لا,ن.داخلي,12,',
      '2,1001315010226400,327,أستيت,سيفاكس,ذكر,2013-03-17,لا,ن.داخلي,13,',
      '3,1001215040012614,148,الجنادي,وليد,ذكر,2012-01-22,نعم,ن.داخلي,14,',
    ].join('\n');

    const blob = new Blob(['\uFEFF' + templateContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'modele_import_eleves_algerie_cem.csv');
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
      setPastedCSV(text);
      const parsed = parseStudentsCSV(text, importTargetClassId);
      setImportResult(parsed);
    };
    reader.readAsText(file);
  };

  const handlePasteChange = (text: string) => {
    setPastedCSV(text);
    setCsvFileContent(text);
    if (text.trim().length > 10) {
      const parsed = parseStudentsCSV(text, importTargetClassId);
      setImportResult(parsed);
    } else {
      setImportResult(null);
    }
  };

  const handleConfirmImport = () => {
    if (importResult && importResult.success.length > 0) {
      onImportStudents(importResult.success, replaceClassOnImport);
      setImportModalOpen(false);
      setImportResult(null);
      setCsvFileContent('');
      setPastedCSV('');
      alert(
        language === 'ar'
          ? `تم استيراد ${importResult.success.length} تلميذ بنجاح مع أسمائهم وألقابهم السليمة!`
          : `${importResult.success.length} élève(s) importé(s) avec succès !`
      );
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
            onClick={() => setGroupManagerModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-xs transition cursor-pointer shadow-2xs"
            title={language === 'ar' ? 'تخصيص وتوزيع أفواج الأعمال الموجهة يدوياً' : 'Choisir manuellement le groupe de chaque élève'}
          >
            <Users className="w-4 h-4 text-indigo-600" />
            <span>{language === 'ar' ? '👥 تخصيص وتوزيع الأفواج (TD)' : '👥 Choisir les Groupes (TD)'}</span>
          </button>

          <button
            onClick={handleSplitClassInto2Groups}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-semibold text-xs transition cursor-pointer"
            title={language === 'ar' ? 'تقسيم القسم إلى فوجين بالتساوي كبداية' : 'Diviser la classe en 2 groupes TD 50/50'}
          >
            <span>{language === 'ar' ? '⚡ تقسيم أولي (50/50)' : '⚡ Répartir 50/50'}</span>
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

      {/* Barre d'action groupée pour assigner le groupe manuellement ou supprimer */}
      {selectedStudentIds.length > 0 && (
        <div className="fixed bottom-4 left-4 right-4 sm:static sm:mb-4 z-50 bg-slate-900/95 text-white px-5 py-3.5 rounded-2xl shadow-2xl backdrop-blur-md flex flex-wrap items-center justify-between gap-3 animate-fade-in border-2 border-rose-500/50">
          <div className="flex items-center gap-2.5 text-xs font-bold">
            <span className="w-7 h-7 rounded-full bg-rose-600 text-white flex items-center justify-center text-xs font-black shadow-xs">
              {selectedStudentIds.length}
            </span>
            <span className="text-sm font-extrabold">
              {language === 'ar'
                ? `تم تحديد ${selectedStudentIds.length} تلميذ :`
                : `${selectedStudentIds.length} élève(s) sélectionné(s) :`}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleBulkDelete}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-lg transition cursor-pointer flex items-center gap-1.5"
              title="Supprimer les élèves sélectionnés"
            >
              <Trash2 className="w-4 h-4" />
              <span>
                {language === 'ar'
                  ? `🗑️ حذف المحددين (${selectedStudentIds.length})`
                  : `Supprimer (${selectedStudentIds.length})`}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleBulkAssignGroup('1')}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow-md transition cursor-pointer flex items-center gap-1.5"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-300" />
              <span>{language === 'ar' ? 'الفوج 1' : 'Groupe 1'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleBulkAssignGroup('2')}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold shadow-md transition cursor-pointer flex items-center gap-1.5"
            >
              <span className="w-2 h-2 rounded-full bg-blue-300" />
              <span>{language === 'ar' ? 'الفوج 2' : 'Groupe 2'}</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedStudentIds([])}
              className="px-2.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 text-xs font-medium transition cursor-pointer"
            >
              {language === 'ar' ? 'إلغاء' : 'Annuler'}
            </button>
          </div>
        </div>
      )}

      {/* Alerte si des élèves ont un numéro au lieu de leur nom (issu d'une importation précédente) */}
      {hasCorruptedNames && (
        <div className="bg-amber-50 border-2 border-amber-300 p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-200/80 text-amber-900 flex items-center justify-center shrink-0 font-black text-xl">
              ⚠️
            </div>
            <div>
              <p className="font-extrabold text-xs sm:text-sm text-amber-950">
                {language === 'ar'
                  ? 'تنبيه : بعض التلاميذ يظهر رقم التسجيل مكان أسمائهم (بسبب استيراد قديم).'
                  : 'Attention : le numéro d’inscription apparaît à la place du nom (issu d’un ancien import).'}
              </p>
              <p className="text-[11px] text-amber-800 mt-0.5">
                {language === 'ar'
                  ? 'اضغط هنا لمسح الأرقام القديمة وإعادة استيراد القائمة الصحيحة بضغطة واحدة وبكل سهولة.'
                  : 'Cliquez ci-contre pour effacer les anciens numéros et réimporter la liste avec les vrais noms arabes.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleClearCurrentClass}
              className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-xs flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'مسح الأرقام القديمة' : 'Nettoyer la classe'}</span>
            </button>
            <button
              type="button"
              onClick={() => setImportModalOpen(true)}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-xs flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'استيراد الأسماء الصحيحة' : 'Réimporter'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Liste / Tableau des élèves */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-3.5 border-b border-slate-100 flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
          <div className="flex items-center gap-3">
            <span>{filteredStudents.length} élève{filteredStudents.length > 1 ? 's' : ''} trouvé{filteredStudents.length > 1 ? 's' : ''}</span>
            {selectedClassId !== 'all' && filteredStudents.length > 0 && (
              <button
                type="button"
                onClick={handleClearCurrentClass}
                className="text-rose-600 hover:text-rose-700 hover:underline text-[11px] font-bold normal-case cursor-pointer flex items-center gap-1"
                title="Supprimer tous les élèves de cette classe"
              >
                <Trash2 className="w-3 h-3" />
                <span>{language === 'ar' ? 'إفراغ هذا القسم' : 'Vider cette classe'}</span>
              </button>
            )}
          </div>
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
                  <th className="py-3.5 px-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={selectedStudentIds.length === filteredStudents.length && filteredStudents.length > 0}
                      onChange={handleSelectAllVisible}
                      className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                      title="Sélectionner tous les élèves affichés"
                    />
                  </th>
                  <th className="py-2 px-4">
                    {selectedStudentIds.length > 0 ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleBulkDelete}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-md cursor-pointer transition shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>
                            {language === 'ar'
                              ? `🗑️ حذف الكل (${selectedStudentIds.length})`
                              : `🗑️ Supprimer tout (${selectedStudentIds.length})`}
                          </span>
                        </button>
                        <span className="text-[11px] text-slate-500 font-normal normal-case hidden sm:inline">
                          {language === 'ar' ? 'تلميذ محدد' : 'élèves sélectionnés'}
                        </span>
                      </div>
                    ) : (
                      <span>{language === 'ar' ? 'التلميذ' : 'Élève'}</span>
                    )}
                  </th>
                  <th className="py-3.5 px-4">Classe & Groupe TD</th>
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
                  const isSelected = selectedStudentIds.includes(student.id);

                  return (
                    <tr
                      key={student.id}
                      className={`hover:bg-slate-50/80 transition group ${isSelected ? 'bg-indigo-50/40' : ''}`}
                    >
                      {/* Checkbox sélection */}
                      <td className="py-3 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectStudent(student.id)}
                          className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                        />
                      </td>

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
                              className="font-extrabold text-slate-900 group-hover:text-indigo-600 cursor-pointer block text-sm"
                            >
                              {student.lastName} {student.firstName}
                            </span>
                            <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                              {student.registrationNumber && (
                                <span className="font-mono bg-indigo-50 text-indigo-800 border border-indigo-200 px-1.5 py-0.5 rounded text-[10px] font-bold">
                                  {language === 'ar' ? `رقم التسجيل: ${student.registrationNumber}` : `N° ${student.registrationNumber}`}
                                </span>
                              )}
                              <span>• {student.gender === 'F' ? 'أنثى' : 'ذكر'}</span>
                              {student.nationalId && (
                                <span className="font-mono text-slate-400 text-[10px] hidden lg:inline">
                                  • NIN: {student.nationalId}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Classe et Groupe TD avec choix direct par l'enseignant */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                          <span
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold"
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

                          {/* Menu déroulant immédiat pour choisir le groupe */}
                          <select
                            value={student.group || '1'}
                            onChange={(e) => onUpdateStudent({ ...student, group: e.target.value as '1' | '2' })}
                            title={language === 'ar' ? 'تحديد فوج هذا التلميذ مباشرة' : 'Choisir directement le groupe TD de cet élève'}
                            className={`px-2.5 py-1 rounded-lg text-xs font-black border transition cursor-pointer shadow-2xs ${
                              student.group === '2'
                                ? 'bg-blue-50 text-blue-900 border-blue-300 focus:ring-2 focus:ring-blue-500'
                                : 'bg-emerald-50 text-emerald-900 border-emerald-300 focus:ring-2 focus:ring-emerald-500'
                            }`}
                          >
                            <option value="1">{language === 'ar' ? 'الفوج 1 (Groupe 1)' : 'Groupe 1 (فوج 1)'}</option>
                            <option value="2">{language === 'ar' ? 'الفوج 2 (Groupe 2)' : 'Groupe 2 (فوج 2)'}</option>
                          </select>
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
        <div className="modal-safe-overlay">
          <div className="relative bg-white rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[calc(100dvh-6rem)] my-0 animate-fade-in">
            {/* Header fixe - Ne passe JAMAIS sous la barre de notification */}
            <div className="sticky top-0 bg-white z-20 flex items-center justify-between px-6 py-4 border-b border-slate-100 shadow-2xs shrink-0">
              <div>
                <h3 className="font-extrabold text-lg text-slate-900">
                  {editingStudent ? (language === 'ar' ? 'تعديل بيانات التلميذ' : "Modifier l'élève") : (language === 'ar' ? 'إضافة تلميذ جديد' : 'Ajouter un nouvel élève')}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {language === 'ar' ? 'المعلومات الشخصية، الفوج وبيانات الاتصال' : 'Informations scolaires, groupe TD et contact'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAddEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 transition cursor-pointer"
                title="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    {language === 'ar' ? 'اللقب (Nom) *' : 'Nom de famille *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={language === 'ar' ? 'مثال: بن علي' : 'Ex: Moreau'}
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    {language === 'ar' ? 'الاسم (Prénom) *' : 'Prénom *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={language === 'ar' ? 'مثال: محمد' : 'Ex: Lucas'}
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 font-semibold"
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
                    {language === 'ar' ? 'فوج الأعمال الموجهة (TD/TP) *' : 'Groupe TD / TP *'}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, group: '1' })}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                        formData.group === '1'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${formData.group === '1' ? 'bg-white' : 'bg-emerald-500'}`} />
                      <span>{language === 'ar' ? 'الفوج 1 (G1)' : 'Groupe 1 (G1)'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, group: '2' })}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                        formData.group === '2'
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${formData.group === '2' ? 'bg-white' : 'bg-blue-500'}`} />
                      <span>{language === 'ar' ? 'الفوج 2 (G2)' : 'Groupe 2 (G2)'}</span>
                    </button>
                  </div>
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

              <div className="sticky bottom-0 bg-white z-20 flex items-center justify-end gap-3 pt-3 pb-1 border-t border-slate-100 shadow-xs">
                <button
                  type="button"
                  onClick={() => setAddEditModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  {language === 'ar' ? 'إلغاء' : 'Annuler'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition cursor-pointer"
                >
                  {editingStudent
                    ? (language === 'ar' ? 'حفظ التعديلات' : 'Sauvegarder')
                    : (language === 'ar' ? 'إضافة التلميذ' : 'Ajouter l’élève')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Import CSV */}
      {importModalOpen && (
        <div className="modal-safe-overlay">
          <div className="relative bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[calc(100dvh-6rem)] my-0 animate-fade-in">
            <div className="sticky top-0 bg-white z-20 flex items-center justify-between px-6 py-4 border-b border-slate-100 shadow-2xs shrink-0">
              <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                <Upload className="w-5 h-5 text-indigo-600" />
                <span>Importer une liste d'élèves (CSV)</span>
              </h3>
              <button
                type="button"
                onClick={() => setImportModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  {language === 'ar' ? 'القسم المستهدف لاستيراد التلاميذ *' : 'Classe de destination *'}
                </label>
                <select
                  value={importTargetClassId}
                  onChange={(e) => {
                    setImportTargetClassId(e.target.value);
                    if (csvFileContent) {
                      setImportResult(parseStudentsCSV(csvFileContent, e.target.value));
                    }
                  }}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold"
                >
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} ({cls.level})
                    </option>
                  ))}
                </select>
              </div>

              {/* Onglets Choix méthode : Fichier ou Coller texte */}
              <div className="flex p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setPasteMode(false)}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                    !pasteMode ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {language === 'ar' ? '📁 اختيار ملف CSV' : '📁 Importer un fichier CSV'}
                </button>
                <button
                  type="button"
                  onClick={() => setPasteMode(true)}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                    pasteMode ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {language === 'ar' ? '📋 نسخ ولصق النص مباشرة' : '📋 Coller le texte CSV'}
                </button>
              </div>

              {!pasteMode ? (
                /* Sélecteur de fichier */
                <div className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-2xl p-5 text-center transition bg-slate-50/50">
                  <FileSpreadsheet className="w-9 h-9 text-indigo-500 mx-auto mb-2" />
                  <label className="cursor-pointer block">
                    <span className="text-xs sm:text-sm font-bold text-indigo-600 hover:underline">
                      {language === 'ar' ? 'اضغط لاختيار ملف من هاتفك أو حاسوبك' : 'Cliquez pour choisir un fichier CSV'}
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-1">
                      {language === 'ar'
                        ? 'متوافق 100% مع ملفات منصة الرقمنة لوزارة التربية الوطنية (الترتيب، اللقب، الاسم...)'
                        : 'Compatible avec les exports du ministère (الترتيب، اللقب، الاسم...) et formats standards'}
                    </span>
                    <input
                      type="file"
                      accept=".csv,text/csv,text/plain"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              ) : (
                /* Zone de texte pour coller */
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    {language === 'ar'
                      ? 'الصق أسطر التلاميذ هنا (من إكسل أو ملف نصي) :'
                      : 'Collez directement le texte CSV ici :'}
                  </label>
                  <textarea
                    rows={4}
                    value={pastedCSV}
                    onChange={(e) => handlePasteChange(e.target.value)}
                    placeholder="الترتيب,رقم التعريف,رقم التسجيل,اللقب,الاسم,الجنس,تاريخ الميلاد,الإعادة,الصفة..."
                    className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                  <p className="text-[11px] text-slate-400">
                    {language === 'ar'
                      ? 'سيتم التعرف على الأعمدة وتقسيم التلاميذ تلقائياً.'
                      : 'Les colonnes ministérielles algériennes sont détectées automatiquement.'}
                  </p>
                </div>
              )}

              {/* Aperçu du parsing */}
              {importResult && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        {language === 'ar'
                          ? `تم التعرف على ${importResult.success.length} تلميذ بنجاح`
                          : `${importResult.success.length} élève(s) détecté(s) avec succès`}
                      </span>
                    </div>
                    {importResult.success[0]?.nationalId && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-200/60 text-emerald-900 font-bold">
                        🇩🇿 نظام الرقمنة الجزائري
                      </span>
                    )}
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
                    <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 text-xs bg-white shadow-2xs">
                      {importResult.success.map((s, idx) => (
                        <div key={idx} className="p-2.5 flex items-center justify-between hover:bg-slate-50 transition gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-black text-[10px] flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <div className="min-w-0">
                              <span className="font-extrabold text-slate-900 block truncate">
                                {s.lastName} {s.firstName}
                              </span>
                              <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                                <span>{s.gender === 'F' ? 'أنثى' : 'ذكر'}</span>
                                <span>• {s.birthDate}</span>
                                {s.boardingStatus && <span className="text-amber-700 font-medium">• {s.boardingStatus}</span>}
                                {s.nationalId && <span className="font-mono text-indigo-600 font-semibold">• NIN: {s.nationalId}</span>}
                              </div>
                            </div>
                          </div>

                          {s.isRepeating && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 shrink-0">
                              معيد
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Option de remplacement pour nettoyer les anciens numéros */}
              <label className="flex items-start gap-2.5 p-3 bg-amber-50/80 border border-amber-200 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={replaceClassOnImport}
                  onChange={(e) => setReplaceClassOnImport(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer mt-0.5"
                />
                <div>
                  <span className="text-xs font-bold text-amber-950 block">
                    {language === 'ar'
                      ? 'مسح واستبدال التلاميذ السابقين بهذا القسم (موصى به لتفادي التكرار والأرقام القديمة)'
                      : 'Remplacer les anciens élèves de cette classe (recommandé pour effacer les anciens numéros)'}
                  </span>
                  <span className="text-[11px] text-amber-800 block mt-0.5">
                    {language === 'ar'
                      ? 'سيتم حذف القائمة القديمة المعيبة ووضع هؤلاء التلاميذ الجدد بأسمائهم الرسمية.'
                      : 'Les élèves actuels de cette classe seront effacés et remplacés par cette nouvelle liste.'}
                  </span>
                </div>
              </label>

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

      {/* Modal interactif de répartition manuelle des groupes TD */}
      {groupManagerModalOpen && (
        <GroupManagerModal
          classroom={classes.find((c) => c.id === (selectedClassId !== 'all' ? selectedClassId : classes[0]?.id))}
          students={students}
          onUpdateStudent={onUpdateStudent}
          onClose={() => setGroupManagerModalOpen(false)}
        />
      )}
    </div>
  );
};
