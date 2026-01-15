import { useState, useEffect } from 'react';
import { db } from './services/db';
import { SubtitleUploader } from './components/SubtitleUploader';
import { serializeEntriesToJSON } from './utils/srt';
import { SubtitleEditor } from './components/SubtitleEditor';
import { FileHorizontalSelector } from './components/FileHorizontalSelector';
import { SubtitleAnalysis } from './components/SubtitleAnalysis';
import { QuickTranslate } from './components/QuickTranslate';
import { Sidebar } from './components/Sidebar';
import { ProjectDashboard } from './components/ProjectDashboard';
import { Settings } from './components/Settings';
import { SettingsProvider, useSettings } from './contexts/SettingsContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Auth } from './components/Auth';
import { SubtitleEntry, Project, SubtitleFile } from './types';
import './App.css';
import { FileText, Settings as SettingsIcon, LogOut, Menu, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslation } from './hooks/useTranslation';

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
    <SettingsProvider>
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
    </SettingsProvider>
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
  const { theme } = useSettings();
  const isDark = theme === 'dark';
  const { t } = useTranslation();
  const [showAllFiles, setShowAllFiles] = useState(false);

  // Helper to get tab title
  const getTabTitle = () => {
    switch (activeTab) {
      case 'upload': return t('uploadSubtitle');
      case 'manage': return t('manageTranslate');
      case 'quick-translate': return t('quickTranslate');
      case 'analysis': return t('analysis');
      case 'settings': return t('settings');
      default: return t('dashboard');
    }
  };

  // Sync document title with active tab
  useEffect(() => {
    document.title = `Sino-Viet Subtitle Studio | ${getTabTitle()}`;
  }, [activeTab, t]);

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
    <div className={`flex min-h-screen w-full font-sans transition-colors duration-300 ${isDark ? 'bg-slate-950 text-slate-200' : 'bg-slate-50 text-slate-900'}`}>
      <div className="flex flex-1 min-h-0">
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
          <Sidebar activeTab={activeTab} onTabChange={(tab: any) => {
            setActiveTab(tab);
            setIsMobileMenuOpen(false);
          }} />
        </div>

        {/* Main Content Area - This container now handles scrolling for the 'covering' effect */}
        <div className={`flex-1 flex flex-col min-w-0 overflow-y-auto relative h-screen transition-colors duration-300 ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
          {/* Header - Part of the page workspace (right of sidebar) */}
          <header className={`sticky top-0 w-full px-8 py-6 backdrop-blur-md border-b flex items-center justify-center shrink-0 z-[100] shadow-sm transition-colors duration-300 ${isDark ? 'bg-slate-950/80 border-white/10' : 'bg-white/80 border-slate-200'
            }`}>
            <div className="flex flex-col items-center">
              <h1 className={`text-3xl font-black tracking-tight flex items-center gap-3 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                <span className="text-blue-600">Sino-Viet Subtitle Studio</span>
                <span className="text-slate-300 font-light mx-1">|</span>
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>
                  {getTabTitle()}
                </span>
              </h1>
              <p className="text-slate-400 text-[10px] font-bold tracking-[0.3em] uppercase mt-2">
                {t('professionalWorkflow')}
              </p>
            </div>
          </header>

          {/* Workspace Area */}
          <main className={`flex-1 p-0 overflow-hidden flex flex-col h-full transition-colors duration-300 ${isDark ? 'bg-[#0f172a]' : 'bg-slate-50'}`}>
            <div className="mx-auto w-full h-full flex flex-col">
              {activeTab === 'manage' && (
                <div className="flex flex-col w-full h-full">
                  {/* Horizontal File Slider */}
                  <FileHorizontalSelector
                    files={subtitleFiles}
                    selectedFileId={selectedFile?.id}
                    onSelectFile={handleFileSelect}
                  />

                  {/* Main Editor Area */}
                  <div className="flex-1 overflow-hidden relative">
                    {selectedFile ? (
                      <SubtitleEditor
                        file={selectedFile}
                        onUpdate={handleUpdateFile}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-slate-500">
                        <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 border border-slate-700">
                          <FileText className="w-8 h-8 text-slate-600" />
                        </div>
                        <h3 className="font-bold text-lg text-slate-400">Select a file from above</h3>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab !== 'manage' && (
                <div className="p-8 h-full overflow-y-auto custom-scrollbar">
                  {activeTab === 'upload' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <SubtitleUploader
                        onFileUpload={handleFileUpload}
                        projects={projects}
                        onCreateProject={handleCreateProject}
                        files={subtitleFiles}
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
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}