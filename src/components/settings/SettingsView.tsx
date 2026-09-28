import React, { useState } from 'react';
import {
  Settings,
  Download,
  Upload,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  User,
  ShieldCheck,
  Database,
  Building,
  Mail,
  School,
  Save
} from 'lucide-react';
import { Teacher } from '../../types';

interface SettingsViewProps {
  teacher: Teacher;
  onUpdateTeacher: (updated: Teacher) => void;
  onExportJSON: () => void;
  onImportJSON: (jsonString: string) => boolean;
  onResetDemoData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  teacher,
  onUpdateTeacher,
  onExportJSON,
  onImportJSON,
  onResetDemoData,
}) => {
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

  const handleResetConfirm = () => {
    if (
      window.confirm(
        'Attention : Voulez-vous réinitialiser toutes vos données avec le jeu d’exemple complet ? Vos modifications actuelles seront écrasées.'
      )
    ) {
      onResetDemoData();
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* En-tête */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
          <Settings className="w-7 h-7 text-indigo-600" />
          <span>Paramètres & Données</span>
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Gérez votre profil enseignant et effectuez des sauvegardes intégrales de vos classes et élèves.
        </p>
      </div>

      {/* Profil enseignant */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
          <User className="w-5 h-5 text-indigo-600" />
          <div>
            <h2 className="text-base font-bold text-slate-900">Profil de l'enseignant</h2>
            <p className="text-xs text-slate-500">Ces informations apparaissent sur les bulletins scolaires officiels</p>
          </div>
        </div>

        <form onSubmit={handleSubmitProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Nom complet *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Adresse email académique *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Établissement scolaire
              </label>
              <input
                type="text"
                value={formData.school}
                onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Discipline / Matière principale
              </label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Photo / Avatar (URL)
            </label>
            <input
              type="url"
              placeholder="https://images.unsplash.com/..."
              value={formData.avatarUrl}
              onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center justify-between pt-3">
            {savedSuccess ? (
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5 animate-fade-in">
                <CheckCircle className="w-4 h-4" />
                Profil enregistré avec succès !
              </span>
            ) : <span />}

            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Enregistrer le profil</span>
            </button>
          </div>
        </form>
      </div>

      {/* Sauvegarde & Restauration */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
          <Database className="w-5 h-5 text-indigo-600" />
          <div>
            <h2 className="text-base font-bold text-slate-900">Sauvegarde & Restauration intégrale</h2>
            <p className="text-xs text-slate-500">
              Vos données sont stockées de façon sécurisée et privée dans votre navigateur
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Exporter */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Download className="w-4 h-4 text-indigo-600" />
                <span>Exporter toutes les données</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Téléchargez un fichier JSON complet contenant toutes vos classes, élèves, devoirs, notes et présences.
              </p>
            </div>
            <button
              onClick={onExportJSON}
              className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-white text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200 hover:bg-indigo-50 shadow-2xs transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Télécharger le fichier de sauvegarde (JSON)</span>
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
                Chargez un fichier de sauvegarde ProfPilot JSON pour réinjecter toutes vos données.
              </p>
            </div>

            <label className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-white text-slate-700 font-bold text-xs rounded-xl border border-slate-300 hover:bg-slate-100 shadow-2xs transition cursor-pointer">
              <Upload className="w-4 h-4 text-slate-500" />
              <span>Choisir un fichier de sauvegarde...</span>
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

      {/* Zone de Danger / Données de démonstration */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100">
          <RotateCcw className="w-5 h-5 text-amber-500" />
          <div>
            <h2 className="text-base font-bold text-slate-900">Données de démonstration</h2>
            <p className="text-xs text-slate-500">
              Réinitialiser l'application avec les classes types (3ème B, 4ème A, 2nde 3) et élèves exemples
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-xs text-slate-500 max-w-lg">
            Si vous souhaitez réinitialiser l’application pour tester ou explorer les fonctionnalités avec un jeu d'élèves et de devoirs réaliste, cliquez ci-contre.
          </p>
          <button
            onClick={handleResetConfirm}
            className="px-4 py-2 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 text-xs font-bold rounded-xl border border-slate-300 hover:border-rose-200 transition cursor-pointer shrink-0"
          >
            Réinitialiser les données démo
          </button>
        </div>
      </div>
    </div>
  );
};
