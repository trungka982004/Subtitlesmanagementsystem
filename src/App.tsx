import { useState, useEffect } from 'react';
import { db } from './services/db';
import { SubtitleUploader } from './components/SubtitleUploader';
import { serializeEntriesToJSON } from './utils/srt';

import { SubtitleEditor } from './components/SubtitleEditor';
import { SubtitleAnalysis } from './components/SubtitleAnalysis';
import { SubtitleComparison } from './components/SubtitleComparison';
import { QuickTranslate } from './components/QuickTranslate';
import { Sidebar } from './components/Sidebar';
import { ProjectDashboard } from './components/ProjectDashboard';
import { Settings } from './components/Settings';
import { SettingsProvider } from './contexts/SettingsContext';

export interface SubtitleEntry {
  id: number;
  startTime: string;
  endTime: string;
  text: string;
  translation?: string;
  googleTranslation?: string;
  nlpTranslation?: string;
}

export interface Project {
  id: string;
  name: string;
  createdAt: Date;
  description?: string;
}

export interface SubtitleFile {
  id: string;
  projectId?: string;
  name: string;
  language?: string;
  entries: SubtitleEntry[];
  uploadedAt: Date;
  status: 'not-started' | 'in-progress' | 'done';
  progress: number;
}

export default function App() {
  const [subtitleFiles, setSubtitleFiles] = useState<SubtitleFile[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeTab, setActiveTab] = useState<'upload' | 'manage' | 'quick-translate' | 'analysis' | 'compare' | 'settings'>('upload');
  const [selectedFile, setSelectedFile] = useState<SubtitleFile | null>(null);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [loadedProjects, loadedFiles] = await Promise.all([
          db.getProjects(),
          db.getFiles()
        ]);
        setProjects(loadedProjects);
        setSubtitleFiles(loadedFiles);
      } catch (err) {
        console.error('Failed to load data:', err);
      }
    };
    loadData();
  }, []);

  const handleFileUpload = async (file: SubtitleFile) => {
    console.log('Uploading file:', file.name, 'Project ID:', file.projectId);
    try {
      const newFile = await db.createFile({
        name: file.name,
        content: file.entries.map(e => `${e.id}\n${e.startTime} --> ${e.endTime}\n${e.text}`).join('\n\n'),
        projectId: file.projectId || null,
      });
      // We might need to re-parse entries here or trust the backend to return them (if we implemented parsing there)
      // For now, let's keep the local file object's entries but use the DB ID
      const fileWithEntries = { ...file, id: newFile.id, uploadedAt: newFile.uploadedAt };
      setSubtitleFiles(prev => [...prev, fileWithEntries]);
    } catch (err) {
      console.error('Failed to upload file:', err);
    }
  };

  const handleCreateProject = async (name: string, description?: string) => {
    try {
      const newProject = await db.createProject(name, description);
      setProjects(prev => [...prev, newProject]);
      return newProject.id;
    } catch (err) {
      console.error('Failed to create project:', err);
      return '';
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      await db.deleteProject(projectId);
      setProjects(prev => prev.filter(p => p.id !== projectId));
      setSubtitleFiles(prev => prev.map(f => f.projectId === projectId ? { ...f, projectId: undefined } : f));
    } catch (err) {
      console.error('Failed to delete project:', err);
    }
  };

  const handleMoveFileToProject = async (fileId: string, projectId: string) => {
    try {
      await db.updateFile(fileId, { projectId });
      setSubtitleFiles(prev =>
        prev.map(f => f.id === fileId ? { ...f, projectId } : f)
      );
    } catch (err) {
      console.error('Failed to move file:', err);
    }
  };

  const handleFileSelect = (file: SubtitleFile) => {
    if (file.status === 'not-started') {
      const updatedFile: SubtitleFile = { ...file, status: 'in-progress' };
      // Optimistic update, background save
      setSubtitleFiles(prev =>
        prev.map(f => f.id === file.id ? updatedFile : f)
      );
      setSelectedFile(updatedFile);
      db.updateFile(file.id, { status: 'in-progress' }).catch(console.error);
    } else {
      setSelectedFile(file);
    }
  };

  const handleUpdateFile = async (updatedFile: SubtitleFile) => {
    setSubtitleFiles(prev =>
      prev.map(f => f.id === updatedFile.id ? updatedFile : f)
    );
    setSelectedFile(updatedFile);
    // Save to DB (debouncing might be good here, but for now direct save)
    try {
      await db.updateFile(updatedFile.id, {
        content: serializeEntriesToJSON(updatedFile.entries),
        status: updatedFile.status,
        progress: updatedFile.progress
      });
    } catch (err) {
      console.error('Failed to update file:', err);
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    try {
      await db.deleteFile(fileId);
      setSubtitleFiles(prev => prev.filter(f => f.id !== fileId));
      if (selectedFile?.id === fileId) {
        setSelectedFile(null);
      }
    } catch (err) {
      console.error('Failed to delete file:', err);
    }
  };

  return (
    <SettingsProvider>
      <div className="flex min-h-screen bg-blue-50-custom dark:bg-slate-950 transition-colors">
        {/* Sidebar */}
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Main Content */}
        <div className="flex-1">
          <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-10 border-b border-gray-200 dark:border-blue-900/30 transition-colors">
            <div className="px-8 py-6 text-center">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-cyan-600 dark:from-blue-400 dark:to-cyan-300 bg-clip-text text-transparent inline-block">
                Subtitle Translation Analysis & Management
              </h1>
              <p className="text-gray-600 dark:text-blue-200/70 mt-1 font-medium text-sm">
                Chinese to Vietnamese subtitle translation system
              </p>
            </div>
          </header>

          <div className={activeTab === 'manage' ? "" : "p-8"}>
            <div className={activeTab === 'manage' ? "" : "bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-gray-200 dark:border-slate-800 p-6 transition-colors"}>
              {activeTab === 'upload' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <SubtitleUploader
                    onFileUpload={handleFileUpload}
                    projects={projects}
                    onCreateProject={handleCreateProject}
                  />
                  <ProjectDashboard
                    files={subtitleFiles}
                    projects={projects}
                    onCreateProject={handleCreateProject}
                    onDeleteProject={handleDeleteProject}
                    onMoveFile={handleMoveFileToProject}
                    onFileUpload={handleFileUpload}
                    onFileSelect={(file) => {
                      handleFileSelect(file);
                      setActiveTab('manage');
                    }}
                  />
                </div>
              )}

              {activeTab === 'manage' && (
                <div className="flex h-[calc(100vh-theme(spacing.24))]">
                  {/* File Sidebar */}
                  <div className="w-64 border-r border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900 overflow-y-auto flex-shrink-0">
                    <div className="p-4 border-b border-gray-200 dark:border-slate-800">
                      <h3 className="font-semibold text-gray-700 dark:text-slate-200">Files</h3>
                    </div>
                    <div className="p-2 space-y-1">
                      {subtitleFiles.length === 0 ? (
                        <div className="text-sm text-gray-400 p-4 text-center">No files uploaded</div>
                      ) : (
                        subtitleFiles.map(file => (
                          <button
                            key={file.id}
                            onClick={() => handleFileSelect(file)}
                            className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${selectedFile?.id === file.id
                              ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-gray-200 dark:ring-slate-700 font-medium'
                              : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'
                              }`}
                          >
                            <div className="truncate">{file.name}</div>
                            <div className="flex justify-between items-center mt-1">
                              <span className="text-[10px] text-gray-400">{file.entries.length} lines</span>
                              {file.status === 'done' && <span className="w-2 h-2 rounded-full bg-green-500"></span>}
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Main Editor Area */}
                  <div className="flex-1 overflow-hidden bg-white dark:bg-slate-900 relative">
                    {selectedFile ? (
                      <SubtitleEditor
                        file={selectedFile}
                        onUpdate={handleUpdateFile}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-slate-500">
                        <p>Select a file to begin translating</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'analysis' && (
                <SubtitleAnalysis
                  files={subtitleFiles}
                  selectedFile={selectedFile}
                  onSelectFile={handleFileSelect}
                />
              )}

              {activeTab === 'compare' && (
                <SubtitleComparison files={subtitleFiles} />
              )}

              {activeTab === 'quick-translate' && (
                <QuickTranslate />
              )}

              {activeTab === 'settings' && (
                <Settings />
              )}
            </div>
          </div>
        </div>
      </div>
    </SettingsProvider>
  );
}