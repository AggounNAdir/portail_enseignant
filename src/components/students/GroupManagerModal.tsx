import React, { useState, useMemo } from 'react';
import {
  X,
  Users,
  Search,
  ArrowRight,
  ArrowLeft,
  ArrowLeftRight,
  CheckCircle,
  Wand2,
  Sparkles
} from 'lucide-react';
import { Student, Classroom } from '../../types';
import { useLanguage } from '../../i18n/LanguageContext';

interface GroupManagerModalProps {
  classroom?: Classroom;
  students: Student[];
  onUpdateStudent: (updated: Student) => void;
  onClose: () => void;
}

export const GroupManagerModal: React.FC<GroupManagerModalProps> = ({
  classroom,
  students,
  onUpdateStudent,
  onClose,
}) => {
  const { language, isRTL } = useLanguage();
  const [search, setSearch] = useState('');

  // Filtrer les élèves de cette classe
  const classStudents = useMemo(() => {
    if (!classroom) return [];
    return students.filter((s) => s.classId === classroom.id);
  }, [students, classroom]);

  // Groupe 1 et Groupe 2
  const group1Students = useMemo(() => {
    return classStudents.filter((s) => (s.group || '1') === '1');
  }, [classStudents]);

  const group2Students = useMemo(() => {
    return classStudents.filter((s) => s.group === '2');
  }, [classStudents]);

  // Filtrage selon la recherche
  const filterList = (list: Student[]) => {
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(
      (s) =>
        s.firstName.toLowerCase().includes(q) ||
        s.lastName.toLowerCase().includes(q)
    );
  };

  const handleMoveToGroup = (student: Student, targetGroup: '1' | '2') => {
    onUpdateStudent({
      ...student,
      group: targetGroup,
    });
  };

  // Répartition automatique 50/50 optionnelle
  const handleAutoSplit = () => {
    const confirmMsg =
      language === 'ar'
        ? `هل تريد توزيع تلاميذ ${classroom?.name || ''} بالتساوي (50% الفوج 1 و 50% الفوج 2) حسب الترتيب الأبجدي كبداية؟ يمكنك بعدها تعديل أي تلميذ يدوياً.`
        : `Voulez-vous répartir les élèves de ${classroom?.name || ''} à 50% / 50% par ordre alphabétique comme base de départ ? Vous pourrez ensuite ajuster chaque élève manuellement.`;

    if (!window.confirm(confirmMsg)) return;

    const sorted = [...classStudents].sort((a, b) =>
      a.lastName.localeCompare(b.lastName, 'fr', { sensitivity: 'base' }) ||
      a.firstName.localeCompare(b.firstName, 'fr', { sensitivity: 'base' })
    );

    const half = Math.ceil(sorted.length / 2);
    sorted.forEach((st, idx) => {
      const assigned: '1' | '2' = idx < half ? '1' : '2';
      if (st.group !== assigned) {
        onUpdateStudent({ ...st, group: assigned });
      }
    });
  };

  return (
    <div className="modal-safe-overlay">
      <div className="relative bg-white rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden border border-slate-100 my-0 flex flex-col max-h-[calc(100dvh-6rem)] animate-fade-in">
        {/* Header fixe - Protégé contre la barre de notification */}
        <div className="sticky top-0 z-20 px-6 py-4 sm:py-5 bg-linear-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between shrink-0 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-indigo-300 shrink-0">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight">
                {language === 'ar'
                  ? `توزيع وتحديد أفواج الأعمال الموجهة (TD/TP) — ${classroom?.name || ''}`
                  : `Répartition manuelle des Groupes TD / TP — ${classroom?.name || ''}`}
              </h2>
              <p className="text-xs text-slate-300">
                {language === 'ar'
                  ? 'أنت من يقرر ويختار في أي فوج يكون كل تلميذ. اضغط على التلميذ لنقله فوراً.'
                  : 'C’est vous qui décidez quel élève va dans quel groupe. Cliquez sur les flèches pour déplacer un élève.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-300 hover:text-white rounded-xl hover:bg-white/10 transition cursor-pointer shrink-0"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barre de contrôle et recherche */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={
                language === 'ar'
                  ? 'بحث عن تلميذ بالاسم أو اللقب...'
                  : 'Rechercher un élève par nom ou prénom...'
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            type="button"
            onClick={handleAutoSplit}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition cursor-pointer shrink-0"
            title="Répartir automatiquement 50/50 pour commencer"
          >
            <Wand2 className="w-3.5 h-3.5 text-indigo-600" />
            <span>
              {language === 'ar'
                ? 'توزيع أولي تلقائي 50/50 (اختياري)'
                : 'Pré-remplir 50/50 (optionnel)'}
            </span>
          </button>
        </div>

        {/* Deux Colonnes : Groupe 1 et Groupe 2 */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* COLONNE GROUPE 1 */}
          <div className="flex flex-col bg-emerald-50/50 border-2 border-emerald-200 rounded-2xl p-4">
            <div className="flex items-center justify-between pb-3 border-b border-emerald-200/80 mb-3">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-emerald-200" />
                <h3 className="font-extrabold text-sm text-emerald-950">
                  {language === 'ar' ? 'الفوج الأول (Groupe 1)' : 'Groupe 1 (الفوج 1)'}
                </h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-600 text-white shadow-2xs">
                {group1Students.length} {language === 'ar' ? 'تلميذ' : 'élèves'}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[220px]">
              {filterList(group1Students).length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400 italic">
                  {language === 'ar' ? 'لا يوجد تلاميذ في الفوج 1' : 'Aucun élève dans le Groupe 1'}
                </div>
              ) : (
                filterList(group1Students).map((s) => (
                  <div
                    key={s.id}
                    className="p-2.5 bg-white border border-emerald-200 rounded-xl shadow-2xs flex items-center justify-between gap-2 hover:border-emerald-400 transition"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-black flex items-center justify-center shrink-0">
                        {s.firstName[0]}
                      </div>
                      <span className="font-bold text-xs text-slate-900 truncate">
                        {s.lastName.toUpperCase()} {s.firstName}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleMoveToGroup(s, '2')}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition cursor-pointer shrink-0"
                      title={
                        language === 'ar'
                          ? 'نقل هذا التلميذ إلى الفوج 2'
                          : 'Déplacer cet élève vers le Groupe 2'
                      }
                    >
                      <span>{language === 'ar' ? 'تحويل للفوج 2' : 'Vers G2'}</span>
                      {isRTL ? <ArrowLeft className="w-3 h-3" /> : <ArrowRight className="w-3 h-3" />}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* COLONNE GROUPE 2 */}
          <div className="flex flex-col bg-blue-50/50 border-2 border-blue-200 rounded-2xl p-4">
            <div className="flex items-center justify-between pb-3 border-b border-blue-200/80 mb-3">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-500 ring-2 ring-blue-200" />
                <h3 className="font-extrabold text-sm text-blue-950">
                  {language === 'ar' ? 'الفوج الثاني (Groupe 2)' : 'Groupe 2 (الفوج 2)'}
                </h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-600 text-white shadow-2xs">
                {group2Students.length} {language === 'ar' ? 'تلميذ' : 'élèves'}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[220px]">
              {filterList(group2Students).length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400 italic">
                  {language === 'ar' ? 'لا يوجد تلاميذ في الفوج 2' : 'Aucun élève dans le Groupe 2'}
                </div>
              ) : (
                filterList(group2Students).map((s) => (
                  <div
                    key={s.id}
                    className="p-2.5 bg-white border border-blue-200 rounded-xl shadow-2xs flex items-center justify-between gap-2 hover:border-blue-400 transition"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-800 text-[11px] font-black flex items-center justify-center shrink-0">
                        {s.firstName[0]}
                      </div>
                      <span className="font-bold text-xs text-slate-900 truncate">
                        {s.lastName.toUpperCase()} {s.firstName}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleMoveToGroup(s, '1')}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition cursor-pointer shrink-0"
                      title={
                        language === 'ar'
                          ? 'نقل هذا التلميذ إلى الفوج 1'
                          : 'Déplacer cet élève vers le Groupe 1'
                      }
                    >
                      {isRTL ? <ArrowRight className="w-3 h-3" /> : <ArrowLeft className="w-3 h-3" />}
                      <span>{language === 'ar' ? 'تحويل للفوج 1' : 'Vers G1'}</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <p className="text-xs text-slate-500 font-medium">
            {language === 'ar'
              ? `إجمالي التلاميذ : ${classStudents.length} (الفوج 1: ${group1Students.length} | الفوج 2: ${group2Students.length})`
              : `Total classe : ${classStudents.length} (G1 : ${group1Students.length} | G2 : ${group2Students.length})`}
          </p>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
          >
            {language === 'ar' ? 'حفظ وإغلاق' : 'Terminer & Fermer'}
          </button>
        </div>
      </div>
    </div>
  );
};
