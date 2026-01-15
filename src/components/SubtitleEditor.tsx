import { useState, useEffect, useRef } from 'react';
import { SubtitleFile, SubtitleEntry } from '../types';
import { Download, Sparkles, Globe, Clock, Save, ArrowRight, Video, FileText, CheckCircle2, RefreshCw } from 'lucide-react';
import { translateText } from '../services/libreTranslate';
import { fetchMockTranslations } from '../services/mockTranslationService';
import { TranslationCard } from './ui/TranslationCard';
import { useSettings } from '../contexts/SettingsContext';

interface SubtitleEditorProps {
  file: SubtitleFile;
  onUpdate: (file: SubtitleFile) => void;
}

export function SubtitleEditor({ file, onUpdate }: SubtitleEditorProps) {
  const { theme } = useSettings();
  const isDark = theme === 'dark';
  const [editedEntries, setEditedEntries] = useState<SubtitleEntry[]>(file.entries);
  const [isTranslating, setIsTranslating] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Sync state with props if file changes (e.g. switching files)
  useEffect(() => {
    setEditedEntries(file.entries);
  }, [file.id, file.entries]);

  const handleModelSelection = (id: number, model: 'libre' | 'opus' | 'mbart' | 'nllb', text: string) => {
    const updated = editedEntries.map(entry => {
      if (entry.id === id) {
        return {
          ...entry,
          translation: text,
          selectedModel: model,
          // Update specific model field if selection happens (though usually pre-filled)
          [model === 'libre' ? 'libreTranslation' : `${model}Translation`]: text
        };
      }
      return entry;
    });

    updateFileState(updated);
  };

  const handleTextEdit = (id: number, model: 'libre' | 'opus' | 'mbart' | 'nllb', newText: string) => {
    const updated = editedEntries.map(entry => {
      if (entry.id === id) {
        const fieldName = model === 'libre' ? 'libreTranslation' : `${model}Translation`;
        return {
          ...entry,
          [fieldName]: newText,
          // If this model was already selected, update the main translation too
          ...(entry.selectedModel === model ? { translation: newText } : {})
        };
      }
      return entry;
    });
    setEditedEntries(updated);
    // We don't necessarily autosave on every keystroke/blur, but let's keep local state fresh
  };

  const updateFileState = (updatedEntries: SubtitleEntry[]) => {
    setEditedEntries(updatedEntries);

    // Calculate progress
    const completedCount = updatedEntries.filter(e => e.selectedModel).length;
    const progress = updatedEntries.length > 0 ? Math.round((completedCount / updatedEntries.length) * 100) : 0;
    const status = progress === 100 ? 'done' : progress > 0 ? 'in-progress' : 'not-started';

    // Propagate up
    onUpdate({ ...file, entries: updatedEntries, progress, status });
  };

  const handleGenerateAll = async () => {
    setIsTranslating(true);
    try {
      // Parallelize requests per segment for demo speed (in prod, queueing might be better)
      const promises = editedEntries.map(async (entry) => {
        // 1. Fetch LibreTranslate (Real)
        // If already exists, skip
        let libreText = entry.libreTranslation || entry.googleTranslation;
        if (!libreText) {
          try {
            libreText = await translateText(entry.text, 'vi', 'auto');
          } catch (e) {
            console.error("Libre failed", e);
          }
        }

        // 2. Fetch Mock Models (Opus, MBART, NLLB)
        let opusText = entry.opusTranslation;
        let mbartText = entry.mbartTranslation || entry.nlpTranslation; // Map old nlp to mbart
        let nllbText = entry.nllbTranslation;

        if (!opusText || !mbartText || !nllbText) {
          try {
            const mocks = await fetchMockTranslations(entry.text);
            if (!opusText) opusText = mocks.translations.opus;
            if (!mbartText) mbartText = mocks.translations.mbart;
            if (!nllbText) nllbText = mocks.translations.nllb;
          } catch (e) {
            console.error("Mock fetch failed", e);
          }
        }

        return {
          ...entry,
          libreTranslation: libreText,
          opusTranslation: opusText,
          mbartTranslation: mbartText,
          nllbTranslation: nllbText
        };
      });

      const updated = await Promise.all(promises);
      updateFileState(updated);

    } catch (error) {
      console.error("Batch generation failed", error);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleExport = () => {
    let srtContent = '';
    editedEntries.forEach(entry => {
      srtContent += `${entry.id}\n`;
      srtContent += `${entry.startTime} --> ${entry.endTime}\n`;
      srtContent += `${entry.translation || ''}\n\n`;
    });

    const blob = new Blob([srtContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name.replace('.srt', '_final.srt');
    a.click();
    URL.revokeObjectURL(url);
  };

  const completedCount = editedEntries.filter(e => e.selectedModel).length;

  // Dummy scores for now
  const getDummyScore = (model: string) => {
    // deterministic random based on model name strings length
    return 90 + (model.length % 9);
  };
  const getDummyLatency = (model: string) => {
    return 100 + (model.length * 15);
  };

  return (
    <div className={`flex flex-col w-full h-full font-sans overflow-hidden transition-colors duration-300 ${isDark ? 'bg-[#0f172a]' : 'bg-slate-50'
      }`}>
      {/* 1. Slim Header */}
      <div className={`flex items-center justify-between px-6 py-3 border-b z-20 w-full shadow-sm shrink-0 h-14 ${isDark ? 'bg-[#0f172a] border-slate-800' : 'bg-white border-gray-200'
        }`}>
        <div className="flex items-center gap-4">
          {/* Filename & Progress */}
          <div className="flex items-center gap-3">
            <h2 className={`text-sm font-bold truncate max-w-[200px] ${isDark ? 'text-slate-200' : 'text-slate-700'
              }`} title={file.name}>
              {file.name}
            </h2>
            <div className={`h-4 w-px ${isDark ? 'bg-slate-700' : 'bg-slate-300'}`}></div>
            <span className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {completedCount}/{editedEntries.length} segments
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleGenerateAll}
            disabled={isTranslating}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded transition-all disabled:opacity-50 border ${isDark
              ? 'text-slate-200 bg-blue-600/10 hover:bg-blue-600/20 border-blue-500/30 hover:border-blue-500/50'
              : 'text-blue-700 bg-blue-50 hover:bg-blue-100 border-blue-200 hover:border-blue-300'
              }`}
          >
            {isTranslating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className={`w-3.5 h-3.5 ${isDark ? 'text-blue-400' : 'text-blue-500'}`} />}
            <span>Generate All</span>
          </button>

          <button
            onClick={handleExport}
            disabled={completedCount === 0}
            className={`hidden sm:flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded transition-all disabled:opacity-50 border ${isDark
              ? 'text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border-slate-700'
              : 'text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-50 border-slate-200'
              }`}
          >
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        </div>
      </div>

      {/* 2. Main List Content */}
      <div
        ref={scrollContainerRef}
        className={`flex-1 overflow-y-auto p-4 lg:p-6 space-y-8 custom-scrollbar scroll-smooth ${isDark ? 'bg-[#0f172a]' : 'bg-slate-50'
          }`}
      >
        {editedEntries.map((entry) => (
          <div key={entry.id} className="group relative flex flex-col gap-4 max-w-5xl mx-auto">
            {/* Segment Header */}
            <div className={`flex items-baseline gap-3 select-none ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>
              <span className={`text-sm font-bold font-mono ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>#{entry.id}</span>
              <span className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{entry.startTime} → {entry.endTime}</span>
            </div>

            {/* Source Text - Full Width & Darker */}
            <div className={`w-full p-4 rounded-lg border transition-colors ${isDark
              ? 'bg-[#1e293b]/50 border-slate-800 hover:border-slate-700'
              : 'bg-slate-100 border-slate-200 hover:border-slate-300'
              }`}>
              <p className={`text-base leading-relaxed font-medium font-serif ${isDark ? 'text-slate-300' : 'text-slate-700'
                }`}>
                {entry.text}
              </p>
            </div>

            {/* Translation Grid - Strictly 2x2 on Large Screens */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Row 1: Libre (TL) & Opus (TR) */}
              <div className="h-full">
                <TranslationCard
                  modelName="LibreTranslate"
                  translation={entry.libreTranslation || entry.googleTranslation}
                  isLoading={isTranslating}
                  isSelected={entry.selectedModel === 'libre'}
                  onSelect={() => handleModelSelection(entry.id, 'libre', entry.libreTranslation || entry.googleTranslation || '')}
                  onEdit={(val) => handleTextEdit(entry.id, 'libre', val)}
                  colorClass="border-blue-500 bg-blue-50 dark:bg-blue-500/5"
                  badgeColor="bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400"
                  latency={getDummyLatency('LibreTranslate')}
                  confidence={getDummyScore('LibreTranslate')}
                />
              </div>

              <div className="h-full">
                <TranslationCard
                  modelName="Opus MT"
                  translation={entry.opusTranslation}
                  isLoading={isTranslating}
                  isSelected={entry.selectedModel === 'opus'}
                  onSelect={() => handleModelSelection(entry.id, 'opus', entry.opusTranslation || '')}
                  onEdit={(val) => handleTextEdit(entry.id, 'opus', val)}
                  colorClass="border-purple-500 bg-purple-50 dark:bg-purple-500/5"
                  badgeColor="bg-purple-100 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400"
                  latency={getDummyLatency('Opus MT')}
                  confidence={getDummyScore('Opus MT')}
                />
              </div>

              {/* Row 2: MBART (BL) & NLLB (BR) */}
              <div className="h-full">
                <TranslationCard
                  modelName="mBART-50"
                  translation={entry.mbartTranslation || entry.nlpTranslation}
                  isLoading={isTranslating}
                  isSelected={entry.selectedModel === 'mbart'}
                  onSelect={() => handleModelSelection(entry.id, 'mbart', entry.mbartTranslation || entry.nlpTranslation || '')}
                  onEdit={(val) => handleTextEdit(entry.id, 'mbart', val)}
                  colorClass="border-pink-500 bg-pink-50 dark:bg-pink-500/5"
                  badgeColor="bg-pink-100 dark:bg-pink-500/10 text-pink-700 dark:text-pink-400"
                  latency={getDummyLatency('mBART-50')}
                  confidence={getDummyScore('mBART-50')}
                />
              </div>

              <div className="h-full">
                <TranslationCard
                  modelName="NLLB-200"
                  translation={entry.nllbTranslation}
                  isLoading={isTranslating}
                  isSelected={entry.selectedModel === 'nllb'}
                  onSelect={() => handleModelSelection(entry.id, 'nllb', entry.nllbTranslation || '')}
                  onEdit={(val) => handleTextEdit(entry.id, 'nllb', val)}
                  colorClass="border-orange-500 bg-orange-50 dark:bg-orange-500/5"
                  badgeColor="bg-orange-100 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400"
                  latency={getDummyLatency('NLLB-200')}
                  confidence={getDummyScore('NLLB-200')}
                />
              </div>
            </div>

            {/* Spacer */}
            <div className="h-px bg-slate-800/50 w-full mt-4 mb-2"></div>
          </div>
        ))}

        <div className="h-20"></div>
      </div>
    </div>
  );
}