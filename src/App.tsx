import { useState, useEffect } from 'react';
import { db } from './services/db';
import { SubtitleUploader } from './components/SubtitleUploader';
import { serializeEntriesToJSON } from './utils/srt';

import { SubtitleEditor } from './components/SubtitleEditor';
import { SubtitleAnalysis } from './components/SubtitleAnalysis';

import { QuickTranslate } from './components/QuickTranslate';
import { Sidebar } from './components/Sidebar';
import { ProjectDashboard } from './components/ProjectDashboard';
import { Settings } from './components/Settings';
import { SettingsProvider } from './contexts/SettingsContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Auth } from './components/Auth';
import './App.css';
import { FileText, Settings as SettingsIcon, LogOut, Menu, X } from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<'upload' | 'manage' | 'quick-translate' | 'analysis' | 'settings'>('upload');

  // Mobile Menu State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<SubtitleFile | null>(null);

  // Data loading is now handled inside AppContent to react to user changes
  useEffect(() => {
    if (!selectedFile) return;
  }, [selectedFile]);

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
    <AuthProvider>
      <AppContent
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        subtitleFiles={subtitleFiles}
        projects={projects}
        handleFileUpload={handleFileUpload}
        handleCreateProject={handleCreateProject}
        handleDeleteProject={handleDeleteProject}
        handleMoveFileToProject={handleMoveFileToProject}
        handleFileSelect={handleFileSelect}
        selectedFile={selectedFile}
        handleUpdateFile={handleUpdateFile}
        setSubtitleFiles={setSubtitleFiles}
        setProjects={setProjects}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />
    </AuthProvider>
  );
}

function AppContent({
  activeTab,
  setActiveTab,
  subtitleFiles,
  projects,
  handleFileUpload,
  handleCreateProject,
  handleDeleteProject,
  handleMoveFileToProject,
  handleFileSelect,
  selectedFile,
  handleUpdateFile,
  setSubtitleFiles,
  setProjects,
  isMobileMenuOpen,
  setIsMobileMenuOpen
}: any) {
  const { user, isLoading } = useAuth();

  // Sync document title with active tab
  useEffect(() => {
    const labels: Record<string, string> = {
      upload: 'Upload',
      manage: 'Manage & Translate',
      'quick-translate': 'Quick Translate',
      analysis: 'Analysis',
      settings: 'Settings'
    };
    document.title = `Sino-Viet Subtitle Studio | ${labels[activeTab] || 'Dashboard'}`;
  }, [activeTab]);

  useEffect(() => {
    if (user) {
      const loadUserData = async () => {
        try {
          const [loadedProjects, loadedFiles] = await Promise.all([
            db.getProjects(),
            db.getFiles()
          ]);
          // Update state
          setProjects(loadedProjects);
          setSubtitleFiles(loadedFiles);
        } catch (err) {
          console.error('Failed to load user data:', err);
          setProjects([]);
          setSubtitleFiles([]);
        }
      };
      loadUserData();
    } else {
      // Clear data if no user
      setProjects([]);
      setSubtitleFiles([]);
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <SettingsProvider>
      <div className="flex min-h-screen w-full bg-[#0b1121] font-sans text-slate-200">

        {/* Mobile Sidebar Overlay */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Sidebar - Responsive Structure */}
        <div className={`
          fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-300 ease-in-out
          lg:sticky lg:top-0 lg:h-screen lg:translate-x-0
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <Sidebar activeTab={activeTab} onTabChange={(tab) => {
            setActiveTab(tab);
            setIsMobileMenuOpen(false); // Close on selection
          }} />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#0b1121]">

          {/* Header */}
          <header className="sticky top-0 px-6 py-4 bg-[#0b1121]/90 backdrop-blur-md border-b border-white/10 flex items-center justify-center shrink-0 z-20 shadow-lg shadow-black/20">
            {/* Centered Title */}
            <div className="text-center">
              <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 tracking-tighter drop-shadow-sm">
                Sino-Viet Subtitle Studio | {
                  {
                    upload: 'Upload',
                    manage: 'Manage & Translate',
                    'quick-translate': 'Quick Translate',
                    analysis: 'Analysis',
                    settings: 'Settings'
                  }[activeTab as 'upload' | 'manage' | 'quick-translate' | 'analysis' | 'settings'] || 'Dashboard'
                }
              </h1>
              <p className="text-blue-200/50 text-xs font-bold tracking-[0.2em] uppercase mt-1.5 flex items-center justify-center gap-2">
                <span className="w-8 h-px bg-blue-500/30"></span>
                Professional Translation Workflow
                <span className="w-8 h-px bg-blue-500/30"></span>
              </p>
            </div>
          </header>

          {/* Scrollable Main Content */}
          <main className="flex-1 p-4 lg:p-8 scroll-smooth">
            <div className="max-w-7xl mx-auto space-y-6">
              {activeTab === 'upload' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <SubtitleUploader
                    onFileUpload={handleFileUpload}
                    projects={projects}
                    onCreateProject={handleCreateProject}
                  />
                  <div style={{ marginTop: '2rem' }}>
                    <ProjectDashboard
                      projects={projects}
                      files={subtitleFiles}
                      onDeleteProject={handleDeleteProject}
                      onCreateProject={handleCreateProject}
                      onMoveFile={handleMoveFileToProject}
                      onFileUpload={handleFileUpload}
                      onFileSelect={(file: any) => {
                        handleFileSelect(file);
                        setActiveTab('manage');
                      }}
                    />
                  </div>
                </div>
              )}

              {activeTab === 'manage' && (
                <div className="flex flex-col lg:flex-row h-full gap-6 animate-in fade-in zoom-in-95 duration-300">
                  {/* File List Sidebar */}
                  <div className="w-full lg:w-72 bg-white rounded-lg border border-gray-200 flex flex-col shrink-0 shadow-sm overflow-hidden h-full">
                    <div className="p-4 border-b border-gray-100 bg-slate-50">
                      <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wide flex items-center gap-2">
                        <FileText className="w-4 h-4 text-slate-400" />
                        Project Files
                      </h3>
                    </div>
                    <div className="p-2 space-y-1 bg-slate-50/50 overflow-y-auto flex-1">
                      {subtitleFiles.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 text-sm italic">
                          No files found
                        </div>
                      ) : (
                        subtitleFiles.map((file: any) => (
                          <button
                            key={file.id}
                            onClick={() => handleFileSelect(file)}
                            className={`w-full text-left px-4 py-3 rounded-md text-sm transition-all duration-200 border group ${selectedFile?.id === file.id
                              ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-sm'
                              : 'bg-white border-transparent text-slate-600 hover:bg-white hover:border-gray-200 hover:shadow-sm'
                              }`}
                          >
                            <div className="font-semibold truncate mb-0.5">{file.name}</div>
                            <div className="flex justify-between items-center text-xs">
                              <span className={`font-medium ${selectedFile?.id === file.id ? 'text-blue-500' : 'text-slate-400'}`}>
                                {file.entries?.length || 0} lines
                              </span>
                              {file.status === 'done' && <span className="w-2 h-2 rounded-full bg-green-500"></span>}
                              {file.status === 'in-progress' && <span className="w-2 h-2 rounded-full bg-blue-500"></span>}
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Editor Area */}
                  <div className="w-full lg:flex-1 bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col relative h-full overflow-hidden">
                    {selectedFile ? (
                      <div className="w-full flex flex-col h-full overflow-hidden">
                        <SubtitleEditor
                          file={selectedFile}
                          onUpdate={handleUpdateFile}
                        />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-slate-500">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                          <FileText className="w-8 h-8 text-slate-300" />
                        </div>
                        <h3 className="font-bold text-lg text-slate-700">Select a File</h3>
                        <p className="text-slate-400 text-sm mt-1">Choose a file from the list to start editing</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'quick-translate' && (
                <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-right-8 duration-500">
                  <QuickTranslate />
                </div>
              )}

              {activeTab === 'analysis' && (
                <div className="max-w-7xl mx-auto animate-in fade-in zoom-in-95 duration-500">
                  <SubtitleAnalysis
                    files={subtitleFiles}
                    selectedFile={selectedFile}
                    onSelectFile={handleFileSelect}
                  />
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <Settings projectsCount={projects.length} />
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </SettingsProvider>
  );
}