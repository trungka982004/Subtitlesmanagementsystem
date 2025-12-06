import { useState, useEffect } from 'react';
import { X, Clock, User, Moon, Bell, Globe as GlobeIcon, Database, Sun, Monitor } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { useTranslation } from '../hooks/useTranslation';

interface SettingsProps {
  onClose?: () => void;
}

export function Settings({ onClose }: SettingsProps) {
  const { theme, setTheme, language, setLanguage } = useSettings();
  const { t } = useTranslation();
  const [activeSection, setActiveSection] = useState<'translation' | 'account' | 'appearance' | 'notifications' | 'system'>('translation');
  
  // Translation settings
  const [selectedGenre, setSelectedGenre] = useState<string>('modern');
  const [contentPrompt, setContentPrompt] = useState<string>('');
  const [maxCharsPerLine, setMaxCharsPerLine] = useState<number>(40);
  const [maxLines, setMaxLines] = useState<1 | 2>(2);
  const [smartLineBreak, setSmartLineBreak] = useState<boolean>(true);
  const [timeShift, setTimeShift] = useState<number>(0);

  // Account settings
  const [userName, setUserName] = useState<string>('Admin User');
  const [userEmail, setUserEmail] = useState<string>('admin@example.com');
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');

  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState<boolean>(true);
  const [translationComplete, setTranslationComplete] = useState<boolean>(true);
  const [systemUpdates, setSystemUpdates] = useState<boolean>(false);

  // System settings
  const [autoSave, setAutoSave] = useState<boolean>(true);
  const [backupEnabled, setBackupEnabled] = useState<boolean>(true);

  const genres = [
    { id: 'ancient', label: 'Cổ trang/Cung đấu', icon: '🧛🏻' },
    { id: 'martial', label: 'Kiếm hiệp/Giang hồ', icon: '⚔️' },
    { id: 'fantasy', label: 'Tiên hiệp/Huyền huyễn', icon: '🧚🏻' },
    { id: 'modern', label: 'Hiện đại/Đô thị', icon: '🏢' },
  ];

  const sections = [
    { id: 'translation' as const, label: 'Dịch thuật', icon: GlobeIcon },
    { id: 'account' as const, label: 'Tài khoản', icon: User },
    { id: 'appearance' as const, label: 'Giao diện', icon: Moon },
    { id: 'notifications' as const, label: 'Thông báo', icon: Bell },
    { id: 'system' as const, label: 'Hệ thống', icon: Database },
  ];

  const handleReset = () => {
    if (activeSection === 'translation') {
      setSelectedGenre('modern');
      setContentPrompt('');
      setMaxCharsPerLine(40);
      setMaxLines(2);
      setSmartLineBreak(true);
      setTimeShift(0);
    } else if (activeSection === 'appearance') {
      setTheme('light');
      setLanguage('vi');
    } else if (activeSection === 'notifications') {
      setEmailNotifications(true);
      setTranslationComplete(true);
      setSystemUpdates(false);
    } else if (activeSection === 'system') {
      setAutoSave(true);
      setBackupEnabled(true);
    }
  };

  const handleSave = () => {
    console.log('Settings saved:', {
      activeSection,
      translation: { selectedGenre, contentPrompt, maxCharsPerLine, maxLines, smartLineBreak, timeShift },
      account: { userName, userEmail },
      appearance: { theme, language },
      notifications: { emailNotifications, translationComplete, systemUpdates },
      system: { autoSave, backupEnabled }
    });
    if (onClose) onClose();
  };

  const renderTranslationSettings = () => (
    <div className="space-y-6">
      {/* Translation Context */}
      <div className="space-y-4">
        <div>
          <label className="block text-gray-700 mb-3">
            Thể loại / Phong cách dịch <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-4 gap-3">
            {genres.map(genre => (
              <button
                key={genre.id}
                onClick={() => setSelectedGenre(genre.id)}
                className={`p-4 rounded-lg border-2 transition-all text-center ${
                  selectedGenre === genre.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="text-2xl mb-2">{genre.icon}</div>
                <div className="text-gray-900">{genre.label}</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-gray-700 mb-2">
            Gợi ý nội dung (Prompt) <span className="text-gray-400">(Tùy chọn)</span>
          </label>
          <textarea
            value={contentPrompt}
            onChange={(e) => setContentPrompt(e.target.value)}
            placeholder="Ví dụ: Nam chính là Tướng quân lạnh lùng, Nữ chính là công chúa hoạt bát. Bối cảnh thời nhà Thanh..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            rows={4}
          />
          <p className="text-gray-500 mt-2">
            Giúp AI xác định vai vế và xưng hô chính xác hơn.
          </p>
        </div>
      </div>

      {/* QC Standards */}
      <div className="space-y-4">
        <h3 className="text-gray-900">Quy chuẩn Phụ đề</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 mb-2">
              Ký tự tối đa mỗi dòng
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMaxCharsPerLine(Math.max(1, maxCharsPerLine - 1))}
                className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                -
              </button>
              <input
                type="number"
                value={maxCharsPerLine}
                onChange={(e) => setMaxCharsPerLine(parseInt(e.target.value) || 0)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center"
              />
              <button
                onClick={() => setMaxCharsPerLine(maxCharsPerLine + 1)}
                className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                +
              </button>
            </div>
          </div>

          <div>
            <label className="block text-gray-700 mb-2">
              Số dòng tối đa
            </label>
            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setMaxLines(1)}
                className={`flex-1 px-4 py-2 transition-colors ${
                  maxLines === 1
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                1 Dòng
              </button>
              <button
                onClick={() => setMaxLines(2)}
                className={`flex-1 px-4 py-2 transition-colors ${
                  maxLines === 2
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                2 Dòng
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="text-gray-900">Tự động ngắt câu thông minh</p>
            <p className="text-gray-500">
              Tự động xuống dòng tại dấu phẩy hoặc ngắt cụm từ có nghĩa
            </p>
          </div>
          <button
            onClick={() => setSmartLineBreak(!smartLineBreak)}
            className={`relative w-14 h-7 rounded-full transition-colors ${
              smartLineBreak ? 'bg-blue-600' : 'bg-gray-300'
            }`}
          >
            <div
              className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full transition-transform ${
                smartLineBreak ? 'translate-x-7' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Sync & Export */}
      <div className="space-y-4">
        <h3 className="text-gray-900">Đồng bộ & Xuất file</h3>
        
        <div>
          <label className="block text-gray-700 mb-2">
            Đồng bộ thời gian (Time Shift)
          </label>
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-gray-400" />
            <input
              type="number"
              value={timeShift}
              onChange={(e) => setTimeShift(parseInt(e.target.value) || 0)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0"
            />
            <span className="text-gray-600 min-w-[40px]">ms</span>
          </div>
          <p className="text-gray-500 mt-2">
            Nhập giá trị âm (ví dụ -500ms) nếu phụ đề chạy chậm hơn tiếng.
          </p>
        </div>

        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-900">
            File xuất mặc định: .SRT (UTF-8 Standard)
          </p>
        </div>
      </div>
    </div>
  );

  const renderAccountSettings = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-gray-900">Thông tin cá nhân</h3>
        
        <div>
          <label className="block text-gray-700 mb-2">Tên người dùng</label>
          <input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-gray-700 mb-2">Email</label>
          <input
            type="email"
            value={userEmail}
            onChange={(e) => setUserEmail(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-gray-900">Đổi mật khẩu</h3>
        
        <div>
          <label className="block text-gray-700 mb-2">Mật khẩu hiện tại</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="••••••••"
          />
        </div>

        <div>
          <label className="block text-gray-700 mb-2">Mật khẩu mới</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="••••••••"
          />
        </div>

        <div>
          <label className="block text-gray-700 mb-2">Xác nhận mật khẩu mới</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="••••••••"
          />
        </div>

        <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          Cập nhật mật khẩu
        </button>
      </div>

      <div className="space-y-4 pt-6 border-t border-gray-200">
        <h3 className="text-red-600">Xóa tài khoản</h3>
        <p className="text-gray-600">
          Khi bạn xóa tài khoản, tất cả dữ liệu liên quan sẽ bị xóa vĩnh viễn và không thể khôi phục.
        </p>
        <button className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
          Xóa tài khoản
        </button>
      </div>
    </div>
  );

  const renderAppearanceSettings = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-gray-900">Chủ đề giao diện</h3>
        
        <div className="grid grid-cols-3 gap-4">
          <button
            onClick={() => setTheme('light')}
            className={`p-6 rounded-lg border-2 transition-all ${
              theme === 'light'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <Sun className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
            <p className="text-gray-900">Sáng</p>
            <p className="text-gray-500 mt-1">Light Mode</p>
          </button>

          <button
            onClick={() => setTheme('dark')}
            className={`p-6 rounded-lg border-2 transition-all ${
              theme === 'dark'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <Moon className="w-8 h-8 mx-auto mb-2 text-gray-700" />
            <p className="text-gray-900">Tối</p>
            <p className="text-gray-500 mt-1">Dark Mode</p>
          </button>

          <button
            onClick={() => setTheme('auto')}
            className={`p-6 rounded-lg border-2 transition-all ${
              theme === 'auto'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <Monitor className="w-8 h-8 mx-auto mb-2 text-blue-500" />
            <p className="text-gray-900">Tự động</p>
            <p className="text-gray-500 mt-1">Auto</p>
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-gray-900">Ngôn ngữ giao diện</h3>
        
        <div className="space-y-2">
          <button
            onClick={() => setLanguage('vi')}
            className={`w-full p-4 rounded-lg border-2 transition-all flex items-center justify-between ${
              language === 'vi'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🇻🇳</span>
              <div className="text-left">
                <p className="text-gray-900">Tiếng Việt</p>
                <p className="text-gray-500">Vietnamese</p>
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
            className={`w-full p-4 rounded-lg border-2 transition-all flex items-center justify-between ${
              language === 'en'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🇬🇧</span>
              <div className="text-left">
                <p className="text-gray-900">English</p>
                <p className="text-gray-500">English</p>
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
            className={`w-full p-4 rounded-lg border-2 transition-all flex items-center justify-between ${
              language === 'zh'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🇨🇳</span>
              <div className="text-left">
                <p className="text-gray-900">中文</p>
                <p className="text-gray-500">Chinese</p>
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

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-gray-900">Thông báo Email</h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-gray-900">Bật thông báo qua Email</p>
              <p className="text-gray-500">Nhận thông báo quan trọng qua email</p>
            </div>
            <button
              onClick={() => setEmailNotifications(!emailNotifications)}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                emailNotifications ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <div
                className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full transition-transform ${
                  emailNotifications ? 'translate-x-7' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-gray-900">Hoàn thành dịch thuật</p>
              <p className="text-gray-500">Thông báo khi quá trình dịch hoàn tất</p>
            </div>
            <button
              onClick={() => setTranslationComplete(!translationComplete)}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                translationComplete ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <div
                className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full transition-transform ${
                  translationComplete ? 'translate-x-7' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-gray-900">Cập nhật hệ thống</p>
              <p className="text-gray-500">Thông báo về các bản cập nhật mới</p>
            </div>
            <button
              onClick={() => setSystemUpdates(!systemUpdates)}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                systemUpdates ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <div
                className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full transition-transform ${
                  systemUpdates ? 'translate-x-7' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-blue-900">
          💡 Bạn có thể tắt thông báo bất kỳ lúc nào. Một số thông báo quan trọng về bảo mật sẽ vẫn được gửi.
        </p>
      </div>
    </div>
  );

  const renderSystemSettings = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-gray-900">Tự động hóa</h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-gray-900">Tự động lưu</p>
              <p className="text-gray-500">Tự động lưu thay đổi khi chỉnh sửa phụ đề</p>
            </div>
            <button
              onClick={() => setAutoSave(!autoSave)}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                autoSave ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <div
                className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full transition-transform ${
                  autoSave ? 'translate-x-7' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-gray-900">Sao lưu tự động</p>
              <p className="text-gray-500">Tự động sao lưu dữ liệu mỗi ngày</p>
            </div>
            <button
              onClick={() => setBackupEnabled(!backupEnabled)}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                backupEnabled ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <div
                className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full transition-transform ${
                  backupEnabled ? 'translate-x-7' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-gray-900">Thông tin hệ thống</h3>
        
        <div className="p-4 bg-gray-50 rounded-lg space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Phiên bản</span>
            <span className="text-gray-900">v1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Model dịch thuật</span>
            <span className="text-gray-900">VietSub-Custom (Latest)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Dung lượng đã dùng</span>
            <span className="text-gray-900">256 MB / 10 GB</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Số dự án</span>
            <span className="text-gray-900">12 projects</span>
          </div>
        </div>
      </div>

      <div className="space-y-4 pt-6 border-t border-gray-200">
        <h3 className="text-red-600">Xóa tất cả dữ liệu</h3>
        <p className="text-gray-600">
          Xóa tất cả các file phụ đề, bản dịch và cài đặt. Hành động này không thể hoàn tác.
        </p>
        <button className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
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
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeSection === section.id
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <section.icon className="w-5 h-5" />
            <span>{t(section.id === 'translation' ? 'translationSettings' : section.id === 'account' ? 'accountSettings' : section.id === 'appearance' ? 'appearanceSettings' : section.id === 'notifications' ? 'notificationSettings' : 'systemSettings')}</span>
          </button>
        ))}
      </div>

      {/* Right Content Area */}
      <div className="flex-1">
        <div className="mb-6">
          <h2 className="text-gray-900 dark:text-white">
            {t(activeSection === 'translation' ? 'translationSettings' : activeSection === 'account' ? 'accountSettings' : activeSection === 'appearance' ? 'appearanceSettings' : activeSection === 'notifications' ? 'notificationSettings' : 'systemSettings')}
          </h2>
          {activeSection === 'translation' && (
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {t('usingModel')}
            </p>
          )}
        </div>

        {activeSection === 'translation' && renderTranslationSettings()}
        {activeSection === 'account' && renderAccountSettings()}
        {activeSection === 'appearance' && renderAppearanceSettings()}
        {activeSection === 'notifications' && renderNotificationSettings()}
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