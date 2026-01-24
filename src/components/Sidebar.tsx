import { Upload, FileText, BarChart3, Settings, Languages, LogOut, User as UserIcon, Mail } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  activeTab: 'upload' | 'manage' | 'quick-translate' | 'analysis' | 'settings';
  onTabChange: (tab: 'upload' | 'manage' | 'quick-translate' | 'analysis' | 'settings') => void;
}

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const { t } = useTranslation();
  const { user, logout } = useAuth();

  const menuItems = [
    { id: 'upload' as const, label: t('uploadSubtitle'), icon: Upload },
    { id: 'manage' as const, label: t('manageTranslate'), icon: FileText },
    { id: 'quick-translate' as const, label: t('quickTranslate'), icon: Languages },
    { id: 'analysis' as const, label: t('analysis'), icon: BarChart3 },
    { id: 'settings' as const, label: t('settings'), icon: Settings },
  ];

  return (
    <div
      className="w-full h-full bg-slate-900 dark:bg-slate-950 text-white flex flex-col transition-all duration-300 relative z-20 shadow-xl border-r border-transparent dark:border-white/10"
    >
      {/* Brand Logo & Profile Section */}
      <div className="p-8 flex flex-col gap-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Languages className="w-6 h-6 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-lg tracking-tighter leading-none">{t('brandName')}</span>
            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.2em] mt-1">{t('brandSubtitle')}</span>
          </div>
        </div>

        {/* Separated User Info Boxes */}
        <div className="flex flex-col gap-2.5">
          {/* Username Box */}
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm group hover:bg-white/10 transition-colors">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0">
              <UserIcon className="w-4 h-4 text-blue-400" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{t('username')}</span>
              <span className="text-xs font-bold text-slate-100 truncate">{user?.name || t('userAdmin')}</span>
            </div>
          </div>

          {/* Email Box */}
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm group hover:bg-white/10 transition-colors">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 flex items-center justify-center shrink-0">
              <Mail className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{t('email')}</span>
              <span className="text-xs font-bold text-slate-100 truncate">{user?.email || 'admin@vstudio.com'}</span>
            </div>
          </div>
        </div>

        <button
          onClick={logout}
          className="sidebar-logout-button flex items-center gap-3 w-full px-6 py-4 rounded-full transition-all duration-300 group mt-2"
        >
          <LogOut className="icon w-5 h-5 transition-all duration-300" />
          <span className="label text-sm font-semibold tracking-tight transition-colors duration-300">{t('logout')}</span>
        </button>
      </div>

      <nav className="flex-1 p-4 space-y-3 overflow-y-auto">
        {menuItems.map(item => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`sidebar-nav-button group w-full flex items-center gap-4 px-6 py-4 text-sm font-semibold rounded-full transition-all duration-300 ${activeTab === item.id ? 'active' : ''}`}
          >
            <item.icon className="icon w-5 h-5 transition-all duration-300" />
            <span className="label tracking-tight transition-colors duration-300">{item.label}</span>
          </button>
        ))}
      </nav>

    </div>
  );
}