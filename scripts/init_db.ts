
import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

async function createDatabase() {
    const url = process.env.DATABASE_URL;
    if (!url) {
        console.error('DATABASE_URL not found');
        return;
    }

    // Connect to 'postgres' database to create the new one
    const postgresUrl = url.replace(/\/[^\/]+(?=\?|$)/, '/postgres');
    const client = new Client({ connectionString: postgresUrl });

    try {
        await client.connect();
        console.log('Connected to PostgreSQL server.');

        // Check if database exists
        const res = await client.query("SELECT 1 FROM pg_database WHERE datname = 'Subtitles_film_management'");
        if (res.rowCount === 0) {
            console.log('Database does not exist. Creating...');
            await client.query('CREATE DATABASE "Subtitles_film_management"');
            console.log('✅ Database created successfully.');
        } else {
            console.log('Database already exists.');
        }
    } catch (err: any) {
        console.error('❌ Error:', err.message);
    } finally {
        await client.end();
    }
}

createDatabase();
