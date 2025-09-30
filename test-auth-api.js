
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

// Force environment to development
process.env.NODE_ENV = 'development';

const dev = true;
const hostname = 'localhost';
const port = 3001;

// Create Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      // Parse the URL
      const parsedUrl = parse(req.url, true);
      const { pathname } = parsedUrl;

      console.log(`[${new Date().toISOString()}] ${req.method} ${pathname}`);

      // Handle the request with Next.js
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  })
    .once('error', (err) => {
      console.error('Server error:', err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`✅ Test server ready on http://${hostname}:${port}`);
      console.log('Testing authentication endpoints...');
    });
}).catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
