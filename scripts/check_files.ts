import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const files = await prisma.subtitleFile.findMany({
        include: { project: { include: { user: true } } }
    });

    console.log('--- FILES STATUS ---');
    files.forEach(f => {
        console.log(`- File: ${f.name}`);
        console.log(`  Project: ${f.project?.name || 'NONE'}`);
        console.log(`  Owner: ${f.project?.user?.email || 'N/A'}`);
    });

    await prisma.$disconnect();
}

main();
