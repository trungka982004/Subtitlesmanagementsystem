import { SubtitleFile } from '../App';
import { FileText, Trash2, Clock } from 'lucide-react';

interface SubtitleListProps {
  files: SubtitleFile[];
  selectedFile: SubtitleFile | null;
  onSelectFile: (file: SubtitleFile) => void;
  onDeleteFile: (fileId: string) => void;
}

export function SubtitleList({ files, selectedFile, onSelectFile, onDeleteFile }: SubtitleListProps) {
  if (files.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <FileText className="w-12 h-12 mx-auto mb-3" />
        <p>No subtitle files uploaded yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-gray-700 mb-3">
        Subtitle Files ({files.length})
      </h3>
      {files.map(file => (
        <div
          key={file.id}
          onClick={() => onSelectFile(file)}
          className={`p-4 rounded-lg border cursor-pointer transition-colors ${
            selectedFile?.id === file.id
              ? 'bg-blue-50 border-blue-300'
              : 'bg-white border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <FileText className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <p className="text-gray-900 truncate">{file.name}</p>
              </div>
              <div className="flex items-center gap-3 text-gray-500">
                <span>{file.entries.length} entries</span>
              </div>
              <div className="flex items-center gap-2 mt-1 text-gray-400">
                <Clock className="w-3 h-3" />
                <span>{new Date(file.uploadedAt).toLocaleString()}</span>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteFile(file.id);
              }}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}