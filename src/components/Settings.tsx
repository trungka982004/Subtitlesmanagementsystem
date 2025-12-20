import { useState, useEffect, useRef } from 'react';
import { db } from '../services/db';
import { useAuth } from '../contexts/AuthContext';
import {
  User,
  Moon,
  Database,
  History as HistoryIcon,
  ChevronDown,
  Check,
  Eye,
  EyeOff,
  Trash2,
  Lock,
  Mail,
  X,
  Clock,
  Bell,
  Globe as GlobeIcon,
  Sun,
  Monitor,
  Camera
} from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { useTranslation } from '../hooks/useTranslation';

interface SettingsProps {
  onClose?: () => void;
  projectsCount?: number;
}

export function Settings({ onClose, projectsCount = 0 }: SettingsProps) {
  const { theme, setTheme, language, setLanguage } = useSettings();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<'account' | 'appearance' | 'system'>('account');

  // Translation settings


  // Account settings
  const [userName, setUserName] = useState<string>(user?.name || 'Admin User');
  const [userEmail, setUserEmail] = useState<string>(user?.email || 'admin@example.com');
  const [currentPassword, setCurrentPassword] = useState<string>(user?.lastKnownPassword || '');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');

  // Password visibility states
  const [showCurrentPassword, setShowCurrentPassword] = useState<boolean>(false);
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  // Avatar settings
  const [avatar, setAvatar] = useState<string | null>(localStorage.getItem('userAvatar'));
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert("File too large");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 200;
          const MAX_HEIGHT = 200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const base64String = canvas.toDataURL('image/jpeg', 0.8);
            setAvatar(base64String);
            localStorage.setItem('userAvatar', base64String);
          }
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };



  // System settings
  const [autoSave, setAutoSave] = useState<boolean>(true);
  const [backupEnabled, setBackupEnabled] = useState<boolean>(true);
  const [appVersion, setAppVersion] = useState<string>('1.0.0');
  const [showVersions, setShowVersions] = useState<boolean>(false);

  // Synchronize state when user context changes
  useEffect(() => {
    if (user) {
      setUserName(user.name || '');
      setUserEmail(user.email);
      if (user.lastKnownPassword) {
        setCurrentPassword(user.lastKnownPassword);
      }
    }
  }, [user]);

  const availableVersions = [
    { id: '1.0.0', date: '2025-01-20', note: 'Stable Release', current: true },
    { id: '0.9.8', date: '2025-01-10', note: 'Beta Release', current: false },
    { id: '0.9.5', date: '2024-12-25', note: 'Alpha Feature Test', current: false },
    { id: '0.9.0', date: '2024-12-01', note: 'Initial Prototype', current: false },
  ];

  const sections = [
    { id: 'account' as const, label: 'Tài khoản', icon: User },
    { id: 'appearance' as const, label: 'Giao diện', icon: Moon },
    { id: 'system' as const, label: 'Hệ thống', icon: Database },
  ];

  const handleReset = () => {
    if (activeSection === 'appearance') {
      setTheme('light');
      setLanguage('vi');
      setTheme('light');
      setLanguage('vi');
    } else if (activeSection === 'system') {
      setAutoSave(true);
      setBackupEnabled(true);
    }
  };

  const handleSave = () => {
    console.log('Settings saved:', {
      activeSection,
      account: { userName, userEmail },
      appearance: { theme, language },
      system: { autoSave, backupEnabled }
    });
    if (onClose) onClose();
  };



  const renderAccountSettings = () => (
    <div className="space-y-6">
      {/* Profile Section */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm">
        <h3 className="text-lg font-medium text-gray-900 dark:text-slate-200 mb-6">Thông tin cá nhân</h3>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Avatar Column */}
          <div className="flex flex-col items-center space-y-3 shrink-0">
            <div className="relative group w-24 h-24">
              <div
                className="w-full h-full rounded-full bg-gray-200 border-4 border-white dark:border-slate-800 shadow-md overflow-hidden flex items-center justify-center"
              >
                {avatar ? (
                  <img src={avatar} alt="User Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-12 h-12 text-gray-400" />
                )}
              </div>
            </div>

            <button
              onClick={triggerFileInput}
              className="p-2 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 rounded-full hover:bg-blue-50 dark:hover:bg-slate-700 hover:text-blue-600 transition-colors cursor-pointer border border-gray-200 dark:border-slate-700 shadow-sm"
              title="Thay đổi ảnh đại diện"
            >
              <Camera className="w-5 h-5" />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarUpload}
              accept="image/*"
              className="hidden"
            />
          </div>

          {/* Inputs Column */}
          <div className="flex-1 space-y-4 w-full">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Tên người dùng</label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-950 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Email</label>
              <input
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-950 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Password Section */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm">
        <h3 className="text-lg font-medium text-gray-900 dark:text-slate-200 mb-6">Đổi mật khẩu</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Mật khẩu hiện tại</label>
            <div className="relative w-full">
              <input
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full pl-4 pr-12 py-2.5 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-950 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="your password"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowCurrentPassword(!showCurrentPassword);
                }}
                className="absolute right-0 top-0 h-full px-3 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer z-50 rounded-r-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              >
                {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Mật khẩu mới</label>
              <div className="relative w-full">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-4 pr-12 py-2.5 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-950 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="your password"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowNewPassword(!showNewPassword);
                  }}
                  className="absolute right-0 top-0 h-full px-3 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer z-50 rounded-r-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                >
                  {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Xác nhận mật khẩu mới</label>
              <div className="relative w-full">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-4 pr-12 py-2.5 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-950 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="your password"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowConfirmPassword(!showConfirmPassword);
                  }}
                  className="absolute right-0 top-0 h-full px-3 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer z-50 rounded-r-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm focus:ring-4 focus:ring-blue-500/20">
              Cập nhật mật khẩu
            </button>
          </div>
        </div>
      </div>

      {/* Debug Info */}
      <div className="p-4 bg-gray-50 dark:bg-slate-950 rounded-lg border border-gray-100 dark:border-slate-800">
        <p className="text-[10px] text-gray-400 font-mono">
          DEBUG: UserID={user?.id} | Projects={projectsCount}
        </p>
      </div>

      {/* Delete Account Section */}
      <div className="p-6 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-xl shadow-sm">
        <h3 className="text-lg font-medium text-red-700 dark:text-red-400 mb-2">Xóa tài khoản</h3>
        <p className="text-gray-600 dark:text-slate-400 mb-4 text-sm">
          Khi bạn xóa tài khoản, tất cả dữ liệu liên quan sẽ bị xóa vĩnh viễn và không thể khôi phục. Hãy cân nhắc kỹ trước khi thực hiện.
        </p>
        <button className="px-6 py-2.5 bg-white border border-red-300 text-red-600 font-medium rounded-lg hover:bg-red-50 transition-colors focus:ring-4 focus:ring-red-500/10 dark:bg-transparent dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20">
          Xóa tài khoản
        </button>
      </div>
    </div>
  );

  const renderAppearanceSettings = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-gray-900 dark:text-slate-200">Chủ đề giao diện</h3>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setTheme('light')}
            className={`p-6 rounded-lg border-2 transition-all ${theme === 'light'
              ? 'border-blue-500 bg-blue-50 dark:bg-slate-800 dark:border-blue-500'
              : 'border-gray-200 bg-white dark:bg-slate-900 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600'
              }`}
          >
            <Sun className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
            <p className="text-gray-900 dark:text-white">Sáng</p>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Light Mode</p>
          </button>

          <button
            onClick={() => setTheme('dark')}
            className={`p-6 rounded-lg border-2 transition-all ${theme === 'dark'
              ? 'border-blue-500 bg-blue-50 dark:bg-slate-800 dark:border-blue-500'
              : 'border-gray-200 bg-white dark:bg-slate-900 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600'
              }`}
          >
            <Moon className="w-8 h-8 mx-auto mb-2 text-gray-700 dark:text-gray-200" />
            <p className="text-gray-900 dark:text-white">Tối</p>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Dark Mode</p>
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-gray-900 dark:text-white">Ngôn ngữ giao diện</h3>

        <div className="space-y-2">
          <button
            onClick={() => setLanguage('vi')}
            className={`w-full p-4 rounded-lg border-2 transition-all flex items-center justify-between ${language === 'vi'
              ? 'border-blue-500 bg-blue-50 dark:bg-slate-800 dark:border-blue-500'
              : 'border-gray-200 bg-white dark:bg-slate-900 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600'
              }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🇻🇳</span>
              <div className="text-left">
                <p className="text-gray-900 dark:text-white">Tiếng Việt</p>
                <p className="text-gray-500 dark:text-gray-400">Vietnamese</p>
              </div>
            </div>
            {language === 'vi' && (
              <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full" />
              </div>
            )}
          </button>

          <button
            onClick={() => setLanguage('en')}
            className={`w-full p-4 rounded-lg border-2 transition-all flex items-center justify-between ${language === 'en'
              ? 'border-blue-500 bg-blue-50 dark:bg-slate-800 dark:border-blue-500'
              : 'border-gray-200 bg-white dark:bg-slate-900 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600'
              }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🇬🇧</span>
              <div className="text-left">
                <p className="text-gray-900 dark:text-white">English</p>
                <p className="text-gray-500 dark:text-gray-400">English</p>
              </div>
            </div>
            {language === 'en' && (
              <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full" />
              </div>
            )}
          </button>

          <button
            onClick={() => setLanguage('zh')}
            className={`w-full p-4 rounded-lg border-2 transition-all flex items-center justify-between ${language === 'zh'
              ? 'border-blue-500 bg-blue-50 dark:bg-slate-800 dark:border-blue-500'
              : 'border-gray-200 bg-white dark:bg-slate-900 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600'
              }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🇨🇳</span>
              <div className="text-left">
                <p className="text-gray-900 dark:text-white">中文</p>
                <p className="text-gray-500 dark:text-gray-400">Chinese</p>
              </div>
            </div>
            {language === 'zh' && (
              <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full" />
              </div>
            )}
          </button>
        </div>
      </div>
    </div>
  );



  const renderSystemSettings = () => (
    <div className="space-y-6">
      {/* Automation Section */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm">
        <h3 className="text-lg font-medium text-gray-900 dark:text-slate-200 mb-6">Tự động hóa</h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-950 rounded-lg border border-gray-100 dark:border-slate-800">
            <div>
              <p className="font-medium text-gray-900 dark:text-slate-200">Tự động lưu</p>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Tự động lưu thay đổi khi chỉnh sửa phụ đề</p>
            </div>
            <button
              onClick={() => setAutoSave(!autoSave)}
              className={`relative w-12 h-6 rounded-full transition-colors ${autoSave ? 'bg-blue-600' : 'bg-gray-300 dark:bg-slate-700'
                }`}
            >
              <div
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${autoSave ? 'translate-x-6' : 'translate-x-0'
                  }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-950 rounded-lg border border-gray-100 dark:border-slate-800">
            <div>
              <p className="font-medium text-gray-900 dark:text-slate-200">Sao lưu tự động</p>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Tự động sao lưu dữ liệu mỗi ngày</p>
            </div>
            <button
              onClick={() => setBackupEnabled(!backupEnabled)}
              className={`relative w-12 h-6 rounded-full transition-colors ${backupEnabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-slate-700'
                }`}
            >
              <div
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${backupEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* System Info Section */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm">
        <h3 className="text-lg font-medium text-gray-900 dark:text-slate-200 mb-6">Thông tin hệ thống</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Version Manager - Full Width */}
          <div className="col-span-1 md:col-span-2 p-4 bg-gray-50 dark:bg-slate-950 rounded-lg border border-gray-100 dark:border-slate-800 transition-all">
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() => setShowVersions(!showVersions)}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                  <HistoryIcon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-slate-400">Phiên bản hiện tại</p>
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-bold text-gray-900 dark:text-slate-200">v{appVersion}</p>
                    <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full">
                      Stable
                    </span>
                  </div>
                </div>
              </div>
              <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${showVersions ? 'rotate-180' : ''}`} />
            </div>

            {/* Expanded Version List */}
            {showVersions && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-800 animate-in fade-in slide-in-from-top-2">
                <p className="text-xs font-semibold text-gray-400 uppercase mb-3">Lịch sử phiên bản</p>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                  {availableVersions.map((ver) => (
                    <button
                      key={ver.id}
                      onClick={() => {
                        setAppVersion(ver.id);
                        setShowVersions(false);
                      }}
                      className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${appVersion === ver.id
                        ? 'bg-white dark:bg-slate-900 border-blue-500 ring-1 ring-blue-500 shadow-sm'
                        : 'bg-transparent border-transparent hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-600 dark:text-slate-400'
                        }`}
                    >
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${appVersion === ver.id ? 'text-blue-600 dark:text-blue-400' : ''}`}>v{ver.id}</span>
                          {ver.current && <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-slate-800 text-gray-500 rounded border border-gray-200 dark:border-slate-700">Latest</span>}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">{ver.date} • {ver.note}</p>
                      </div>
                      {appVersion === ver.id && <Check className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="p-4 bg-gray-50 dark:bg-slate-950 rounded-lg border border-gray-100 dark:border-slate-800">
            <span className="block text-sm text-gray-500 dark:text-slate-400 mb-1">Model dịch thuật</span>
            <span className="block text-lg font-medium text-gray-900 dark:text-slate-200">VietSub-Custom (Latest)</span>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-slate-950 rounded-lg border border-gray-100 dark:border-slate-800">
            <span className="block text-sm text-gray-500 dark:text-slate-400 mb-1">Dung lượng đã dùng</span>
            <span className="block text-lg font-medium text-gray-900 dark:text-slate-200">256 MB / 10 GB</span>
          </div>
          <div className="col-span-1 md:col-span-2 p-4 bg-gray-50 dark:bg-slate-950 rounded-lg border border-gray-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <span className="block text-sm text-gray-500 dark:text-slate-400 mb-1">Tổng số dự án</span>
              <span className="block text-lg font-medium text-gray-900 dark:text-slate-200">12 Projects</span>
            </div>
            <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Database className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone Section */}
      <div className="p-6 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-xl shadow-sm">
        <h3 className="text-lg font-medium text-red-700 dark:text-red-400 mb-2">Xóa tất cả dữ liệu</h3>
        <p className="text-sm text-gray-600 dark:text-slate-400 mb-4">
          Xóa tất cả các file phụ đề, bản dịch và cài đặt. Hành động này không thể hoàn tác.
        </p>
        <button
          onClick={async () => {
            if (window.confirm('Bạn có chắc chắn muốn xóa tất cả dữ liệu? Hành động này không thể hoàn tác.')) {
              try {
                // Delete all files first
                const files = await db.getFiles();
                await Promise.all(files.map(f => db.deleteFile(f.id)));

                // Delete all projects
                const projects = await db.getProjects();
                await Promise.all(projects.map(p => db.deleteProject(p.id)));

                alert('Đã xóa toàn bộ dữ liệu thành công.');
                window.location.reload(); // Reload to refresh state
              } catch (error) {
                console.error(error);
                alert('Có lỗi xảy ra khi xóa dữ liệu.');
              }
            }
          }}
          className="px-6 py-2.5 bg-white border border-red-300 text-red-600 font-medium rounded-lg hover:bg-red-50 transition-colors focus:ring-4 focus:ring-red-500/10 dark:bg-transparent dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
        >
          Xóa tất cả dữ liệu
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex gap-6 max-w-7xl mx-auto">
      {/* Left Sidebar - Section Navigation */}
      <div className="w-64 space-y-2">
        <h3 className="text-gray-900 dark:text-white mb-4">{t('settingsTitle')}</h3>
        {sections.map(section => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeSection === section.id
              ? 'bg-blue-600 text-white'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
          >
            <section.icon className="w-5 h-5" />
            <span>{t(section.id === 'account' ? 'accountSettings' : section.id === 'appearance' ? 'appearanceSettings' : 'systemSettings')}</span>
          </button>
        ))}
      </div>

      {/* Right Content Area */}
      <div className="flex-1">
        <div className="mb-6">
          <h2 className="text-gray-900 dark:text-white">
            {t(activeSection === 'account' ? 'accountSettings' : activeSection === 'appearance' ? 'appearanceSettings' : 'systemSettings')}
          </h2>
        </div>


        {activeSection === 'account' && renderAccountSettings()}
        {activeSection === 'appearance' && renderAppearanceSettings()}
        {activeSection === 'system' && renderSystemSettings()}

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <button
            onClick={handleReset}
            className="px-6 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            {t('reset')}
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t('save')}
          </button>
        </div>
      </div>
    </div>
  );
}