import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany();
    const projects = await prisma.project.findMany();
    const files = await prisma.subtitleFile.findMany();

    console.log('--- USERS ---');
    users.forEach(u => console.log(`ID: ${u.id}, Email: ${u.email}, Name: ${u.name}`));

    console.log('\n--- PROJECTS ---');
    projects.forEach(p => console.log(`ID: ${p.id}, Name: ${p.name}, UserID: ${p.userId}`));

    console.log('\n--- FILES ---');
    files.forEach(f => console.log(`ID: ${f.id}, Name: ${f.name}, ProjectID: ${f.projectId}`));

    await prisma.$disconnect();
}

main();
