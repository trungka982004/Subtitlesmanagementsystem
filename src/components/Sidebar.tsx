import { Upload, FileText, BarChart3, Settings, LogOut, User, Languages } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  activeTab: 'upload' | 'manage' | 'quick-translate' | 'analysis' | 'settings';
  onTabChange: (tab: 'upload' | 'manage' | 'quick-translate' | 'analysis' | 'settings') => void;
}

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const { user, logout } = useAuth();
  const menuItems = [
    { id: 'upload' as const, label: 'Upload', icon: Upload },
    { id: 'manage' as const, label: 'Manage & Translate', icon: FileText },
    { id: 'quick-translate' as const, label: 'Quick Translate', icon: Languages },
    { id: 'analysis' as const, label: 'Analysis', icon: BarChart3 },

    { id: 'settings' as const, label: 'Settings', icon: Settings },
  ];

  return (
    <div
      className="w-64 h-full bg-slate-900 dark:bg-slate-950 text-white flex flex-col shrink-0 transition-all duration-300 relative z-20 shadow-xl border-r border-transparent dark:border-white/10"
      style={{ minWidth: '250px' }}
    >
      {/* User Profile */}
      {/* User Profile */}
      <div className="p-6 bg-slate-950 dark:bg-slate-950/50 flex flex-col gap-4 border-b border-white/10 dark:border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white shadow-md">
            <User className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm text-white truncate">{user?.name || 'Admin'}</p>
            <p className="text-xs text-slate-400 truncate" title={user?.email}>{user?.email || 'admin@example.com'}</p>
          </div>
        </div>

        <button
          onClick={logout}
          className="flex items-center justify-center gap-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 py-2 px-4 rounded-lg transition-all w-fit shadow-md"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map(item => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`w-full flex items-center gap-3 px-6 py-3 text-sm font-medium transition-all duration-200 rounded-md ${activeTab === item.id
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-white/10 hover:translate-x-1'
              }`}
          >
            <item.icon className={`w-4 h-4 ${activeTab === item.id ? 'text-white' : 'text-slate-400'}`} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Logout */}

    </div>
  );
}