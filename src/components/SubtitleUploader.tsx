import { useState, useRef } from 'react';
import { Upload, FileText, FolderPlus, Folder } from 'lucide-react';
import { SubtitleFile, SubtitleEntry, Project } from '../App';

interface SubtitleUploaderProps {
  onFileUpload: (file: SubtitleFile) => void;
  projects: Project[];
  onCreateProject: (name: string) => string;
}

export function SubtitleUploader({ onFileUpload, projects, onCreateProject }: SubtitleUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseSRT = (content: string): SubtitleEntry[] => {
    const entries: SubtitleEntry[] = [];
    const blocks = content.trim().split('\n\n');

    blocks.forEach(block => {
      const lines = block.split('\n');
      if (lines.length >= 3) {
        const id = parseInt(lines[0]);
        const timeMatch = lines[1].match(/(\d{2}:\d{2}:\d{2},\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2},\d{3})/);

        if (timeMatch) {
          const text = lines.slice(2).join('\n');
          entries.push({
            id,
            startTime: timeMatch[1],
            endTime: timeMatch[2],
            text,
          });
        }
      }
    });

    return entries;
  };

  const handleFileRead = (content: string, fileName: string) => {
    const entries = parseSRT(content);

    if (entries.length > 0) {
      const newFile: SubtitleFile = {
        id: `${Date.now()}-${Math.random()}`,
        name: fileName,
        entries,
        uploadedAt: new Date(),
        status: 'not-started',
        progress: 0,
        projectId: undefined,
      };
      onFileUpload(newFile);
    }
  };

  const handleFileSelect = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      handleFileRead(content, file.name);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleManualCreateProject = () => {
    if (newProjectName.trim()) {
      onCreateProject(newProjectName.trim());
      setNewProjectName('');
      setIsCreatingProject(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleLoadSample = () => {
    const sampleSRT = `1
00:00:01,000 --> 00:00:04,000
欢迎使用字幕翻译
分析与管理系统

2
00:00:04,500 --> 00:00:07,500
此工具可帮助您管理
和翻译字幕文件

3
00:00:08,000 --> 00:00:11,000
上传您的SRT文件即可开始

4
00:00:11,500 --> 00:00:14,500
您可以分析时间、字符数
和翻译质量

5
00:00:15,000 --> 00:00:18,000
并排比较多个版本`;

    handleFileRead(sampleSRT, 'sample_chinese.srt');
  };

  return (
    <div className="space-y-6">
      {/* Project Creation Only - No Selection */}
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
          <FolderPlus className="w-4 h-4" />
          Create New Project
        </h3>

        {!isCreatingProject ? (
          <button
            onClick={() => setIsCreatingProject(true)}
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2"
          >
            <FolderPlus className="w-4 h-4" />
            Create Project
          </button>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleManualCreateProject()}
              placeholder="Enter project name..."
              className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              autoFocus
            />
            <button
              onClick={handleManualCreateProject}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium text-sm"
            >
              Create
            </button>
            <button
              onClick={() => setIsCreatingProject(false)}
              className="px-3 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${dragActive
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-300 hover:border-gray-400'
          }`}
      >
        <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-700 mb-2">
          Drag and drop your SRT file here
        </p>
        <p className="text-gray-500 mb-4">
          or
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".srt"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFileSelect(e.target.files[0]);
            }
          }}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Choose File
        </button>
      </div>

      <div className="flex items-center justify-center gap-4">
        <div className="flex-1 h-px bg-gray-300" />
        <span className="text-gray-500">or</span>
        <div className="flex-1 h-px bg-gray-300" />
      </div>

      <button
        onClick={handleLoadSample}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 border-2 border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors"
      >
        <FileText className="w-5 h-5 text-gray-600" />
        <span className="text-gray-700">Load Sample Subtitle File</span>
      </button>
    </div>
  );
}