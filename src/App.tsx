import { useState } from 'react';
import { SubtitleUploader } from './components/SubtitleUploader';
import { SubtitleList } from './components/SubtitleList';
import { SubtitleEditor } from './components/SubtitleEditor';
import { SubtitleAnalysis } from './components/SubtitleAnalysis';
import { SubtitleComparison } from './components/SubtitleComparison';
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

export interface SubtitleFile {
  id: string;
  name: string;
  entries: SubtitleEntry[];
  uploadedAt: Date;
  status: 'not-started' | 'in-progress' | 'done';
  progress: number;
}

export default function App() {
  const [subtitleFiles, setSubtitleFiles] = useState<SubtitleFile[]>([]);
  const [activeTab, setActiveTab] = useState<'upload' | 'manage' | 'analysis' | 'compare' | 'settings'>('upload');
  const [selectedFile, setSelectedFile] = useState<SubtitleFile | null>(null);

  const handleFileUpload = (file: SubtitleFile) => {
    setSubtitleFiles(prev => [...prev, file]);
    setActiveTab('manage');
  };

  const handleFileSelect = (file: SubtitleFile) => {
    setSelectedFile(file);
  };

  const handleUpdateFile = (updatedFile: SubtitleFile) => {
    setSubtitleFiles(prev => 
      prev.map(f => f.id === updatedFile.id ? updatedFile : f)
    );
    setSelectedFile(updatedFile);
  };

  const handleDeleteFile = (fileId: string) => {
    setSubtitleFiles(prev => prev.filter(f => f.id !== fileId));
    if (selectedFile?.id === fileId) {
      setSelectedFile(null);
    }
  };

  return (
    <SettingsProvider>
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
        {/* Sidebar */}
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Main Content */}
        <div className="flex-1">
          <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 transition-colors">
            <div className="px-8 py-6">
              <h1 className="text-gray-900 dark:text-white">Subtitle Translation Analysis & Management</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Chinese to Vietnamese subtitle translation system</p>
            </div>
          </header>

          <div className="p-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors">
              {activeTab === 'upload' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <SubtitleUploader onFileUpload={handleFileUpload} />
                  <ProjectDashboard files={subtitleFiles} />
                </div>
              )}

              {activeTab === 'manage' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-1">
                    <SubtitleList
                      files={subtitleFiles}
                      selectedFile={selectedFile}
                      onSelectFile={handleFileSelect}
                      onDeleteFile={handleDeleteFile}
                    />
                  </div>
                  <div className="lg:col-span-2">
                    {selectedFile ? (
                      <SubtitleEditor
                        file={selectedFile}
                        onUpdate={handleUpdateFile}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-96 text-gray-400 dark:text-gray-500">
                        Select a subtitle file to edit
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