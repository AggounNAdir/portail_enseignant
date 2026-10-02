import React, { useState } from 'react';
import {
  Cloud,
  X,
  CheckCircle,
  AlertCircle,
  Laptop,
  Smartphone,
  Lock,
  Mail,
  ArrowRight,
  LogOut,
  RefreshCw,
  Zap,
  ShieldCheck
} from 'lucide-react';
import { User } from 'firebase/auth';
import { loginWithEmail, registerWithEmail, logoutCloud } from '../../services/firebase';
import { useLanguage } from '../../i18n/LanguageContext';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  cloudUser: User | null;
  onSyncSuccess: (user: User) => void;
  onLogoutSuccess: () => void;
  defaultEmail?: string;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({
  isOpen,
  onClose,
  cloudUser,
  onSyncSuccess,
  onLogoutSuccess,
  defaultEmail = 'aggounnadir8@gmail.com',
}) => {
  const { language } = useLanguage();
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (password.length < 6) {
      setErrorMsg(
        language === 'ar'
          ? 'يجب أن تكون كلمة المرور 6 أحرف على الأقل.'
          : 'Le mot de passe doit comporter au moins 6 caractères.'
      );
      return;
    }

    setLoading(true);
    try {
      let user: User;
      if (isRegisterMode) {
        user = await registerWithEmail(email, password);
        setSuccessMsg(
          language === 'ar'
            ? 'تم إنشاء حساب المزامنة وتفعيله بنجاح!'
            : 'Compte Cloud créé et synchronisation activée !'
        );
      } else {
        try {
          user = await loginWithEmail(email, password);
          setSuccessMsg(
            language === 'ar'
              ? 'تم تسجيل الدخول وتفعيل المزامنة المباشرة بنجاح!'
              : 'Connexion réussie ! Vos deux appareils sont maintenant synchronisés.'
          );
        } catch (loginErr: any) {
          // Si l'utilisateur n'existe pas encore, on le crée automatiquement
          if (loginErr?.code === 'auth/user-not-found' || loginErr?.code === 'auth/invalid-credential') {
            try {
              user = await registerWithEmail(email, password);
              setSuccessMsg(
                language === 'ar'
                  ? 'تم إنشاء الحساب وتفعيل المزامنة الفورية بنجاح!'
                  : 'Compte activé ! Synchronisation en temps réel prête.'
              );
            } catch (regErr: any) {
              throw loginErr;
            }
          } else {
            throw loginErr;
          }
        }
      }

      onSyncSuccess(user);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error(err);
      if (err?.code === 'auth/wrong-password' || err?.code === 'auth/invalid-credential') {
        setErrorMsg(
          language === 'ar'
            ? 'كلمة المرور غير صحيحة، يرجى التحقق منها.'
            : 'Mot de passe incorrect pour cet email.'
        );
      } else if (err?.code === 'auth/email-already-in-use') {
        setIsRegisterMode(false);
        setErrorMsg(
          language === 'ar'
            ? 'هذا الحساب موجود بالفعل، يرجى إدخال كلمة المرور لتسجيل الدخول.'
            : 'Ce compte existe déjà. Entrez votre mot de passe pour vous connecter.'
        );
      } else {
        setErrorMsg(
          language === 'ar'
            ? 'تعذر الاتصال بخادم المزامنة. تأكد من اتصالك بالإنترنت.'
            : err?.message || 'Erreur lors de la connexion.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutCloud();
      onLogoutSuccess();
      setSuccessMsg(
        language === 'ar' ? 'تم قطع الاتصال بالمزامنة السحابية.' : 'Déconnecté de la synchronisation Cloud.'
      );
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Erreur de déconnexion');
    }
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
                <span>{language === 'ar' ? 'المزامنة الفورية (هاتف ⇄ حاسوب)' : 'Synchronisation Temps Réel (Téléphone ⇄ PC)'}</span>
              </h3>
              <p className="text-xs text-indigo-200">
                {language === 'ar'
                  ? 'كل عملية تجريها على الهاتف تظهر مباشرة على الحاسوب والعكس بالعكس'
                  : 'Chaque saisie faite sur votre téléphone apparaît instantanément sur votre PC et vice-versa.'}
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
                {language === 'ar' ? 'مباشر (Cloud)' : 'En Direct'}
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
          {cloudUser ? (
            /* Utilisateur déjà connecté */
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-extrabold text-emerald-950">
                    {language === 'ar' ? 'المزامنة السحابية الفورية مفعلة بنجاح !' : 'Synchronisation Temps Réel Active !'}
                  </h4>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    {language === 'ar'
                      ? `أنت متصل بالبريد : ${cloudUser.email}. افتح التطبيق في حاسوبك وسجل الدخول بنفس هذا البريد، وستعمل المزامنة الفورية تلقائياً.`
                      : `Connecté avec l'adresse : ${cloudUser.email}. Connectez-vous avec ce même compte sur votre PC pour que tout se synchronise en direct.`}
                  </p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-2">
                <p className="font-bold text-slate-800 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <span>{language === 'ar' ? 'كيف تتأكد أن حاسوبك متزامن ؟' : 'Comment lier votre PC ?'}</span>
                </p>
                <ol className="list-decimal list-inside space-y-1 text-slate-600">
                  <li>{language === 'ar' ? 'افتح التطبيق على حاسوبك.' : 'Ouvrez ProfPilot sur votre PC.'}</li>
                  <li>
                    {language === 'ar'
                      ? `اضغط على زر السحابة في الأعلى وسجل الدخول بـ : ${cloudUser.email}.`
                      : `Cliquez sur le bouton Cloud en haut et connectez-vous avec : ${cloudUser.email}.`}
                  </li>
                  <li>
                    {language === 'ar'
                      ? 'مبروك! أي تلميذ أو نقطة أو غياب تدخله هنا سيظهر في الحاسوب خلال أجزاء من الثانية.'
                      : 'Félicitations ! Chaque note, élève ou présence saisie apparaîtra en moins d’une seconde sur l’autre écran.'}
                  </li>
                </ol>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-4 py-2.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{language === 'ar' ? 'قطع الاتصال' : 'Se déconnecter'}</span>
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
            /* Formulaire de connexion / création */
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="text-xs text-slate-600 bg-indigo-50/70 p-3.5 rounded-2xl border border-indigo-100">
                <p className="font-bold text-indigo-950 mb-0.5">
                  {language === 'ar'
                    ? '💡 اختر بريدك الإلكتروني وكلمة مرور لربط أجهزتك :'
                    : '💡 Entrez vos identifiants pour lier votre Téléphone et votre PC :'}
                </p>
                <p className="text-[11px] text-indigo-900/80">
                  {language === 'ar'
                    ? 'أدخل نفس البريد وكلمة المرور في الهاتف والحاسوب، وستنتقل البيانات بينهما في نفس اللحظة.'
                    : 'Utilisez simplement les mêmes identifiants sur vos 2 appareils pour une synchronisation automatique bidirectionnelle.'}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  {language === 'ar' ? 'البريد الإلكتروني للأستاذ *' : 'Votre Email *'}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="aggounnadir8@gmail.com"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  {language === 'ar' ? 'كلمة المرور للربط السحابي *' : 'Mot de passe de synchronisation *'}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Au moins 6 caractères"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  {language === 'ar'
                    ? 'اختر كلمة مرور بسيطة يمكنك تذكرها عند فتح الحاسوب (6 أحرف فأكثر).'
                    : 'Choisissez un mot de passe facile à retenir pour vous connecter sur votre PC.'}
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
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black text-sm rounded-xl shadow-lg transition cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{language === 'ar' ? 'جارٍ الاتصال...' : 'Connexion en cours...'}</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>
                      {isRegisterMode
                        ? (language === 'ar' ? 'إنشاء حساب وتفعيل المزامنة' : 'Créer mon compte et synchroniser')
                        : (language === 'ar' ? 'تفعيل المزامنة الفورية الآن' : 'Activer la synchronisation en direct')}
                    </span>
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setIsRegisterMode(!isRegisterMode)}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-bold hover:underline cursor-pointer"
                >
                  {isRegisterMode
                    ? (language === 'ar' ? 'لديك حساب بالفعل ؟ تسجيل الدخول' : 'Vous avez déjà un compte ? Se connecter')
                    : (language === 'ar' ? 'أول استخدام ؟ إنشاء حساب جديد' : 'Première utilisation ? Créer un compte')}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
