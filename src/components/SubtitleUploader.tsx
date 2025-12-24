import { useState, useRef, useEffect } from 'react';
import { Upload, FileText, FolderPlus, X, CloudUpload, CheckCircle2 } from 'lucide-react';
import { SubtitleFile, SubtitleEntry, Project } from '../types';
import { useTranslation } from '../hooks/useTranslation';

interface SubtitleUploaderProps {
  onFileUpload: (file: SubtitleFile) => void;
  projects: Project[];
  onCreateProject: (name: string) => Promise<string> | string;
}

interface StagedFile {
  id: string;
  fileObj: File;
  content: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
}

export function SubtitleUploader({ onFileUpload, projects, onCreateProject }: SubtitleUploaderProps) {
  const { t } = useTranslation();
  const [dragActive, setDragActive] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Format bytes to human readable
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const parseSRT = (content: string): SubtitleEntry[] => {
    const normalizeContent = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const entries: SubtitleEntry[] = [];
    const blocks = normalizeContent.trim().split(/\n\s*\n/);

    blocks.forEach(block => {
      const lines = block.split('\n').map(l => l.trim());
      if (lines.length >= 3) {
        const idStr = lines[0];
        const id = parseInt(idStr);
        const timeLineIndex = lines.findIndex(l => l.includes('-->'));

        if (timeLineIndex !== -1) {
          const timeMatch = lines[timeLineIndex].match(/(\d{2}:\d{2}:\d{2},\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2},\d{3})/);

          if (timeMatch) {
            const text = lines.slice(timeLineIndex + 1).join('\n');
            entries.push({
              id: !isNaN(id) ? id : entries.length + 1,
              startTime: timeMatch[1],
              endTime: timeMatch[2],
              text,
            });
          }
        }
      }
    });

    return entries;
  };

  // Simulate upload progress
  useEffect(() => {
    const interval = setInterval(() => {
      setStagedFiles(prev => prev.map(f => {
        if (f.status === 'uploading') {
          const newProgress = Math.min(f.progress + Math.random() * 20, 100);
          return {
            ...f,
            progress: newProgress,
            status: newProgress >= 100 ? 'completed' : 'uploading'
          };
        }
        return f;
      }));
    }, 200);
    return () => clearInterval(interval);
  }, []);

  const handleFileSelect = (files: FileList) => {
    Array.from(files).forEach(file => {
      if (file.name.endsWith('.srt')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          setStagedFiles(prev => [...prev, {
            id: Math.random().toString(36).substr(2, 9),
            fileObj: file,
            content,
            progress: 0,
            status: 'uploading'
          }]);
        };
        reader.readAsText(file);
      }
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const handleRemoveStaged = (id: string) => {
    setStagedFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleAttachFiles = () => {
    stagedFiles.forEach(f => {
      if (f.status === 'completed') {
        const entries = parseSRT(f.content);
        if (entries.length > 0) {
          const newFile: SubtitleFile = {
            id: `${Date.now()}-${Math.random()}`,
            name: f.fileObj.name,
            entries,
            uploadedAt: new Date(),
            status: 'not-started',
            progress: 0,
            projectId: undefined,
          };
          onFileUpload(newFile);
        }
      }
    });
    setStagedFiles([]);
  };

  const handleManualCreateProject = () => {
    if (newProjectName.trim()) {
      onCreateProject(newProjectName.trim());
      setNewProjectName('');
      setIsCreatingProject(false);
    }
  };

  return (
    <div className="flex flex-col" style={{ gap: '3rem' }}>
      {/* Project Creation */}
      <div className="p-5 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-white/10 hover:shadow-lg hover:border-slate-300 dark:hover:border-blue-500/30 transition-all duration-300">
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2 uppercase tracking-wide border-l-4 border-blue-500 pl-3" style={{ marginBottom: '24px', marginTop: '1.5rem' }}>
          <FolderPlus className="w-4 h-4 text-blue-500" />
          {t('createNewProject')}
        </h3>

        {!isCreatingProject ? (
          <button
            onClick={() => setIsCreatingProject(true)}
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950/50 border border-dashed border-slate-300 dark:border-white/10 rounded-lg text-slate-500 hover:border-blue-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-500 flex items-center justify-center gap-2 transition-all font-medium active:scale-[0.99]"
          >
            <FolderPlus className="w-5 h-5 transition-transform group-hover:scale-110" />
            {t('createProjectBtn')}
          </button>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleManualCreateProject()}
              placeholder={t('enterProjectName')}
              className="flex-1 px-4 py-2 bg-slate-50 dark:bg-slate-950/50 border border-slate-300 dark:border-white/10 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
              autoFocus
            />
            <button
              onClick={handleManualCreateProject}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium text-sm shadow-sm transition-all"
            >
              {t('create')}
            </button>
            <button
              onClick={() => setIsCreatingProject(false)}
              className="px-3 py-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium"
            >
              {t('close')}
            </button>
          </div>
        )}
      </div>

      {/* Upload and Attach Files - Redesigned Card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-white/10 overflow-hidden hover:shadow-xl hover:border-blue-500/30 transition-all duration-300 group/card">
        {/* Header */}
        <div className="px-6 py-6 border-b border-slate-100 dark:border-white/5 flex flex-col items-center justify-center text-center bg-slate-50/30 dark:bg-slate-950/30">
          <h3 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 tracking-tight font-sans">
            {t('importSubtitles')}
          </h3>
          <p className="text-xs font-medium text-slate-500 mt-1.5 uppercase tracking-wider">
            {t('supportedFormats')}
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Dropzone */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 group ${dragActive
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10'
              : 'border-slate-300 dark:border-white/10 hover:border-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
          >
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
              <CloudUpload className="w-6 h-6" />
            </div>
            <p className="text-slate-700 dark:text-slate-300 font-medium text-sm">
              <span className="text-blue-600 hover:underline">{t('clickToUpload')}</span> {t('dragAndDrop')}
            </p>
            <p className="text-slate-400 text-xs mt-1">{t('maxFileSize')}</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".srt"
              multiple
              onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
              className="hidden"
            />
          </div>

          {/* Staged Files List */}
          {stagedFiles.length > 0 && (
            <div className="space-y-3">
              {stagedFiles.map((file) => (
                <div key={file.id} className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 border border-slate-100 dark:border-slate-700/50 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-8 h-8 rounded bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 shrink-0 border border-green-200 dark:border-green-800">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{file.fileObj.name}</p>
                        <p className="text-xs text-slate-400">{formatFileSize(file.fileObj.size)}</p>
                      </div>
                    </div>
                    <button onClick={() => handleRemoveStaged(file.id)} className="text-slate-400 hover:text-red-500 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  {/* Progress Bar */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${file.progress === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                        style={{ width: `${file.progress}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-slate-500 w-8 text-right">{Math.round(file.progress)}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700/50 flex justify-end gap-3">
          <button
            onClick={() => setStagedFiles([])}
            className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm active:scale-95 transition-all"
          >
            {t('cancel')}
          </button>
          <button
            onClick={handleAttachFiles}
            disabled={stagedFiles.length === 0 || stagedFiles.some(f => f.status === 'uploading')}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 hover:shadow-md hover:shadow-blue-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 shadow-sm transition-all flex items-center gap-2"
          >
            {stagedFiles.every(f => f.status === 'completed') && stagedFiles.length > 0 && <CheckCircle2 className="w-4 h-4" />}
            {t('attachFiles')}
          </button>
        </div>
      </div>
    </div >
  );
}