
import { Check, Edit2, Play } from 'lucide-react';
import { useState, useEffect } from 'react';

type CardVariant = 'blue' | 'purple' | 'pink' | 'orange';

const VARIANT_STYLES: Record<CardVariant, { container: string; badge: string }> = {
    blue: {
        container: "border-blue-500 bg-blue-50 dark:bg-blue-500/5",
        badge: "bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400"
    },
    purple: {
        container: "border-[#a855f7] bg-[#f3e8ff] dark:bg-[#a855f7]/5", // purple-500, purple-100
        badge: "bg-[#f3e8ff] dark:bg-[#a855f7]/10 text-[#7e22ce] dark:text-[#c084fc]" // purple-100, purple-700, purple-400
    },
    pink: {
        container: "border-[#ec4899] bg-[#fce7f3] dark:bg-[#ec4899]/5", // pink-500, pink-100
        badge: "bg-[#fce7f3] dark:bg-[#ec4899]/10 text-[#be185d] dark:text-[#f472b6]" // pink-100, pink-700, pink-400
    },
    orange: {
        container: "border-orange-500 bg-orange-50 dark:bg-orange-500/5",
        badge: "bg-orange-100 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400"
    }
};

interface TranslationCardProps {
    modelName: string;
    translation: string | undefined;
    isLoading: boolean;
    isSelected: boolean;
    onSelect: () => void;
    onEdit: (newText: string) => void;
    variant: CardVariant;
    errorMessage?: string;
    isLocked?: boolean;
    isDark?: boolean;
}

export function TranslationCard({
    modelName,
    translation,
    isLoading,
    isSelected,
    onSelect,
    onEdit,
    variant,
    errorMessage,
    isLocked,
    isDark = false
}: TranslationCardProps) {
    const styles = VARIANT_STYLES[variant];

    // Explicit colors for reliable rendering
    const getBadgeStyle = () => {
        if (variant === 'purple') {
            return {
                backgroundColor: isDark ? 'rgba(168, 85, 247, 0.1)' : '#f3e8ff',
                color: isDark ? '#c084fc' : '#7e22ce'
            };
        }
        if (variant === 'pink') {
            return {
                backgroundColor: isDark ? 'rgba(236, 72, 153, 0.1)' : '#fce7f3',
                color: isDark ? '#f472b6' : '#be185d'
            };
        }
        return {}; // Fallback to class-based for others
    };

    // Allow selection via card click
    const handleClick = () => {
        if (!isLoading && translation && !errorMessage && !isLocked) {
            onSelect();
        }
    };

    return (
        <div
            className={`relative flex flex-col h-full rounded-xl border-2 transition-all duration-300 bg-white dark:bg-slate-900 overflow-hidden shadow-sm ${isLoading || !translation || isLocked ? 'cursor-default' : 'cursor-pointer hover:shadow-lg'
                } ${isSelected ? `${styles.container} shadow-md ring-1 ring-opacity-50` : 'border-slate-200 dark:border-slate-800'
                }`}
            onClick={handleClick}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-950/50 border-b border-gray-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                    <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${styles.badge}`}
                        style={getBadgeStyle()}
                    >
                        {modelName}
                    </span>
                    {isSelected && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
                            <Check className="w-3 h-3" /> Selected
                        </span>
                    )}
                </div>
            </div>

            {/* Body */}
            <div className="flex-1 p-4 relative group">
                {isLoading ? (
                    <div className="space-y-3 animate-pulse">
                        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4"></div>
                        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2"></div>
                        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-5/6"></div>
                    </div>
                ) : (
                    <div className="h-full relative">
                        <div
                            className={`w-full h-full min-h-[100px] text-sm whitespace-pre-wrap leading-relaxed ${errorMessage ? 'text-red-500 italic' : 'text-slate-700 dark:text-slate-300'}`}
                        >
                            {errorMessage || translation || <span className="text-slate-500 dark:text-slate-600 italic">Translation pending...</span>}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
