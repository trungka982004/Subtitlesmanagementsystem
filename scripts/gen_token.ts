import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const johnId = '7cf82e90-9107-4bcd-915c-108f18b415cb';

const token = jwt.sign({ userId: johnId }, JWT_SECRET, { expiresIn: '1h' });
console.log('--- TEST TOKEN FOR JOHN DOE ---');
console.log(token);
