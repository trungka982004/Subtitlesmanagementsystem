import { SubtitleUploader } from '../components/SubtitleUploader';
import { ProjectDashboard } from '../components/ProjectDashboard';
import { SubtitleFile, Project } from '../types';

interface DashboardProps {
    files: SubtitleFile[];
    projects: Project[];
    onFileUpload: (file: SubtitleFile) => void;
    onCreateProject: (name: string, description?: string) => Promise<string>;
    onDeleteProject: (projectId: string) => void;
    onMoveFile: (fileId: string, projectId: string) => void;
    onFileSelect: (file: SubtitleFile) => void;
    setActiveTab: (tab: any) => void;
    onDeleteFile: (fileId: string) => void;
}

export function Dashboard({
    files,
    projects,
    onFileUpload,
    onCreateProject,
    onDeleteProject,
    onMoveFile,
    onFileSelect,
    setActiveTab,
    onDeleteFile
}: DashboardProps) {
    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <SubtitleUploader
                onFileUpload={onFileUpload}
                projects={projects}
                onCreateProject={onCreateProject}
                files={files}
            />
            <div className="mt-8">
                <ProjectDashboard
                    projects={projects}
                    files={files}
                    onDeleteProject={onDeleteProject}
                    onCreateProject={onCreateProject}
                    onMoveFile={onMoveFile}
                    onFileUpload={onFileUpload}
                    onDeleteFile={onDeleteFile}
                    onFileSelect={(file: any) => {
                        onFileSelect(file);
                        setActiveTab('manage');
                    }}
                />
            </div>
        </div>
    );
}
