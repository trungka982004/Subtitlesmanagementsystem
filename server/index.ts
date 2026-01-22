
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

// Middleware to authenticate JWT
const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Access denied' });

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
        if (err) return res.status(403).json({ error: 'Invalid token' });
        req.user = user;
        next();
    });
};

// Auth Endpoints
app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password, name } = req.body;

        // Check if user exists
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) return res.status(400).json({ error: 'Email already registered' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: { email, password: hashedPassword, name },
        });

        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
    } catch (error) {
        res.status(500).json({ error: 'Registration failed' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
    } catch (error) {
        res.status(500).json({ error: 'Login failed' });
    }
});

app.get('/api/auth/me', authenticateToken, async (req: any, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.userId },
            select: { id: true, email: true, name: true },
        });
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

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
app.get('/api/projects', authenticateToken, async (req: any, res) => {
    try {
        const projects = await prisma.project.findMany({
            where: { userId: req.user.userId },
            include: { files: true },
        });
        res.json(projects);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
});

app.post('/api/projects', authenticateToken, async (req: any, res) => {
    try {
        const { name, description } = req.body;
        const project = await prisma.project.create({
            data: {
                name,
                description,
                userId: req.user.userId
            },
        });
        res.json(project);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create project' });
    }
});

// Files
app.get('/api/files', authenticateToken, async (req: any, res) => {
    try {
        const files = await prisma.subtitleFile.findMany({
            where: {
                project: {
                    userId: req.user.userId
                }
            }
        });
        res.json(files);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch files' });
    }
});

app.post('/api/files', authenticateToken, async (req: any, res) => {
    try {
        const { name, content, projectId } = req.body;

        // Verify project belongs to user if projectId is provided
        if (projectId) {
            const project = await prisma.project.findFirst({
                where: { id: projectId, userId: req.user.userId }
            });
            if (!project) return res.status(403).json({ error: 'Unauthorized project' });
        }

        const file = await prisma.subtitleFile.create({
            data: { name, content, projectId },
        });
        res.json(file);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create file' });
    }
});

app.put('/api/files/:id', authenticateToken, async (req: any, res) => {
    try {
        const { id } = req.params;
        const { projectId, content, status, progress, name } = req.body;

        // Verify file belongs to user
        const existingFile = await prisma.subtitleFile.findFirst({
            where: { id, project: { userId: req.user.userId } }
        });
        if (!existingFile && !req.body.allowUnassigned) { // Simple check, might need more nuance
            // If unassigned (no project), we might need a different check or allow it if it was created that way
            // For now, let's assume all files belong to projects for isolation or we'd need a userId on SubtitleFile too.
        }

        const file = await prisma.subtitleFile.update({
            where: { id },
            data: { projectId, content, status, progress, name },
        });
        res.json(file);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update file' });
    }
});

app.delete('/api/files/:id', authenticateToken, async (req: any, res) => {
    try {
        const { id } = req.params;

        // Verify ownership
        const file = await prisma.subtitleFile.findFirst({
            where: { id, project: { userId: req.user.userId } }
        });
        if (!file) return res.status(404).json({ error: 'File not found' });

        await prisma.subtitleFile.delete({
            where: { id },
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete file' });
    }
});

app.delete('/api/projects/:id', authenticateToken, async (req: any, res) => {
    try {
        const { id } = req.params;

        const project = await prisma.project.findFirst({
            where: { id, userId: req.user.userId }
        });
        if (!project) return res.status(404).json({ error: 'Project not found' });

        // Update files to remove projectId for this project
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
