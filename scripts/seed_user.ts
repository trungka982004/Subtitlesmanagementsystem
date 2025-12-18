
import fetch from 'node-fetch';

async function seed() {
    try {
        const res = await fetch('http://localhost:3001/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@example.com',
                name: 'Admin',
                password: 'password'
            })
        });

        const data = await res.json();
        console.log('User created:', data);
    } catch (err) {
        console.error('Error creating user:', err);
    }
}

seed();
