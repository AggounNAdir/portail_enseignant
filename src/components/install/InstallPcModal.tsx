import React, { useState } from 'react';
import {
  Laptop,
  Download,
  X,
  Check,
  Copy,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Zap,
  Globe
} from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

interface InstallPcModalProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt: any;
  onTriggerInstall: () => void;
}

export const InstallPcModal: React.FC<InstallPcModalProps> = ({
  isOpen,
  onClose,
  deferredPrompt,
  onTriggerInstall,
}) => {
  const { language } = useLanguage();
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const appUrl = window.location.origin;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(appUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    });
  };

  return (
    <div className="modal-safe-overlay">
      <div className="relative bg-white rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden border border-slate-100 animate-fade-in flex flex-col max-h-[calc(100dvh-4rem)]">
        {/* En-tête */}
        <div className="bg-linear-to-r from-indigo-900 via-indigo-800 to-blue-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/70 hover:text-white p-2 rounded-xl hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center text-emerald-300 shadow-inner">
              <Laptop className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">
                {language === 'ar' ? 'تثبيت التطبيق على جهاز الكمبيوتر (PC)' : 'Installer ProfPilot sur votre PC'}
              </h3>
              <p className="text-xs text-indigo-200">
                {language === 'ar'
                  ? 'برنامج مستقل على سطح المكتب يعمل بدون متصفح وبدون إنترنت !'
                  : 'Application de bureau autonome pour Windows & Mac (PWA haute performance).'}
              </p>
            </div>
          </div>
        </div>

        {/* Corps */}
        <div className="p-6 overflow-y-auto space-y-5 text-slate-700">
          {/* Si le navigateur supporte l'installation directe en 1 clic */}
          {deferredPrompt && (
            <div className="p-4 bg-emerald-50 border-2 border-emerald-300 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-black text-emerald-950 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>{language === 'ar' ? 'تثبيت فوري بضغطة زر :' : 'Installation en 1 clic disponible :'}</span>
                </h4>
                <p className="text-xs text-emerald-800 mt-0.5">
                  {language === 'ar'
                    ? 'متصفحك يدعم التثبيت المباشر على سطح المكتب الآن.'
                    : 'Votre navigateur permet d’ajouter directement l’application sur votre bureau.'}
                </p>
              </div>
              <button
                type="button"
                onClick={onTriggerInstall}
                className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md transition cursor-pointer flex items-center justify-center gap-2 shrink-0"
              >
                <Download className="w-4 h-4" />
                <span>{language === 'ar' ? 'تثبيت على الحاسوب الآن' : 'Installer sur ce PC'}</span>
              </button>
            </div>
          )}

          {/* Guide visuel étape par étape */}
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
              {language === 'ar' ? 'خطوات التثبيت على الكمبيوتر (Windows / Mac) :' : 'Comment installer en 3 étapes simples :'}
            </h4>

            {/* Étape 1 */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-black text-xs flex items-center justify-center">
                  1
                </span>
                <span className="font-extrabold text-sm text-slate-900">
                  {language === 'ar' ? 'افتح هذا الرابط على متصفح الحاسوب :' : 'Ouvrez ce lien sur votre ordinateur :'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {language === 'ar'
                  ? 'استخدم متصفح Google Chrome أو Microsoft Edge على الكمبيوتر :'
                  : 'Dans Google Chrome, Microsoft Edge ou Brave sur votre PC :'}
              </p>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  readOnly
                  value={appUrl}
                  className="flex-1 px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl text-slate-700 font-mono select-all focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? (language === 'ar' ? 'تم النسخ' : 'Copié !') : (language === 'ar' ? 'نسخ الرابط' : 'Copier')}</span>
                </button>
              </div>
            </div>

            {/* Étape 2 */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-black text-xs flex items-center justify-center">
                  2
                </span>
                <span className="font-extrabold text-sm text-slate-900">
                  {language === 'ar' ? 'اضغط على أيقونة التثبيت في شريط العنوان :' : 'Cliquez sur l’icône d’installation dans la barre d’adresse :'}
                </span>
              </div>
              <div className="text-xs text-slate-600 space-y-1.5 pl-8">
                <p>
                  • <strong className="text-slate-800">Google Chrome :</strong>{' '}
                  {language === 'ar'
                    ? 'في أقصى يمين شريط العنوان (مكان كتابة الرابط)، اضغط على أيقونة الحاسوب 💻 الصغيرة (أو ⊕) المكتوب عليها « تثبيت ProfPilot ».'
                    : 'Tout à droite de la barre d’adresse (où se trouve l’URL), cliquez sur la petite icône d’écran 💻 ou l’icône ⊕ « Installer ProfPilot ».'}
                </p>
                <p>
                  • <strong className="text-slate-800">Microsoft Edge :</strong>{' '}
                  {language === 'ar'
                    ? 'اضغط على أيقونة المربعات الثلاثية ⊞ في شريط العنوان أو القائمة ➔ التطبيقات ➔ تثبيت ProfPilot.'
                    : 'Cliquez sur l’icône ⊞ dans la barre d’adresse ou Menu (...) ➔ Applications ➔ « Installer ProfPilot ».'}
                </p>
              </div>
            </div>

            {/* Étape 3 */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-black text-xs flex items-center justify-center">
                  3
                </span>
                <span className="font-extrabold text-sm text-slate-900">
                  {language === 'ar' ? 'مبروك ! أصبح لديك برنامج مستقل :' : 'ProfPilot est prêt sur votre bureau !'}
                </span>
              </div>
              <p className="text-xs text-slate-600 pl-8">
                {language === 'ar'
                  ? 'سيظهر اختصار ProfPilot على سطح مكتب الويندوز والماك، وتفتح نافذة مستقلة كاملة بدون شريط المتصفح، تعمل حتى بدون اتصال بالإنترنت.'
                  : 'L’icône apparaît sur votre bureau Windows/Mac et dans votre menu Démarrer. L’application s’ouvre en plein écran comme un logiciel natif.'}
              </p>
            </div>
          </div>

          {/* Avantages de l'application sur PC */}
          <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-2xl">
            <h5 className="text-xs font-bold text-indigo-950 mb-1.5 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>{language === 'ar' ? 'مزايا التطبيق المثبت على الحاسوب :' : 'Pourquoi l’installer sur votre PC ?'}</span>
            </h5>
            <ul className="text-xs text-indigo-900/80 space-y-1 list-disc list-inside">
              <li>{language === 'ar' ? 'يعمل بدون إنترنت تماماً (Offline).' : 'Fonctionne à 100% hors-ligne (sans connexion).'}</li>
              <li>{language === 'ar' ? 'شاشة كاملة سريعة بدون شريط المتصفح أو علامات التبويب.' : 'Interface plein écran sans les barres de navigateur encombrantes.'}</li>
              <li>{language === 'ar' ? 'مزامنة لحظية مباشرة مع هاتفك عند توفر الشبكة.' : 'Synchronisation automatique en direct avec votre téléphone.'}</li>
            </ul>
          </div>
        </div>

        {/* Bouton fermeture */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-md transition cursor-pointer"
          >
            {language === 'ar' ? 'فهمت، إغلاق' : 'J’ai compris, fermer'}
          </button>
        </div>
      </div>
    </div>
  );
};
