import React, { useState } from 'react';
import {
  Cloud,
  X,
  CheckCircle,
  AlertCircle,
  Laptop,
  Smartphone,
  Key,
  Copy,
  Check,
  ArrowRight,
  LogOut,
  RefreshCw,
  Zap,
  ShieldCheck
} from 'lucide-react';
import {
  getStoredSyncKey,
  setStoredSyncKey,
  setCloudSyncEnabled,
  fetchInitialCloudWorkspace,
  pushWorkspaceToCloud
} from '../../services/firebase';
import { useLanguage } from '../../i18n/LanguageContext';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  syncKey: string;
  isSyncActive: boolean;
  onActivateSync: (key: string) => Promise<void>;
  onDeactivateSync: () => void;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({
  isOpen,
  onClose,
  syncKey,
  isSyncActive,
  onActivateSync,
  onDeactivateSync,
}) => {
  const { language } = useLanguage();
  const [inputKey, setInputKey] = useState(syncKey || getStoredSyncKey());
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(inputKey).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const clean = inputKey.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    if (clean.length < 4) {
      setErrorMsg(
        language === 'ar'
          ? 'يجب أن يتكون كود المزامنة من 4 أحرف أو أرقام على الأقل.'
          : 'Le code doit contenir au moins 4 caractères ou chiffres.'
      );
      return;
    }

    setLoading(true);
    try {
      await onActivateSync(clean);
      setSuccessMsg(
        language === 'ar'
          ? 'تم تفعيل المزامنة اللحظية السحابية بنجاح !'
          : 'Synchronisation Cloud instantanée activée avec succès !'
      );
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(
        language === 'ar'
          ? 'تعذر الاتصال بقاعدة البيانات السحابية. تحقق من اتصالك بالإنترنت.'
          : err?.message || 'Erreur lors de la connexion au Cloud.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    onDeactivateSync();
    setSuccessMsg(
      language === 'ar' ? 'تم إيقاف المزامنة السحابية.' : 'Synchronisation Cloud désactivée.'
    );
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  return (
    <div className="modal-safe-overlay">
      <div className="relative bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-100 animate-fade-in flex flex-col max-h-[calc(100dvh-4rem)]">
        {/* En-tête */}
        <div className="bg-linear-to-r from-indigo-900 via-indigo-800 to-blue-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/70 hover:text-white p-2 rounded-xl hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center text-emerald-300 shadow-inner">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <span>{language === 'ar' ? 'المزامنة السحابية المباشرة (هاتف ⇄ حاسوب)' : 'Liaison Cloud Directe (Téléphone ⇄ PC)'}</span>
              </h3>
              <p className="text-xs text-indigo-200">
                {language === 'ar'
                  ? 'مزامنة فورية بدون كلمات مرور معقدة أو أخطاء حساب'
                  : 'Synchronisation instantanée sécurisée via votre Code de liaison unique.'}
              </p>
            </div>
          </div>

          {/* Schéma visuel de connexion */}
          <div className="mt-4 p-3 bg-black/25 rounded-2xl border border-white/10 flex items-center justify-between text-xs font-bold text-indigo-100">
            <div className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-indigo-300" />
              <span>{language === 'ar' ? 'الهاتف' : 'Téléphone'}</span>
            </div>
            <div className="flex items-center gap-1 text-emerald-400 font-extrabold animate-pulse">
              <span>⇄</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30">
                {isSyncActive ? (language === 'ar' ? 'متصل ومباشر' : 'Connecté en direct') : (language === 'ar' ? 'جاهز للربط' : 'Prêt à lier')}
              </span>
              <span>⇄</span>
            </div>
            <div className="flex items-center gap-2">
              <Laptop className="w-5 h-5 text-emerald-300" />
              <span>{language === 'ar' ? 'الحاسوب' : 'PC Bureau'}</span>
            </div>
          </div>
        </div>

        {/* Corps */}
        <div className="p-6 overflow-y-auto space-y-4">
          {isSyncActive ? (
            /* Déjà connecté et actif */
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-extrabold text-emerald-950">
                    {language === 'ar' ? 'المزامنة السحابية المباشرة مفعلة بنجاح !' : 'Liaison Cloud Temps Réel Active !'}
                  </h4>
                  <p className="text-xs text-emerald-800 mt-1 font-medium">
                    {language === 'ar'
                      ? `كود الربط الخاص بك هو : `
                      : `Votre code de liaison actif : `}
                    <strong className="px-2 py-0.5 bg-emerald-200 text-emerald-950 rounded font-mono font-bold">
                      {inputKey}
                    </strong>
                  </p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-2">
                <p className="font-bold text-slate-800 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <span>{language === 'ar' ? 'كيف تربط جهازك الثاني (الحاسوب) ؟' : 'Comment lier votre ordinateur ?'}</span>
                </p>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-600">
                  <li>{language === 'ar' ? 'افتح التطبيق على حاسوبك.' : 'Ouvrez ProfPilot sur votre PC.'}</li>
                  <li>
                    {language === 'ar'
                      ? `اضغط على زر السحابة في الأعلى وأدخل الكود : ${inputKey}.`
                      : `Cliquez sur le bouton Cloud en haut et entrez le code : ${inputKey}.`}
                  </li>
                  <li>
                    {language === 'ar'
                      ? 'أي نقطة أو غياب أو تعديل على الهاتف سيظهر مباشرة على الحاسوب والعكس بالعكس !'
                      : 'Chaque note ou présence saisie apparaîtra en moins d’une seconde sur l’autre écran !'}
                  </li>
                </ol>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="px-4 py-2.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{language === 'ar' ? 'إلغاء الربط' : 'Déconnecter'}</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs transition cursor-pointer shadow-md"
                >
                  {language === 'ar' ? 'تم، إغلاق' : 'Fermer'}
                </button>
              </div>
            </div>
          ) : (
            /* Formulaire d'activation via code de liaison */
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="text-xs text-slate-600 bg-indigo-50/70 p-4 rounded-2xl border border-indigo-100">
                <p className="font-bold text-indigo-950 mb-1 flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-indigo-600" />
                  <span>{language === 'ar' ? 'كود الربط السحابي (Téléphone ⇄ PC) :' : 'Votre Code de Liaison Cloud :'}</span>
                </p>
                <p className="text-[11px] text-indigo-900/80 leading-relaxed">
                  {language === 'ar'
                    ? 'أدخل نفس الكود على هاتفك وعلى حاسوبك، لتنتقل جميع الأقسام والنقاط والتلاميذ بينهما لحظياً دون الحاجة لكلمات مرور.'
                    : 'Utilisez simplement ce même code sur votre téléphone et sur votre PC pour que vos deux écrans soient connectés en temps réel.'}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  {language === 'ar' ? 'كود المزامنة (Code de Synchronisation) *' : 'Code de Synchronisation Cloud *'}
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Key className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={inputKey}
                      onChange={(e) => setInputKey(e.target.value.toUpperCase())}
                      placeholder="AGGOUN-2026"
                      className="w-full pl-9 pr-3 py-2.5 text-sm border-2 border-indigo-300 rounded-xl focus:ring-2 focus:ring-indigo-500 font-mono font-bold tracking-wider text-indigo-950 bg-indigo-50/30"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 transition cursor-pointer flex items-center gap-1.5 shrink-0"
                    title="Copier le code"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? (language === 'ar' ? 'تم النسخ' : 'Copié') : (language === 'ar' ? 'نسخ' : 'Copier')}</span>
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  {language === 'ar'
                    ? 'يمكنك ترك الكود كما هو (AGGOUN-2026) أو تغييره إلى أي رمز تفضله.'
                    : 'Vous pouvez laisser le code par défaut (AGGOUN-2026) ou écrire le vôtre.'}
                </p>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black text-sm rounded-xl shadow-lg transition cursor-pointer flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{language === 'ar' ? 'جارٍ الاتصال بالسحابة...' : 'Connexion au Cloud...'}</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-emerald-300" />
                    <span>
                      {language === 'ar'
                        ? 'تفعيل المزامنة اللحظية الآن'
                        : 'Activer la Synchronisation en Direct'}
                    </span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
