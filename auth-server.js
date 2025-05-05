const http = require('http');
const { MongoClient } = require('mongodb');
const url = require('url');
const querystring = require('querystring');

const uri = 'mongodb://localhost:27017'; // Replace with your MongoDB URI if needed
const client = new MongoClient(uri);
const dbName = 'userAuthDB';
let db;

// Connect to MongoDB
client.connect()
.then(() => {
    db = client.db(dbName);
    console.log('Connected to MongoDB');
})
.catch(err => console.error('Failed to connect to MongoDB:', err));

// Create server
const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const { pathname, method } = parsedUrl;

    if (pathname === '/signup' && method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', async () => {
            const { username, password } = querystring.parse(body);

            if (!username || !password) {
                res.writeHead(400, { 'Content-Type': 'text/plain' });
                return res.end('Username and password are required');
            }

            try {
                const existingUser = await db.collection('users').findOne({ username });
                if (existingUser) {
                    res.writeHead(400, { 'Content-Type': 'text/plain' });
                    return res.end('User already exists');
                }

                await db.collection('users').insertOne({ username, password });
                res.writeHead(200, { 'Content-Type': 'text/plain' });
                res.end('User registered successfully');
            } catch (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Error registering user');
                console.error(err);
            }
        });
    } else if (pathname === '/login' && method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', async () => {
            const { username, password } = querystring.parse(body);

            if (!username || !password) {
                res.writeHead(400, { 'Content-Type': 'text/plain' });
                return res.end('Username and password are required');
            }

            try {
                const user = await db.collection('users').findOne({ username });

                if (user && user.password === password) {
                    res.writeHead(200, { 'Content-Type': 'text/plain' });
                    res.end('Login successful');
                } else {
                    res.writeHead(401, { 'Content-Type': 'text/plain' });
                    res.end('Invalid username or password');
                }
            } catch (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Error logging in');
                console.error(err);
            }
        });
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
    }
});

// Start server
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
