const token = process.argv[2];

async function test() {
    try {
        const res = await fetch('http://localhost:3001/api/projects', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await res.json();
        console.log('--- API RESPONSE (Projects) ---');
        console.log(JSON.stringify(data, null, 2));
    } catch (e) {
        console.error('Fetch failed:', e);
    }
}

test();
