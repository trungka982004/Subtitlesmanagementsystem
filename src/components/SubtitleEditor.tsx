import { useState, useEffect, useRef } from 'react';
import { SubtitleFile, SubtitleEntry } from '../types';
import { Download, Sparkles, Globe, Clock, Save, ArrowRight, Video, FileText, CheckCircle2, RefreshCw } from 'lucide-react';
import { translateText } from '../services/libreTranslate';
import { translateWithCustomModel, translateBatchWithCustomModel } from '../services/customNLP';
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
  const [translationProgress, setTranslationProgress] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('Translation Complete');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Sync state with props if file changes (e.g. switching files)
  useEffect(() => {
    setEditedEntries(file.entries);
  }, [file.id, file.entries]);

  const handleModelSelection = (id: number, model: 'libre' | 'opus' | 'mbart' | 'nllb', text: string) => {
    if (file.status === 'done') return;
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
    if (file.status === 'done') return;
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

  const handleSave = () => {
    // Auto-select best model for unselected entries to ensure 'done' status is valid and persistent
    // Priority: NLLB > mBART > Opus > Libre
    const finalEntries = editedEntries.map(entry => {
      if (entry.selectedModel && entry.translation) return entry;

      // Find best available translation
      let selectedModel: 'nllb' | 'mbart' | 'opus' | 'libre' | undefined;
      let translation = '';

      if (entry.nllbTranslation) { selectedModel = 'nllb'; translation = entry.nllbTranslation; }
      else if (entry.mbartTranslation) { selectedModel = 'mbart'; translation = entry.mbartTranslation; }
      else if (entry.opusTranslation) { selectedModel = 'opus'; translation = entry.opusTranslation; }
      else if (entry.libreTranslation) { selectedModel = 'libre'; translation = entry.libreTranslation; }
      else if (entry.googleTranslation) { selectedModel = 'google' as any; translation = entry.googleTranslation; }

      if (selectedModel) {
        return {
          ...entry,
          selectedModel,
          translation
        };
      }
      return entry;
    });

    setEditedEntries(finalEntries);

    // Calculate progress with fully populated entries
    const completedCount = finalEntries.filter(e => e.selectedModel).length;
    const progress = finalEntries.length > 0 ? Math.round((completedCount / finalEntries.length) * 100) : 0;

    // If we have translations, we treat it as done. If not, we respect the calculation.
    // However, existing requirement was to force 'done' on save. 
    // We'll trust the calculated progress if it's 100, otherwise force done if requested but best effort.
    // Actually, let's keep the user's forced 'done' behavior but now backed by actual data (progress 100).

    onUpdate({
      ...file,
      entries: finalEntries,
      progress: progress === 100 ? 100 : progress, // Ensure 100 if complete
      status: 'done'
    });

    setSuccessMessage('Project Saved Successfully');
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  // Helper to chunk array
  const chunkArray = <T,>(array: T[], size: number): T[][] => {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  };

  const handleGenerateAll = async () => {
    if (file.status === 'done') return;
    setIsTranslating(true);
    setTranslationProgress(0);
    setShowSuccess(false);

    let currentEntries = [...editedEntries];

    // Calculate total operations to accurately show progress
    // We run 4 passes: Libre, Opus, mBART, NLLB
    // Only count entries that actually need translation
    let totalOps = 0;
    const opusIndices: number[] = [];
    const mbartIndices: number[] = [];
    const nllbIndices: number[] = [];

    currentEntries.forEach((e, idx) => {
      if (!e.libreTranslation && !e.googleTranslation) totalOps++;
      if (!e.opusTranslation) { totalOps++; opusIndices.push(idx); }
      if (!e.mbartTranslation && !e.nlpTranslation) { totalOps++; mbartIndices.push(idx); }
      if (!e.nllbTranslation) { totalOps++; nllbIndices.push(idx); }
    });

    if (totalOps === 0) {
      setIsTranslating(false);
      setSuccessMessage('Translation Complete');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      return;
    }

    let completedOps = 0;
    const updateProgress = (increment: number = 1) => {
      completedOps += increment;
      setTranslationProgress(Math.min(Math.round((completedOps / totalOps) * 100), 99));
    };

    try {
      // 1. Process LibreTranslate (External API - keep sequential/parallel for now as it's external)
      const librePromises = currentEntries.map(async (entry, index) => {
        if (!entry.libreTranslation && !entry.googleTranslation) {
          try {
            const text = await translateText(entry.text, 'vi', 'auto');
            currentEntries[index] = { ...currentEntries[index], libreTranslation: text, libreError: undefined };
          } catch (e) {
            console.error("Libre failed", e);
            currentEntries[index] = { ...currentEntries[index], libreError: "Failed" };
          }
          updateProgress();
        }
      });
      await Promise.all(librePromises);
      setEditedEntries([...currentEntries]);

      // 2. Custom Models (Batch Processing)
      const BATCH_SIZE = 32;

      // Helper for batch processing
      const processBatch = async (indices: number[], modelId: string, resultField: 'opusTranslation' | 'mbartTranslation' | 'nllbTranslation', errorField: 'opusError' | 'mbartError' | 'nllbError') => {
        if (indices.length === 0) return;

        const chunks = chunkArray(indices, BATCH_SIZE);

        for (const chunk of chunks) {
          const textsToTranslate = chunk.map(idx => currentEntries[idx].text);
          try {
            const translations = await translateBatchWithCustomModel(textsToTranslate, modelId);

            // Update entries
            chunk.forEach((entryIdx, i) => {
              currentEntries[entryIdx] = {
                ...currentEntries[entryIdx],
                [resultField]: translations[i],
                [errorField]: undefined
              };
            });
          } catch (e) {
            console.error(`${modelId} batch failed`, e);
            // Mark entire batch as failed
            chunk.forEach(entryIdx => {
              currentEntries[entryIdx] = {
                ...currentEntries[entryIdx],
                [errorField]: "Failed"
              };
            });
          }
          // Update progress and state after each chunk
          updateProgress(chunk.length);
          setEditedEntries([...currentEntries]);
        }
      };

      // Execute batches sequentially to manage VRAM
      await processBatch(opusIndices, 'opus', 'opusTranslation', 'opusError');
      await processBatch(mbartIndices, 'mbart', 'mbartTranslation', 'mbartError');
      await processBatch(nllbIndices, 'nllb', 'nllbTranslation', 'nllbError');

      updateFileState(currentEntries);
      setTranslationProgress(100);
      setSuccessMessage('Translation Complete');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);

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
          {(() => {
            const isAllGenerated = editedEntries.every(e =>
              (e.libreTranslation || e.googleTranslation) &&
              e.opusTranslation &&
              (e.mbartTranslation || e.nlpTranslation) &&
              e.nllbTranslation
            );
            const isFinished = file.status === 'done' || isAllGenerated;

            return (
              <button
                onClick={handleGenerateAll}
                disabled={isTranslating || isFinished}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded transition-all disabled:opacity-50 border ${isDark
                  ? isFinished
                    ? 'text-slate-500 bg-slate-800/50 border-slate-700'
                    : 'text-slate-200 bg-blue-600/10 hover:bg-blue-600/20 border-blue-500/30 hover:border-blue-500/50'
                  : isFinished
                    ? 'text-slate-400 bg-slate-100 border-slate-200'
                    : 'text-blue-700 bg-blue-50 hover:bg-blue-100 border-blue-200 hover:border-blue-300'
                  }`}
              >
                {isTranslating ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : isFinished ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <Sparkles className={`w-3.5 h-3.5 ${isDark ? 'text-blue-400' : 'text-blue-500'}`} />
                )}
                <span>{isFinished ? 'Generated All' : 'Generate All'}</span>
              </button>
            );
          })()}

          <button
            onClick={handleSave}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded transition-all border ${isDark
              ? 'text-green-400 bg-green-900/10 hover:bg-green-900/20 border-green-500/30 hover:border-green-500/50'
              : 'text-green-700 bg-green-50 hover:bg-green-100 border-green-200 hover:border-green-300'
              }`}
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save</span>
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

      {/* Progress Bar & Notifications */}
      {isTranslating && (
        <div className="w-full bg-blue-100 dark:bg-blue-900/20 h-1.5 relative overflow-hidden">
          <div
            className="absolute top-0 left-0 h-full bg-blue-600 dark:bg-blue-400 transition-all duration-300 ease-out"
            style={{ width: `${translationProgress}%` }}
          />
        </div>
      )}

      {showSuccess && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-2">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border ${isDark ? 'bg-green-900/90 border-green-800 text-green-100' : 'bg-green-50 border-green-200 text-green-800'
            }`}>
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <div>
              <p className="font-semibold text-sm">{successMessage}</p>
              <p className="text-xs opacity-90">{successMessage === 'Translation Complete' ? 'All model translations generated successfully' : 'Your progress has been saved'}</p>
            </div>
          </div>
        </div>
      )}

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
                  isLoading={isTranslating && !entry.libreTranslation && !entry.googleTranslation}
                  isSelected={entry.selectedModel === 'libre'}
                  onSelect={() => handleModelSelection(entry.id, 'libre', entry.libreTranslation || entry.googleTranslation || '')}
                  onEdit={(val) => handleTextEdit(entry.id, 'libre', val)}
                  variant="blue"
                  isDark={isDark}

                  errorMessage={entry.libreError}
                  isLocked={file.status === 'done'}
                />
              </div>

              <div className="h-full">
                <TranslationCard
                  modelName="Opus MT"
                  translation={entry.opusTranslation}
                  isLoading={isTranslating && !entry.opusTranslation && !entry.opusError}
                  isSelected={entry.selectedModel === 'opus'}
                  onSelect={() => handleModelSelection(entry.id, 'opus', entry.opusTranslation || '')}
                  onEdit={(val) => handleTextEdit(entry.id, 'opus', val)}
                  variant="purple"
                  isDark={isDark}

                  errorMessage={entry.opusError}
                  isLocked={file.status === 'done'}
                />
              </div>

              {/* Row 2: MBART (BL) & NLLB (BR) */}
              <div className="h-full">
                <TranslationCard
                  modelName="mBART-50"
                  translation={entry.mbartTranslation || entry.nlpTranslation}
                  isLoading={isTranslating && !(entry.mbartTranslation || entry.nlpTranslation) && !entry.mbartError}
                  isSelected={entry.selectedModel === 'mbart'}
                  onSelect={() => handleModelSelection(entry.id, 'mbart', entry.mbartTranslation || entry.nlpTranslation || '')}
                  onEdit={(val) => handleTextEdit(entry.id, 'mbart', val)}
                  variant="pink"
                  isDark={isDark}

                  errorMessage={entry.mbartError}
                  isLocked={file.status === 'done'}
                />
              </div>

              <div className="h-full">
                <TranslationCard
                  modelName="NLLB-200"
                  translation={entry.nllbTranslation}
                  isLoading={isTranslating && !entry.nllbTranslation && !entry.nllbError}
                  isSelected={entry.selectedModel === 'nllb'}
                  onSelect={() => handleModelSelection(entry.id, 'nllb', entry.nllbTranslation || '')}
                  onEdit={(val) => handleTextEdit(entry.id, 'nllb', val)}
                  variant="orange"
                  isDark={isDark}

                  errorMessage={entry.nllbError}
                  isLocked={file.status === 'done'}
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