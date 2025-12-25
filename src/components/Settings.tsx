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
  Camera,
  Cpu,
  HardDrive,
  Sparkles
} from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { useTranslation } from '../hooks/useTranslation';
import { checkCustomModelHealth, CUSTOM_NLP_API_URL, getModelVersions, setModelVersion } from '../services/customNLP';

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

  // NLP Status
  const [nlpStatus, setNlpStatus] = useState<{ status: string; model_loaded: boolean; device?: string } | null>(null);
  const [checkingNlp, setCheckingNlp] = useState(false);

  // Model versions state
  const [modelVersionsList, setModelVersionsList] = useState<{ id: string; date: string; note: string; current: boolean }[]>([]);

  const fetchModelInfo = async () => {
    setCheckingNlp(true);

    // 1. Check health and current version
    const statusResult = await checkCustomModelHealth();
    setNlpStatus(statusResult);

    // 2. Fetch available versions
    const versionsData = await getModelVersions();

    if (versionsData) {
      // Current loaded version
      const currentVer = statusResult.current_version || versionsData.current_version || 'Unknown';
      setAppVersion(currentVer); // Repurposing appVersion to track current model version

      // Map to UI format
      const mappedVersions = versionsData.available_versions.map(v => ({
        id: v,
        date: new Date().toISOString().split('T')[0], // Use current date for now
        note: v === 'v1.0' ? 'Stable Release' : v === 'v2.0' ? 'New Improved Model' : 'Custom Model',
        current: v === currentVer
      }));
      setModelVersionsList(mappedVersions);
    }

    setCheckingNlp(false);
  };

  useEffect(() => {
    if (activeSection === 'system') {
      fetchModelInfo();
    }
  }, [activeSection]);

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
  ];

  const sections = [
    { id: 'account' as const, label: t('accountSettings'), icon: User },
    { id: 'appearance' as const, label: t('appearanceSettings'), icon: Moon },
    { id: 'system' as const, label: t('systemSettings'), icon: Database },
  ];

  const handleReset = () => {
    if (activeSection === 'appearance') {
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
    <div className="flex flex-col" style={{ gap: '2.5rem' }}>
      {/* Profile Section */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-xl shadow-sm">
        <h3 className="text-lg font-medium text-gray-900 dark:text-slate-200 mb-6">{t('personalInfo')}</h3>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Avatar Column */}
          <div className="flex flex-col items-center space-y-3 shrink-0">
            <div className="relative group w-24 h-24">
              <div
                className="w-full h-full rounded-full bg-gray-200 dark:bg-slate-800 border-4 border-white dark:border-slate-900 shadow-md overflow-hidden flex items-center justify-center"
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
              className="p-2 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 rounded-full hover:bg-blue-50 dark:hover:bg-slate-700 hover:text-blue-600 transition-colors cursor-pointer border border-gray-200 dark:border-white/10 shadow-sm"
              title="Change Avatar"
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
              <label className="block text-xl font-bold text-gray-700 dark:text-slate-300 mb-2">{t('username')}</label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full pl-6 px-4 py-2.5 text-sm border border-gray-300 dark:border-white/10 bg-white dark:bg-slate-950 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono"
              />
            </div>

            <div>
              <label className="block text-xl font-bold text-gray-700 dark:text-slate-300 mb-2">{t('email')}</label>
              <input
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                className="w-full pl-6 px-4 py-2.5 text-sm border border-gray-300 dark:border-white/10 bg-white dark:bg-slate-950 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Password Section */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-xl shadow-sm">
        <h3 className="text-lg font-medium text-gray-900 dark:text-slate-200">{t('changePassword')}</h3>

        <div className="space-y-4 pt-2">
          <div>
            <label className="block text-xl font-bold text-gray-700 dark:text-slate-300 mb-2">{t('currentPassword')}</label>
            <div className="relative w-full">
              <input
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full pl-6 pr-12 py-2.5 text-sm border border-gray-300 dark:border-white/10 bg-white dark:bg-slate-950 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono"
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
              <label className="block text-xl font-bold text-gray-700 dark:text-slate-300 mb-2">{t('newPassword')}</label>
              <div className="relative w-full">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-6 pr-12 py-2.5 text-sm border border-gray-300 dark:border-white/10 bg-white dark:bg-slate-950 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono"
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
              <label className="block text-xl font-bold text-gray-700 dark:text-slate-300 mb-2">{t('confirmPassword')}</label>
              <div className="relative w-full">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-6 pr-12 py-2.5 text-sm border border-gray-300 dark:border-white/10 bg-white dark:bg-slate-950 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono"
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
              {t('updatePassword')}
            </button>
          </div>
        </div>
      </div>



      {/* Delete Account Section */}
      <div className="p-8 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/20 rounded-xl shadow-sm">
        <h3 className="text-lg font-medium text-red-700 dark:text-red-400 mb-2">{t('deleteAccount')}</h3>
        <p className="text-gray-600 dark:text-slate-400 mb-4 text-sm">
          {t('deleteAccountWarning')}
        </p>
        <button className="px-6 py-2.5 bg-white border border-red-300 text-red-600 font-medium rounded-lg hover:bg-red-50 transition-colors focus:ring-4 focus:ring-red-500/10 dark:bg-slate-950 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-900/20">
          {t('deleteAccount')}
        </button>
      </div>
    </div>
  );

  const renderAppearanceSettings = () => (
    <div className="flex flex-col" style={{ gap: '2.5rem' }}>
      <div className="space-y-4">
        <h3 className="text-gray-900 dark:text-white font-medium text-lg">{t('themeSettings')}</h3>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setTheme('light')}
            className={`p-6 rounded-lg border-2 transition-all ${theme === 'light'
              ? 'border-blue-500 bg-blue-50 dark:bg-slate-800 dark:border-blue-500'
              : 'border-gray-200 bg-white dark:bg-slate-950 dark:border-white/10 hover:border-gray-300 dark:hover:border-slate-500'
              }`}
          >
            <Sun className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
            <p className="text-gray-900 dark:text-white font-medium">{t('lightMode')}</p>
            <p className="text-gray-500 dark:text-slate-300 mt-1">{t('lightModeDesc')}</p>
          </button>

          <button
            onClick={() => setTheme('dark')}
            className={`p-6 rounded-lg border-2 transition-all ${theme === 'dark'
              ? 'border-blue-500 bg-blue-50 dark:bg-slate-800 dark:border-blue-500'
              : 'border-gray-200 bg-white dark:bg-slate-950 dark:border-white/10 hover:border-gray-300 dark:hover:border-slate-500'
              }`}
          >
            <Moon className="w-8 h-8 mx-auto mb-2 text-gray-700 dark:text-gray-200" />
            <p className="text-gray-900 dark:text-white font-medium">{t('darkMode')}</p>
            <p className="text-gray-500 dark:text-slate-300 mt-1">{t('darkModeDesc')}</p>
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-gray-900 dark:text-white font-medium text-lg">{t('uiLanguage')}</h3>

        <div className="space-y-2">
          <button
            onClick={() => setLanguage('vi')}
            className={`w-full p-4 rounded-lg border-2 transition-all flex items-center justify-between ${language === 'vi'
              ? 'border-blue-500 bg-blue-50 dark:bg-slate-800 dark:border-blue-500'
              : 'border-gray-200 bg-white dark:bg-slate-950 dark:border-white/10 hover:border-gray-300 dark:hover:border-slate-500'
              }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🇻🇳</span>
              <div className="text-left">
                <p className="text-gray-900 dark:text-white font-medium">{t('vietnamese')}</p>
                <p className="text-gray-500 dark:text-slate-300">Vietnamese</p>
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
              : 'border-gray-200 bg-white dark:bg-slate-950 dark:border-white/10 hover:border-gray-300 dark:hover:border-slate-500'
              }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🇬🇧</span>
              <div className="text-left">
                <p className="text-gray-900 dark:text-white font-medium">{t('english')}</p>
                <p className="text-gray-500 dark:text-slate-300">English</p>
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
              : 'border-gray-200 bg-white dark:bg-slate-950 dark:border-white/10 hover:border-gray-300 dark:hover:border-slate-500'
              }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🇨🇳</span>
              <div className="text-left">
                <p className="text-gray-900 dark:text-white font-medium">{t('chinese')}</p>
                <p className="text-gray-500 dark:text-slate-300">Chinese</p>
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
    <div className="flex flex-col" style={{ gap: '2.5rem' }}>
      {/* Automation Section */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-xl shadow-sm">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">{t('automation')}</h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 rounded-lg border border-gray-100 dark:border-white/5">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">{t('autoSave')}</p>
              <p className="text-sm text-gray-500 dark:text-slate-300 mt-1">{t('autoSaveDesc')}</p>
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

          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 rounded-lg border border-gray-100 dark:border-white/5">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">{t('autoBackup')}</p>
              <p className="text-sm text-gray-500 dark:text-slate-300 mt-1">{t('autoBackupDesc')}</p>
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
      <div className="p-6 bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-xl shadow-sm">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">{t('systemInfo')}</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Version Manager - Full Width */}
          <div className="col-span-1 md:col-span-2 p-4 bg-slate-50 dark:bg-slate-950 rounded-lg border border-gray-100 dark:border-white/5 transition-all">
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() => setShowVersions(!showVersions)}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                  <HistoryIcon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-slate-300">{t('version')}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-bold text-gray-900 dark:text-white">v{appVersion.replace(/^v/, '')}</p>
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
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-white/5 animate-in fade-in slide-in-from-top-2">
                <p className="text-xs font-semibold text-gray-400 uppercase mb-3">Version History</p>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                  {modelVersionsList.map((ver) => (
                    <button
                      key={ver.id}
                      onClick={async () => {
                        try {
                          setCheckingNlp(true);
                          await setModelVersion(ver.id);
                          // Refresh info to confirm switch
                          await fetchModelInfo();
                          setShowVersions(false);
                        } catch (err) {
                          alert("Failed to switch version");
                          setCheckingNlp(false);
                        }
                      }}
                      className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${appVersion === ver.id
                        ? 'bg-white dark:bg-slate-900 border-blue-500 ring-1 ring-blue-500 shadow-sm'
                        : 'bg-transparent border-transparent hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-600 dark:text-slate-400'
                        }`}
                    >
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${appVersion === ver.id ? 'text-blue-600 dark:text-blue-400' : ''}`}>v{ver.id.replace(/^v/, '')}</span>
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

          <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-lg border border-gray-100 dark:border-white/5 flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-xs text-gray-500 dark:text-slate-300">{t('translationModel')}</span>
              <span className="block text-base font-bold text-gray-900 dark:text-white">VietSub-Custom ({appVersion})</span>
            </div>
          </div>

          {/* Custom NLP Connection Status */}
          <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-lg border border-gray-100 dark:border-white/5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${nlpStatus?.status === 'ok' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-xs text-gray-500 dark:text-slate-300">Custom NLP Service</span>
                  <span className="block text-sm font-bold text-gray-900 dark:text-white">
                    {CUSTOM_NLP_API_URL}
                  </span>
                </div>
              </div>
              <button
                onClick={fetchModelInfo}
                disabled={checkingNlp}
                className="px-3 py-1 text-xs bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
              >
                {checkingNlp ? 'Checking...' : 'Check Connection'}
              </button>
            </div>

            {nlpStatus && (
              <div className="mt-2 text-xs flex items-center gap-4">
                <span className={`px-2 py-0.5 rounded-full ${nlpStatus.status === 'ok' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  Status: {nlpStatus.status}
                </span>
                {nlpStatus.status === 'ok' && (
                  <>
                    <span className={`px-2 py-0.5 rounded-full ${nlpStatus.model_loaded ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      Model Loaded: {nlpStatus.model_loaded ? 'Yes' : 'No'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-gray-300">
                      Device: {nlpStatus.device || 'N/A'}
                    </span>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-lg border border-gray-100 dark:border-white/5 flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-xs text-gray-500 dark:text-slate-300">{t('storageUsed')}</span>
              <span className="block text-base font-bold text-gray-900 dark:text-white">256 MB / 10 GB</span>
            </div>
          </div>

          <div className="col-span-1 md:col-span-2 p-4 bg-slate-50 dark:bg-slate-950 rounded-lg border border-gray-100 dark:border-white/5 flex items-center gap-3 hover:bg-white dark:hover:bg-slate-900 transition-all cursor-default">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-xs text-gray-500 dark:text-slate-300">{t('projectCount')}</span>
              <span className="block text-base font-bold text-gray-900 dark:text-white">{projectsCount} {t('projects')}</span>
            </div>
          </div>
        </div>
      </div>
      {/* Danger Zone Section */}
      <div className="p-6 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/20 rounded-xl shadow-sm">
        <h3 className="text-lg font-medium text-red-700 dark:text-red-400 mb-2">{t('clearAllData')}</h3>
        <p className="text-sm text-gray-600 dark:text-slate-400 mb-4">
          {t('clearAllDataWarning')}
        </p>
        <button
          onClick={async () => {
            if (window.confirm(t('clearAllDataWarning'))) {
              try {
                // Delete all files first
                const files = await db.getFiles();
                await Promise.all(files.map(f => db.deleteFile(f.id)));

                // Delete all projects
                const projects = await db.getProjects();
                await Promise.all(projects.map(p => db.deleteProject(p.id)));

                alert('All data has been deleted successfully.');
                window.location.reload(); // Reload to refresh state
              } catch (error) {
                console.error(error);
                alert('An error occurred while deleting data.');
              }
            }
          }}
          className="px-6 py-2.5 bg-white border border-red-300 text-red-600 font-medium rounded-lg hover:bg-red-50 transition-colors focus:ring-4 focus:ring-red-500/10 dark:bg-slate-950 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-900/20"
        >
          {t('clearAllData')}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex gap-6 max-w-7xl mx-auto">
      {/* Left Sidebar - Section Navigation */}
      <div className="w-64 space-y-2">
        <h3 className="text-gray-900 dark:text-white mb-4 font-bold text-xl uppercase tracking-wide">{t('settingsTitle')}</h3>
        {sections.map(section => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeSection === section.id
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-gray-700 dark:text-slate-200 hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800/50 font-medium'
              }`}
          >
            <section.icon className="w-5 h-5" />
            <span>{section.label}</span>
          </button>
        ))}
      </div>

      {/* Right Content Area */}
      <div className="flex-1">
        <div className="mb-6">
          <h2 className="text-gray-900 dark:text-white text-2xl font-bold tracking-tight">
            {t(activeSection === 'account' ? 'accountSettings' : activeSection === 'appearance' ? 'appearanceSettings' : 'systemSettings')}
          </h2>
        </div>


        {activeSection === 'account' && renderAccountSettings()}
        {activeSection === 'appearance' && renderAppearanceSettings()}
        {activeSection === 'system' && renderSystemSettings()}

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-white/10 flex items-center justify-between">
          <button
            onClick={handleReset}
            className="px-6 py-2 text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-gray-300 dark:border-white/10 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
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