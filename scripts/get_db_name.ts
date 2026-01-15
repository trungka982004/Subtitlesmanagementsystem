
import dotenv from 'dotenv';
dotenv.config();
const url = process.env.DATABASE_URL;
if (url) {
    const parts = url.split('/');
    const dbName = parts[parts.length - 1].split('?')[0];
    console.log('Target Database Name from .env:', dbName);
} else {
    console.log('DATABASE_URL not found in .env');
}
