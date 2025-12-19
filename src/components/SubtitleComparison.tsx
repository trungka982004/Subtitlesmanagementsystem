import { useState } from 'react';
import { SubtitleFile } from '../App';
import { ArrowLeftRight, AlertTriangle } from 'lucide-react';

interface SubtitleComparisonProps {
  files: SubtitleFile[];
}

export function SubtitleComparison({ files }: SubtitleComparisonProps) {
  const [file1, setFile1] = useState<SubtitleFile | null>(files[0] || null);
  const [file2, setFile2] = useState<SubtitleFile | null>(files[1] || null);
  const [syncMode, setSyncMode] = useState<'index' | 'time'>('index');

  if (files.length < 2) {
    return (
      <div className="text-center py-12 text-gray-400 dark:text-slate-500">
        <ArrowLeftRight className="w-12 h-12 mx-auto mb-3" />
        <p>Upload at least 2 subtitle files to compare</p>
      </div>
    );
  }

  const timeToSeconds = (time: string): number => {
    const parts = time.split(':');
    const hours = parseInt(parts[0]);
    const minutes = parseInt(parts[1]);
    const secondsParts = parts[2].split(',');
    const seconds = parseInt(secondsParts[0]);
    const milliseconds = parseInt(secondsParts[1]);
    return hours * 3600 + minutes * 60 + seconds + milliseconds / 1000;
  };

  const findMatchingEntry = (entry: any, targetFile: SubtitleFile) => {
    if (syncMode === 'index') {
      return targetFile.entries.find(e => e.id === entry.id);
    } else {
      const entryStartTime = timeToSeconds(entry.startTime);
      return targetFile.entries.find(e => {
        const targetStartTime = timeToSeconds(e.startTime);
        return Math.abs(targetStartTime - entryStartTime) < 1;
      });
    }
  };

  if (!file1 || !file2) {
    return null;
  }

  const maxEntries = Math.max(file1.entries.length, file2.entries.length);
  const timingMismatches = file1.entries.filter((entry, index) => {
    const matching = findMatchingEntry(entry, file2);
    if (!matching) return false;
    const diff = Math.abs(
      timeToSeconds(entry.startTime) - timeToSeconds(matching.startTime)
    );
    return diff > 0.5;
  }).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-gray-700 dark:text-slate-300 mb-2">
            First File
          </label>
          <select
            value={file1.id}
            onChange={(e) => {
              const selected = files.find(f => f.id === e.target.value);
              if (selected) setFile1(selected);
            }}
            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-850 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {files.map(file => (
              <option key={file.id} value={file.id}>
                {file.name} ({file.language})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-gray-700 dark:text-slate-300 mb-2">
            Second File
          </label>
          <select
            value={file2.id}
            onChange={(e) => {
              const selected = files.find(f => f.id === e.target.value);
              if (selected) setFile2(selected);
            }}
            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-850 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {files.map(file => (
              <option key={file.id} value={file.id}>
                {file.name} ({file.language})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
        <div className="flex gap-4">
          <button
            onClick={() => setSyncMode('index')}
            className={`px-4 py-2 rounded-lg transition-colors ${syncMode === 'index'
              ? 'bg-blue-600 text-white'
              : 'bg-white dark:bg-slate-850 text-gray-700 dark:text-slate-300 border border-gray-300 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800'
              }`}
          >
            Sync by Index
          </button>
          <button
            onClick={() => setSyncMode('time')}
            className={`px-4 py-2 rounded-lg transition-colors ${syncMode === 'time'
              ? 'bg-blue-600 text-white'
              : 'bg-white dark:bg-slate-850 text-gray-700 dark:text-slate-300 border border-gray-300 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800'
              }`}
          >
            Sync by Time
          </button>
        </div>

        {timingMismatches > 0 && (
          <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
            <AlertTriangle className="w-5 h-5" />
            <span>{timingMismatches} timing mismatches</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="sticky top-0 bg-blue-50 dark:bg-blue-900-20 p-3 rounded-lg border border-blue-200 dark:border-blue-900/30">
            <h3 className="text-blue-900 dark:text-blue-200">{file1.name}</h3>
            <p className="text-blue-700 dark:text-blue-300">{file1.entries.length} entries</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="sticky top-0 bg-green-50 dark:bg-green-900-20 p-3 rounded-lg border border-green-200 dark:border-green-900/30">
            <h3 className="text-green-900 dark:text-green-200">{file2.name}</h3>
            <p className="text-green-700 dark:text-green-300">{file2.entries.length} entries</p>
          </div>
        </div>
      </div>

      <div className="max-h-[600px] overflow-y-auto space-y-3">
        {Array.from({ length: maxEntries }).map((_, index) => {
          const entry1 = file1.entries[index];
          const entry2 = entry1 ? findMatchingEntry(entry1, file2) : file2.entries[index];

          if (!entry1 && !entry2) return null;

          const timingDiff = entry1 && entry2
            ? Math.abs(timeToSeconds(entry1.startTime) - timeToSeconds(entry2.startTime))
            : 0;

          const hasTimingMismatch = timingDiff > 0.5;
          const lengthDiff = entry1 && entry2
            ? Math.abs(entry1.text.length - entry2.text.length)
            : 0;

          return (
            <div
              key={index}
              className={`grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 rounded-lg border ${hasTimingMismatch
                ? 'bg-orange-50 dark:bg-orange-900-20 border-orange-200 dark:border-orange-900/50'
                : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700'
                }`}
            >
              <div className={`p-3 rounded ${entry1 ? 'bg-blue-50 dark:bg-blue-900-20 border border-transparent dark:border-blue-900/30' : 'bg-gray-100 dark:bg-slate-800'}`}>
                {entry1 ? (
                  <>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-blue-200 dark:bg-blue-900 dark:border dark:border-blue-700 text-blue-900 dark:text-blue-100 rounded text-xs">
                        #{entry1.id}
                      </span>
                      <span className="text-blue-800 dark:text-blue-300">
                        {entry1.startTime}
                      </span>
                    </div>
                    <p className="text-gray-900 dark:text-blue-100 mb-2">{entry1.text}</p>
                    {entry1.translation && (
                      <p className="text-gray-700 dark:text-slate-400 italic border-t border-blue-200 dark:border-blue-900/30 pt-2 mt-2">
                        {entry1.translation}
                      </p>
                    )}
                    <p className="text-blue-700 dark:text-blue-400 mt-2">
                      {entry1.text.length} characters
                    </p>
                  </>
                ) : (
                  <p className="text-gray-400 dark:text-slate-500 text-center py-4">No matching entry</p>
                )}
              </div>

              <div className={`p-3 rounded ${entry2 ? 'bg-green-50 dark:bg-green-900-20 border border-transparent dark:border-green-900/30' : 'bg-gray-100 dark:bg-slate-800'}`}>
                {entry2 ? (
                  <>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-green-200 dark:bg-green-900 dark:border dark:border-green-700 text-green-900 dark:text-green-100 rounded text-xs">
                        #{entry2.id}
                      </span>
                      <span className="text-green-800 dark:text-green-300">
                        {entry2.startTime}
                      </span>
                      {hasTimingMismatch && (
                        <span className="px-2 py-1 bg-orange-200 dark:bg-orange-900 dark:border dark:border-orange-700 text-orange-900 dark:text-orange-100 rounded text-xs">
                          Δ {timingDiff.toFixed(1)}s
                        </span>
                      )}
                    </div>
                    <p className="text-gray-900 dark:text-green-100 mb-2">{entry2.text}</p>
                    {entry2.translation && (
                      <p className="text-gray-700 dark:text-slate-400 italic border-t border-green-200 dark:border-green-900/30 pt-2 mt-2">
                        {entry2.translation}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-green-700 dark:text-green-400">
                        {entry2.text.length} characters
                      </p>
                      {lengthDiff > 20 && (
                        <span className="text-orange-600 dark:text-orange-400">
                          Δ {lengthDiff} chars
                        </span>
                      )}
                    </div>
                  </>
                ) : (
                  <p className="text-gray-400 dark:text-slate-500 text-center py-4">No matching entry</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
