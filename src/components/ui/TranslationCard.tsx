
import { Check, Edit2, Play, SignalHigh, BrainCircuit } from 'lucide-react';
import { useState, useEffect } from 'react';

interface TranslationCardProps {
    modelName: string;
    translation: string | undefined;
    isLoading: boolean;
    isSelected: boolean;
    onSelect: () => void;
    onEdit: (newText: string) => void;
    colorClass: string; // e.g., 'border-green-500' 
    badgeColor: string; // e.g., 'bg-green-100 text-green-800'
    latency?: number;
    confidence?: number;
    errorMessage?: string;
}

export function TranslationCard({
    modelName,
    translation,
    isLoading,
    isSelected,
    onSelect,
    onEdit,
    colorClass,
    badgeColor,
    latency,
    confidence,
    errorMessage
}: TranslationCardProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editedText, setEditedText] = useState(translation || '');

    useEffect(() => {
        setEditedText(translation || '');
    }, [translation]);

    const handleBlur = () => {
        setIsEditing(false);
        if (editedText !== translation) {
            onEdit(editedText);
        }
    };

    return (
        <div
            className={`relative flex flex-col h-full rounded-xl border-2 transition-all duration-300 bg-white dark:bg-slate-900 overflow-hidden shadow-sm hover:shadow-lg ${isSelected ? `${colorClass} shadow-md ring-1 ring-opacity-50` : 'border-slate-200 dark:border-slate-800'
                }`}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-950/50 border-b border-gray-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${badgeColor}`}>
                        {modelName}
                    </span>
                    {isSelected && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
                            <Check className="w-3 h-3" /> Selected
                        </span>
                    )}
                </div>

                {/* Technical Badge */}
                <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                    {latency && (
                        <span className="flex items-center gap-1" title="Latency">
                            <SignalHigh className="w-3 h-3" /> {latency}ms
                        </span>
                    )}
                    {confidence && (
                        <span className="flex items-center gap-1" title="Confidence Score">
                            <BrainCircuit className="w-3 h-3" /> {confidence}%
                        </span>
                    )}
                </div>
            </div>

            {/* Body */}
            <div
                className="flex-1 p-4 relative group cursor-text"
                onClick={() => !isEditing && setIsEditing(true)}
            >
                {isLoading ? (
                    <div className="space-y-3 animate-pulse">
                        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4"></div>
                        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2"></div>
                        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-5/6"></div>
                    </div>
                ) : (
                    <div className="h-full relative">
                        {isEditing ? (
                            <textarea
                                value={editedText}
                                onChange={(e) => setEditedText(e.target.value)}
                                onBlur={handleBlur}
                                autoFocus
                                className="w-full h-full min-h-[100px] p-0 text-sm bg-transparent border-none focus:ring-0 resize-none text-slate-700 dark:text-slate-200 placeholder-slate-400 leading-relaxed"
                            />
                        ) : (
                            <div
                                className={`w-full h-full min-h-[100px] text-sm whitespace-pre-wrap leading-relaxed ${errorMessage ? 'text-red-500 italic' : 'text-slate-700 dark:text-slate-300'}`}
                            >
                                {errorMessage || translation || <span className="text-slate-500 dark:text-slate-600 italic">Translation pending...</span>}
                            </div>
                        )}

                        {!isEditing && translation && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsEditing(true);
                                }}
                                className="absolute top-0 right-0 p-1.5 text-slate-400 hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-100 dark:bg-slate-800 rounded-md shadow-sm"
                            >
                                <Edit2 className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Action Footer */}
            <div
                className="p-3 border-t border-gray-50 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/30 flex justify-end"
                onClick={(e) => e.stopPropagation()} // Prevent clicking footer from triggering edit
            >
                <button
                    onClick={onSelect}
                    disabled={isLoading || !translation}
                    className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all duration-200 ${isSelected
                        ? 'bg-green-600 text-white shadow-md hover:bg-green-700 ring-2 ring-green-600 ring-offset-1 ring-offset-white dark:ring-offset-slate-900'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed'
                        }`}
                >
                    {isSelected ? (
                        <>
                            <Check className="w-4 h-4" /> Selected Final
                        </>
                    ) : (
                        <>
                            <Play className="w-3 h-3 fill-current" /> Select This
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
