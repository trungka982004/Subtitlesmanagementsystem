import { SubtitleFile, SubtitleEntry } from '../types';
import { FileText } from 'lucide-react';
import { SubtitleEditor } from './SubtitleEditor';

interface ManageTranslateProps {
    subtitleFiles: SubtitleFile[];
    selectedFile: SubtitleFile | null;
    handleFileSelect: (file: SubtitleFile) => void;
    handleUpdateFile: (updatedFile: SubtitleFile) => void;
}

export function ManageTranslate({
    subtitleFiles,
    selectedFile,
    handleFileSelect,
    handleUpdateFile
}: ManageTranslateProps) {
    return (
        <div className="flex flex-col lg:flex-row gap-6 animate-in fade-in zoom-in-95 duration-300" style={{ height: '78vh', minHeight: '600px' }}>
            {/* File List Sidebar */}
            <div className="w-full lg:w-72 bg-[#1e293b] rounded-lg border border-slate-700 flex flex-col shrink-0 shadow-xl overflow-hidden">
                <div className="p-4 border-b border-slate-700 bg-slate-800/50">
                    <h3 className="font-bold text-slate-100 text-sm uppercase tracking-wide flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-400" />
                        Project Files
                    </h3>
                </div>
                <div className="p-2 space-y-1 bg-[#1e293b] overflow-y-auto flex-1 custom-scrollbar">
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
                                    ? 'bg-blue-600/20 text-blue-400 border-blue-500/50 shadow-lg shadow-blue-500/10'
                                    : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-800 hover:text-slate-200'
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
            <div className="w-full lg:flex-1 bg-[#1e293b] rounded-lg border border-slate-700 shadow-2xl flex flex-col relative overflow-hidden">
                {selectedFile ? (
                    <div className="w-full flex flex-col overflow-hidden h-full">
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
    );
}
