import React from 'react';
import { 
  GraduationCap, 
  Menu, 
  X, 
  UserCircle, 
  LogOut, 
  ClipboardCheck, 
  PlusCircle, 
  BookOpen,
  School,
  Globe,
  Cloud,
  Laptop
} from 'lucide-react';
import { User } from 'firebase/auth';
import { Teacher, Classroom, NavTab } from '../../types';
import { useLanguage } from '../../i18n/LanguageContext';

interface NavbarProps {
  teacher: Teacher;
  classes: Classroom[];
  selectedClassId: string;
  onSelectClassId: (id: string) => void;
  onNavigate: (tab: NavTab) => void;
  onOpenTeacherModal: () => void;
  onLogout: () => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  isSyncActive?: boolean;
  syncKey?: string;
  onOpenCloudSync?: () => void;
  onOpenInstallPc?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  teacher,
  classes,
  selectedClassId,
  onSelectClassId,
  onNavigate,
  onOpenTeacherModal,
  onLogout,
  mobileMenuOpen,
  setMobileMenuOpen,
  isSyncActive = false,
  syncKey = '',
  onOpenCloudSync,
  onOpenInstallPc,
}) => {
  const { language, setLanguage, t } = useLanguage();
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo et Marque */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-hidden"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <div 
              onClick={() => onNavigate('dashboard')}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-indigo-600 to-blue-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <span className="font-extrabold text-xl tracking-tight text-slate-900 flex items-center gap-1.5">
                  Prof<span className="text-indigo-600">Pilot</span>
                  <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Pro
                  </span>
                </span>
                <p className="text-xs text-slate-500 hidden sm:block leading-none">
                  Espace Enseignant
                </p>
              </div>
            </div>
          </div>

          {/* Sélecteur de classe globale */}
          <div className="hidden lg:flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Classe active :
            </span>
            <select
              value={selectedClassId}
              onChange={(e) => onSelectClassId(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-800 text-sm font-medium rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all cursor-pointer shadow-2xs"
            >
              <option value="all">Toutes les classes ({classes.length})</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} — {cls.subject} ({cls.level})
                </option>
              ))}
            </select>
          </div>

          {/* Raccourcis d'actions rapides & profil enseignant */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Bouton de Synchronisation Temps Réel Téléphone ⇄ PC */}
            {onOpenCloudSync && (
              <button
                onClick={onOpenCloudSync}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-xl transition shadow-2xs cursor-pointer border ${
                  isSyncActive
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                    : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                }`}
                title={
                  isSyncActive
                    ? `Synchronisation en direct active (${syncKey})`
                    : 'Lier téléphone et PC en direct'
                }
              >
                <div className="relative flex items-center justify-center">
                  <Cloud className="w-4 h-4 text-indigo-600" />
                  {isSyncActive && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 absolute -top-0.5 -right-0.5 ring-1.5 ring-white" />
                  )}
                </div>
                <span className="text-[11px] sm:text-xs">
                  {isSyncActive
                    ? (language === 'ar' ? `🟢 مباشر (${syncKey})` : `🟢 En direct (${syncKey})`)
                    : (language === 'ar' ? '☁️ ربط بالحاسوب' : '☁️ Lier au PC')}
                </span>
              </button>
            )}

            <button
              onClick={() => onNavigate('attendance')}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors shadow-2xs cursor-pointer"
              title="Faire l'appel de cours"
            >
              <ClipboardCheck className="w-4 h-4 text-emerald-600" />
              <span>Faire l'appel</span>
            </button>

            <button
              onClick={() => onNavigate('grades')}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors shadow-2xs cursor-pointer"
              title="Saisir des notes"
            >
              <PlusCircle className="w-4 h-4 text-indigo-600" />
              <span>Saisir notes</span>
            </button>

            {/* Sélecteur de langue */}
            <button
              onClick={() => setLanguage(language === 'fr' ? 'ar' : 'fr')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-indigo-300 text-slate-700 transition shadow-2xs cursor-pointer"
              title={language === 'fr' ? 'Changer en العربية' : 'Passer en Français'}
            >
              <Globe className="w-3.5 h-3.5 text-indigo-600" />
              <span>{language === 'fr' ? '🇩🇿 العربية' : '🇫🇷 Français'}</span>
            </button>

            {/* Bouton d'installation sur PC */}
            {onOpenInstallPc && (
              <button
                onClick={onOpenInstallPc}
                className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:border-indigo-300 transition shadow-2xs cursor-pointer"
                title="Installer ProfPilot sur ce PC"
              >
                <Laptop className="w-3.5 h-3.5 text-indigo-600" />
                <span>{language === 'ar' ? 'تثبيت على PC' : 'Installer sur PC'}</span>
              </button>
            )}

            <div className="h-6 w-px bg-slate-200 hidden sm:block mx-1" />

            {/* Profil enseignant */}
            <div 
              onClick={onOpenTeacherModal}
              className="flex items-center gap-2.5 p-1 sm:px-2 sm:py-1 rounded-xl hover:bg-slate-100 cursor-pointer transition-colors border border-transparent hover:border-slate-200"
              title="Voir mon profil"
            >
              {teacher.avatarUrl ? (
                <img
                  src={teacher.avatarUrl}
                  alt={teacher.name}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-indigo-500/20"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                  {teacher.name.charAt(0)}
                </div>
              )}
              <div className="hidden md:block text-left">
                <p className="text-xs font-bold text-slate-800 leading-tight">
                  {teacher.name}
                </p>
                <p className="text-[11px] text-slate-500 flex items-center gap-1">
                  <School className="w-3 h-3 text-slate-400" />
                  {teacher.school.split(' ')[0]}...
                </p>
              </div>
            </div>

            {/* Bouton Déconnexion */}
            <button
              onClick={onLogout}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              title="Se déconnecter"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
