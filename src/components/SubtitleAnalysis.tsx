import { SubtitleFile } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, Clock, Type, AlertCircle } from 'lucide-react';

interface SubtitleAnalysisProps {
  files: SubtitleFile[];
  selectedFile: SubtitleFile | null;
  onSelectFile: (file: SubtitleFile) => void;
}

export function SubtitleAnalysis({ files, selectedFile, onSelectFile }: SubtitleAnalysisProps) {
  if (files.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400 dark:text-slate-500">
        <BarChart className="w-12 h-12 mx-auto mb-3" />
        <p>Upload subtitle files to see analysis</p>
      </div>
    );
  }

  const analyzeFile = (file: SubtitleFile) => {
    const timeToSeconds = (time: string): number => {
      const parts = time.split(':');
      const hours = parseInt(parts[0]);
      const minutes = parseInt(parts[1]);
      const secondsParts = parts[2].split(',');
      const seconds = parseInt(secondsParts[0]);
      const milliseconds = parseInt(secondsParts[1]);
      return hours * 3600 + minutes * 60 + seconds + milliseconds / 1000;
    };

    let totalChars = 0;
    let totalTranslationChars = 0;
    let totalDuration = 0;
    let gaps = 0;
    let tooFastCount = 0;
    let tooSlowCount = 0;
    const durations: number[] = [];
    const charCounts: number[] = [];

    file.entries.forEach((entry, index) => {
      const startSeconds = timeToSeconds(entry.startTime);
      const endSeconds = timeToSeconds(entry.endTime);
      const duration = endSeconds - startSeconds;

      totalChars += entry.text.length;
      if (entry.translation) {
        totalTranslationChars += entry.translation.length;
      }
      totalDuration += duration;
      durations.push(duration);
      charCounts.push(entry.text.length);

      const charPerSecond = entry.text.length / duration;
      if (charPerSecond > 20) tooFastCount++;
      if (charPerSecond < 10) tooSlowCount++;

      if (index < file.entries.length - 1) {
        const nextStart = timeToSeconds(file.entries[index + 1].startTime);
        const gap = nextStart - endSeconds;
        if (gap > 2) gaps++;
      }
    });

    const avgDuration = totalDuration / file.entries.length;
    const avgCharsPerEntry = totalChars / file.entries.length;
    const avgCharsPerSecond = totalChars / totalDuration;
    const translationProgress = file.entries.filter(e => e.translation).length / file.entries.length * 100;

    return {
      totalEntries: file.entries.length,
      totalChars,
      totalTranslationChars,
      totalDuration,
      avgDuration,
      avgCharsPerEntry,
      avgCharsPerSecond,
      translationProgress,
      gaps,
      tooFastCount,
      tooSlowCount,
      durations,
      charCounts,
    };
  };

  const fileToAnalyze = selectedFile || files[0];
  const stats = analyzeFile(fileToAnalyze);

  const durationData = fileToAnalyze.entries.map((entry, index) => {
    const timeToSeconds = (time: string): number => {
      const parts = time.split(':');
      const hours = parseInt(parts[0]);
      const minutes = parseInt(parts[1]);
      const secondsParts = parts[2].split(',');
      const seconds = parseInt(secondsParts[0]);
      const milliseconds = parseInt(secondsParts[1]);
      return hours * 3600 + minutes * 60 + seconds + milliseconds / 1000;
    };

    const duration = timeToSeconds(entry.endTime) - timeToSeconds(entry.startTime);
    const charCount = entry.text.length;
    const readingSpeed = charCount / duration;

    return {
      index: index + 1,
      duration: parseFloat(duration.toFixed(2)),
      chars: charCount,
      readingSpeed: parseFloat(readingSpeed.toFixed(2)),
    };
  });

  const comparisonData = files.map(file => {
    const analysis = analyzeFile(file);
    return {
      name: file.name.length > 20 ? file.name.substring(0, 20) + '...' : file.name,
      entries: analysis.totalEntries,
      avgDuration: parseFloat(analysis.avgDuration.toFixed(2)),
      avgChars: parseFloat(analysis.avgCharsPerEntry.toFixed(0)),
      translation: parseFloat(analysis.translationProgress.toFixed(0)),
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-gray-700 dark:text-slate-300 mb-2">
          Select File to Analyze
        </label>
        <select
          value={fileToAnalyze.id}
          onChange={(e) => {
            const file = files.find(f => f.id === e.target.value);
            if (file) onSelectFile(file);
          }}
          className="w-full max-w-md px-4 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-850 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {files.map(file => (
            <option key={file.id} value={file.id}>
              {file.name} ({file.language})
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-blue-50 dark:bg-blue-900-20 rounded-lg border border-blue-200 dark:border-blue-900/30">
          <div className="flex items-center gap-2 mb-2">
            <Type className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span className="text-blue-900 dark:text-blue-200">Total Characters</span>
          </div>
          <p className="text-blue-900 dark:text-blue-100">{stats.totalChars.toLocaleString()}</p>
          <p className="text-blue-700 dark:text-blue-300 mt-1">
            Avg: {stats.avgCharsPerEntry.toFixed(0)} per entry
          </p>
        </div>

        <div className="p-4 bg-green-50 dark:bg-green-900-20 rounded-lg border border-green-200 dark:border-green-900/30">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-green-600 dark:text-green-400" />
            <span className="text-green-900 dark:text-green-200">Duration</span>
          </div>
          <p className="text-green-900 dark:text-green-100">
            {Math.floor(stats.totalDuration / 60)}m {(stats.totalDuration % 60).toFixed(0)}s
          </p>
          <p className="text-green-700 dark:text-green-300 mt-1">
            Avg: {stats.avgDuration.toFixed(1)}s per entry
          </p>
        </div>

        <div className="p-4 bg-purple-50 dark:bg-purple-900-20 rounded-lg border border-purple-200 dark:border-purple-900/30">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <span className="text-purple-900 dark:text-purple-200">Reading Speed</span>
          </div>
          <p className="text-purple-900 dark:text-purple-100">
            {stats.avgCharsPerSecond.toFixed(1)} chars/sec
          </p>
          <p className="text-purple-700 dark:text-purple-300 mt-1">
            Optimal: 15-17 chars/sec
          </p>
        </div>

        <div className="p-4 bg-orange-50 dark:bg-orange-900-20 rounded-lg border border-orange-200 dark:border-orange-900/30">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            <span className="text-orange-900 dark:text-orange-200">Issues</span>
          </div>
          <p className="text-orange-900 dark:text-orange-100">
            {stats.tooFastCount} too fast
          </p>
          <p className="text-orange-700 dark:text-orange-300 mt-1">
            {stats.gaps} large gaps
          </p>
        </div>
      </div>

      {stats.translationProgress > 0 && (
        <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800">
          <h3 className="text-gray-900 dark:text-slate-200 mb-3">Translation Progress</h3>
          <div className="w-full bg-gray-200 dark:bg-slate-800 rounded-full h-6 overflow-hidden">
            <div
              className="bg-blue-600 h-full flex items-center justify-center text-white transition-all"
              style={{ width: `${stats.translationProgress}%` }}
            >
              {stats.translationProgress.toFixed(0)}%
            </div>
          </div>
          <p className="text-gray-600 dark:text-slate-400 mt-2">
            {fileToAnalyze.entries.filter(e => e.translation).length} of {fileToAnalyze.entries.length} entries translated
          </p>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-gray-200 dark:border-slate-800">
        <h3 className="text-gray-900 dark:text-slate-200 mb-4">Reading Speed Analysis</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={durationData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="index" label={{ value: 'Entry Number', position: 'insideBottom', offset: -5 }} />
            <YAxis label={{ value: 'Characters per Second', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="readingSpeed" stroke="#8b5cf6" name="Chars/Second" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {files.length > 1 && (
        <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-gray-200 dark:border-slate-800">
          <h3 className="text-gray-900 dark:text-slate-200 mb-4">File Comparison</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="entries" fill="#3b82f6" name="Total Entries" />
              <Bar dataKey="translation" fill="#10b981" name="Translation %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
