import { SubtitleFile } from '../App';
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';

interface ProjectDashboardProps {
  files: SubtitleFile[];
}

export function ProjectDashboard({ files }: ProjectDashboardProps) {
  const doneCount = files.filter(f => f.status === 'done').length;
  const inProgressCount = files.filter(f => f.status === 'in-progress').length;
  const notStartedCount = files.filter(f => f.status === 'not-started').length;

  return (
    <div className="space-y-4">
      <h3 className="text-gray-900">Project Dashboard</h3>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <span className="text-green-900">Done</span>
          </div>
          <p className="text-green-900">{doneCount} projects</p>
        </div>

        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <span className="text-blue-900">In Progress</span>
          </div>
          <p className="text-blue-900">{inProgressCount} projects</p>
        </div>

        <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            <span className="text-orange-900">Not Started</span>
          </div>
          <p className="text-orange-900">{notStartedCount} projects</p>
        </div>
      </div>

      {/* Project List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-gray-700">All Projects</h4>
          <div className="max-h-96 overflow-y-auto space-y-2">
            {files.map(file => (
              <div key={file.id} className="p-4 bg-white rounded-lg border border-gray-200">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className="text-gray-900">{file.name}</p>
                    <p className="text-gray-500">{file.entries.length} entries</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full ${
                    file.status === 'done' 
                      ? 'bg-green-100 text-green-700'
                      : file.status === 'in-progress'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-orange-100 text-orange-700'
                  }`}>
                    {file.status === 'done' ? 'DONE' : file.status === 'in-progress' ? 'IN PROGRESS' : 'NOT STARTED'}
                  </span>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Progress</span>
                    <span className="text-gray-900">{file.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        file.status === 'done'
                          ? 'bg-green-600'
                          : file.status === 'in-progress'
                          ? 'bg-blue-600'
                          : 'bg-orange-600'
                      }`}
                      style={{ width: `${file.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {files.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <p>No projects yet. Upload a subtitle file to get started.</p>
        </div>
      )}
    </div>
  );
}
