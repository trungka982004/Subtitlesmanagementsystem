import { useState, useEffect, useRef } from 'react';
import { SubtitleFile, SubtitleEntry } from '../App';
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
    <div className="flex flex-col h-full w-full bg-white dark:bg-gray-900 font-sans">

      {/* 1. Slim Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 z-10 sticky top-0 w-full">
        <div className="flex items-center gap-4">
          <h2 className="font-semibold text-gray-800 dark:text-gray-100">{file.name}</h2>
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500">SRT</span>
            <span className={`px-2 py-0.5 rounded font-medium ${progressPercentage === 100
              ? 'bg-green-100 text-green-700'
              : 'bg-blue-100 text-blue-700'
              }`}>
              {progressPercentage}%
            </span>
            <span className="text-gray-400">
              {translatedCount}/{editedEntries.length}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-1 gap-1 ml-2">
            <span className="text-[10px] uppercase font-bold text-gray-400 px-2 tracking-wider">Model:</span>
            <button
              onClick={() => handleAutoTranslate('google')}
              disabled={isTranslating}
              className="px-3 py-1.5 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md disabled:opacity-50 transition-all flex items-center gap-2 border border-transparent hover:border-gray-200 dark:hover:border-gray-600"
            >
              <Globe className="w-3.5 h-3.5 text-blue-500" />
              <span>Libre</span>
            </button>
            <div className="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-1"></div>
            <button
              onClick={() => handleAutoTranslate('nlp')}
              disabled={isTranslating}
              className="px-3 py-1.5 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md disabled:opacity-50 transition-all flex items-center gap-2 border border-transparent hover:border-gray-200 dark:hover:border-gray-600"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-500" />
              <span>NLP</span>
            </button>
          </div>

          <button
            onClick={() => handleExport('target')}
            className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors" title="Export"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={() => onUpdate({ ...file, status: 'done', progress: 100 })}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded shadow-sm transition-colors"
          >
            <Save className="w-3 h-3" /> Save
          </button>
        </div>
      </div>

      {/* 2. Distinct Column Headers */}
      <div className="flex gap-4 px-4 py-2 border-b border-gray-200 dark:border-gray-800 text-xs font-bold uppercase tracking-wider sticky top-[61px] z-10 bg-white dark:bg-gray-900 shadow-sm w-full">
        <div style={{ flex: 2 }} className="px-4 py-3 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg">
          Source Text
        </div>
        <div style={{ flex: 5 }} className="px-4 py-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg">
          LibreTranslate (Machine)
        </div>
        <div style={{ flex: 5 }} className="px-4 py-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-lg">
          NLP Model (Advanced)
        </div>
      </div>

      {/* 3. Main List Content */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto bg-white dark:bg-gray-900 w-full"
      >
        {editedEntries.map((entry) => {
          const isGoogleSelected = entry.translation === entry.googleTranslation && !!entry.googleTranslation;
          const isNlpSelected = entry.translation === entry.nlpTranslation && !!entry.nlpTranslation;

          return (
            <div key={entry.id} className="flex gap-4 px-4 py-4 border-b border-gray-100 dark:border-gray-800 min-h-[100px] hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors w-full">

              {/* Col 1: Source (Gray) */}
              <div style={{ flex: 2 }} className="p-4 text-sm bg-gray-100 dark:bg-gray-800/80 text-gray-900 dark:text-gray-100 flex flex-col gap-2 rounded-lg">
                <div className="flex items-center justify-between text-[10px] text-gray-500 font-mono mb-1">
                  <span className="font-bold">#{entry.id}</span>
                  <span>{entry.startTime}</span>
                </div>
                <p className="leading-relaxed whitespace-pre-wrap">
                  {entry.text}
                </p>
              </div>

              {/* Col 2: LibreTranslate (Green) */}
              <div
                style={{ flex: 5 }}
                onClick={() => entry.googleTranslation && handleTranslationChange(entry.id, entry.googleTranslation)}
                className={`p-4 text-sm transition-all relative flex flex-col rounded-lg
                    ${isGoogleSelected
                    ? 'bg-green-100 dark:bg-green-900/40 ring-2 ring-green-500/20 dark:ring-green-400/20 shadow-sm cursor-pointer'
                    : entry.googleTranslation
                      ? 'bg-green-50 hover:bg-green-100 dark:bg-green-900/10 dark:hover:bg-green-900/20 cursor-pointer border border-transparent hover:border-green-200 dark:hover:border-green-800'
                      : 'bg-green-50/50 dark:bg-green-900/5 cursor-default'
                  }
                `}
              >
                {isGoogleSelected && (
                  <div className="absolute top-2 right-2 text-green-600 dark:text-green-400">
                    <CheckCircle2 className="w-5 h-5 fill-green-100" />
                  </div>
                )}

                <p className={`leading-relaxed whitespace-pre-wrap flex-1 mt-1 ${isGoogleSelected
                  ? 'text-green-900 dark:text-green-100 font-medium'
                  : 'text-gray-700 dark:text-gray-300'
                  }`}>
                  {entry.googleTranslation || <span className="text-gray-400 italic">No translation available</span>}
                </p>
              </div>

              {/* Col 3: NLP Model (Blue) */}
              <div
                style={{ flex: 5 }}
                onClick={() => entry.nlpTranslation && handleTranslationChange(entry.id, entry.nlpTranslation)}
                className={`p-4 text-sm transition-all relative flex flex-col rounded-lg
                    ${isNlpSelected
                    ? 'bg-blue-100 dark:bg-blue-900/30 ring-2 ring-blue-500/20 dark:ring-blue-400/20 shadow-sm cursor-pointer'
                    : entry.nlpTranslation
                      ? 'bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/10 dark:hover:bg-blue-900/20 cursor-pointer border border-transparent hover:border-blue-200 dark:hover:border-blue-800'
                      : 'bg-blue-50/50 dark:bg-blue-900/5 cursor-default'
                  }
                `}
              >
                {isNlpSelected && (
                  <div className="absolute top-2 right-2 text-blue-600 dark:text-blue-400">
                    <CheckCircle2 className="w-5 h-5 fill-blue-100" />
                  </div>
                )}

                <p className={`leading-relaxed whitespace-pre-wrap flex-1 mt-1 ${isNlpSelected
                  ? 'text-blue-900 dark:text-blue-100 font-medium'
                  : 'text-gray-700 dark:text-gray-300'
                  }`}>
                  {entry.nlpTranslation || <span className="text-gray-400 italic">No translation available</span>}
                </p>
              </div>

            </div>
          )
        })}
      </div>
    </div>
  );
}