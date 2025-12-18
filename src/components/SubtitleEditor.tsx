import { useState } from 'react';
import { SubtitleFile, SubtitleEntry } from '../App';
import { Download, Sparkles, Globe, CheckCircle2 } from 'lucide-react';
import { translateText } from '../services/libreTranslate';

interface SubtitleEditorProps {
  file: SubtitleFile;
  onUpdate: (file: SubtitleFile) => void;
}

export function SubtitleEditor({ file, onUpdate }: SubtitleEditorProps) {
  const [editedEntries, setEditedEntries] = useState<SubtitleEntry[]>(() => {
    // Add mock Vietnamese translations for demonstration
    const mockGoogleTranslations = [
      'Chào mừng đến với Hệ thống Phân tích và Quản lý Phiên dịch Phụ đề',
      'Công cụ này giúp bạn quản lý và dịch các tệp phụ đề',
      'Tải lên tệp SRT của bạn để bắt đầu',
      'Bạn có thể phân tích thời gian, số lượng ký tự và chất lượng dịch thuật',
      'So sánh nhiều phiên bản cạnh nhau'
    ];

    const mockNlpTranslations = [
      'Chào mừng bạn đến với Hệ thống Quản lý và Phân tích Dịch Phụ đề',
      'Công cụ này hỗ trợ bạn trong việc quản lý và dịch các file phụ đề',
      'Hãy tải file SRT của bạn lên để bắt đầu sử dụng',
      'Bạn có thể phân tích về thời gian, số ký tự và chất lượng của bản dịch',
      'So sánh các phiên bản khác nhau một cách dễ dàng'
    ];

    return file.entries.map((entry, index) => ({
      ...entry,
      googleTranslation: entry.googleTranslation || mockGoogleTranslations[index % mockGoogleTranslations.length],
      nlpTranslation: entry.nlpTranslation || mockNlpTranslations[index % mockNlpTranslations.length],
    }));
  });
  const [isTranslating, setIsTranslating] = useState(false);

  const handleTextChange = (id: number, text: string) => {
    const updated = editedEntries.map(entry =>
      entry.id === id ? { ...entry, text } : entry
    );
    setEditedEntries(updated);
  };

  const handleGoogleTranslationChange = (id: number, translation: string) => {
    const updated = editedEntries.map(entry =>
      entry.id === id ? { ...entry, googleTranslation: translation } : entry
    );
    setEditedEntries(updated);

    // Auto-update file with progress
    const translatedCount = updated.filter(e => e.googleTranslation || e.nlpTranslation).length;
    const progress = Math.round((translatedCount / updated.length) * 100);
    const status = progress === 100 ? 'done' : progress > 0 ? 'in-progress' : 'not-started';

    onUpdate({ ...file, entries: updated, progress, status });
  };

  const handleNlpTranslationChange = (id: number, translation: string) => {
    const updated = editedEntries.map(entry =>
      entry.id === id ? { ...entry, nlpTranslation: translation } : entry
    );
    setEditedEntries(updated);

    // Auto-update file with progress
    const translatedCount = updated.filter(e => e.googleTranslation || e.nlpTranslation).length;
    const progress = Math.round((translatedCount / updated.length) * 100);
    const status = progress === 100 ? 'done' : progress > 0 ? 'in-progress' : 'not-started';

    onUpdate({ ...file, entries: updated, progress, status });
  };

  const handleSave = () => {
    onUpdate({ ...file, entries: editedEntries });
  };

  const handleAutoTranslate = async (type: 'google' | 'nlp') => {
    setIsTranslating(true);

    if (type === 'google') {
      try {
        // Create an array of promises for concurrent translation
        const translationPromises = editedEntries.map(async (entry) => {
          const translated = await translateText(entry.text, 'vi', 'auto');
          return { ...entry, googleTranslation: translated };
        });

        const updated = await Promise.all(translationPromises);
        setEditedEntries(updated);
      } catch (error) {
        console.error("Translation failed", error);
        // You might want to show a toast or error message here
      } finally {
        setIsTranslating(false);
      }
    } else {
      // Keep mocking NLP for now as per previous logic, or leave as is if only Google was requested to be replaced.
      // The user specially asked "replace the Model translate: Google translate into self-hosted LibreTranslate API".
      // They didn't explicitly say replace the NLP one, so I'll leave the NLP one mocked as placeholder.
      setTimeout(() => {
        const updated = editedEntries.map(entry => {
          // Mock translation - in reality, this would call an API
          const mockTranslation = `[${type.toUpperCase()}] ${entry.text}`;
          return { ...entry, nlpTranslation: mockTranslation };
        });

        setEditedEntries(updated);
        setIsTranslating(false);
      }, 1500);
    }
  };

  const handleExport = (translationType: 'google' | 'nlp' | 'original') => {
    let srtContent = '';
    editedEntries.forEach(entry => {
      srtContent += `${entry.id}\n`;
      srtContent += `${entry.startTime} --> ${entry.endTime}\n`;

      if (translationType === 'google' && entry.googleTranslation) {
        srtContent += `${entry.googleTranslation}\n\n`;
      } else if (translationType === 'nlp' && entry.nlpTranslation) {
        srtContent += `${entry.nlpTranslation}\n\n`;
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
    const milliseconds = parseInt(secondsParts[1]);
    return hours * 3600 + minutes * 60 + seconds + milliseconds / 1000;
  };

  const googleTranslatedCount = editedEntries.filter(e => e.googleTranslation).length;
  const nlpTranslatedCount = editedEntries.filter(e => e.nlpTranslation).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-gray-900">{file.name}</h3>
          <p className="text-gray-500">
            {editedEntries.length} subtitle entries
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              const newStatus = file.status === 'done' ? 'in-progress' : 'done';
              onUpdate({ ...file, status: newStatus, progress: newStatus === 'done' ? 100 : file.progress });
            }}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${file.status === 'done'
              ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            {file.status === 'done' ? 'Completed' : 'Mark as Done'}
          </button>

          <div className="relative group">
            <button
              className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-300 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              <button
                onClick={() => handleExport('original')}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 rounded-t-lg"
              >
                Export Original
              </button>
              <button
                onClick={() => handleExport('google')}
                className="w-full px-4 py-2 text-left hover:bg-gray-50"
              >
                Export LibreTranslate ({googleTranslatedCount})
              </button>
              <button
                onClick={() => handleExport('nlp')}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 rounded-b-lg"
              >
                Export NLP ({nlpTranslatedCount})
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => handleAutoTranslate('google')}
          disabled={isTranslating}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
        >
          <Globe className="w-4 h-4" />
          {isTranslating ? 'Translating...' : 'Auto-translate with LibreTranslate'}
        </button>
        <button
          onClick={() => handleAutoTranslate('nlp')}
          disabled={isTranslating}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 transition-colors"
        >
          <Sparkles className="w-4 h-4" />
          {isTranslating ? 'Translating...' : 'Auto-translate with NLP Model'}
        </button>
      </div>

      {/* Column Headers */}
      <div className="grid grid-cols-12 gap-3 px-4 py-3 bg-gray-100 rounded-lg">
        <div className="col-span-1 text-gray-700">
          #
        </div>
        <div className="col-span-3 text-gray-700">
          Chinese (Source)
        </div>
        <div className="col-span-4 text-gray-700 flex items-center gap-2">
          <Globe className="w-4 h-4" />
          Vietnamese - LibreTranslate
        </div>
        <div className="col-span-4 text-gray-700 flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          Vietnamese - Custom NLP Model
        </div>
      </div>

      <div className="max-h-[600px] overflow-y-auto space-y-2 pr-2">
        {editedEntries.map((entry, index) => {
          const duration = timeToSeconds(entry.endTime) - timeToSeconds(entry.startTime);
          const charCount = entry.text.length;
          const charPerSecond = charCount / duration;
          const isSlowReading = charPerSecond < 10;
          const isFastReading = charPerSecond > 20;

          return (
            <div key={entry.id} className="p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-gray-600">
                    {entry.startTime} → {entry.endTime}
                  </span>
                  <span className="text-gray-500">
                    {duration.toFixed(1)}s
                  </span>
                </div>
                {(isSlowReading || isFastReading) && (
                  <span className={`px-2 py-1 rounded ${isFastReading ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                    {isFastReading ? 'Fast read' : 'Slow read'}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-12 gap-3">
                <div className="col-span-1 flex items-start pt-2">
                  <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded">
                    {entry.id}
                  </span>
                </div>

                <div className="col-span-3">
                  <textarea
                    value={entry.text}
                    onChange={(e) => handleTextChange(entry.id, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    rows={3}
                  />
                  <p className="text-gray-500 mt-1">
                    {charCount} chars
                  </p>
                </div>

                <div className="col-span-4">
                  <textarea
                    value={entry.googleTranslation || ''}
                    onChange={(e) => handleGoogleTranslationChange(entry.id, e.target.value)}
                    placeholder="Google translation..."
                    className="w-full px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-green-50 resize-none"
                    rows={3}
                  />
                  {entry.googleTranslation && (
                    <p className="text-gray-500 mt-1">
                      {entry.googleTranslation.length} chars
                    </p>
                  )}
                </div>

                <div className="col-span-4">
                  <textarea
                    value={entry.nlpTranslation || ''}
                    onChange={(e) => handleNlpTranslationChange(entry.id, e.target.value)}
                    placeholder="NLP model translation..."
                    className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-purple-50 resize-none"
                    rows={3}
                  />
                  {entry.nlpTranslation && (
                    <p className="text-gray-500 mt-1">
                      {entry.nlpTranslation.length} chars
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}