import React, { useState } from 'react';
import {
  GraduationCap,
  Lock,
  Mail,
  User,
  School,
  ArrowRight,
  CheckCircle2,
  X
} from 'lucide-react';
import { Teacher } from '../../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacher: Teacher;
  onLoginSuccess: (email: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  teacher,
  onLoginSuccess,
}) => {
  const [email, setEmail] = useState(teacher.email);
  const [password, setPassword] = useState('prof123456');
  const [isDemoFill, setIsDemoFill] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLoginSuccess(email);
    onClose();
  };

  const handleUseDemo = () => {
    setEmail(teacher.email);
    setPassword('prof123456');
    setIsDemoFill(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-100">
        {/* En-tête */}
        <div className="bg-linear-to-r from-indigo-900 to-slate-900 p-6 text-white text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-slate-300 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/60 backdrop-blur-md flex items-center justify-center mx-auto mb-3 border border-white/20">
            <GraduationCap className="w-7 h-7 text-white" />
          </div>
          <h3 className="text-xl font-black">Espace Enseignant ProfPilot</h3>
          <p className="text-xs text-indigo-200 mt-1">
            Connexion sécurisée pour la gestion de vos classes
          </p>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Email académique
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Mot de passe
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Raccourci Démo */}
          <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl text-xs flex items-center justify-between">
            <div>
              <span className="font-bold text-indigo-900 block">Compte Enseignant Démo</span>
              <span className="text-[11px] text-indigo-700">{teacher.name}</span>
            </div>
            <button
              type="button"
              onClick={handleUseDemo}
              className="px-2.5 py-1 bg-white text-indigo-700 font-bold rounded-lg border border-indigo-300 hover:bg-indigo-50 cursor-pointer shadow-2xs"
            >
              Pré-remplir
            </button>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-600/25 transition cursor-pointer"
            >
              <span>Se connecter</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <p className="text-[11px] text-center text-slate-400">
            Toutes les données restent sauvegardées localement et chiffrées dans votre session.
          </p>
        </form>
      </div>
    </div>
  );
};
