
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Users
app.get('/api/users', async (req, res) => {
    try {
        const users = await prisma.user.findMany();
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

app.post('/api/users', async (req, res) => {
    try {
        const { email, name, password } = req.body;
        const user = await prisma.user.create({
            data: { email, name, password }, // Password should be hashed in real app
        });
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create user' });
    }
});

// Projects
app.get('/api/projects', async (req, res) => {
    try {
        const projects = await prisma.project.findMany({
            include: { files: true },
        });
        res.json(projects);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
});

app.post('/api/projects', async (req, res) => {
    try {
        const { name, description, userId } = req.body;
        const project = await prisma.project.create({
            data: { name, description, userId },
        });
        res.json(project);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create project' });
    }
});

// Files
app.get('/api/files', async (req, res) => {
    try {
        const files = await prisma.subtitleFile.findMany();
        res.json(files);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch files' });
    }
});

app.post('/api/files', async (req, res) => {
    try {
        const { name, content, projectId } = req.body;
        const file = await prisma.subtitleFile.create({
            data: { name, content, projectId },
        });
        res.json(file);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create file' });
    }
});

app.put('/api/files/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { projectId, content, status, progress, name } = req.body;
        const file = await prisma.subtitleFile.update({
            where: { id },
            data: { projectId, content, status, progress, name },
        });
        res.json(file);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update file' });
    }
});

app.delete('/api/files/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.subtitleFile.delete({
            where: { id },
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete file' });
    }
});

app.delete('/api/projects/:id', async (req, res) => {
    try {
        const { id } = req.params;
        // Optional: Delete related files first or set onDelete: Cascade in schema
        // For now, let's just update files to remove projectId
        await prisma.subtitleFile.updateMany({
            where: { projectId: id },
            data: { projectId: null }
        });

        await prisma.project.delete({
            where: { id },
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete project' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
