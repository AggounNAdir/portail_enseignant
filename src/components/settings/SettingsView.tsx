import React, { useState } from 'react';
import {
  Settings,
  Download,
  Upload,
  Trash2,
  CheckCircle,
  AlertTriangle,
  User,
  Database,
  Building,
  Mail,
  School,
  Save,
  Sparkles,
  Lock,
  Globe
} from 'lucide-react';
import { Teacher } from '../../types';
import { useLanguage } from '../../i18n/LanguageContext';

interface SettingsViewProps {
  teacher: Teacher;
  onUpdateTeacher: (updated: Teacher) => void;
  onExportJSON: () => void;
  onImportJSON: (jsonString: string) => boolean;
  onClearAllData: () => void;
  onLoadSampleData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  teacher,
  onUpdateTeacher,
  onExportJSON,
  onImportJSON,
  onClearAllData,
  onLoadSampleData,
}) => {
  const { language, setLanguage, t, isRTL } = useLanguage();
  const [formData, setFormData] = useState({
    name: teacher.name,
    email: teacher.email,
    school: teacher.school,
    subject: teacher.subject,
    avatarUrl: teacher.avatarUrl || '',
  });

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [importStatus, setImportStatus] = useState<{ success: boolean; message: string } | null>(null);

  const handleSubmitProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateTeacher({
      ...teacher,
      ...formData,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const ok = onImportJSON(content);
      if (ok) {
        setImportStatus({ success: true, message: 'Sauvegarde restaurée avec succès !' });
      } else {
        setImportStatus({
          success: false,
          message: 'Erreur lors de la lecture du fichier de sauvegarde. Format JSON invalide.',
        });
      }
    };
    reader.readAsText(file);
  };

  const handleClearConfirm = () => {
    if (
      window.confirm(
        'Êtes-vous sûr de vouloir vider toutes les données (classes, élèves, notes et présences) ? Cette action rendra l’application 100% vierge.'
      )
    ) {
      onClearAllData();
      alert('Toutes les données ont été effacées. Votre application est désormais 100% vierge.');
    }
  };

  const handleLoadSampleConfirm = () => {
    if (
      window.confirm(
        'Voulez-vous charger 2 classes d’exemple pour tester l’application ?'
      )
    ) {
      onLoadSampleData();
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* En-tête */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
          <Settings className="w-7 h-7 text-indigo-600" />
          <span>{language === 'ar' ? 'الإعدادات وتخصيص الحساب' : 'Personnalisation & Paramètres'}</span>
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {language === 'ar'
            ? 'تخصيص بيانات الأستاذ، اختيار اللغة، وإدارة النسخ الاحتياطية للأقسام والبيانات.'
            : 'Personnalisez votre compte enseignant, vos coordonnées académiques et gérez la sauvegarde de vos classes.'}
        </p>
      </div>

      {/* Sélecteur de langue / اختيار لغة التطبيق */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {language === 'ar' ? 'لغة واجهة التطبيق' : "Langue de l'interface"}
            </h2>
            <p className="text-xs text-slate-500">
              {language === 'ar' ? 'التبديل بين العربية والفرنسية مع توجيه النص التلقائي' : "Basculez entre le Français et l'Arabe avec adaptation automatique de la direction"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setLanguage('ar')}
            className={`p-4 rounded-xl border text-right transition cursor-pointer flex items-center justify-between ${
              language === 'ar'
                ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-500/20'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div>
              <span className="font-bold text-sm text-slate-900 block">🇩🇿 العربية (الجزائر)</span>
              <span className="text-xs text-slate-500 block mt-0.5">نظام التعليم المتوسط الجزائري (CEM)</span>
            </div>
            {language === 'ar' && <CheckCircle className="w-5 h-5 text-indigo-600 shrink-0" />}
          </button>

          <button
            type="button"
            onClick={() => setLanguage('fr')}
            className={`p-4 rounded-xl border text-left transition cursor-pointer flex items-center justify-between ${
              language === 'fr'
                ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-500/20'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div>
              <span className="font-bold text-sm text-slate-900 block">🇫🇷 Français</span>
              <span className="text-xs text-slate-500 block mt-0.5">Interface en français</span>
            </div>
            {language === 'fr' && <CheckCircle className="w-5 h-5 text-indigo-600 shrink-0" />}
          </button>
        </div>
      </div>

      {/* Profil enseignant personnalisable */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Mon Compte Enseignant</h2>
            <p className="text-xs text-slate-500">Ces informations apparaîtront sur vos bulletins scolaires et feuilles d'appel</p>
          </div>
        </div>

        <form onSubmit={handleSubmitProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Votre Nom & Prénom *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Nadir Aggoun"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Adresse email *
              </label>
              <input
                type="email"
                required
                placeholder="Ex: aggounnadir8@gmail.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Nom de votre établissement
              </label>
              <input
                type="text"
                placeholder="Ex: Collège Jean Moulin, Lycée Pasteur..."
                value={formData.school}
                onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Matière enseignée principale
              </label>
              <input
                type="text"
                placeholder="Ex: Mathématiques, Sciences Physiques, Français..."
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Photo / Avatar (Optionnel - URL d'image)
            </label>
            <input
              type="url"
              placeholder="https://..."
              value={formData.avatarUrl}
              onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center justify-between pt-3">
            {savedSuccess ? (
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5 animate-fade-in">
                <CheckCircle className="w-4 h-4" />
                Profil mis à jour avec succès !
              </span>
            ) : <span />}

            <button
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Enregistrer mes coordonnées</span>
            </button>
          </div>
        </form>
      </div>

      {/* Sauvegarde & Restauration */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Sauvegarde Privée & Sécurisée</h2>
            <p className="text-xs text-slate-500">
              Vos données sont stockées de façon sécurisée et privée dans votre téléphone ou ordinateur
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Exporter */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Download className="w-4 h-4 text-indigo-600" />
                <span>Exporter ma sauvegarde</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Téléchargez un fichier JSON complet pour conserver une copie de secours de vos classes et notes.
              </p>
            </div>
            <button
              onClick={onExportJSON}
              className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-white text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200 hover:bg-indigo-50 shadow-2xs transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Télécharger la sauvegarde (JSON)</span>
            </button>
          </div>

          {/* Importer */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Upload className="w-4 h-4 text-indigo-600" />
                <span>Restaurer une sauvegarde</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Chargez un fichier de sauvegarde précédemment exporté pour réinjecter vos données.
              </p>
            </div>

            <label className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-white text-slate-700 font-bold text-xs rounded-xl border border-slate-300 hover:bg-slate-100 shadow-2xs transition cursor-pointer">
              <Upload className="w-4 h-4 text-slate-500" />
              <span>Choisir un fichier JSON...</span>
              <input
                type="file"
                accept=".json,application/json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {importStatus && (
          <div
            className={`mt-4 p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
              importStatus.success
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {importStatus.success ? (
              <CheckCircle className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            )}
            <span>{importStatus.message}</span>
          </div>
        )}
      </div>

      {/* Gestion des données : Remise à zéro */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Remise à zéro des données</h2>
            <p className="text-xs text-slate-500">
              Videz instantanément l'application de toute classe ou note pour travailler sur une base 100% vierge
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-xs text-slate-600 max-w-lg">
            Cliquez sur ce bouton pour supprimer définitivement toutes les classes, élèves et devoirs actuels et repartir sur une application entièrement vide.
          </p>
          <button
            onClick={handleClearConfirm}
            className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-300 transition cursor-pointer shrink-0 flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4 text-rose-600" />
            <span>Vider toutes les données (Base vierge)</span>
          </button>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
          <span>Besoin de voir un exemple temporaire ?</span>
          <button
            type="button"
            onClick={handleLoadSampleConfirm}
            className="text-indigo-600 hover:underline font-semibold"
          >
            Charger un exemple d'essai (facultatif)
          </button>
        </div>
      </div>
    </div>
  );
};
