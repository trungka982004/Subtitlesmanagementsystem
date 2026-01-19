import { useState } from 'react';
import { FolderPlus, CheckCircle2, Clock, AlertCircle, MoreVertical } from 'lucide-react';
import { SubtitleFile, Project } from '../types';
import { useTranslation } from '../hooks/useTranslation';

interface SubtitleUploaderProps {
  onFileUpload: (file: SubtitleFile) => void;
  projects: Project[];
  onCreateProject: (name: string) => Promise<string> | string;
  files: SubtitleFile[];
}

export function SubtitleUploader({ onFileUpload, projects, onCreateProject, files }: SubtitleUploaderProps) {
  const { t } = useTranslation();
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  const doneCount = files.filter(f => f.status === 'done').length;
  const inProgressCount = files.filter(f => f.status === 'in-progress').length;
  const notStartedCount = files.filter(f => f.status === 'not-started').length;

  const handleManualCreateProject = () => {
    if (newProjectName.trim()) {
      onCreateProject(newProjectName.trim());
      setNewProjectName('');
      setIsCreatingProject(false);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-12">
      {/* Project Creation - Top Left */}
      <div className="h-full">
        <div className="p-5 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-white/10 hover:shadow-lg hover:border-slate-300 dark:hover:border-blue-500/30 transition-all duration-300 h-full flex flex-col">
          <h3 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center justify-center gap-2 uppercase tracking-wide mb-6 mt-8">
            <FolderPlus className="w-5 h-5 text-blue-500" />
            {t('createNewProject')}
          </h3>

          <div className="flex-1 flex flex-col">
            {!isCreatingProject ? (
              <button
                onClick={() => setIsCreatingProject(true)}
                className="w-full flex-1 px-4 py-8 bg-slate-50 dark:bg-slate-950/50 border border-dashed border-slate-300 dark:border-white/10 rounded-lg text-slate-500 hover:border-blue-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-500 flex flex-col items-center justify-center gap-3 transition-all font-medium active:scale-[0.99]"
              >
                <div className="p-3 bg-white dark:bg-slate-900 rounded-full shadow-sm border border-slate-200 dark:border-slate-700">
                  <FolderPlus className="w-6 h-6 transition-transform group-hover:scale-110" />
                </div>
                <span>{t('createProjectBtn')}</span>
              </button>
            ) : (
              <div className="flex flex-col gap-3 my-auto">
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleManualCreateProject()}
                  placeholder={t('enterProjectName')}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950/50 border border-slate-300 dark:border-white/10 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400 text-lg"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleManualCreateProject}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium shadow-sm transition-all"
                  >
                    {t('create')}
                  </button>
                  <button
                    onClick={() => setIsCreatingProject(false)}
                    className="px-4 py-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium"
                  >
                    {t('close')}
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className="mt-1 py-4 text-slate-400 text-center leading-relaxed">
            {t('createProjectDesc')}
          </div>
        </div>
      </div>

      {/* Overview Stats - Top Right */}
      <div className="h-full flex flex-col">
        <div className="flex justify-center items-center mb-6 mt-8">
          <h3 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wide">{t('overview')}</h3>
        </div>
        <div className="grid grid-cols-3 gap-6">
          {/* Done Card */}
          <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-white/10 flex flex-col justify-between group hover:shadow-md transition-all duration-200 h-full min-h-[200px]">
            <div className="flex justify-between items-start">
              <div className="p-4 rounded-2xl text-green-600 dark:text-green-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>

            <div className="mt-6 mb-8">
              <h4 className="text-lg font-bold text-green-600 dark:text-green-400">{t('completed')}</h4>
            </div>

            <div className="mt-auto space-y-4">
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-green-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${files.length > 0 ? (doneCount / files.length) * 100 : 0}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-sm font-semibold">
                <span className="text-green-600 dark:text-green-400">{doneCount} {t('files')}</span>
                <span className="text-green-600 dark:text-green-400">
                  {files.length > 0 ? Math.round((doneCount / files.length) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>

          {/* In Progress Card */}
          <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-white/10 flex flex-col justify-between group hover:shadow-md transition-all duration-200 h-full min-h-[200px]">
            <div className="flex justify-between items-start">
              <div className="p-4 rounded-2xl text-blue-600 dark:text-blue-400">
                <Clock className="w-6 h-6" />
              </div>
            </div>

            <div className="mt-6 mb-8">
              <h4 className="text-lg font-bold text-blue-600 dark:text-blue-400">{t('inProgress')}</h4>
            </div>

            <div className="mt-auto space-y-4">
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-blue-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${files.length > 0 ? (inProgressCount / files.length) * 100 : 0}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-sm font-semibold">
                <span className="text-blue-600 dark:text-blue-400">{inProgressCount} {t('files')}</span>
                <span className="text-blue-600 dark:text-blue-400">
                  {files.length > 0 ? Math.round((inProgressCount / files.length) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>

          {/* Not Started Card */}
          <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-white/10 flex flex-col justify-between group hover:shadow-md transition-all duration-200 h-full min-h-[200px]">
            <div className="flex justify-between items-start">
              <div className="p-4 rounded-2xl text-orange-600 dark:text-orange-400">
                <AlertCircle className="w-6 h-6" />
              </div>
            </div>

            <div className="mt-6 mb-8">
              <h4 className="text-lg font-bold text-orange-600 dark:text-orange-400">{t('notStarted')}</h4>
            </div>

            <div className="mt-auto space-y-4">
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-orange-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${files.length > 0 ? (notStartedCount / files.length) * 100 : 0}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-sm font-semibold">
                <span className="text-orange-600 dark:text-orange-400">{notStartedCount} {t('files')}</span>
                <span className="text-orange-600 dark:text-orange-400">
                  {files.length > 0 ? Math.round((notStartedCount / files.length) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}