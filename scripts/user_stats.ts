import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({ include: { projects: true } });

    users.forEach(u => {
        console.log(`User: ${u.email} (${u.name}) has ${u.projects.length} projects`);
    });

    await prisma.$disconnect();
}

main();
