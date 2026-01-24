import { useState, useEffect } from 'react';
import { db } from './services/db';
import { serializeEntriesToJSON } from './utils/srt';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { SettingsProvider, useSettings } from './contexts/SettingsContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SubtitleEntry, Project, SubtitleFile } from './types';
import './App.css';
import { useTranslation } from './hooks/useTranslation';

// Pages
import { Dashboard } from './pages/Dashboard';
import { EditorPage } from './pages/EditorPage';
import { QuickTranslate } from './pages/QuickTranslate';
import { SubtitleAnalysis } from './pages/SubtitleAnalysis';
import { Settings } from './pages/Settings';
import { Auth } from './pages/Auth';

export default function App() {
  const [subtitleFiles, setSubtitleFiles] = useState<SubtitleFile[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeTab, setActiveTab] = useState<'upload' | 'manage' | 'quick-translate' | 'analysis' | 'settings'>('upload');

  // Sidebar State (Desktop & Mobile)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
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

      // Synchronize local state with backend response
      const fileWithEntries = { ...file, id: newFile.id, uploadedAt: newFile.uploadedAt };
      setSubtitleFiles(prev => [...prev, fileWithEntries]);
    } catch (err) {
      console.error('Failed to upload file:', err);
    }
  };

  const handleCreateProject = async (name: string, description?: string): Promise<string> => {
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
    // TODO: Implement debouncing for database updates
    setSubtitleFiles(prev =>
      prev.map(f => f.id === updatedFile.id ? updatedFile : f)
    );
    setSelectedFile(updatedFile);

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
          setIsSidebarOpen={setIsSidebarOpen}
          isSidebarOpen={isSidebarOpen}
          handleDeleteFile={handleDeleteFile}
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
  isSidebarOpen,
  setIsSidebarOpen,
  handleDeleteFile
}: any) {
  const { user, isLoading } = useAuth();
  const { theme } = useSettings();
  const isDark = theme === 'dark';
  const { t } = useTranslation();

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
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <div
        className={`fixed inset-y-0 left-0 z-40 bg-slate-900 transition-all duration-300 ease-in-out lg:relative lg:inset-auto lg:h-screen`}
        style={{
          width: isSidebarOpen ? '256px' : '0px',
          minWidth: isSidebarOpen ? '256px' : '0px',
          maxWidth: isSidebarOpen ? '256px' : '0px',
          opacity: isSidebarOpen ? 1 : 0,
          overflow: 'hidden'
        }}
      >
        <div style={{ width: '256px', height: '100%' }}>
          <Sidebar activeTab={activeTab} onTabChange={(tab: any) => {
            setActiveTab(tab);
            if (window.innerWidth < 1024) setIsSidebarOpen(false);
          }} />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        <Header
          onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
          getTabTitle={getTabTitle}
        />

        <main className={`flex-1 overflow-y-auto custom-scrollbar transition-colors duration-300 ${isDark ? 'bg-[#0f172a]' : 'bg-slate-50'}`}>
          <div className="p-8">
            {activeTab === 'manage' ? (
              <EditorPage
                files={subtitleFiles}
                selectedFile={selectedFile}
                onSelectFile={handleFileSelect}
                onUpdateFile={handleUpdateFile}
              />
            ) : (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {activeTab === 'upload' && (
                  <Dashboard
                    files={subtitleFiles}
                    projects={projects}
                    onFileUpload={handleFileUpload}
                    onCreateProject={handleCreateProject}
                    onDeleteProject={handleDeleteProject}
                    onMoveFile={handleMoveFileToProject}
                    onFileSelect={handleFileSelect}
                    setActiveTab={setActiveTab}
                    onDeleteFile={handleDeleteFile}
                  />
                )}
                {activeTab === 'quick-translate' && (
                  <div className="max-w-4xl mx-auto">
                    <QuickTranslate />
                  </div>
                )}
                {activeTab === 'analysis' && (
                  <div className="max-w-7xl mx-auto">
                    <SubtitleAnalysis
                      files={subtitleFiles}
                      selectedFile={selectedFile}
                      onSelectFile={handleFileSelect}
                    />
                  </div>
                )}
                {activeTab === 'settings' && (
                  <div className="max-w-2xl mx-auto">
                    <Settings projectsCount={projects.length} />
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}