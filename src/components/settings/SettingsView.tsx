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
  Globe,
  Laptop,
  Smartphone,
  Copy,
  Check,
  Share2,
  RefreshCw
} from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import { Teacher } from '../../types';
import { useLanguage } from '../../i18n/LanguageContext';
import { exportAllDataAsJSON } from '../../services/storage';

interface SettingsViewProps {
  teacher: Teacher;
  onUpdateTeacher: (updated: Teacher) => void;
  onExportJSON: () => void;
  onImportJSON: (jsonString: string) => boolean;
  onClearAllData: () => void;
  onLoadSampleData: () => void;
  cloudUser?: FirebaseUser | null;
  onOpenCloudSync?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  teacher,
  onUpdateTeacher,
  onExportJSON,
  onImportJSON,
  onClearAllData,
  onLoadSampleData,
  cloudUser = null,
  onOpenCloudSync,
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
  const [isUpdating, setIsUpdating] = useState(false);

  // Synchronisation directe PC ⇄ Téléphone
  const [syncCopied, setSyncCopied] = useState(false);
  const [syncInputText, setSyncInputText] = useState('');
  const [syncTextStatus, setSyncTextStatus] = useState<{ success: boolean; message: string } | null>(null);

  const handleCopySyncCode = () => {
    try {
      const code = exportAllDataAsJSON();
      navigator.clipboard.writeText(code).then(() => {
        setSyncCopied(true);
        setTimeout(() => setSyncCopied(false), 3500);
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleApplySyncCode = () => {
    if (!syncInputText.trim()) return;
    const ok = onImportJSON(syncInputText.trim());
    if (ok) {
      setSyncTextStatus({
        success: true,
        message: language === 'ar' ? 'تمت مزامنة واسترجاع جميع بياناتك بنجاح!' : 'Toutes vos données ont été synchronisées avec succès !',
      });
      setSyncInputText('');
    } else {
      setSyncTextStatus({
        success: false,
        message: language === 'ar' ? 'الكود الملصق غير صالح، يرجى نسخه مجدداً.' : 'Le code collé est invalide ou corrompu. Veuillez le recopier.',
      });
    }
  };

  const handleForceUpdate = async () => {
    setIsUpdating(true);
    try {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.update();
        }
      }
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
      }
      setTimeout(() => {
        window.location.reload();
      }, 600);
    } catch (err) {
      console.error('Update error:', err);
      window.location.reload();
    }
  };

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

      {/* Carte Mise à jour de l'application sur Téléphone */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {language === 'ar' ? 'تحديث التطبيق على الهاتف' : "Mise à jour de l'application sur téléphone"}
              </h2>
              <p className="text-xs text-slate-500">
                {language === 'ar' ? 'تثبيت أحدث الإصدارات والمميزات الجديدة فوراً' : 'Téléchargez immédiatement les dernières fonctionnalités (Langues, Groupes TD, etc.)'}
              </p>
            </div>
          </div>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-200 self-start sm:self-auto">
            v2.4 (Algérie CEM & TD)
          </span>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
            <p className="font-bold text-slate-900">
              {language === 'ar' ? '📱 كيفية التحديث على هاتفك (أندرويد / آيفون) :' : '📱 Comment mettre à jour sur votre smartphone :'}
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-slate-600">
              <li>
                <strong>{language === 'ar' ? 'الطريقة 1 (المباشرة والأسرع) :' : 'Méthode 1 (Directe & Rapide) :'}</strong>{' '}
                {language === 'ar'
                  ? 'اضغط على الزر الأخضر بالأسفل «تحديث التطبيق الآن»، سيقوم التطبيق بمسح الملفات القديمة وتحميل التحديث فوراً.'
                  : 'Cliquez sur le bouton vert ci-dessous « Mettre à jour l’application maintenant ». Le cache sera vidé et l’app rechargera la dernière version.'}
              </li>
              <li>
                <strong>{language === 'ar' ? 'الطريقة 2 (إعادة فتح التطبيق) :' : 'Méthode 2 (Redémarrage de l’app) :'}</strong>{' '}
                {language === 'ar'
                  ? 'أغلق التطبيق تماماً (اسحبه للأعلى من قائمة التطبيقات المفتوحة في هاتفك)، ثم أعد تشغيله وأنت متصل بالإنترنت.'
                  : 'Fermez complètement l’application (glisser vers le haut dans le multitâche de votre téléphone) puis rouvrez-la avec une connexion Internet.'}
              </li>
              <li>
                <strong>{language === 'ar' ? 'الطريقة 3 (سحب الشاشة) :' : 'Méthode 3 (Glisser vers le bas) :'}</strong>{' '}
                {language === 'ar'
                  ? 'اسحب الشاشة بيدك من الأعلى إلى الأسفل لتنشيط الصفحة (Pull-to-refresh).'
                  : 'Glissez votre doigt du haut vers le bas sur l’écran pour actualiser (Pull-to-refresh).'}
              </li>
            </ul>

            <div className="pt-2 border-t border-slate-200/60 flex items-center gap-1.5 text-[11px] text-emerald-800 font-semibold">
              <CheckCircle className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
              <span>
                {language === 'ar'
                  ? '🔒 أمان تام: التحديث لا يحذف إطلاقاً بياناتك ولا علامات التلاميذ المخزنة في هاتفك.'
                  : '🔒 Vos données, classes et notes sont 100% conservées en mémoire et ne sont jamais effacées.'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleForceUpdate}
            disabled={isUpdating}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition cursor-pointer"
          >
            <Sparkles className={`w-4 h-4 ${isUpdating ? 'animate-spin' : ''}`} />
            <span>
              {isUpdating
                ? (language === 'ar' ? 'جاري تثبيت التحديث...' : 'Téléchargement de la mise à jour...')
                : (language === 'ar' ? '🔄 تحديث التطبيق الآن (تحميل أحدث إصدار)' : '🔄 Mettre à jour l’application maintenant')}
            </span>
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

      {/* Guide & Outils de Synchronisation Téléphone ⇄ PC */}
      <div className="bg-linear-to-br from-indigo-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-500/30">
        <div className="flex items-center gap-4 mb-6 pb-5 border-b border-indigo-500/20">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold shadow-inner">
            <div className="flex items-center -space-x-1">
              <Smartphone className="w-6 h-6 text-indigo-300" />
              <Laptop className="w-6 h-6 text-emerald-400" />
            </div>
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
              <span>{language === 'ar' ? 'مزامنة البيانات بين الهاتف والحاسوب' : 'Synchroniser avec l’application sur PC'}</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {language === 'ar' ? '100% خاص وآمن' : 'Privé & Sécurisé'}
              </span>
            </h2>
            <p className="text-xs text-indigo-200/80 mt-1">
              {language === 'ar'
                ? 'كيفية نقل أقسامك وتلاميذك ونقاطك بين هاتفك وحاسوبك بكل بساطة وسرعة.'
                : 'Transférez facilement toutes vos classes, vos élèves et vos notes de votre smartphone vers votre PC (et inversement).'}
            </p>
          </div>
        </div>

        {/* Liaison directe en temps réel Cloud */}
        {onOpenCloudSync && (
          <div className="mb-6 p-4 rounded-2xl bg-indigo-500/20 border-2 border-indigo-400/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black shrink-0 shadow-md">
                ⚡
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                  <span>{language === 'ar' ? 'المزامنة السحابية اللحظية (تلقائية بالكامل)' : 'Synchronisation Cloud Instantanée (100% Automatique)'}</span>
                  {cloudUser && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-bold">
                      {language === 'ar' ? 'مفعلة' : 'Active'}
                    </span>
                  )}
                </h3>
                <p className="text-xs text-indigo-200 mt-0.5">
                  {cloudUser
                    ? (language === 'ar'
                        ? `متصل بالبريد : ${cloudUser.email}. أي عملية تقوم بها الآن تنعكس فوراً على الحاسوب.`
                        : `Connecté (${cloudUser.email}). Chaque opération est répercutée en direct sur votre PC.`)
                    : (language === 'ar'
                        ? 'اضغط هنا لربط الهاتف والحاسوب، لتظهر التعديلات لحظياً دون نسخ أو تحميل أي ملف!'
                        : 'Connectez vos deux appareils pour que chaque action soit transmise en direct sans fichier !')}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onOpenCloudSync}
              className="px-5 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-xs transition cursor-pointer shadow-lg shrink-0 flex items-center justify-center gap-2"
            >
              <span>{cloudUser ? (language === 'ar' ? 'إدارة المزامنة السحابية' : 'Gérer la synchronisation') : (language === 'ar' ? '⚡ تفعيل المزامنة المباشرة' : '⚡ Activer la synchronisation')}</span>
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Méthode 1 : Copier-Coller le code (Instantané sans fichier !) */}
          <div className="bg-white/10 rounded-2xl p-5 border border-white/10 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">
                  {language === 'ar' ? '⚡ الطريقة الأسرع (دون الحاجة لملفات)' : '⚡ Méthode Express (Sans fichier)'}
                </span>
              </div>
              <h3 className="font-extrabold text-white text-base">
                {language === 'ar' ? '1. نسخ كود المزامنة ولصقه' : '1. Copier / Coller le code direct'}
              </h3>
              <p className="text-xs text-indigo-100/70 mt-1">
                {language === 'ar'
                  ? 'اضغط هنا لنسخ كل بياناتك، أرسلها لنفسك في واتساب أو مسنجر، ثم الصقها في الحاسوب.'
                  : 'Copiez vos données en 1 clic, collez-les dans un message pour vous-même (WhatsApp/Mail), puis validez sur votre PC.'}
              </p>
            </div>

            <div className="mt-5 space-y-3">
              <button
                type="button"
                onClick={handleCopySyncCode}
                className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs rounded-xl shadow-md transition cursor-pointer flex items-center justify-center gap-2"
              >
                {syncCopied ? (
                  <>
                    <Check className="w-4 h-4 text-slate-950" />
                    <span>{language === 'ar' ? 'تم نسخ كود المزامنة بنجاح !' : 'Code de synchronisation copié !'}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-slate-950" />
                    <span>{language === 'ar' ? '📋 نسخ كود مزامنة جميع بياناتي' : '📋 Copier mon code de synchronisation'}</span>
                  </>
                )}
              </button>

              <div className="pt-2 border-t border-white/10">
                <label className="block text-[11px] font-bold text-indigo-200 mb-1.5">
                  {language === 'ar' ? 'إذا كنت الآن على الحاسوب، الصق الكود هنا :' : 'Si vous êtes sur le PC, collez le code ici :'}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder={language === 'ar' ? 'الصق كود المزامنة هنا...' : 'Collez le code de synchronisation ici...'}
                    value={syncInputText}
                    onChange={(e) => setSyncInputText(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs bg-black/30 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleApplySyncCode}
                    disabled={!syncInputText.trim()}
                    className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 text-white font-bold text-xs rounded-xl transition cursor-pointer shrink-0"
                  >
                    {language === 'ar' ? 'مزامنة الآن' : 'Synchroniser'}
                  </button>
                </div>
              </div>

              {syncTextStatus && (
                <div
                  className={`p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 ${
                    syncTextStatus.success
                      ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-200 border border-rose-500/30'
                  }`}
                >
                  {syncTextStatus.success ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-rose-400" />}
                  <span>{syncTextStatus.message}</span>
                </div>
              )}
            </div>
          </div>

          {/* Méthode 2 : Par fichier JSON & Comment installer sur PC */}
          <div className="bg-white/10 rounded-2xl p-5 border border-white/10 flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-300">
                {language === 'ar' ? '📁 طريقة ملف النسخة الاحتياطية' : '📁 Méthode par fichier de sauvegarde'}
              </span>
              <h3 className="font-extrabold text-white text-base mt-1">
                {language === 'ar' ? '2. نقل ملف JSON إلى الحاسوب' : '2. Télécharger & Charger le fichier'}
              </h3>
              <ol className="text-xs text-indigo-100/80 mt-2 space-y-1.5 list-decimal list-inside">
                <li>
                  <strong className="text-white">{language === 'ar' ? 'على الهاتف :' : 'Sur votre téléphone :'}</strong>{' '}
                  {language === 'ar' ? 'اضغط « تحميل النسخة الاحتياطية » لحفظ ملف JSON.' : 'Cliquez sur « Télécharger la sauvegarde (JSON) ».'}
                </li>
                <li>
                  <strong className="text-white">{language === 'ar' ? 'الإرسال :' : 'Envoi :'}</strong>{' '}
                  {language === 'ar' ? 'أرسل الملف إلى الحاسوب عبر واتساب ويب أو الإيميل أو كابل USB.' : 'Envoyez ce fichier à votre PC (WhatsApp Web, Gmail ou câble).'}
                </li>
                <li>
                  <strong className="text-white">{language === 'ar' ? 'على الحاسوب :' : 'Sur votre PC :'}</strong>{' '}
                  {language === 'ar' ? 'افتح التطبيق، واضغط « اختيار ملف JSON » في قسم الاسترجاع.' : 'Ouvrez ProfPilot et cliquez sur « Choisir un fichier JSON ».'}
                </li>
              </ol>
            </div>

            <div className="mt-4 p-3 bg-black/20 rounded-xl border border-white/10">
              <p className="text-[11px] font-bold text-white flex items-center gap-1.5 mb-1">
                <Laptop className="w-4 h-4 text-emerald-400" />
                <span>{language === 'ar' ? 'تثبيت التطبيق على الحاسوب (Windows / Mac) :' : 'Installer ProfPilot sur PC :'}</span>
              </p>
              <p className="text-[11px] text-indigo-200/70">
                {language === 'ar'
                  ? 'افتح رابط التطبيق في متصفح Chrome أو Edge على حاسوبك، ثم اضغط على أيقونة التثبيت (💻 أو ⊕) بجانب شريط العنوان لتثبيته كبرنامج حاسوب يعمل بدون إنترنت !'
                  : 'Ouvrez le lien dans Google Chrome ou Edge sur PC, puis cliquez sur l’icône 💻 (ou ⊕) dans la barre d’adresse pour l’installer comme une application native autonome.'}
              </p>
            </div>
          </div>
        </div>
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
