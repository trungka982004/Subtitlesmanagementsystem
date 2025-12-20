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
    <div className="w-64 bg-deep-dark border-r border-gray-800 min-h-screen flex flex-col" style={{ backgroundColor: '#020617' }}>
      {/* User Profile */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-white font-medium truncate w-32">{user?.name || 'Admin User'}</p>
            <p className="text-xs text-gray-400 truncate w-32">{user?.email || 'admin@example.com'}</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map(item => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === item.id
              ? 'bg-blue-600 text-white'
              : 'text-gray-300 hover:bg-gray-800'
              }`}
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-800">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-gray-800/50 rounded-lg transition-colors group"
        >
          <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}