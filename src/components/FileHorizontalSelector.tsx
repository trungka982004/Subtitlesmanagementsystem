
import { FileText } from 'lucide-react';
import { SubtitleFile } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { useSettings } from '../contexts/SettingsContext';

interface FileHorizontalSelectorProps {
    files: SubtitleFile[];
    selectedFileId: string | undefined;
    onSelectFile: (file: SubtitleFile) => void;
}

export function FileHorizontalSelector({ files, selectedFileId, onSelectFile }: FileHorizontalSelectorProps) {
    const { t } = useTranslation();
    const { theme } = useSettings();
    const isDark = theme === 'dark';

    return (
        <div className={`w-full border-b p-4 shrink-0 overflow-x-auto custom-scrollbar flex gap-4 transition-colors duration-300 ${isDark ? 'bg-[#0f172a] border-slate-800' : 'bg-white border-gray-200'
            }`}>
            {files.length === 0 ? (
                <div className="text-slate-500 text-sm italic px-4 py-2">No files uploaded yet.</div>
            ) : (
                files.map((file) => {
                    const isSelected = selectedFileId === file.id;
                    const completion = file.progress || 0;

                    // Dynamic styles based on theme and selection
                    let containerClasses = "relative group flex flex-col justify-between min-w-[160px] max-w-[160px] h-[80px] rounded-lg border transition-all duration-200 ";

                    if (isDark) {
                        if (isSelected) {
                            containerClasses += "bg-slate-900 border-blue-500 shadow-[0_0_15px_-3px_rgba(59,130,246,0.3)]";
                        } else {
                            containerClasses += "bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-800";
                        }
                    } else {
                        // Light Mode
                        if (isSelected) {
                            containerClasses += "bg-blue-50 border-blue-500 shadow-md shadow-blue-500/10";
                        } else {
                            containerClasses += "bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50";
                        }
                    }

                    const iconContainerClasses = isDark
                        ? (isSelected ? "bg-blue-500/20 text-blue-400" : "bg-slate-800 text-slate-500 group-hover:text-slate-400")
                        : (isSelected ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-slate-500 group-hover:text-slate-600");

                    const textClasses = isDark
                        ? (isSelected ? "text-white" : "text-slate-400 group-hover:text-slate-300")
                        : (isSelected ? "text-blue-700" : "text-slate-600 group-hover:text-slate-800");

                    const subTextClasses = isDark ? "text-slate-500" : "text-slate-400";

                    const progressBarBg = isDark ? "bg-slate-800" : "bg-gray-100";
                    const progressBarFill = isDark
                        ? (isSelected ? "bg-blue-500" : "bg-slate-700")
                        : (isSelected ? "bg-blue-500" : "bg-slate-400");

                    return (
                        <button
                            key={file.id}
                            onClick={() => onSelectFile(file)}
                            className={containerClasses}
                        >
                            {/* Content */}
                            <div className="p-3 flex items-start gap-3 w-full">
                                <div className={`p-1.5 rounded-md shrink-0 transition-colors ${iconContainerClasses}`}>
                                    <FileText className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0 text-left">
                                    <div className={`text-xs font-bold truncate transition-colors ${textClasses}`}>
                                        {file.name}
                                    </div>
                                    <div className={`text-[10px] mt-0.5 font-mono ${subTextClasses}`}>
                                        {file.entries.length} lines
                                    </div>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="w-full px-3 pb-3">
                                <div className={`h-1 w-full rounded-full overflow-hidden ${progressBarBg}`}>
                                    <div
                                        className={`h-full rounded-full transition-all duration-500 ${progressBarFill}`}
                                        style={{ width: `${completion}%` }}
                                    />
                                </div>
                            </div>

                            {/* Active Glow Decor element */}
                            {isSelected && (
                                <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50"></div>
                            )}
                        </button>
                    );
                })
            )}
        </div>
    );
}
