import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const projects = await prisma.project.findMany({
        include: { user: true }
    });

    console.log('--- PROJECTS STATUS ---');
    projects.forEach(p => {
        console.log(`- Project: ${p.name}`);
        console.log(`  ID: ${p.id}`);
        console.log(`  Owner: ${p.user.name} (${p.user.email})`);
    });

    await prisma.$disconnect();
}

main();
