
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTables() {
    try {
        // raw query to list tables in the current database
        const result = await prisma.$queryRaw`
      SELECT table_schema, table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
        console.log("Tables found in 'public' schema:");
        console.table(result);
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

checkTables();
