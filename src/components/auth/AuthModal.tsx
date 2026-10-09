import React, { useState } from 'react';
import {
  GraduationCap,
  Lock,
  Mail,
  User,
  School,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  KeyRound,
  X,
  Layers,
  FileSpreadsheet,
  Loader2
} from 'lucide-react';
import { Teacher } from '../../types';
import { useLanguage } from '../../i18n/LanguageContext';
import { verifyCloudCredentials } from '../../services/firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacher: Teacher;
  onLoginSuccess: (email: string, syncKey?: string) => void;
  onCreateAccount: (newTeacher: Teacher, startBlank: boolean, passcode?: string) => void;
  onLoadDemo: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  teacher,
  onLoginSuccess,
  onCreateAccount,
  onLoadDemo,
}) => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const [mode, setMode] = useState<'create' | 'login'>('login');

  // Champs de création de compte
  const [name, setName] = useState('');
  const [school, setSchool] = useState('');
  const [subject, setSubject] = useState('Mathématiques');
  const [email, setEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [startBlank, setStartBlank] = useState(true);

  // Champs de connexion
  const [loginEmail, setLoginEmail] = useState(teacher.email || '');
  const [syncKeyInput, setSyncKeyInput] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // États de validation
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!name.trim()) return;

    const newTeacher: Teacher = {
      id: `teacher-${Date.now()}`,
      name: name.trim(),
      email: email.trim() || `${name.trim().toLowerCase().replace(/\s+/g, '.')}@education.dz`,
      school: school.trim() || 'Établissement Scolaire',
      subject: subject.trim() || 'Enseignement',
    };

    onCreateAccount(newTeacher, startBlank, createPassword.trim() || undefined);
    onClose();
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);

    const cleanKey = syncKeyInput.trim();

    if (!cleanKey) {
      setAuthError(
        isAr
          ? 'يرجى إدخال رمز المزامنة السحابي (Clé Cloud) للتحقق من حسابك.'
          : 'Veuillez saisir votre Clé Cloud pour vérifier votre compte.'
      );
      return;
    }

    setIsLoading(true);

    try {
      // Vérification rigoureuse dans Firestore
      const res = await verifyCloudCredentials(cleanKey, loginEmail, loginPassword);

      if (!res.success) {
        setIsLoading(false);
        setAuthError(res.error || (isAr ? 'رمز المزامنة غير صالح أو الحساب غير موجود' : 'Clé Cloud ou mot de passe invalide.'));
        return;
      }

      setAuthSuccess(
        isAr
          ? `تم التحقق بنجاح من حساب ${res.workspace?.teacher?.name || cleanKey} !`
          : `Connexion réussie au compte de ${res.workspace?.teacher?.name || cleanKey} !`
      );

      setTimeout(() => {
        setIsLoading(false);
        onLoginSuccess(loginEmail, cleanKey);
        onClose();
      }, 700);
    } catch (err) {
      setIsLoading(false);
      setAuthError(
        isAr
          ? 'تعذر الاتصال بقاعدة البيانات السحابية. يرجى المحاولة لاحقاً.'
          : 'Erreur lors de la vérification. Vérifiez votre connexion Internet.'
      );
    }
  };

  const handleDemoClick = () => {
    onLoadDemo();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-100 my-8">
        {/* En-tête avec bascule Inscription / Connexion */}
        <div className="bg-linear-to-r from-indigo-900 via-indigo-800 to-slate-900 p-6 text-white text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/30 backdrop-blur-md flex items-center justify-center mx-auto mb-3 border border-indigo-400/30 shadow-inner">
            <GraduationCap className="w-8 h-8 text-indigo-200" />
          </div>
          
          <h3 className="text-xl font-black">
            {isAr ? 'منصة الأستاذ ProfPilot' : 'Espace Enseignant ProfPilot'}
          </h3>
          <p className="text-xs text-indigo-200 mt-1 max-w-sm mx-auto">
            {isAr 
              ? 'تسجيل الدخول الآمن للأستاذ أو إنشاء حساب جديد'
              : 'Connexion sécurisée ou création d’un nouvel espace enseignant'}
          </p>

          {/* Onglets Connexion / Créer un compte */}
          <div className="flex bg-white/10 p-1 rounded-xl mt-5 max-w-xs mx-auto border border-white/15">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setAuthError(null);
              }}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition cursor-pointer ${
                mode === 'login'
                  ? 'bg-white text-indigo-950 shadow-xs'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              {isAr ? '🔑 تسجيل الدخول' : '🔑 Connexion'}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('create');
                setAuthError(null);
              }}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition cursor-pointer ${
                mode === 'create'
                  ? 'bg-white text-indigo-950 shadow-xs'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              {isAr ? '✨ إنشاء حساب جديد' : '✨ Nouveau Compte'}
            </button>
          </div>
        </div>

        {/* Message d'erreur s'il y a lieu */}
        {authError && (
          <div className="m-6 mb-0 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-xs text-rose-800">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold block mb-0.5">
                {isAr ? 'فشل تسجيل الدخول' : 'Échec de connexion'}
              </span>
              <p>{authError}</p>
            </div>
          </div>
        )}

        {/* Message de succès */}
        {authSuccess && (
          <div className="m-6 mb-0 p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-2.5 text-xs text-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p className="font-bold">{authSuccess}</p>
          </div>
        )}

        {/* Corps du Formulaire */}
        {mode === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="p-6 space-y-4">
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs text-slate-600">
              <p>
                {isAr
                  ? '🔒 أدخل بريدك ورمز المزامنة السحابي (Clé Cloud) للتحقق واسترجاع أقسامك المحفوظة.'
                  : '🔒 Saisissez votre Clé Cloud et votre email pour vérifier vos droits et ouvrir vos classes.'}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                {isAr ? 'رمز المزامنة السحابية (Clé Cloud) *' : 'Clé Cloud Personnelle *'}
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="Ex: AGGOUN-2026"
                  value={syncKeyInput}
                  onChange={(e) => {
                    setSyncKeyInput(e.target.value);
                    setAuthError(null);
                  }}
                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white uppercase font-mono font-bold"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {isAr
                  ? 'يتم التحقق من وجود هذا الرمز مباشرة على الخادم السحابي.'
                  : 'La clé sera vérifiée en direct sur le serveur Cloud avant de vous connecter.'}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                {isAr ? 'البريد الإلكتروني للأستاذ' : 'Email de l’enseignant'}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => {
                    setLoginEmail(e.target.value);
                    setAuthError(null);
                  }}
                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                {isAr ? 'كلمة المرور / الرمز السري (إن وُجد)' : 'Mot de passe / Code secret (Optionnel)'}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => {
                    setLoginPassword(e.target.value);
                    setAuthError(null);
                  }}
                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-sm shadow-md shadow-indigo-600/25 transition cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{isAr ? 'جاري التحقق من الخادم...' : 'Vérification sur le Cloud...'}</span>
                  </>
                ) : (
                  <>
                    <span>{isAr ? 'تسجيل الدخول والتحقق' : 'Se Connecter & Vérifier'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                {isAr ? 'ليس لديك حساب بعد ؟' : 'Pas encore de compte ?'}
              </span>
              <button
                type="button"
                onClick={() => {
                  setMode('create');
                  setAuthError(null);
                }}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
              >
                {isAr ? 'إنشاء حساب جديد' : 'Créer un compte'}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
            <div className="bg-indigo-50/60 p-3 rounded-2xl border border-indigo-100 text-xs text-indigo-900 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <p>
                {isAr
                  ? 'قم بإنشاء حسابك الشخصي في ثوانٍ. سيتم توليد رمز مزامنة فريد وخاص بك لحفظ بياناتك.'
                  : 'Créez votre compte personnel. Une Clé Cloud unique vous sera attribuée pour sécuriser et synchroniser vos classes.'}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                {isAr ? 'اسم ولقب الأستاذ *' : 'Nom & Prénom de l’Enseignant *'}
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder={isAr ? 'مثال: أ. كريم بن علي' : 'Ex: M. Karim BENALI'}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  {isAr ? 'المؤسسة التعليمية' : 'Établissement (CEM / Lycée)'}
                </label>
                <div className="relative">
                  <School className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder={isAr ? 'مثال: متوسطة الشهداء' : 'Ex: Lycée Ibn Khaldoun'}
                    value={school}
                    onChange={(e) => setSchool(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  {isAr ? 'المادة التعليمية' : 'Matière enseignée'}
                </label>
                <div className="relative">
                  <BookOpen className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder={isAr ? 'مثال: رياضيات / علوم' : 'Ex: Mathématiques'}
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  {isAr ? 'البريد الإلكتروني' : 'Email académique'}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    placeholder="prof@education.dz"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  {isAr ? 'كلمة المرور / الرمز السري' : 'Mot de passe secret'}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    placeholder="Ex: 123456"
                    value={createPassword}
                    onChange={(e) => setCreatePassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Choix : Espace Vierge ou Avec Exemples */}
            <div className="pt-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                {isAr ? 'تهيئة فضاء العمل الأولي :' : 'Contenu de départ :'}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setStartBlank(true)}
                  className={`p-3 rounded-2xl border text-left flex flex-col gap-1 transition cursor-pointer ${
                    startBlank
                      ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="font-bold text-xs flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-indigo-600" />
                    <span>{isAr ? 'فضاء عمل جديد (فارغ)' : 'Espace Vierge'}</span>
                  </span>
                  <span className="text-[11px] text-slate-500 leading-tight">
                    {isAr ? 'البدء مباشرة بإضافة أقسامك الخاصة' : 'Prêt pour vos propres classes'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setStartBlank(false)}
                  className={`p-3 rounded-2xl border text-left flex flex-col gap-1 transition cursor-pointer ${
                    !startBlank
                      ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="font-bold text-xs flex items-center gap-1.5">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <span>{isAr ? 'بيانات توضيحية' : 'Avec Exemples'}</span>
                  </span>
                  <span className="text-[11px] text-slate-500 leading-tight">
                    {isAr ? 'أقسام وتلاميذ وهمية للتجربة' : 'Classes modèles pour tester'}
                  </span>
                </button>
              </div>
            </div>

            <div className="pt-3">
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-600/25 transition cursor-pointer"
              >
                <span>{isAr ? '🚀 إنشاء فضاء الأستاذ والبدء الآن' : '🚀 Créer mon Espace Enseignant'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
