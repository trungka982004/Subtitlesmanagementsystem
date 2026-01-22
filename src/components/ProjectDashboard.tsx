import { useState, useEffect, useRef } from 'react';
import { parseContent } from '../utils/srt';
import { SubtitleFile, Project, SubtitleEntry } from '../types';
import { CheckCircle2, Folder, Trash2, FolderOpen, CloudUpload, FileText, X } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

interface ProjectDashboardProps {
  files: SubtitleFile[];
  projects: Project[];
  onCreateProject: (name: string) => Promise<string> | string;
  onDeleteProject: (projectId: string) => void;
  onMoveFile: (fileId: string, projectId: string) => void;
  onFileUpload: (file: SubtitleFile) => void;
  onFileSelect: (file: SubtitleFile) => void;
  onDeleteFile: (fileId: string) => void;
}

interface StagedFile {
  id: string;
  fileObj: File;
  content: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
}

export function ProjectDashboard({ files, projects, onDeleteProject, onMoveFile, onFileUpload, onFileSelect, onDeleteFile }: ProjectDashboardProps) {
  const { t } = useTranslation();
  const [dragActiveProject, setDragActiveProject] = useState<string | null>(null);
  const [uploadDragActive, setUploadDragActive] = useState(false);
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parsing Logic via Utility
  const parseSRT = parseContent;

  // Upload Logic : Progress Simulation
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

  // Format bytes
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleUploadFileSelect = (files: FileList) => {
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

  const handleUploadDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setUploadDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUploadFileSelect(e.dataTransfer.files);
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

  // Existing Project Drag/Drop Logic
  const handleFileRead = (content: string, fileName: string, projectId: string) => {
    const entries = parseSRT(content);
    if (entries.length > 0) {
      const newFile: SubtitleFile = {
        id: `${Date.now()}-${Math.random()}`,
        name: fileName,
        entries,
        uploadedAt: new Date(),
        status: 'not-started',
        progress: 0,
        projectId: projectId,
      };
      onFileUpload(newFile);
    }
  };

  const handleDrop = (e: React.DragEvent, projectId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActiveProject(null);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.srt')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          handleFileRead(content, file.name, projectId);
        };
        reader.readAsText(file);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent, projectId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActiveProject(projectId);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.relatedTarget && (e.currentTarget.contains(e.relatedTarget as Node) || e.currentTarget === e.relatedTarget)) {
      return;
    }
    setDragActiveProject(null);
  };

  const getProjectFiles = (projectId: string) => files.filter(f => f.projectId === projectId);
  const getUnassignedFiles = () => files.filter(f => !f.projectId);

  const getProjectProgress = (projectId: string) => {
    const pFiles = getProjectFiles(projectId);
    if (pFiles.length === 0) return 0;
    const completedFiles = pFiles.filter(f => f.status === 'done').length;
    return Math.round((completedFiles / pFiles.length) * 100);
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-2 gap-12">
        {/* Upload and Attach Files - Left Column (Moved from Top) */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-white/10 overflow-hidden hover:shadow-xl hover:border-blue-500/30 transition-all duration-300 group/card flex flex-col h-full">
          {/* Header */}
          <div className="px-6 py-6 border-b border-slate-100 dark:border-white/5 flex flex-col items-center justify-center text-center bg-slate-50/30 dark:bg-slate-950/30">
            <h3 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wide">
              {t('importSubtitles')}
            </h3>
            <p className="text-xs font-bold text-slate-500 mt-1.5 uppercase tracking-wider">
              {t('supportedFormats')}
            </p>
          </div>

          <div className="p-6 space-y-6 flex-1 flex flex-col">
            {/* Dropzone */}
            <div
              onDrop={handleUploadDrop}
              onDragOver={(e) => { e.preventDefault(); setUploadDragActive(true); }}
              onDragLeave={(e) => { e.preventDefault(); setUploadDragActive(false); }}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 group flex-1 min-h-[200px] ${uploadDragActive
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
                onChange={(e) => e.target.files && handleUploadFileSelect(e.target.files)}
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
          <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700/50 flex justify-end gap-3 mt-auto">
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

        {/* Projects Section (Right Column) */}
        <div className="h-full flex flex-col">
          <div className="flex justify-center items-center mb-6 mt-8">
            <h3 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wide">{t('projectsTitle')}</h3>
          </div>

          <div className="grid grid-cols-1 gap-4 flex-1 overflow-y-auto max-h-[600px] custom-scrollbar pr-2">
            {projects.map(project => {
              const pFiles = getProjectFiles(project.id);
              const progress = getProjectProgress(project.id);
              const isDragActive = dragActiveProject === project.id;

              return (
                <div
                  key={project.id}
                  className={`p-6 bg-white dark:bg-slate-900 rounded-lg border transition-all duration-300 shadow-md ${isDragActive
                    ? 'border-blue-500 ring-4 ring-blue-500/20 bg-blue-50 dark:bg-blue-900/10 scale-[1.02]'
                    : 'border-slate-200 dark:border-white/10 hover:border-blue-500/50 hover:shadow-xl hover:-translate-y-1 hover:bg-white dark:hover:bg-slate-800'
                    } group`}
                  onDrop={(e) => handleDrop(e, project.id)}
                  onDragOver={(e) => handleDragOver(e, project.id)}
                  onDragLeave={handleDragLeave}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Folder className={`w-5 h-5 ${isDragActive ? 'text-blue-400' : 'text-blue-500'}`} />
                      <div>
                        <h4 className="font-medium text-slate-700 dark:text-slate-100">{project.name}</h4>
                        <p className="text-xs text-slate-400">{pFiles.length} {t('files')} • {t('created')} {new Date(project.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => onDeleteProject(project.id)}
                      className="p-1 text-slate-500 hover:text-red-400 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>{t('progress')}</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-200 dark:border-white/5">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* File list preview */}
                  {pFiles.length > 0 ? (
                    <div className="mt-4 space-y-2 border-t border-slate-100 dark:border-white/5 pt-3">
                      {pFiles.slice(0, 3).map(file => (
                        <div
                          key={file.id}
                          className="flex items-center justify-between text-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 p-1 -mx-1 rounded"
                          onClick={() => onFileSelect(file)}
                        >
                          <span className="text-slate-600 dark:text-slate-300 truncate max-w-[150px]">{file.name}</span>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${file.status === 'done'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 border-green-200 dark:border-green-800'
                              : file.status === 'in-progress'
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                                : 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300 border-orange-200 dark:border-orange-800'
                              }`}>
                              {file.status === 'done' ? t('completed') : file.status === 'in-progress' ? t('inProgress') : t('notStarted')}
                            </span>
                            {/* Move Button */}
                            <select
                              className="text-xs border-none bg-transparent text-slate-500 hover:text-slate-300 cursor-pointer focus:ring-0 p-0"
                              value={project.id}
                              onChange={(e) => onMoveFile(file.id, e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <option value={project.id}>{t('move')}</option>
                            </select>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm('Are you sure you want to delete this file?')) {
                                  onDeleteFile(file.id);
                                }
                              }}
                              className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                      {pFiles.length > 3 && (
                        <p className="text-xs text-slate-500 text-center">+ {pFiles.length - 3} {t('moreFiles')}</p>
                      )}
                    </div>
                  ) : (
                    <div className={`mt-4 border-t border-slate-100 dark:border-white/5 pt-3 text-center transition-colors ${isDragActive ? 'text-blue-400' : 'text-slate-500'}`}>
                      <p className="text-xs italic">
                        {isDragActive ? t('dropFileToAdd') : t('startDragging')}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}

            {projects.length === 0 && (
              <div className="col-span-1 p-8 border-2 border-dashed border-slate-300 dark:border-white/10 rounded-lg text-center text-slate-500 flex flex-col items-center justify-center">
                <FolderOpen className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                <p>{t('noProjectsYet')}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Unassigned Files */}
      {getUnassignedFiles().length > 0 && (
        <div className="mb-12">
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 pl-3 border-l-4 border-blue-500 mb-6">{t('unassignedFiles')}</h3>
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-white/10 shadow-sm divide-y divide-slate-100 dark:divide-white/5">
            {getUnassignedFiles().map(file => (
              <div
                key={file.id}
                className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors duration-200 group active:scale-[0.99]"
                onClick={() => onFileSelect(file)}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${file.status === 'done' ? 'bg-green-900/20' : 'bg-[#1e293b]'
                    }`}>
                    <FolderOpen className={`w-4 h-4 ${file.status === 'done' ? 'text-green-400' : 'text-slate-500'
                      }`} />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-slate-800 dark:text-slate-200">{file.name}</h4>
                    <p className="text-xs text-slate-400">{file.entries.length} entries • {file.progress}% complete</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('Are you sure you want to delete this file?')) {
                        onDeleteFile(file.id);
                      }
                    }}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-500">{t('moveTo')}</span>
                    <select
                      className="text-sm border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-900"
                      value=""
                      onChange={(e) => {
                        if (e.target.value) onMoveFile(file.id, e.target.value);
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <option value="">{t('selectProject')}</option>
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )
      }
    </div >
  );
}
