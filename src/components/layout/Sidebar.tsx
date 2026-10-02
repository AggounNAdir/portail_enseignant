import React from 'react';
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  FileSpreadsheet,
  ClipboardCheck,
  Award,
  BarChart3,
  Settings,
  Database,
  Download,
  Laptop
} from 'lucide-react';
import { NavTab } from '../../types';
import { useLanguage } from '../../i18n/LanguageContext';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  classesCount: number;
  studentsCount: number;
  assessmentsCount: number;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onExportJSON: () => void;
  onOpenInstallPc?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  classesCount,
  studentsCount,
  assessmentsCount,
  isOpenMobile,
  onCloseMobile,
  onExportJSON,
  onOpenInstallPc,
}) => {
  const { t, isRTL } = useLanguage();

  const navItems: {
    id: NavTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number | string;
  }[] = [
    {
      id: 'dashboard',
      label: t.dashboard,
      icon: LayoutDashboard,
    },
    {
      id: 'classes',
      label: t.classes,
      icon: GraduationCap,
      badge: classesCount,
    },
    {
      id: 'students',
      label: t.students,
      icon: Users,
      badge: studentsCount,
    },
    {
      id: 'grades',
      label: t.grades,
      icon: FileSpreadsheet,
      badge: assessmentsCount,
    },
    {
      id: 'attendance',
      label: t.attendance,
      icon: ClipboardCheck,
    },
    {
      id: 'reports',
      label: t.reportCards,
      icon: Award,
    },
    {
      id: 'analytics',
      label: t.analytics,
      icon: BarChart3,
    },
    {
      id: 'settings',
      label: t.settings,
      icon: Settings,
    },
  ];

  const handleItemClick = (tab: NavTab) => {
    onSelectTab(tab);
    onCloseMobile();
  };

  const content = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200">
      {/* Liste des onglets */}
      <div className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          Menu Principal
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleItemClick(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left font-medium text-sm transition-all cursor-pointer group ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon
                  className={`w-5 h-5 shrink-0 transition-colors ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-600'
                  }`}
                />
                <div className="truncate">
                  <span className="block truncate text-sm font-semibold">{item.label}</span>
                </div>
              </div>
              {item.badge !== undefined && (
                <span
                  className={`${isRTL ? 'mr-2' : 'ml-2'} shrink-0 px-2 py-0.5 text-xs font-bold rounded-full ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 text-slate-600 group-hover:bg-indigo-50 group-hover:text-indigo-700'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bas de sidebar : Sauvegarde rapide & Installation */}
      <div className="p-3 border-t border-slate-200 bg-slate-50/70 space-y-2">
        {onOpenInstallPc && (
          <button
            onClick={onOpenInstallPc}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl shadow-2xs transition-colors cursor-pointer"
          >
            <Laptop className="w-3.5 h-3.5 text-indigo-600" />
            <span>Installer sur PC</span>
          </button>
        )}

        <button
          onClick={onExportJSON}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg shadow-2xs transition-colors cursor-pointer"
          title="Télécharger une sauvegarde complète de toutes vos données"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" />
          <span>Exporter Sauvegarde (JSON)</span>
        </button>
        <p className="mt-2 text-center text-[10px] text-slate-400">
          ProfPilot v1.0 • Données locales sécurisées
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 lg:w-72 shrink-0 sticky top-16 h-[calc(100vh-4rem)] no-print">
        {content}
      </aside>

      {/* Mobile Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 md:hidden no-print">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="fixed inset-y-0 left-0 max-w-xs w-full bg-white shadow-xl z-10">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
