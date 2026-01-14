
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const users = [
        {
            email: 'john@example.com',
            name: 'John Doe',
            password: 'password123',
        },
        {
            email: 'trung@example.com',
            name: 'Trung Khai',
            password: '123456',
        },
        {
            email: 'admin@example.com',
            name: 'Admin',
            password: 'password',
        }
    ];

    console.log('Seeding users...');

    for (const u of users) {
        const hashedPassword = await bcrypt.hash(u.password, 10);
        await prisma.user.upsert({
            where: { email: u.email },
            update: {
                name: u.name,
                password: hashedPassword,
            },
            create: {
                email: u.email,
                name: u.name,
                password: hashedPassword,
            },
        });
        console.log(`- Created/Updated: ${u.email} (${u.password})`);
    }

    console.log('Seed completed successfully.');
}

main()
    .catch((e) => {
        console.error('Seed error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
