import { Menu, ChevronRight } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { useTranslation } from '../hooks/useTranslation';

interface HeaderProps {
    onMenuClick: () => void;
    getTabTitle: () => string;
}

export function Header({ onMenuClick, getTabTitle }: HeaderProps) {
    const { theme } = useSettings();
    const isDark = theme === 'dark';
    const { t } = useTranslation();

    return (
        <header
            className="w-full shrink-0 min-h-[140px] px-6 lg:px-10 py-6 border-b flex items-center gap-6 transition-all duration-300"
            style={{
                backgroundColor: isDark ? '#0f172a' : '#ffffff',
                borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(226,232,240,1)'
            }}
        >
            {/* 1. LEFT SECTION */}
            <div className="flex flex-1 items-center gap-6 min-w-0">
                <button
                    onClick={onMenuClick}
                    className="p-5 rounded-2xl bg-blue-600/10 text-blue-600 hover:bg-blue-600 hover:text-white transition-all cursor-pointer shadow-sm shrink-0 active:scale-95 group"
                    aria-label="Toggle Sidebar"
                >
                    <Menu className="w-8 h-8 transition-transform group-hover:scale-110" />
                </button>

                <div className="flex flex-col justify-center min-w-0">
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                        <span className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest shrink-0">
                            {t('dashboard') || 'DASHBOARD'}
                        </span>

                        <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600 shrink-0" />

                        <h1 className="text-3xl md:text-4xl font-black text-blue-600 dark:text-blue-400 uppercase tracking-tight break-words leading-none">
                            {getTabTitle()}
                        </h1>
                    </div>
                </div>
            </div>

            {/* 2. CENTER SECTION (Solid Colors to fix visibility) */}
            <div className="flex-none flex items-center justify-center mx-4">
                <div className="px-24 py-6 rounded-full bg-white dark:bg-slate-800 border-4 border-blue-600 dark:border-blue-400 shadow-xl flex justify-center items-center">
                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.1em] whitespace-nowrap text-center drop-shadow-sm leading-relaxed">
                        {t('professionalWorkflow') || 'PROFESSIONAL WORKFLOW'}
                    </h2>
                </div>
            </div>

            {/* 3. RIGHT SECTION */}
            <div className="flex flex-1 items-center justify-end min-w-0">
            </div>
        </header>
    );
}
