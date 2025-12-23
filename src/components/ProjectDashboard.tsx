import { useState } from 'react';
import { SubtitleFile, Project, SubtitleEntry } from '../App';
import { CheckCircle2, Clock, AlertCircle, Folder, Trash2, FolderOpen } from 'lucide-react';

interface ProjectDashboardProps {
  files: SubtitleFile[];
  projects: Project[];
  onCreateProject: (name: string) => Promise<string> | string;
  onDeleteProject: (projectId: string) => void;
  onMoveFile: (fileId: string, projectId: string) => void;
  onFileUpload: (file: SubtitleFile) => void;
  onFileSelect: (file: SubtitleFile) => void;
}

export function ProjectDashboard({ files, projects, onDeleteProject, onMoveFile, onFileUpload, onFileSelect }: ProjectDashboardProps) {
  const [dragActiveProject, setDragActiveProject] = useState<string | null>(null);

  const doneCount = files.filter(f => f.status === 'done').length;
  const inProgressCount = files.filter(f => f.status === 'in-progress').length;
  const notStartedCount = files.filter(f => f.status === 'not-started').length;

  const parseSRT = (content: string): SubtitleEntry[] => {
    const normalizeContent = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const entries: SubtitleEntry[] = [];
    const blocks = normalizeContent.trim().split(/\n\s*\n/);

    blocks.forEach(block => {
      const lines = block.split('\n').map(l => l.trim());
      if (lines.length >= 3) {
        // Try to identify logical parts
        const idStr = lines[0];
        const id = parseInt(idStr);

        // Time usually on line 2 (index 1), but let's look for the arrow
        const timeLineIndex = lines.findIndex(l => l.includes('-->'));

        if (timeLineIndex !== -1) {
          const timeMatch = lines[timeLineIndex].match(/(\d{2}:\d{2}:\d{2},\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2},\d{3})/);

          if (timeMatch) {
            const text = lines.slice(timeLineIndex + 1).join('\n');
            entries.push({
              id: !isNaN(id) ? id : entries.length + 1, // Fallback ID if missing
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

    // Only clear if we're actually leaving the project card, not just entering a child element
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
    <div className="flex flex-col" style={{ gap: '2rem' }}>
      {/* Summary Cards - Match Analysis Page Colored Style */}
      <div>
        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 pl-3 border-l-4 border-blue-500" style={{ marginBottom: '24px' }}>Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Done Card */}
          <div className="p-6 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-green-200 dark:border-green-900/50 flex items-center justify-between group hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-default relative overflow-hidden">
            <div className="absolute inset-0 bg-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 border border-green-200 dark:border-green-800 mb-2 tracking-wide uppercase transition-transform group-hover:scale-105 origin-left">
                Done
              </span>
              <p className="text-3xl font-bold text-green-700 dark:text-green-400 group-hover:text-green-600 dark:group-hover:text-green-300 transition-colors">{doneCount}</p>
            </div>
            <div className="relative z-10 w-12 h-12 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center border border-green-200 dark:border-green-800 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300 shadow-sm">
              <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>

          {/* In Progress Card */}
          <div className="p-6 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-blue-200 dark:border-blue-900/50 flex items-center justify-between group hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-default relative overflow-hidden">
            <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 border border-blue-200 dark:border-blue-800 mb-2 tracking-wide uppercase transition-transform group-hover:scale-105 origin-left">
                In Progress
              </span>
              <p className="text-3xl font-bold text-blue-700 dark:text-blue-400 group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors">{inProgressCount}</p>
            </div>
            <div className="relative z-10 w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center border border-blue-200 dark:border-blue-800 group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-300 shadow-sm">
              <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>

          {/* Not Started Card */}
          <div className="p-6 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-orange-200 dark:border-orange-900/50 flex items-center justify-between group hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-default relative overflow-hidden">
            <div className="absolute inset-0 bg-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300 border border-orange-200 dark:border-orange-800 mb-2 tracking-wide uppercase transition-transform group-hover:scale-105 origin-left">
                Not Started
              </span>
              <p className="text-3xl font-bold text-orange-700 dark:text-orange-400 group-hover:text-orange-600 dark:group-hover:text-orange-300 transition-colors">{notStartedCount}</p>
            </div>
            <div className="relative z-10 w-12 h-12 bg-orange-100 dark:bg-orange-900/50 rounded-full flex items-center justify-center border border-orange-200 dark:border-orange-800 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300 shadow-sm">
              <AlertCircle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Projects Section */}
      <div>
        <div className="flex items-center justify-between" style={{ marginBottom: '24px' }}>
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 pl-3 border-l-4 border-blue-500">Projects</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map(project => {
            const pFiles = getProjectFiles(project.id);
            const progress = getProjectProgress(project.id);
            const isDragActive = dragActiveProject === project.id;

            return (
              <div
                key={project.id}
                className={`p-6 bg-[#1e293b] rounded-lg border transition-all duration-300 shadow-md ${isDragActive
                  ? 'border-blue-500 ring-4 ring-blue-500/20 bg-blue-900/20 scale-[1.02]'
                  : 'border-slate-700 hover:border-blue-500/50 hover:shadow-xl hover:-translate-y-1 hover:bg-[#1e293b]'
                  } group`}
                onDrop={(e) => handleDrop(e, project.id)}
                onDragOver={(e) => handleDragOver(e, project.id)}
                onDragLeave={handleDragLeave}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Folder className={`w-5 h-5 ${isDragActive ? 'text-blue-400' : 'text-blue-500'}`} />
                    <div>
                      <h4 className="font-medium text-slate-100">{project.name}</h4>
                      <p className="text-xs text-slate-400">{pFiles.length} files • Created {new Date(project.createdAt).toLocaleDateString()}</p>
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
                    <span>Progress</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full bg-[#1e293b] rounded-full h-1.5 overflow-hidden border border-slate-700/50">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* File list preview */}
                {pFiles.length > 0 ? (
                  <div className="mt-4 space-y-2 border-t border-slate-700/50 pt-3">
                    {pFiles.slice(0, 3).map(file => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between text-sm cursor-pointer hover:bg-slate-800 p-1 -mx-1 rounded"
                        onClick={() => onFileSelect(file)}
                      >
                        <span className="text-slate-300 truncate max-w-[150px]">{file.name}</span>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${file.status === 'done'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 border-green-200 dark:border-green-800'
                            : file.status === 'in-progress'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                              : 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300 border-orange-200 dark:border-orange-800'
                            }`}>
                            {file.status === 'done' ? 'Done' : file.status === 'in-progress' ? 'In Progress' : 'Not Started'}
                          </span>
                          {/* Move Button */}
                          <select
                            className="text-xs border-none bg-transparent text-slate-500 hover:text-slate-300 cursor-pointer focus:ring-0 p-0"
                            value={project.id}
                            onChange={(e) => onMoveFile(file.id, e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <option value={project.id}>Move...</option>
                            <option value="">Unassign</option>
                          </select>
                        </div>
                      </div>
                    ))}
                    {pFiles.length > 3 && (
                      <p className="text-xs text-slate-500 text-center">+ {pFiles.length - 3} more files</p>
                    )}
                  </div>
                ) : (
                  <div className={`mt-4 border-t border-slate-700/50 pt-3 text-center transition-colors ${isDragActive ? 'text-blue-400' : 'text-slate-500'}`}>
                    <p className="text-xs italic">
                      {isDragActive ? 'Drop file to add' : 'Start by dragging files here'}
                    </p>
                  </div>
                )}
              </div>
            );
          })}

          {projects.length === 0 && (
            <div className="col-span-1 md:col-span-2 p-8 border-2 border-dashed border-slate-700 rounded-lg text-center text-slate-500">
              <FolderOpen className="w-8 h-8 mx-auto mb-2 text-slate-600" />
              <p>No projects yet. Create one to organize your files.</p>
            </div>
          )}
        </div>
      </div>

      {/* Unassigned Files */}
      {getUnassignedFiles().length > 0 && (
        <div style={{ marginBottom: '3rem' }}>
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 pl-3 border-l-4 border-blue-500" style={{ marginBottom: '24px' }}>Unassigned Files</h3>
          <div className="bg-[#1e293b] rounded-lg border border-slate-700 shadow-sm divide-y divide-slate-700/50">
            {getUnassignedFiles().map(file => (
              <div
                key={file.id}
                className="p-4 flex items-center justify-between hover:bg-slate-700/50 cursor-pointer transition-colors duration-200 group active:scale-[0.99]"
                onClick={() => onFileSelect(file)}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${file.status === 'done' ? 'bg-green-900/20' : 'bg-[#1e293b]'
                    }`}>
                    <FolderOpen className={`w-4 h-4 ${file.status === 'done' ? 'text-green-400' : 'text-slate-500'
                      }`} />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-slate-200">{file.name}</h4>
                    <p className="text-xs text-slate-400">{file.entries.length} entries • {file.progress}% complete</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-500">Move to:</span>
                    <select
                      className="text-sm border-slate-700 bg-[#0f172a] text-slate-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:bg-[#0f172a]"
                      value=""
                      onChange={(e) => {
                        if (e.target.value) onMoveFile(file.id, e.target.value);
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <option value="">Select Project...</option>
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
      )}
    </div>
  );
}
