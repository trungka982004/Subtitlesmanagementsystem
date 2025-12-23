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
