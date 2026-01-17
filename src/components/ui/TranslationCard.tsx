
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

    // Allow selection via card click
    const handleClick = () => {
        if (!isLoading && translation && !errorMessage) {
            onSelect();
        }
    };

    return (
        <div
            className={`relative flex flex-col h-full rounded-xl border-2 transition-all duration-300 bg-white dark:bg-slate-900 overflow-hidden shadow-sm hover:shadow-lg ${isLoading || !translation ? 'cursor-default' : 'cursor-pointer'
                } ${isSelected ? `${colorClass} shadow-md ring-1 ring-opacity-50` : 'border-slate-200 dark:border-slate-800'
                }`}
            onClick={handleClick}
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
