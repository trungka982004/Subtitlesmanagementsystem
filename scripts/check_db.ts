
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Checking Database Connection ---');
  try {
    // Try to perform a simple query
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Connection successful: Database is reachable.');
    
    // Check if we can fetch user count
    const userCount = await prisma.user.count();
    console.log(`📊 Current user count: ${userCount}`);
    
    // Check if we can fetch project count
    const projectCount = await prisma.project.count();
    console.log(`📊 Current project count: ${projectCount}`);
    
  } catch (error: any) {
    console.error('❌ Connection failed: Unable to connect to the database.');
    console.error('Error Details:', error.message);
    
    if (error.message.includes('Can\'t reach database server')) {
      console.log('\n💡 Tip: Make sure your PostgreSQL server is running and the credentials in .env are correct.');
    }
  } finally {
    await prisma.$disconnect();
  }
}

main();
