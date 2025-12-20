import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const oldAdminId = 'b7ffdd36-3769-4bac-a946-01c896496f5c';
    const johnEmail = 'john@example.com';

    const john = await prisma.user.findUnique({ where: { email: johnEmail } });

    if (!john) {
        console.log('John Doe not found');
        return;
    }

    const result = await prisma.project.updateMany({
        where: { userId: oldAdminId },
        data: { userId: john.id }
    });

    console.log(`Reassigned ${result.count} projects to John Doe (${john.id})`);

    await prisma.$disconnect();
}

main();
