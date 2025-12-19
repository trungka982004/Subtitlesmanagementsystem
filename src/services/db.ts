import { Project, SubtitleFile } from '../App';
import { parseContent } from '../utils/srt';

const API_URL = 'http://localhost:3001/api';

export const db = {
    // Projects
    async getProjects(): Promise<Project[]> {
        const res = await fetch(`${API_URL}/projects`);
        if (!res.ok) throw new Error('Failed to fetch projects');
        const data = await res.json();
        // Convert date strings to Date objects
        return data.map((p: any) => ({
            ...p,
            createdAt: new Date(p.createdAt),
            updatedAt: new Date(p.updatedAt),
        }));
    },

    async createProject(name: string, description?: string, userId?: string): Promise<Project> {
        const res = await fetch(`${API_URL}/projects`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            // Mock userId for now since we don't have auth on frontend yet
            body: JSON.stringify({
                name,
                description,
                userId: userId || 'b7ffdd36-3769-4bac-a946-01c896496f5c'
            }),
        });
        if (!res.ok) throw new Error('Failed to create project');
        const p = await res.json();
        return {
            ...p,
            createdAt: new Date(p.createdAt),
        };
    },

    // Files
    async getFiles(): Promise<SubtitleFile[]> {
        const res = await fetch(`${API_URL}/files`);
        if (!res.ok) throw new Error('Failed to fetch files');
        const data = await res.json();
        return data.map((f: any) => ({
            ...f,
            entries: parseContent(f.content), // Parse content (JSON or SRT)
            uploadedAt: new Date(f.createdAt),
        }));
    },

    async createFile(file: { name: string, content: string, projectId?: string | null }): Promise<SubtitleFile> {
        const res = await fetch(`${API_URL}/files`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: file.name,
                content: file.content,
                projectId: file.projectId || null, // Convert undefined/empty to null for backend
            }),
        });
        if (!res.ok) throw new Error('Failed to create file');
        const data = await res.json();
        return {
            ...data,
            uploadedAt: new Date(data.createdAt),
            entries: parseContent(data.content),
        };
    },

    async updateFile(id: string, updates: Partial<SubtitleFile> & { projectId?: string | null, content?: string }): Promise<SubtitleFile> {
        const res = await fetch(`${API_URL}/files/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
        });
        if (!res.ok) throw new Error('Failed to update file');
        const data = await res.json();
        return {
            ...data,
            uploadedAt: new Date(data.createdAt),
            entries: parseContent(data.content),
        };
    },

    async deleteFile(id: string): Promise<void> {
        const res = await fetch(`${API_URL}/files/${id}`, {
            method: 'DELETE',
        });
        if (!res.ok) throw new Error('Failed to delete file');
    },

    async deleteProject(id: string): Promise<void> {
        const res = await fetch(`${API_URL}/projects/${id}`, {
            method: 'DELETE',
        });
        if (!res.ok) throw new Error('Failed to delete project');
    }
};
