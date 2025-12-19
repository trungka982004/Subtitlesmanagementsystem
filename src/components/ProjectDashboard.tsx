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
    <div className="space-y-8">
      {/* Summary Cards */}
      <div>
        <h3 className="text-gray-900 font-medium mb-4">Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <span className="text-green-900">Done</span>
            </div>
            <p className="text-green-900">{doneCount} files</p>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <span className="text-blue-900">In Progress</span>
            </div>
            <p className="text-blue-900">{inProgressCount} files</p>
          </div>

          <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              <span className="text-orange-900">Not Started</span>
            </div>
            <p className="text-orange-900">{notStartedCount} files</p>
          </div>
        </div>
      </div>

      {/* Projects Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-gray-900 font-medium">Projects</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map(project => {
            const pFiles = getProjectFiles(project.id);
            const progress = getProjectProgress(project.id);
            const isDragActive = dragActiveProject === project.id;

            return (
              <div
                key={project.id}
                className={`p-4 bg-white rounded-lg border shadow-sm transition-all duration-200
                  ${isDragActive
                    ? 'border-blue-500 ring-2 ring-blue-200 bg-blue-50 scale-[1.02]'
                    : 'border-gray-200 hover:shadow-md'
                  }`}
                onDrop={(e) => handleDrop(e, project.id)}
                onDragOver={(e) => handleDragOver(e, project.id)}
                onDragLeave={handleDragLeave}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Folder className={`w-5 h-5 ${isDragActive ? 'text-blue-600' : 'text-blue-500'}`} />
                    <div>
                      <h4 className="font-medium text-gray-900">{project.name}</h4>
                      <p className="text-xs text-gray-500">{pFiles.length} files • Created {new Date(project.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => onDeleteProject(project.id)}
                    className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Progress</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* File list preview */}
                {pFiles.length > 0 ? (
                  <div className="mt-4 space-y-2 border-t pt-3">
                    {pFiles.slice(0, 3).map(file => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between text-sm cursor-pointer hover:bg-gray-50 p-1 -mx-1 rounded"
                        onClick={() => onFileSelect(file)}
                      >
                        <span className="text-gray-600 truncate max-w-[150px]">{file.name}</span>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${file.status === 'done' ? 'bg-green-100 text-green-700' :
                            file.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                              'bg-orange-100 text-orange-700'
                            }`}>
                            {file.status === 'done' ? 'Done' : 'Pending'}
                          </span>
                          {/* Move Button */}
                          <select
                            className="text-xs border-none bg-transparent text-gray-400 hover:text-gray-600 cursor-pointer focus:ring-0 p-0"
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
                      <p className="text-xs text-gray-400 text-center">+ {pFiles.length - 3} more files</p>
                    )}
                  </div>
                ) : (
                  <div className={`mt-4 border-t pt-3 text-center transition-colors ${isDragActive ? 'text-blue-600' : 'text-gray-400'}`}>
                    <p className="text-xs italic">
                      {isDragActive ? 'Drop file to add' : 'Start by dragging files here'}
                    </p>
                  </div>
                )}
              </div>
            );
          })}

          {projects.length === 0 && (
            <div className="col-span-1 md:col-span-2 p-8 border-2 border-dashed border-gray-200 rounded-lg text-center text-gray-400">
              <FolderOpen className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p>No projects yet. Create one to organize your files.</p>
            </div>
          )}
        </div>
      </div>

      {/* Unassigned Files */}
      {getUnassignedFiles().length > 0 && (
        <div>
          <h3 className="text-gray-900 font-medium mb-4">Unassigned Files</h3>
          <div className="bg-white rounded-lg border border-gray-200 divide-y">
            {getUnassignedFiles().map(file => (
              <div
                key={file.id}
                className="p-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer"
                onClick={() => onFileSelect(file)}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${file.status === 'done' ? 'bg-green-50' : 'bg-gray-100'
                    }`}>
                    <FolderOpen className={`w-4 h-4 ${file.status === 'done' ? 'text-green-600' : 'text-gray-500'
                      }`} />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">{file.name}</h4>
                    <p className="text-xs text-gray-500">{file.entries.length} entries • {file.progress}% complete</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Move to:</span>
                    <select
                      className="text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
