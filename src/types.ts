export interface SubtitleEntry {
    id: number;
    startTime: string;
    endTime: string;
    text: string;
    translation?: string;
    libreTranslation?: string;
    opusTranslation?: string;
    mbartTranslation?: string;
    nllbTranslation?: string;
    googleTranslation?: string; // Kept for backward compatibility
    nlpTranslation?: string; // Kept for backward compatibility
    selectedModel?: 'libre' | 'opus' | 'mbart' | 'nllb' | 'google' | 'nlp';
    libreError?: string;
    opusError?: string;
    mbartError?: string;
    nllbError?: string;
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
    content?: string;
    language?: string;
    entries: SubtitleEntry[];
    uploadedAt: Date;
    status: 'not-started' | 'in-progress' | 'done';
    progress: number;
}

