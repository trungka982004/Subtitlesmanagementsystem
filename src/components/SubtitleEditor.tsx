import { useState, useEffect, useRef } from 'react';
import { SubtitleFile, SubtitleEntry } from '../types';
import { Download, Sparkles, Globe, Clock, Save, CheckCircle2 } from 'lucide-react';
import { translateText } from '../services/libreTranslate';

interface SubtitleEditorProps {
  file: SubtitleFile;
  onUpdate: (file: SubtitleFile) => void;
}

export function SubtitleEditor({ file, onUpdate }: SubtitleEditorProps) {
  const [editedEntries, setEditedEntries] = useState<SubtitleEntry[]>(file.entries);
  const [isTranslating, setIsTranslating] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Sync state with props if file changes (e.g. switching files)
  useEffect(() => {
    setEditedEntries(file.entries);
  }, [file.id, file.entries]);

  // Update the translation when user types or selects a suggestion
  const handleTranslationChange = (id: number, translation: string) => {
    const updated = editedEntries.map(entry =>
      entry.id === id ? { ...entry, translation } : entry
    );
    setEditedEntries(updated);

    // Calculate progress (Split 50/50 between models)
    const translatedCount = updated.filter(e => e.translation && e.translation.trim().length > 0).length;
    const googleCount = updated.filter(e => e.googleTranslation).length;
    const nlpCount = updated.filter(e => e.nlpTranslation).length;
    const progress = updated.length > 0 ? Math.round(((googleCount / updated.length) * 50) + ((nlpCount / updated.length) * 50)) : 0;

    const status = progress === 100 ? 'done' : progress > 0 ? 'in-progress' : 'not-started';

    // Propagate up
    onUpdate({ ...file, entries: updated, progress, status });
  };

  const applySuggestion = (id: number, text: string) => {
    handleTranslationChange(id, text);
  };

  const handleAutoTranslate = async (type: 'google' | 'nlp') => {
    setIsTranslating(true);

    if (type === 'google') {
      try {
        const translationPromises = editedEntries.map(async (entry) => {
          // If already has google trans, ensure it's selected
          if (entry.googleTranslation) return { ...entry, translation: entry.googleTranslation };

          // Otherwise fetch new
          const translated = await translateText(entry.text, 'vi', 'auto');
          return { ...entry, googleTranslation: translated, translation: translated };
        });

        const updated = await Promise.all(translationPromises);

        // Update stats
        const translatedCount = updated.filter(e => e.translation && e.translation.trim().length > 0).length;
        const googleCount = updated.filter(e => e.googleTranslation).length;
        const nlpCount = updated.filter(e => e.nlpTranslation).length;
        const progress = updated.length > 0 ? Math.round(((googleCount / updated.length) * 50) + ((nlpCount / updated.length) * 50)) : 0;

        const status = progress === 100 ? 'done' : progress > 0 ? 'in-progress' : 'not-started';

        setEditedEntries(updated);
        onUpdate({ ...file, entries: updated, progress, status });
      } catch (error) {
        console.error("Translation failed", error);
      } finally {
        setIsTranslating(false);
      }
    } else {
      // Mock NLP
      setTimeout(() => {
        const updated = editedEntries.map(entry => {
          if (entry.nlpTranslation) return entry;
          return { ...entry, nlpTranslation: `[NLP] ${entry.text}` };
        });

        // Update stats (NLP also contributes to progress now)
        const translatedCount = updated.filter(e => e.translation && e.translation.trim().length > 0).length;
        const googleCount = updated.filter(e => e.googleTranslation).length;
        const nlpCount = updated.filter(e => e.nlpTranslation).length;
        const progress = updated.length > 0 ? Math.round(((googleCount / updated.length) * 50) + ((nlpCount / updated.length) * 50)) : 0;

        const status = progress === 100 ? 'done' : progress > 0 ? 'in-progress' : 'not-started';

        setEditedEntries(updated);
        onUpdate({ ...file, entries: updated, progress, status }); // Include progress update for NLP
        setIsTranslating(false);
      }, 1000);
    }
  };

  const handleExport = (translationType: 'target' | 'source') => {
    let srtContent = '';
    editedEntries.forEach(entry => {
      srtContent += `${entry.id}\n`;
      srtContent += `${entry.startTime} --> ${entry.endTime}\n`;
      if (translationType === 'target') {
        srtContent += `${entry.translation || ''}\n\n`;
      } else {
        srtContent += `${entry.text}\n\n`;
      }
    });

    const blob = new Blob([srtContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name.replace('.srt', `_${translationType}.srt`);
    a.click();
    URL.revokeObjectURL(url);
  };

  const timeToSeconds = (time: string): number => {
    const parts = time.split(':');
    const hours = parseInt(parts[0]);
    const minutes = parseInt(parts[1]);
    const secondsParts = parts[2].split(',');
    const seconds = parseInt(secondsParts[0]);
    const milliseconds = parseInt(secondsParts[1]) || 0;
    return hours * 3600 + minutes * 60 + seconds + milliseconds / 1000;
  };

  // Stats (Main Render)
  const translatedCount = editedEntries.filter(e => e.translation && e.translation.trim().length > 0).length;
  const googleCount = editedEntries.filter(e => e.googleTranslation).length;
  const nlpCount = editedEntries.filter(e => e.nlpTranslation).length;
  // Progress split 50/50
  const progressPercentage = editedEntries.length > 0 ? Math.round(((googleCount / editedEntries.length) * 50) + ((nlpCount / editedEntries.length) * 50)) : 0;


  // Helper for Duration Bar
  const maxDuration = 10; // Assume 10s is a "long" line for visual scaling cap

  return (
    <div className="flex flex-col w-full h-full bg-[#1e293b] font-sans rounded-b-lg overflow-hidden">

      {/* 1. Slim Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-slate-700 bg-[#1e293b] z-20 w-full shadow-lg shrink-0">
        <div className="flex items-center gap-4">
          <h2 className="font-semibold text-slate-100">{file.name}</h2>
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400">SRT</span>
            <span className={`px-2 py-0.5 rounded font-medium ${progressPercentage === 100
              ? 'bg-green-900/30 text-green-400 border border-green-500/30'
              : 'bg-blue-900/30 text-blue-400 border border-blue-500/30'
              }`}>
              {progressPercentage}%
            </span>
            <span className="text-slate-500">
              {translatedCount}/{editedEntries.length}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-[#0f172a] rounded-lg shadow-sm border border-slate-700 p-1 gap-1 ml-2">
            <span className="text-[10px] uppercase font-bold text-slate-500 px-2 tracking-wider">Model:</span>
            <button
              onClick={() => handleAutoTranslate('google')}
              disabled={isTranslating}
              className="px-3 py-1.5 text-xs font-bold text-slate-300 hover:bg-slate-700 rounded-md disabled:opacity-50 transition-all flex items-center gap-2 border border-transparent hover:border-slate-600"
            >
              <Globe className="w-3.5 h-3.5 text-blue-500" />
              <span>Libre</span>
            </button>
            <div className="w-px h-4 bg-slate-700 mx-1"></div>
            <button
              onClick={() => handleAutoTranslate('nlp')}
              disabled={isTranslating}
              className="px-3 py-1.5 text-xs font-bold text-slate-300 hover:bg-slate-700 rounded-md disabled:opacity-50 transition-all flex items-center gap-2 border border-transparent hover:border-slate-600"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-500" />
              <span>NLP</span>
            </button>
          </div>

          <button
            onClick={() => handleExport('target')}
            className="p-2 text-slate-400 hover:bg-slate-700 rounded transition-colors" title="Export"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={() => onUpdate({ ...file, status: 'done', progress: 100 })}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded shadow-sm transition-colors"
          >
            <Save className="w-3 h-3" /> Save
          </button>
        </div>
      </div>

      {/* 2. Distinct Column Headers */}
      <div className="flex gap-4 px-4 py-2 border-b border-slate-700 text-xs font-bold uppercase tracking-wider bg-[#1e293b] shadow-md w-full shrink-0">
        <div style={{ flex: 2 }} className="px-4 py-3 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-lg border border-slate-200 dark:border-slate-700 font-extrabold tracking-tight">
          Source Text
        </div>
        <div style={{ flex: 5 }} className="px-4 py-3 bg-green-600 text-white rounded-lg border border-green-500 shadow-sm font-bold">
          LibreTranslate (Machine)
        </div>
        <div style={{ flex: 5 }} className="px-4 py-3 bg-purple-600 text-white rounded-lg border border-purple-500 shadow-sm font-bold">
          NLP Model (Advanced)
        </div>
      </div>

      {/* 3. Main List Content */}
      <div
        ref={scrollContainerRef}
        className="w-full bg-[#1e293b] custom-scrollbar overflow-y-auto"
        style={{ flex: 1 }}
      >
        {editedEntries.map((entry) => {
          const isGoogleSelected = entry.translation === entry.googleTranslation && !!entry.googleTranslation;
          const isNlpSelected = entry.translation === entry.nlpTranslation && !!entry.nlpTranslation;

          return (
            <div key={entry.id} className="flex gap-4 px-4 py-4 border-b border-slate-800 min-h-[100px] hover:bg-slate-800/30 transition-colors w-full">

              {/* Col 1: Source (White -> Dark) */}
              <div style={{ flex: 2 }} className="p-4 text-sm bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-200 flex flex-col gap-2 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mb-1">
                  <span className="font-bold">#{entry.id}</span>
                  <span>{entry.startTime}</span>
                </div>
                <p className="leading-relaxed whitespace-pre-wrap font-medium">
                  {entry.text}
                </p>
              </div>

              {/* Col 2: LibreTranslate (Green) */}
              <div
                style={{ flex: 5 }}
                onClick={() => entry.googleTranslation && handleTranslationChange(entry.id, entry.googleTranslation)}
                className={`p-4 text-sm transition-all relative flex flex-col rounded-lg border
                    ${isGoogleSelected
                    ? 'bg-green-900/20 border-green-500 ring-1 ring-green-500 shadow-sm cursor-pointer'
                    : entry.googleTranslation
                      ? 'bg-green-900/10 border-green-500/20 hover:bg-green-900/30 cursor-pointer'
                      : 'bg-slate-800/20 border-slate-700/50 cursor-default'
                  }
                `}
              >
                {isGoogleSelected && (
                  <div className="absolute top-2 right-2 text-green-400">
                    <CheckCircle2 className="w-5 h-5 fill-green-900/50" />
                  </div>
                )}

                <p className={`leading-relaxed whitespace-pre-wrap flex-1 mt-1 ${isGoogleSelected
                  ? 'text-green-300 font-medium'
                  : 'text-slate-300'
                  }`}>
                  {entry.googleTranslation || <span className="text-slate-600 italic">No translation available</span>}
                </p>
              </div>

              {/* Col 3: NLP Model (Purple) */}
              <div
                style={{ flex: 5 }}
                onClick={() => entry.nlpTranslation && handleTranslationChange(entry.id, entry.nlpTranslation)}
                className={`p-4 text-sm transition-all relative flex flex-col rounded-lg border
                    ${isNlpSelected
                    ? 'bg-purple-900/20 border-purple-500 ring-1 ring-purple-500 shadow-sm cursor-pointer'
                    : entry.nlpTranslation
                      ? 'bg-purple-900/10 border-purple-500/20 hover:bg-purple-900/30 cursor-pointer'
                      : 'bg-slate-800/20 border-slate-700/50 cursor-default'
                  }
                `}
              >
                {isNlpSelected && (
                  <div className="absolute top-2 right-2 text-purple-400">
                    <CheckCircle2 className="w-5 h-5 fill-purple-900/50" />
                  </div>
                )}

                <p className={`leading-relaxed whitespace-pre-wrap flex-1 mt-1 ${isNlpSelected
                  ? 'text-purple-300 font-medium'
                  : 'text-slate-300'
                  }`}>
                  {entry.nlpTranslation || <span className="text-slate-600 italic">No translation available</span>}
                </p>
              </div>

            </div>
          )
        })}
      </div>
    </div>
  );
}