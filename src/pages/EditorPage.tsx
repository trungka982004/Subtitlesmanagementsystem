import { FileHorizontalSelector } from '../components/FileHorizontalSelector';
import { SubtitleEditor } from '../components/SubtitleEditor';
import { SubtitleFile } from '../types';
import { FileText } from 'lucide-react';

interface EditorPageProps {
    files: SubtitleFile[];
    selectedFile: SubtitleFile | null;
    onSelectFile: (file: SubtitleFile) => void;
    onUpdateFile: (file: SubtitleFile) => void;
}

export function EditorPage({ files, selectedFile, onSelectFile, onUpdateFile }: EditorPageProps) {
    return (
        <div className="flex flex-col w-full h-full">
            {/* Horizontal File Slider */}
            <FileHorizontalSelector
                files={files}
                selectedFileId={selectedFile?.id}
                onSelectFile={onSelectFile}
            />

            {/* Main Editor Area */}
            <div className="flex-1 overflow-hidden relative">
                {selectedFile ? (
                    <SubtitleEditor
                        file={selectedFile}
                        onUpdate={onUpdateFile}
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
    );
}
