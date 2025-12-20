import { useState, useRef } from 'react';
import { Upload, FileText, FolderPlus, Folder } from 'lucide-react';
import { SubtitleFile, SubtitleEntry, Project } from '../App';

interface SubtitleUploaderProps {
  onFileUpload: (file: SubtitleFile) => void;
  projects: Project[];
  onCreateProject: (name: string) => Promise<string> | string;
}

export function SubtitleUploader({ onFileUpload, projects, onCreateProject }: SubtitleUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      {/* Project Creation - Match Analysis Page Theme */}
      <div className="p-6 bg-[#0f172a] rounded-lg shadow-lg border border-slate-800">
        <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2 uppercase tracking-wide">
          <FolderPlus className="w-4 h-4 text-blue-500" />
          Create New Project
        </h3>

        {!isCreatingProject ? (
          <button
            onClick={() => setIsCreatingProject(true)}
            className="w-full px-4 py-3 bg-[#020617] border border-dashed border-slate-700 rounded text-slate-400 hover:border-blue-500 hover:bg-[#0f172a] hover:text-blue-400 flex items-center justify-center gap-2 transition-all font-medium"
          >
            <FolderPlus className="w-5 h-5" />
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
              className="flex-1 px-4 py-2 bg-[#020617] border border-slate-700 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-white placeholder:text-slate-500"
              autoFocus
            />
            <button
              onClick={handleManualCreateProject}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-medium text-sm shadow-sm transition-all"
            >
              Create
            </button>
            <button
              onClick={() => setIsCreatingProject(false)}
              className="px-4 py-2 text-slate-400 hover:text-slate-200 font-medium"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Drag & Drop - Match Analysis Page Theme */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`bg-[#1e293b] border-2 border-dashed rounded-lg p-12 text-center transition-all duration-300 ${dragActive
          ? 'border-blue-500 bg-blue-900/20 ring-1 ring-blue-500'
          : 'border-slate-700 hover:border-blue-500 hover:bg-[#1e293b]/80'
          }`}
      >
        <div className="w-16 h-16 mx-auto bg-blue-900/20 rounded-full flex items-center justify-center mb-6">
          <Upload className="w-8 h-8 text-blue-400" />
        </div>

        <h3 className="text-white font-bold text-xl mb-2">
          Drag and drop your SRT file here
        </h3>
        <p className="text-slate-500 mb-6 font-medium text-sm uppercase tracking-wide">
          - or -
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
          className="px-8 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded font-medium shadow-sm transition-all"
        >
          Choose File
        </button>
      </div>

      <div className="flex items-center justify-center gap-4">
        <div className="flex-1 h-px bg-slate-800" />
        <span className="text-slate-600">or</span>
        <div className="flex-1 h-px bg-slate-800" />
      </div>

      <button
        onClick={handleLoadSample}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#1e293b] border border-slate-700 rounded hover:border-blue-500 hover:text-blue-400 transition-all group font-medium text-slate-400 shadow-sm"
      >
        <FileText className="w-5 h-5 text-slate-500 group-hover:text-blue-400 transition-colors" />
        <span>Load Sample Subtitle File</span>
      </button>
    </div>
  );
}