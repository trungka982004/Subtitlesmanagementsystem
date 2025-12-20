import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const email = 'john@example.com';
    const name = 'John Doe';
    const password = 'password123';

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const user = await prisma.user.upsert({
            where: { email },
            update: {
                name,
                password: hashedPassword,
            },
            create: {
                email,
                name,
                password: hashedPassword,
            },
        });

        console.log('Test user created/updated successfully:');
        console.log('Email:', user.email);
        console.log('Password: password123');
    } catch (error) {
        console.error('Error creating test user:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
