import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const johnId = '7cf82e90-9107-4bcd-915c-108f18b415cb';

async function main() {
    const token = jwt.sign({ userId: johnId }, JWT_SECRET, { expiresIn: '1h' });

    const res = await fetch('http://localhost:3001/api/projects', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!res.ok) {
        console.error('API Error:', res.status, await res.text());
        return;
    }

    const data = await res.json();
    console.log(`Found ${data.length} projects for John Doe`);
    data.forEach(p => console.log(`- ${p.name}`));
}

main();
